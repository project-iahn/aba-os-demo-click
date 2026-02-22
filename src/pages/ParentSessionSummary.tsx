import { useMemo } from 'react';
import { Activity, TrendingUp, Target, BarChart3, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function ParentSessionSummary() {
  const { sessions, goals, children } = useApp();

  const summary = useMemo(() => {
    const totalSessions = sessions.length;
    const activeGoals = goals.filter(g => g.status === 'active');

    const allTrials = sessions.flatMap(s => s.trials);
    const totalTrialCount = allTrials.reduce((a, t) => a + t.trials, 0);
    const totalSuccesses = allTrials.reduce((a, t) => a + t.successes, 0);
    const avgRate = totalTrialCount > 0 ? Math.round((totalSuccesses / totalTrialCount) * 100) : 0;

    // Session-by-session success rate for chart
    const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const chartData = sortedSessions.slice(-10).map(s => {
      const trials = s.trials.reduce((a, t) => a + t.trials, 0);
      const successes = s.trials.reduce((a, t) => a + t.successes, 0);
      const child = children.find(c => c.id === s.childId);
      return {
        date: new Date(s.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        성공률: trials > 0 ? Math.round((successes / trials) * 100) : 0,
        child: child?.name || '',
      };
    });

    // Goal-level stats
    const goalStats = activeGoals.map(goal => {
      const goalTrials = sessions.flatMap(s => s.trials.filter(t => t.goalId === goal.id));
      const total = goalTrials.reduce((a, t) => a + t.trials, 0);
      const succ = goalTrials.reduce((a, t) => a + t.successes, 0);
      const rate = total > 0 ? Math.round((succ / total) * 100) : 0;

      // Trend: compare last 3 vs previous 3
      const sorted = [...sessions]
        .filter(s => s.trials.some(t => t.goalId === goal.id))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const recent = sorted.slice(0, 3).flatMap(s => s.trials.filter(t => t.goalId === goal.id));
      const older = sorted.slice(3, 6).flatMap(s => s.trials.filter(t => t.goalId === goal.id));
      const recentRate = recent.length > 0 ? recent.reduce((a, t) => a + t.successes, 0) / recent.reduce((a, t) => a + t.trials, 0) : 0;
      const olderRate = older.length > 0 ? older.reduce((a, t) => a + t.successes, 0) / older.reduce((a, t) => a + t.trials, 0) : 0;
      const trend = older.length === 0 ? 'stable' : recentRate > olderRate + 0.05 ? 'up' : recentRate < olderRate - 0.05 ? 'down' : 'stable';

      return { goal, rate, trend, sessionCount: sorted.length };
    });

    // Recent vs older comparison
    const recentSessions = sortedSessions.slice(-3);
    const olderSessions = sortedSessions.slice(-6, -3);
    const getRate = (ss: typeof sessions) => {
      const t = ss.flatMap(s => s.trials);
      const total = t.reduce((a, x) => a + x.trials, 0);
      const succ = t.reduce((a, x) => a + x.successes, 0);
      return total > 0 ? Math.round((succ / total) * 100) : 0;
    };
    const recentRate = getRate(recentSessions);
    const trendDirection = olderSessions.length > 0
      ? (recentRate > getRate(olderSessions) ? 'up' : recentRate < getRate(olderSessions) ? 'down' : 'stable')
      : 'stable';

    // Goal bar chart data
    const goalChartData = goalStats.map(gs => ({
      name: gs.goal.title.length > 6 ? gs.goal.title.slice(0, 6) + '…' : gs.goal.title,
      성공률: gs.rate,
    }));

    return { totalSessions, activeGoals: activeGoals.length, avgRate, recentRate, trendDirection, chartData, goalStats, goalChartData };
  }, [sessions, goals, children]);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">세션 요약</h1>
        <p className="text-muted-foreground">자녀의 치료 세션 현황과 성과를 확인하세요</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="rounded-lg bg-primary/5 p-2 mb-2 mx-auto w-fit">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">{summary.totalSessions}</p>
            <p className="text-xs text-muted-foreground mt-1">총 세션</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="rounded-lg bg-accent/5 p-2 mb-2 mx-auto w-fit">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-accent">{summary.activeGoals}</p>
            <p className="text-xs text-muted-foreground mt-1">활성 목표</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="rounded-lg bg-success/5 p-2 mb-2 mx-auto w-fit">
              <BarChart3 className="h-5 w-5 text-success" />
            </div>
            <p className="text-2xl font-bold text-success">{summary.avgRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">전체 평균 성공률</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="rounded-lg bg-muted p-2 mb-2 mx-auto w-fit">
              {summary.trendDirection === 'up'
                ? <TrendingUp className="h-5 w-5 text-success" />
                : summary.trendDirection === 'down'
                ? <TrendingUp className="h-5 w-5 text-destructive rotate-180" />
                : <Activity className="h-5 w-5 text-muted-foreground" />
              }
            </div>
            <p className="text-2xl font-bold text-foreground">{summary.recentRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">최근 추이</p>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate Trend Chart */}
      {summary.chartData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              성공률 추이 (최근 10회)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                    formatter={(value: number) => [`${value}%`, '성공률']}
                  />
                  <Line type="monotone" dataKey="성공률" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal-level Bar Chart */}
      {summary.goalChartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              목표별 성공률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.goalChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                    formatter={(value: number) => [`${value}%`, '성공률']}
                  />
                  <Bar dataKey="성공률" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">목표별 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.goalStats.map(gs => (
              <div key={gs.goal.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div>
                  <p className="font-medium text-sm">{gs.goal.title}</p>
                  <p className="text-xs text-muted-foreground">{gs.goal.category} · {gs.sessionCount}세션</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${gs.rate >= 70 ? 'text-success' : gs.rate >= 50 ? 'text-warning' : 'text-destructive'}`}>
                    {gs.rate}%
                  </span>
                  {gs.trend === 'up' && <Badge className="bg-success/10 text-success border-0 text-xs">↑ 향상</Badge>}
                  {gs.trend === 'down' && <Badge className="bg-destructive/10 text-destructive border-0 text-xs">↓ 주의</Badge>}
                  {gs.trend === 'stable' && <Badge variant="secondary" className="text-xs">→ 유지</Badge>}
                </div>
              </div>
            ))}
            {summary.goalStats.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">아직 기록된 세션 데이터가 없습니다</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
