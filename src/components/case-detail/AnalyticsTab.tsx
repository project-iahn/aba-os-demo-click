import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Generate insights
  const insights = useMemo(() => {
    if (sessions.length < 2) return [];

    const recentSessions = [...sessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);

    const insights: string[] = [];

    goals.forEach((goal) => {
      const recentTrials = recentSessions
        .flatMap((s) => s.trials)
        .filter((t) => t.goalId === goal.id);

      if (recentTrials.length >= 2) {
        const rates = recentTrials.map((t) => t.successes / t.trials);
        const avgRecent = rates.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
        const avgOlder = rates.slice(2).reduce((a, b) => a + b, 0) / Math.max(rates.slice(2).length, 1);

        if (avgRecent > avgOlder + 0.1) {
          insights.push(
            `${goal.title} 목표의 성공률이 최근 4회 세션에서 개선되고 있습니다.`
          );
        } else if (avgRecent < avgOlder - 0.1) {
          insights.push(
            `${goal.title} 목표에서 최근 성공률이 다소 감소했습니다. 전략 조정을 고려해보세요.`
          );
        }

        // Check prompt level improvement
        const prompts = recentTrials.map((t) => t.promptLevel);
        const avgPromptRecent = prompts.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
        const avgPromptOlder = prompts.slice(2).reduce((a, b) => a + b, 0) / Math.max(prompts.slice(2).length, 1);

        if (avgPromptRecent < avgPromptOlder - 0.3) {
          insights.push(
            `${goal.title}에서 촉진 수준이 낮아지고 있습니다 - 독립성이 향상되고 있습니다!`
          );
        }
      }
    });

    return insights.slice(0, 3);
  }, [sessions, goals]);

  const activeGoals = goals.filter((g) => g.status === 'active');

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">분석할 세션 데이터가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insights */}
      {insights.length > 0 && (
        <Card className="insight-box border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">📊 인사이트</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  {insight}
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
