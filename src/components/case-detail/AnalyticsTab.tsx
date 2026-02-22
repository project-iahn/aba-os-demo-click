import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Goal, Session } from '@/data/mockData';
import { promptLevelLabels } from '@/data/mockData';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, BarChart3, GripVertical, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ParentExplainer } from '@/components/ParentExplainer';
import { DataSyncHint } from '@/components/DataSyncHint';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AnalyticsTabProps {
  sessions: Session[];
  goals: Goal[];
}

const COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899'];

type ChartType = 'line' | 'bar' | 'area';
type DateRange = '7' | '30' | '90' | 'all' | 'custom';

interface SortableSectionProps {
  id: string;
  children: React.ReactNode;
}

function SortableSection({ id, children }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-4 z-10 cursor-grab rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

export function AnalyticsTab({ sessions, goals }: AnalyticsTabProps) {
  const { role } = useApp();
  const [chartType, setChartType] = useState<ChartType>('line');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [sectionOrder, setSectionOrder] = useState(['successRate', 'promptLevel', 'sessionStatus', 'insights']);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Filter sessions by date range
  const filteredSessions = useMemo(() => {
    if (dateRange === 'all') return sessions;
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    if (dateRange === 'custom') {
      if (!customStart || !customEnd) return sessions;
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
    } else {
      startDate = new Date();
      startDate.setDate(now.getDate() - parseInt(dateRange));
    }

    return sessions.filter(s => {
      const d = new Date(s.date);
      return d >= startDate && d <= endDate;
    });
  }, [sessions, dateRange, customStart, customEnd]);

  // Success rate data
  const successRateData = useMemo(() => {
    const sorted = [...filteredSessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted.map((session) => {
      const dp: Record<string, string | number> = {
        date: new Date(session.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      };
      session.trials.forEach((trial) => {
        const goal = goals.find((g) => g.id === trial.goalId);
        if (goal) dp[goal.title] = Math.round((trial.successes / trial.trials) * 100);
      });
      return dp;
    });
  }, [filteredSessions, goals]);

  // Prompt level data
  const promptLevelData = useMemo(() => {
    const sorted = [...filteredSessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted.map((session) => {
      const dp: Record<string, string | number> = {
        date: new Date(session.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      };
      session.trials.forEach((trial) => {
        const goal = goals.find((g) => g.id === trial.goalId);
        if (goal) dp[goal.title] = trial.promptLevel;
      });
      return dp;
    });
  }, [filteredSessions, goals]);

  // Insights
  const insights = useMemo(() => {
    if (filteredSessions.length < 2) return [];
    const sorted = [...filteredSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recent = sorted.slice(0, 4);
    const older = sorted.slice(4, 8);
    const result: { type: 'success' | 'warning' | 'info'; message: string; detail?: string }[] = [];

    goals.forEach((goal) => {
      const recentTrials = recent.flatMap(s => s.trials.filter(t => t.goalId === goal.id));
      const olderTrials = older.flatMap(s => s.trials.filter(t => t.goalId === goal.id));
      if (recentTrials.length < 2) return;

      const recentRate = recentTrials.reduce((a, t) => a + t.successes, 0) / recentTrials.reduce((a, t) => a + t.trials, 0) * 100;
      if (olderTrials.length >= 2) {
        const olderRate = olderTrials.reduce((a, t) => a + t.successes, 0) / olderTrials.reduce((a, t) => a + t.trials, 0) * 100;
        const change = recentRate - olderRate;
        if (change > 10) result.push({ type: 'success', message: `${goal.title}: 성공률 ${Math.round(olderRate)}% → ${Math.round(recentRate)}%`, detail: `+${Math.round(change)}%p 향상` });
        else if (change < -10) result.push({ type: 'warning', message: `${goal.title}: 성공률 ${Math.round(olderRate)}% → ${Math.round(recentRate)}%`, detail: `${Math.round(change)}%p 하락 · 전략 조정 필요` });

        const recentAvgPrompt = recentTrials.reduce((a, t) => a + t.promptLevel, 0) / recentTrials.length;
        const olderAvgPrompt = olderTrials.reduce((a, t) => a + t.promptLevel, 0) / olderTrials.length;
        if (recentAvgPrompt < olderAvgPrompt - 0.5) {
          result.push({ type: 'info', message: `${goal.title}: 촉진 수준 감소`, detail: `${promptLevelLabels[Math.round(olderAvgPrompt)]} → ${promptLevelLabels[Math.round(recentAvgPrompt)]} · 독립성 향상 중` });
        }
      }
      if (recentRate >= 80 && recentTrials.every(t => t.promptLevel <= 1)) {
        result.push({ type: 'success', message: `${goal.title}: 마스터리 기준 근접`, detail: `성공률 ${Math.round(recentRate)}% · 촉진 수준 낮음` });
      }
      const problems = recentTrials.reduce((a, t) => a + t.problemBehaviorCount, 0);
      if (problems > 4) result.push({ type: 'warning', message: `${goal.title}: 문제행동 발생`, detail: `최근 ${problems}회 · 행동 관리 전략 검토 필요` });
    });
    return result.slice(0, 5);
  }, [filteredSessions, goals]);

  // Goal summary
  const goalSummary = useMemo(() => {
    return goals.filter(g => g.status === 'active').map((goal) => {
      const allTrials = filteredSessions.flatMap(s => s.trials.filter(t => t.goalId === goal.id));
      if (allTrials.length === 0) return null;
      const sortedS = [...filteredSessions].filter(s => s.trials.some(t => t.goalId === goal.id)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const first = sortedS[0]?.trials.filter(t => t.goalId === goal.id) || [];
      const last = sortedS[sortedS.length - 1]?.trials.filter(t => t.goalId === goal.id) || [];
      const firstRate = first.length > 0 ? (first.reduce((a, t) => a + t.successes, 0) / first.reduce((a, t) => a + t.trials, 0)) * 100 : 0;
      const lastRate = last.length > 0 ? (last.reduce((a, t) => a + t.successes, 0) / last.reduce((a, t) => a + t.trials, 0)) * 100 : 0;
      const firstPrompt = first.length > 0 ? first.reduce((a, t) => a + t.promptLevel, 0) / first.length : 0;
      const lastPrompt = last.length > 0 ? last.reduce((a, t) => a + t.promptLevel, 0) / last.length : 0;
      return {
        goal,
        firstRate: Math.round(firstRate),
        lastRate: Math.round(lastRate),
        firstPrompt: Math.round(firstPrompt * 10) / 10,
        lastPrompt: Math.round(lastPrompt * 10) / 10,
        rateTrend: lastRate > firstRate + 5 ? 'up' : lastRate < firstRate - 5 ? 'down' : 'stable',
        promptTrend: lastPrompt < firstPrompt - 0.3 ? 'up' : lastPrompt > firstPrompt + 0.3 ? 'down' : 'stable',
        sessionCount: sortedS.length,
      };
    }).filter(Boolean) as NonNullable<any>[];
  }, [filteredSessions, goals]);

  const activeGoals = goals.filter(g => g.status === 'active');

  if (sessions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex h-64 flex-col items-center justify-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">분석할 세션 데이터가 없습니다</p>
          <p className="text-sm text-muted-foreground mt-1">세션을 기록하면 추이 분석이 자동으로 생성됩니다</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSectionOrder(prev => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const renderChart = (data: Record<string, string | number>[], yDomain: [number, number], yFormatter: (v: number) => string, tooltipFormatter: (v: number) => [string, string]) => {
    const chartProps = {
      data,
      children: (
        <>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis domain={yDomain} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={yFormatter} />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={tooltipFormatter} />
          <Legend />
        </>
      ),
    };

    if (chartType === 'bar') {
      return (
        <BarChart data={data}>
          {chartProps.children}
          {activeGoals.map((goal, i) => (
            <Bar key={goal.id} dataKey={goal.title} fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      );
    }
    if (chartType === 'area') {
      return (
        <AreaChart data={data}>
          {chartProps.children}
          {activeGoals.map((goal, i) => (
            <Area key={goal.id} type="monotone" dataKey={goal.title} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.2} />
          ))}
        </AreaChart>
      );
    }
    return (
      <LineChart data={data}>
        {chartProps.children}
        {activeGoals.map((goal, i) => (
          <Line key={goal.id} type="monotone" dataKey={goal.title} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        ))}
      </LineChart>
    );
  };

  const sections: Record<string, React.ReactNode> = {
    successRate: (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">목표별 성공률 추이</CardTitle>
          {role === 'parent' && <p className="text-sm text-muted-foreground">그래프가 위로 올라갈수록 목표 달성이 잘 되고 있다는 의미입니다</p>}
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(successRateData, [0, 100], (v) => `${v}%`, (v: number) => [`${v}%`, ''])}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    ),
    promptLevel: (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">목표별 촉진 수준 추이</CardTitle>
          <p className="text-sm text-muted-foreground">
            {role === 'parent' ? '촉진 수준이 낮아질수록 아이가 더 독립적으로 과제를 수행할 수 있다는 의미입니다' : `낮을수록 독립적 수행 (0: ${promptLevelLabels[0]}, 3: ${promptLevelLabels[3]})`}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(promptLevelData, [0, 3], (v) => promptLevelLabels[v] || '', (v: number) => [promptLevelLabels[v], ''])}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    ),
    sessionStatus: goalSummary.length > 0 ? (
      <div className="space-y-3">
        <h3 className="text-base font-semibold pl-8">세션별 현황</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goalSummary.map((stat: any) => (
            <Card key={stat.goal.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{stat.goal.title}</p>
                    <Badge variant="outline" className="text-xs mt-1">{stat.goal.category}</Badge>
                  </div>
                  {getTrendIcon(stat.rateTrend)}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">성공률 변화</p>
                    <p className="font-semibold">
                      {stat.firstRate}% → <span className={stat.rateTrend === 'up' ? 'text-success' : stat.rateTrend === 'down' ? 'text-destructive' : ''}>{stat.lastRate}%</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">촉진 수준</p>
                    <p className="font-semibold">
                      {promptLevelLabels[Math.round(stat.firstPrompt)]} → <span className={stat.promptTrend === 'up' ? 'text-success' : stat.promptTrend === 'down' ? 'text-destructive' : ''}>{promptLevelLabels[Math.round(stat.lastPrompt)]}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{stat.sessionCount}회 세션 기록</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    ) : null,
    insights: insights.length > 0 ? (
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            해석 카드 · 데이터 기반 인사이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {insights.map((insight, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-lg p-3 ${
                insight.type === 'success' ? 'bg-success/10' : insight.type === 'warning' ? 'bg-warning/10' : 'bg-primary/10'
              }`}>
                {insight.type === 'success' && <TrendingUp className="h-5 w-5 mt-0.5 text-success shrink-0" />}
                {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 mt-0.5 text-warning shrink-0" />}
                {insight.type === 'info' && <Lightbulb className="h-5 w-5 mt-0.5 text-primary shrink-0" />}
                <div>
                  <p className="font-medium text-sm">{insight.message}</p>
                  {insight.detail && (
                    <p className={`text-xs mt-0.5 ${insight.type === 'success' ? 'text-success' : insight.type === 'warning' ? 'text-warning' : 'text-primary'}`}>
                      {insight.detail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ) : null,
  };

  return (
    <div className="space-y-6">
      {/* Parent explainer */}
      {role === 'parent' && (
        <ParentExplainer
          title="분석 차트란?"
          description="이 화면은 자녀의 치료 목표별 성공률과 독립성(촉진 수준) 변화를 시각적으로 보여줍니다."
        />
      )}
      <DataSyncHint />

      {/* Controls: date range + chart type */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">기간 범위</Label>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">최근 7일</SelectItem>
              <SelectItem value="30">최근 30일</SelectItem>
              <SelectItem value="90">최근 90일</SelectItem>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="custom">사용자 지정</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {dateRange === 'custom' && (
          <>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">시작일</Label>
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-36 h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">종료일</Label>
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-36 h-9" />
            </div>
          </>
        )}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">그래프 종류</Label>
          <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">선 그래프</SelectItem>
              <SelectItem value="bar">막대 그래프</SelectItem>
              <SelectItem value="area">영역 그래프</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground pb-2">
          <GripVertical className="h-3 w-3 inline mr-1" />
          섹션을 드래그하여 순서를 변경할 수 있습니다
        </p>
      </div>

      {/* Draggable sections */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          {sectionOrder.map(id => {
            const content = sections[id];
            if (!content) return null;
            return (
              <SortableSection key={id} id={id}>
                {content}
              </SortableSection>
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
}
