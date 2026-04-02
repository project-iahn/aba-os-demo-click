import { useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Goal, Session, Trial } from '@/data/mockData';
import { promptLevelLabels } from '@/data/mockData';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, BarChart3, GripVertical } from 'lucide-react';
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

const COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#22c55e', '#6366f1'];

type ChartType = 'line' | 'bar' | 'area' | 'cumulative';
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

// Session detail popup content
function SessionDetailContent({ session, goals }: { session: Session; goals: Goal[] }) {
  const trialsByProgram = useMemo(() => {
    const map = new Map<string, Trial[]>();
    session.trialRecords.forEach(t => {
      const arr = map.get(t.programId) || [];
      arr.push(t);
      map.set(t.programId, arr);
    });
    return map;
  }, [session]);

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{new Date(session.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span>·</span>
        <span>{session.duration}분</span>
      </div>
      {session.notes && <p className="text-sm bg-muted/50 rounded-lg p-3">{session.notes}</p>}

      {Array.from(trialsByProgram.entries()).map(([programId, trials]) => {
        const goal = goals.find(g => g.id === programId);
        if (!goal) return null;
        const correct = trials.filter(t => t.result === 'correct').length;
        const rate = Math.round((correct / trials.length) * 100);
        const avgPrompt = trials.reduce((a, t) => a + t.promptLevel, 0) / trials.length;
        const problems = trials.filter(t => t.problemBehavior).length;

        return (
          <Card key={programId} className="border-border/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{goal.title}</p>
                <Badge variant={rate >= 80 ? 'default' : rate >= 50 ? 'secondary' : 'destructive'} className="text-xs">
                  {rate}%
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>시행: <span className="text-foreground font-medium">{trials.length}회</span></div>
                <div>촉진: <span className="text-foreground font-medium">{promptLevelLabels[Math.round(avgPrompt)]}</span></div>
                <div>문제행동: <span className={`font-medium ${problems > 0 ? 'text-destructive' : 'text-foreground'}`}>{problems}회</span></div>
              </div>
              <div className="flex flex-wrap gap-1">
                {trials.map((trial, i) => (
                  <div
                    key={trial.id}
                    className={`w-6 h-6 rounded text-xs flex items-center justify-center font-medium ${
                      trial.result === 'correct'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : trial.result === 'incorrect'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    title={`${trial.stimulus} → ${trial.result} (${promptLevelLabels[trial.promptLevel]})`}
                  >
                    {trial.result === 'correct' ? '✓' : trial.result === 'incorrect' ? '✗' : '—'}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function AnalyticsTab({ sessions, goals }: AnalyticsTabProps) {
  const { role } = useApp();
  const [chartType, setChartType] = useState<ChartType>('line');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [sectionOrder, setSectionOrder] = useState(['successRate', 'sessionStatus', 'insights']);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [goalDetailStat, setGoalDetailStat] = useState<any | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Only STOs that have actual trial data
  const practicedSTOs = useMemo(() => {
    const programIdsWithTrials = new Set<string>();
    sessions.forEach(s => s.trialRecords.forEach(t => programIdsWithTrials.add(t.programId)));
    return goals.filter(g => g.objectiveType === 'STO' && programIdsWithTrials.has(g.id));
  }, [sessions, goals]);

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

  // Success rate data - only practiced STOs
  const successRateData = useMemo(() => {
    const sorted = [...filteredSessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted.map((session) => {
      const dp: Record<string, string | number> = {
        date: new Date(session.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        _sessionId: session.id as any,
      };
      practicedSTOs.forEach((goal) => {
        const trials = session.trialRecords.filter(t => t.programId === goal.id);
        if (trials.length > 0) {
          const correct = trials.filter(t => t.result === 'correct').length;
          dp[goal.title] = Math.round((correct / trials.length) * 100);
        }
      });
      return dp;
    });
  }, [filteredSessions, practicedSTOs]);

  // Cumulative success rate data
  const cumulativeData = useMemo(() => {
    const sorted = [...filteredSessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const accum: Record<string, { correct: number; total: number }> = {};
    return sorted.map((session) => {
      const dp: Record<string, string | number> = {
        date: new Date(session.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        _sessionId: session.id as any,
      };
      practicedSTOs.forEach((goal) => {
        const trials = session.trialRecords.filter(t => t.programId === goal.id);
        if (!accum[goal.id]) accum[goal.id] = { correct: 0, total: 0 };
        if (trials.length > 0) {
          accum[goal.id].correct += trials.filter(t => t.result === 'correct').length;
          accum[goal.id].total += trials.length;
          dp[goal.title] = Math.round((accum[goal.id].correct / accum[goal.id].total) * 100);
        }
      });
      return dp;
    });
  }, [filteredSessions, practicedSTOs]);

  const displayGoals = selectedGoalId ? practicedSTOs.filter(g => g.id === selectedGoalId) : practicedSTOs;

  // Insights
  const insights = useMemo(() => {
    if (filteredSessions.length < 2) return [];
    const sorted = [...filteredSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recent = sorted.slice(0, 4);
    const older = sorted.slice(4, 8);
    const result: { type: 'success' | 'warning' | 'info'; message: string; detail?: string }[] = [];

    practicedSTOs.forEach((goal) => {
      const recentTrials = recent.flatMap(s => s.trialRecords.filter(t => t.programId === goal.id));
      const olderTrials = older.flatMap(s => s.trialRecords.filter(t => t.programId === goal.id));
      if (recentTrials.length < 2) return;

      const recentCorrect = recentTrials.filter(t => t.result === 'correct').length;
      const recentRate = (recentCorrect / recentTrials.length) * 100;

      if (olderTrials.length >= 2) {
        const olderCorrect = olderTrials.filter(t => t.result === 'correct').length;
        const olderRate = (olderCorrect / olderTrials.length) * 100;
        const change = recentRate - olderRate;
        if (change > 10) result.push({ type: 'success', message: `${goal.title}: 성공률 ${Math.round(olderRate)}% → ${Math.round(recentRate)}%`, detail: `+${Math.round(change)}%p 향상` });
        else if (change < -10) result.push({ type: 'warning', message: `${goal.title}: 성공률 ${Math.round(olderRate)}% → ${Math.round(recentRate)}%`, detail: `${Math.round(change)}%p 하락 · 전략 조정 필요` });

        const recentAvgPrompt = recentTrials.reduce((a, t) => a + t.promptLevel, 0) / recentTrials.length;
        const olderAvgPrompt = olderTrials.reduce((a, t) => a + t.promptLevel, 0) / olderTrials.length;
        if (recentAvgPrompt < olderAvgPrompt - 0.5) {
          result.push({ type: 'info', message: `${goal.title}: 촉진 수준 감소`, detail: `${promptLevelLabels[Math.round(olderAvgPrompt)]} → ${promptLevelLabels[Math.round(recentAvgPrompt)]} · 독립성 향상 중` });
        }
      }
      if (recentRate >= 80) {
        result.push({ type: 'success', message: `${goal.title}: 마스터리 기준 근접`, detail: `성공률 ${Math.round(recentRate)}%` });
      }
      const problems = recentTrials.filter(t => t.problemBehavior).length;
      if (problems > 4) result.push({ type: 'warning', message: `${goal.title}: 문제행동 발생`, detail: `최근 ${problems}회 · 행동 관리 전략 검토 필요` });
    });
    return result.slice(0, 5);
  }, [filteredSessions, practicedSTOs]);

  // Goal summary - only practiced STOs
  const goalSummary = useMemo(() => {
    return practicedSTOs.filter(g => g.status === 'active').map((goal) => {
      const sessionsWithGoal = filteredSessions.filter(s => s.trialRecords.some(t => t.programId === goal.id));
      if (sessionsWithGoal.length === 0) return null;
      const sorted = [...sessionsWithGoal].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const allTrials = sorted.flatMap(s => s.trialRecords.filter(t => t.programId === goal.id));
      const firstTrials = sorted[0].trialRecords.filter(t => t.programId === goal.id);
      const lastTrials = sorted[sorted.length - 1].trialRecords.filter(t => t.programId === goal.id);
      const firstRate = firstTrials.length > 0 ? (firstTrials.filter(t => t.result === 'correct').length / firstTrials.length) * 100 : 0;
      const lastRate = lastTrials.length > 0 ? (lastTrials.filter(t => t.result === 'correct').length / lastTrials.length) * 100 : 0;
      const totalProblems = allTrials.filter(t => t.problemBehavior).length;
      const avgPrompt = allTrials.length > 0 ? allTrials.reduce((a, t) => a + t.promptLevel, 0) / allTrials.length : 0;
      const firstPrompt = firstTrials.length > 0 ? firstTrials.reduce((a, t) => a + t.promptLevel, 0) / firstTrials.length : 0;
      const lastPrompt = lastTrials.length > 0 ? lastTrials.reduce((a, t) => a + t.promptLevel, 0) / lastTrials.length : 0;
      const totalTrialCount = allTrials.length;

      // Per-session progression for narrative
      const sessionProgression = sorted.map(s => {
        const trials = s.trialRecords.filter(t => t.programId === goal.id);
        const rate = trials.length > 0 ? Math.round((trials.filter(t => t.result === 'correct').length / trials.length) * 100) : 0;
        const problems = trials.filter(t => t.problemBehavior).length;
        const avgP = trials.length > 0 ? Math.round((trials.reduce((a, t) => a + t.promptLevel, 0) / trials.length) * 10) / 10 : 0;
        return { date: s.date, rate, problems, avgPrompt: avgP, trialCount: trials.length };
      });

      // Find best/worst sessions
      const bestSession = sessionProgression.reduce((best, s) => s.rate > best.rate ? s : best, sessionProgression[0]);
      const worstSession = sessionProgression.reduce((worst, s) => s.rate < worst.rate ? s : worst, sessionProgression[0]);

      // Detect notable jumps (>15%p change between consecutive sessions)
      const notableChanges: { from: typeof sessionProgression[0]; to: typeof sessionProgression[0]; diff: number }[] = [];
      for (let i = 1; i < sessionProgression.length; i++) {
        const diff = sessionProgression[i].rate - sessionProgression[i - 1].rate;
        if (Math.abs(diff) >= 15) {
          notableChanges.push({ from: sessionProgression[i - 1], to: sessionProgression[i], diff });
        }
      }

      // Sessions with problem behaviors
      const problemSessions = sessionProgression.filter(s => s.problems > 0);

      return {
        goal,
        firstRate: Math.round(firstRate),
        lastRate: Math.round(lastRate),
        rateTrend: lastRate > firstRate + 5 ? 'up' : lastRate < firstRate - 5 ? 'down' : 'stable',
        sessionCount: sorted.length,
        totalProblems,
        avgPrompt: Math.round(avgPrompt * 10) / 10,
        firstPrompt: Math.round(firstPrompt * 10) / 10,
        lastPrompt: Math.round(lastPrompt * 10) / 10,
        totalTrialCount,
        sessionProgression,
        bestSession,
        worstSession,
        notableChanges,
        problemSessions,
      };
    }).filter(Boolean) as any[];
  }, [filteredSessions, practicedSTOs]);

  const handleChartClick = useCallback((data: any) => {
    if (data?.activePayload?.[0]?.payload?._sessionId) {
      const sessionId = data.activePayload[0].payload._sessionId;
      const session = sessions.find(s => s.id === sessionId);
      if (session) setSelectedSession(session);
    }
  }, [sessions]);

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

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium mb-1.5">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 py-0.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold">{entry.value}%</span>
          </div>
        ))}
        <p className="text-xs text-muted-foreground mt-1.5 border-t border-border pt-1.5">클릭하여 세션 상세 보기</p>
      </div>
    );
  };

  const renderChart = (data: Record<string, string | number>[]) => {
    const commonProps = {
      data,
      onClick: handleChartClick,
      className: 'cursor-pointer',
    };
    const commonChildren = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}%`} />
        <RechartsTooltip content={<CustomTooltip />} />
        <Legend />
      </>
    );

    if (chartType === 'bar') {
      return (
        <BarChart {...commonProps}>
          {commonChildren}
          {displayGoals.map((goal) => (
            <Bar key={goal.id} dataKey={goal.title} fill={COLORS[practicedSTOs.findIndex(g => g.id === goal.id) % COLORS.length]} />
          ))}
        </BarChart>
      );
    }
    if (chartType === 'area') {
      return (
        <AreaChart {...commonProps}>
          {commonChildren}
          {displayGoals.map((goal) => (
            <Area key={goal.id} type="monotone" dataKey={goal.title} stroke={COLORS[practicedSTOs.findIndex(g => g.id === goal.id) % COLORS.length]} fill={COLORS[practicedSTOs.findIndex(g => g.id === goal.id) % COLORS.length]} fillOpacity={0.2} />
          ))}
        </AreaChart>
      );
    }
    return (
      <LineChart {...commonProps}>
        {commonChildren}
        {displayGoals.map((goal) => (
          <Line key={goal.id} type="monotone" dataKey={goal.title} stroke={COLORS[practicedSTOs.findIndex(g => g.id === goal.id) % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 7, className: 'cursor-pointer' }} />
        ))}
      </LineChart>
    );
  };

  const sections: Record<string, React.ReactNode> = {
    successRate: (
      <Card>
        <CardHeader>
        <CardTitle className="text-base">목표별 성공률 추이</CardTitle>
          {role === 'parent' && <p className="text-sm text-muted-foreground">그래프가 위로 올라갈수록 아이가 해당 활동을 더 잘 수행하고 있다는 뜻입니다</p>}
          <p className="text-xs text-muted-foreground">차트의 점을 클릭하면 해당 세션의 상세 결과를 확인할 수 있습니다</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge
              variant={selectedGoalId === null ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => setSelectedGoalId(null)}
            >
              전체
            </Badge>
            {practicedSTOs.map((goal, i) => (
              <Badge
                key={goal.id}
                variant={selectedGoalId === goal.id ? 'default' : 'outline'}
                className="cursor-pointer transition-colors"
                style={selectedGoalId === goal.id ? { backgroundColor: COLORS[i % COLORS.length], borderColor: COLORS[i % COLORS.length] } : { borderColor: COLORS[i % COLORS.length], color: COLORS[i % COLORS.length] }}
                onClick={() => setSelectedGoalId(selectedGoalId === goal.id ? null : goal.id)}
              >
                {goal.title}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(successRateData)}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    ),
    sessionStatus: goalSummary.length > 0 ? (
      <div className="space-y-3">
        <h3 className="text-base font-semibold pl-8">목표별 현황</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goalSummary.map((stat: any) => {
            const change = stat.lastRate - stat.firstRate;
            const generateSummary = () => {
              const lines: string[] = [];
              if (stat.rateTrend === 'up') {
                lines.push(`${stat.goal.title} 활동에서 꾸준한 성장을 보이고 있습니다. 성공률이 ${stat.firstRate}%에서 ${stat.lastRate}%로 ${Math.abs(change)}%p 향상되었습니다.`);
                if (stat.lastRate >= 80) lines.push('현재 목표 달성 기준에 근접해 있어, 곧 다음 단계로 넘어갈 수 있을 것으로 기대됩니다.');
                else lines.push('이 추세가 유지되면 조만간 목표 달성이 가능할 것으로 보입니다.');
              } else if (stat.rateTrend === 'down') {
                lines.push(`${stat.goal.title} 활동에서 성공률이 ${stat.firstRate}%에서 ${stat.lastRate}%로 다소 낮아졌습니다.`);
                lines.push('일시적인 변동일 수 있으며, 자극의 난이도를 조정하거나 동기부여 전략을 변경하여 다시 향상을 유도할 계획입니다.');
              } else {
                lines.push(`${stat.goal.title} 활동에서 ${stat.lastRate}% 수준을 안정적으로 유지하고 있습니다.`);
                lines.push('안정적인 수행은 학습이 내재화되고 있다는 좋은 신호입니다. 점진적으로 난이도를 높여볼 수 있습니다.');
              }
              lines.push(`총 ${stat.sessionCount}회 세션에서 해당 활동을 진행했습니다.`);
              return lines;
            };

            return (
              <Card
                key={stat.goal.id}
                className="cursor-pointer hover:shadow-md transition-all"
                onClick={() => setGoalDetailStat(stat)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">{stat.goal.title}</p>
                      <Badge variant="outline" className="text-xs mt-1">{stat.goal.category}</Badge>
                    </div>
                    {getTrendIcon(stat.rateTrend)}
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">성공률 변화</p>
                    <p className="font-semibold">
                      {stat.firstRate}% → <span className={stat.rateTrend === 'up' ? 'text-success' : stat.rateTrend === 'down' ? 'text-destructive' : ''}>{stat.lastRate}%</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{stat.sessionCount}회 세션 · 클릭하여 상세 보기</p>
                </CardContent>
              </Card>
            );
          })}
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
      {role === 'parent' && (
        <ParentExplainer
          title="분석 차트란?"
          description="이 화면은 자녀의 치료 목표별 성공률 변화를 시각적으로 보여줍니다."
        />
      )}
      <DataSyncHint />

      {/* Controls */}
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
              <SelectItem value="cumulative">누적 그래프</SelectItem>
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

      {/* Session detail dialog */}
      <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>세션 상세 결과</DialogTitle>
          </DialogHeader>
          {selectedSession && <SessionDetailContent session={selectedSession} goals={goals} />}
        </DialogContent>
      </Dialog>

      {/* Goal detail dialog */}
      <Dialog open={!!goalDetailStat} onOpenChange={(open) => !open && setGoalDetailStat(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {goalDetailStat?.goal?.title}
              {goalDetailStat && getTrendIcon(goalDetailStat.rateTrend)}
            </DialogTitle>
          </DialogHeader>
          {goalDetailStat && (() => {
            const stat = goalDetailStat;
            const change = stat.lastRate - stat.firstRate;
            const promptLabels = ['독립 수행', '살짝 힌트', '말로 안내', '시범', '직접 도움'];
            const formatDate = (d: string) => {
              const date = new Date(d);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            };

            // Build narrative paragraphs
            const paragraphs: string[] = [];

            // 1. Overall change narrative
            if (stat.rateTrend === 'up') {
              paragraphs.push(`이 목표는 전체 ${stat.sessionCount}회 세션 동안 뚜렷한 성장세를 보였습니다. 초기 ${stat.firstRate}%였던 성공률이 최근 ${stat.lastRate}%까지 ${Math.abs(change)}%p 상승했으며, 총 ${stat.totalTrialCount}회의 시행을 통해 꾸준히 수행 능력이 향상되고 있음을 확인할 수 있습니다.`);
            } else if (stat.rateTrend === 'down') {
              paragraphs.push(`이 목표는 전체 ${stat.sessionCount}회 세션 동안 성공률이 ${stat.firstRate}%에서 ${stat.lastRate}%로 ${Math.abs(change)}%p 하락한 것으로 나타났습니다. 총 ${stat.totalTrialCount}회 시행 기록을 살펴보면, 특정 시점에서 수행 수준의 변화가 관찰됩니다.`);
            } else {
              paragraphs.push(`이 목표는 전체 ${stat.sessionCount}회 세션, ${stat.totalTrialCount}회 시행을 거치며 성공률 ${stat.lastRate}% 수준을 안정적으로 유지하고 있습니다. 일관된 수행 수준이 확인됩니다.`);
            }

            // 2. Notable jumps
            if (stat.notableChanges.length > 0) {
              const jumpDescs = stat.notableChanges.map((nc: any) => {
                if (nc.diff > 0) {
                  return `${formatDate(nc.from.date)} → ${formatDate(nc.to.date)} 세션 사이에 성공률이 ${nc.from.rate}%에서 ${nc.to.rate}%로 ${nc.diff}%p 급상승했습니다`;
                } else {
                  return `${formatDate(nc.from.date)} → ${formatDate(nc.to.date)} 세션 사이에 성공률이 ${nc.from.rate}%에서 ${nc.to.rate}%로 ${Math.abs(nc.diff)}%p 하락했습니다`;
                }
              });
              paragraphs.push(`특이 변화: ${jumpDescs.join('. ')}. 해당 시점의 세션 환경이나 아동 컨디션을 함께 살펴보면 변화 원인을 파악하는 데 도움이 됩니다.`);
            }

            // 3. Best / worst session
            if (stat.sessionCount >= 3 && stat.bestSession.rate !== stat.worstSession.rate) {
              paragraphs.push(`가장 높은 수행을 보인 세션은 ${formatDate(stat.bestSession.date)}(성공률 ${stat.bestSession.rate}%)이며, 가장 낮았던 세션은 ${formatDate(stat.worstSession.date)}(성공률 ${stat.worstSession.rate}%)입니다.`);
            }

            // 4. Prompt level change
            if (stat.firstPrompt !== stat.lastPrompt) {
              const promptDir = stat.lastPrompt < stat.firstPrompt ? '감소' : '증가';
              paragraphs.push(`도움 수준은 초기 "${promptLabels[Math.round(stat.firstPrompt)]}"에서 최근 "${promptLabels[Math.round(stat.lastPrompt)]}"(으)로 ${promptDir}했습니다. ${stat.lastPrompt < stat.firstPrompt ? '아동이 점차 독립적으로 수행하고 있음을 의미합니다.' : '현재 더 많은 지원이 필요한 상태로, 과제 난이도나 접근 방식을 점검해 볼 필요가 있습니다.'}`);
            } else {
              paragraphs.push(`도움 수준은 "${promptLabels[Math.round(stat.avgPrompt)]}" 단계에서 일관되게 유지되고 있습니다.`);
            }

            // 5. Problem behaviors
            if (stat.totalProblems > 0) {
              const problemRatio = stat.problemSessions.length;
              paragraphs.push(`문제행동은 총 ${stat.totalProblems}회 관찰되었으며, ${problemRatio}개 세션에서 발생했습니다.${stat.problemSessions.length >= stat.sessionCount / 2 ? ' 절반 이상의 세션에서 문제행동이 나타나고 있어, 해당 목표 수행 시 선행 환경 조정이나 대체 행동 지도를 함께 고려해 볼 수 있습니다.' : ''}`);
            }

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-lg font-bold">{stat.firstRate}%</p>
                    <p className="text-[10px] text-muted-foreground">초기</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 text-center flex flex-col items-center justify-center">
                    <p className={cn('text-lg font-bold', change > 0 ? 'text-success' : change < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                      {change > 0 ? `+${change}` : change}%p
                    </p>
                    <p className="text-[10px] text-muted-foreground">변화</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className={cn('text-lg font-bold', stat.rateTrend === 'up' ? 'text-success' : stat.rateTrend === 'down' ? 'text-destructive' : '')}>{stat.lastRate}%</p>
                    <p className="text-[10px] text-muted-foreground">최근</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">📋 상세 해석</h4>
                  {paragraphs.map((p, i) => (
                    <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
                  ))}
                </div>
                <div className="rounded-lg bg-muted/30 px-3 py-2">
                  <p className="text-xs text-muted-foreground">📌 {stat.goal.category} 영역 · {stat.sessionCount}회 세션 · {stat.totalTrialCount}회 시행</p>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
