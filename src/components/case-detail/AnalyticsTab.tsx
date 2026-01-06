import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Goal, Session } from '@/data/mockData';
import { promptLevelLabels } from '@/data/mockData';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb } from 'lucide-react';

interface AnalyticsTabProps {
  sessions: Session[];
  goals: Goal[];
}

const COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899'];

export function AnalyticsTab({ sessions, goals }: AnalyticsTabProps) {
  // Prepare success rate data by session date for each goal
  const successRateData = useMemo(() => {
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sortedSessions.map((session) => {
      const dataPoint: Record<string, string | number> = {
        date: new Date(session.date).toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
        }),
      };

      session.trials.forEach((trial) => {
        const goal = goals.find((g) => g.id === trial.goalId);
        if (goal) {
          dataPoint[goal.title] = Math.round((trial.successes / trial.trials) * 100);
        }
      });

      return dataPoint;
    });
  }, [sessions, goals]);

  // Prepare prompt level data
  const promptLevelData = useMemo(() => {
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sortedSessions.map((session) => {
      const dataPoint: Record<string, string | number> = {
        date: new Date(session.date).toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
        }),
      };

      session.trials.forEach((trial) => {
        const goal = goals.find((g) => g.id === trial.goalId);
        if (goal) {
          dataPoint[goal.title] = trial.promptLevel;
        }
      });

      return dataPoint;
    });
  }, [sessions, goals]);

  // Generate detailed insights with numeric evidence
  const insights = useMemo(() => {
    if (sessions.length < 2) return [];

    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const recentSessions = sortedSessions.slice(0, 4);
    const olderSessions = sortedSessions.slice(4, 8);

    const insights: { type: 'success' | 'warning' | 'info'; message: string }[] = [];

    goals.forEach((goal) => {
      const recentTrials = recentSessions.flatMap((s) => s.trials.filter((t) => t.goalId === goal.id));
      const olderTrials = olderSessions.flatMap((s) => s.trials.filter((t) => t.goalId === goal.id));

      if (recentTrials.length >= 2) {
        // Calculate success rate change
        const recentSuccesses = recentTrials.reduce((acc, t) => acc + t.successes, 0);
        const recentTotalTrials = recentTrials.reduce((acc, t) => acc + t.trials, 0);
        const recentRate = recentTotalTrials > 0 ? (recentSuccesses / recentTotalTrials) * 100 : 0;

        if (olderTrials.length >= 2) {
          const olderSuccesses = olderTrials.reduce((acc, t) => acc + t.successes, 0);
          const olderTotalTrials = olderTrials.reduce((acc, t) => acc + t.trials, 0);
          const olderRate = olderTotalTrials > 0 ? (olderSuccesses / olderTotalTrials) * 100 : 0;
          
          const rateChange = recentRate - olderRate;

          if (rateChange > 10) {
            insights.push({
              type: 'success',
              message: `${goal.title}: 성공률 ${Math.round(olderRate)}% → ${Math.round(recentRate)}% (+${Math.round(rateChange)}%p) 향상`,
            });
          } else if (rateChange < -10) {
            insights.push({
              type: 'warning',
              message: `${goal.title}: 성공률 ${Math.round(olderRate)}% → ${Math.round(recentRate)}% (${Math.round(rateChange)}%p) 하락. 전략 조정 필요`,
            });
          }

          // Check prompt level improvement
          const recentAvgPrompt = recentTrials.reduce((acc, t) => acc + t.promptLevel, 0) / recentTrials.length;
          const olderAvgPrompt = olderTrials.reduce((acc, t) => acc + t.promptLevel, 0) / olderTrials.length;

          if (recentAvgPrompt < olderAvgPrompt - 0.5) {
            insights.push({
              type: 'info',
              message: `${goal.title}: 촉진 수준 ${promptLevelLabels[Math.round(olderAvgPrompt)]} → ${promptLevelLabels[Math.round(recentAvgPrompt)]}으로 개선. 독립성 향상 중`,
            });
          }
        }

        // Check if reaching mastery
        if (recentRate >= 80 && recentTrials.every(t => t.promptLevel <= 1)) {
          insights.push({
            type: 'success',
            message: `${goal.title}: 성공률 ${Math.round(recentRate)}%, 촉진 수준 낮음. 마스터리 기준 근접`,
          });
        }

        // Check for problem behaviors
        const recentProblems = recentTrials.reduce((acc, t) => acc + t.problemBehaviorCount, 0);
        if (recentProblems > 4) {
          insights.push({
            type: 'warning',
            message: `${goal.title}: 최근 세션에서 문제행동 ${recentProblems}회 발생. 행동 관리 전략 검토 필요`,
          });
        }
      }
    });

    return insights.slice(0, 5);
  }, [sessions, goals]);

  // Goal summary statistics
  const goalSummary = useMemo(() => {
    return goals.filter(g => g.status === 'active').map((goal) => {
      const allTrials = sessions.flatMap((s) => s.trials.filter((t) => t.goalId === goal.id));
      if (allTrials.length === 0) return null;

      const sortedSessions = [...sessions]
        .filter(s => s.trials.some(t => t.goalId === goal.id))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const firstSession = sortedSessions[0];
      const lastSession = sortedSessions[sortedSessions.length - 1];

      const firstTrials = firstSession?.trials.filter(t => t.goalId === goal.id) || [];
      const lastTrials = lastSession?.trials.filter(t => t.goalId === goal.id) || [];

      const firstRate = firstTrials.length > 0
        ? (firstTrials.reduce((acc, t) => acc + t.successes, 0) / firstTrials.reduce((acc, t) => acc + t.trials, 0)) * 100
        : 0;
      const lastRate = lastTrials.length > 0
        ? (lastTrials.reduce((acc, t) => acc + t.successes, 0) / lastTrials.reduce((acc, t) => acc + t.trials, 0)) * 100
        : 0;

      const firstPrompt = firstTrials.length > 0
        ? firstTrials.reduce((acc, t) => acc + t.promptLevel, 0) / firstTrials.length
        : 0;
      const lastPrompt = lastTrials.length > 0
        ? lastTrials.reduce((acc, t) => acc + t.promptLevel, 0) / lastTrials.length
        : 0;

      const rateTrend = lastRate > firstRate + 5 ? 'up' : lastRate < firstRate - 5 ? 'down' : 'stable';
      const promptTrend = lastPrompt < firstPrompt - 0.3 ? 'up' : lastPrompt > firstPrompt + 0.3 ? 'down' : 'stable';

      return {
        goal,
        firstRate: Math.round(firstRate),
        lastRate: Math.round(lastRate),
        firstPrompt: Math.round(firstPrompt * 10) / 10,
        lastPrompt: Math.round(lastPrompt * 10) / 10,
        rateTrend,
        promptTrend,
        sessionCount: sortedSessions.length,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [sessions, goals]);

  const activeGoals = goals.filter((g) => g.status === 'active');

  if (sessions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex h-64 flex-col items-center justify-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground font-medium">분석할 세션 데이터가 없습니다</p>
          <p className="text-sm text-muted-foreground">세션을 기록하면 추이 분석이 자동으로 생성됩니다</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Goal Summary Cards */}
      {goalSummary.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goalSummary.map((stat) => (
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
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="insight-box border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              데이터 기반 인사이트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  {insight.type === 'success' && <TrendingUp className="h-4 w-4 mt-0.5 text-success shrink-0" />}
                  {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 mt-0.5 text-warning shrink-0" />}
                  {insight.type === 'info' && <Lightbulb className="h-4 w-4 mt-0.5 text-primary shrink-0" />}
                  {insight.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Success Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">목표별 성공률 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={successRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value}%`, '']}
                />
                <Legend />
                {activeGoals.map((goal, index) => (
                  <Line
                    key={goal.id}
                    type="monotone"
                    dataKey={goal.title}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Level Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">목표별 촉진 수준 추이</CardTitle>
          <p className="text-sm text-muted-foreground">
            낮을수록 독립적 수행 (0: {promptLevelLabels[0]}, 3: {promptLevelLabels[3]})
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={promptLevelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  domain={[0, 3]}
                  ticks={[0, 1, 2, 3]}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => promptLevelLabels[v] || ''}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [promptLevelLabels[value], '']}
                />
                <Legend />
                {activeGoals.map((goal, index) => (
                  <Line
                    key={goal.id}
                    type="monotone"
                    dataKey={goal.title}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}