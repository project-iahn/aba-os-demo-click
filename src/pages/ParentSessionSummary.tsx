import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, User, BookOpen, Sparkles, Calendar, Star } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Skill domain mapping from goal categories
const SKILL_DOMAIN_MAP: Record<string, { domain: string; icon: string }> = {
  '의사소통': { domain: '표현 언어', icon: '🗣️' },
  '표현언어': { domain: '표현 언어', icon: '🗣️' },
  '수용언어': { domain: '언어 이해', icon: '👂' },
  '사회성': { domain: '사회적 상호작용', icon: '🤝' },
  '놀이': { domain: '사회적 상호작용', icon: '🤝' },
  '감각통합': { domain: '감각 및 행동', icon: '🧩' },
  '행동': { domain: '감각 및 행동', icon: '🧩' },
  '자조기술': { domain: '일상생활 자립', icon: '🏠' },
};

// Example achievements per goal for "체감" data
const EXAMPLE_ACHIEVEMENTS: Record<string, string[]> = {
  'g1': ['과자 줘', '놀이 하고 싶어', '물 주세요'],
  'g2': ['대화 중 눈맞춤 3초 유지'],
  'g3': ['앉아', '일어나', '공 줘', '이리 와'],
  'g10': ['사과', '물', '바나나', '자동차'],
  'g11': ['앉아', '일어나', '손 씻어'],
  'g12': ['보드게임 차례 기다리기'],
  'g13': ['기쁨', '슬픔', '화남'],
  'g14': ['사과', '자동차', '강아지', '공', '물'],
  'g15': ['몸짓으로 "줘" 표현', '"더" 요구하기'],
};

export default function ParentSessionSummary() {
  const { sessions, goals, children } = useApp();

  const PARENT_CHILD_IDS = ['c1'];
  const myChildren = children.filter(c => PARENT_CHILD_IDS.includes(c.id));
  const mySessions = sessions.filter(s => PARENT_CHILD_IDS.includes(s.childId));
  const myGoals = goals.filter(g => PARENT_CHILD_IDS.includes(g.childId) && g.status === 'active');

  const skillDomains = useMemo(() => {
    // Group goals by skill domain
    const domainMap = new Map<string, { icon: string; goalIds: string[]; goalTitles: string[] }>();

    myGoals.forEach(goal => {
      const mapping = SKILL_DOMAIN_MAP[goal.category] || { domain: '기타', icon: '📋' };
      const existing = domainMap.get(mapping.domain);
      if (existing) {
        existing.goalIds.push(goal.id);
        existing.goalTitles.push(goal.title);
      } else {
        domainMap.set(mapping.domain, { icon: mapping.icon, goalIds: [goal.id], goalTitles: [goal.title] });
      }
    });

    // Calculate skill progress per domain
    const sortedSessions = [...mySessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return Array.from(domainMap.entries()).map(([domain, { icon, goalIds, goalTitles }]) => {
      // Overall success rate for this domain
      const allTrials = mySessions.flatMap(s => s.trials.filter(t => goalIds.includes(t.goalId)));
      const totalTrials = allTrials.reduce((a, t) => a + t.trials, 0);
      const totalSuccesses = allTrials.reduce((a, t) => a + t.successes, 0);
      const rate = totalTrials > 0 ? Math.round((totalSuccesses / totalTrials) * 100) : 0;

      // Trend: recent 3 sessions vs older 3
      const relevantSessions = sortedSessions.filter(s => s.trials.some(t => goalIds.includes(t.goalId)));
      const recent = relevantSessions.slice(-3).flatMap(s => s.trials.filter(t => goalIds.includes(t.goalId)));
      const older = relevantSessions.slice(-6, -3).flatMap(s => s.trials.filter(t => goalIds.includes(t.goalId)));
      const recentRate = recent.length > 0 ? recent.reduce((a, t) => a + t.successes, 0) / recent.reduce((a, t) => a + t.trials, 0) : 0;
      const olderRate = older.length > 0 ? older.reduce((a, t) => a + t.successes, 0) / older.reduce((a, t) => a + t.trials, 0) : 0;
      const trend = older.length === 0 ? 'stable' : recentRate > olderRate + 0.05 ? 'up' : recentRate < olderRate - 0.05 ? 'down' : 'stable';

      // Monthly trend data for chart
      const monthlyData = new Map<string, { trials: number; successes: number }>();
      sortedSessions.forEach(s => {
        const domainTrials = s.trials.filter(t => goalIds.includes(t.goalId));
        if (domainTrials.length === 0) return;
        const monthKey = new Date(s.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        const existing = monthlyData.get(monthKey) || { trials: 0, successes: 0 };
        domainTrials.forEach(t => {
          existing.trials += t.trials;
          existing.successes += t.successes;
        });
        monthlyData.set(monthKey, existing);
      });
      const chartData = Array.from(monthlyData.entries()).map(([date, d]) => ({
        date,
        달성률: d.trials > 0 ? Math.round((d.successes / d.trials) * 100) : 0,
      }));

      // Example achievements
      const examples = goalIds.flatMap(gid => EXAMPLE_ACHIEVEMENTS[gid] || []);

      // Independence level (from prompt level: 0=독립, lower is better)
      const avgPrompt = allTrials.length > 0
        ? allTrials.reduce((a, t) => a + t.promptLevel, 0) / allTrials.length
        : 3;
      const independenceLabel = avgPrompt <= 0.5 ? '혼자서 해요' : avgPrompt <= 1.5 ? '조금만 도와주면 해요' : avgPrompt <= 2.5 ? '도움이 필요해요' : '많이 도와줘야 해요';

      return { domain, icon, rate, trend, chartData, goalTitles, examples, independenceLabel };
    });
  }, [mySessions, myGoals, myChildren]);

  // Overall therapy summary
  const therapySummary = useMemo(() => {
    const totalSessions = mySessions.length;
    const allTrials = mySessions.flatMap(s => s.trials);
    const totalTrialCount = allTrials.reduce((a, t) => a + t.trials, 0);
    const totalSuccesses = allTrials.reduce((a, t) => a + t.successes, 0);
    const overallRate = totalTrialCount > 0 ? Math.round((totalSuccesses / totalTrialCount) * 100) : 0;
    const improvingDomains = skillDomains.filter(d => d.trend === 'up').length;
    const lastSession = [...mySessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return { totalSessions, overallRate, improvingDomains, lastSessionDate: lastSession?.date };
  }, [mySessions, skillDomains]);

  const child = myChildren[0];

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl mx-auto">
      {/* Child greeting */}
      {child && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {child.name} 보호자님, 안녕하세요 👋
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {child.age}세 · {child.concern?.replace(/지연|어려움|장애|부족/g, '향상').replace(/문제/g, '발달')} 목표
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Therapy summary - answers "Is therapy working?" */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            치료 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{therapySummary.totalSessions}회</p>
              <p className="text-xs text-muted-foreground mt-1">누적 세션</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{therapySummary.improvingDomains}개</p>
              <p className="text-xs text-muted-foreground mt-1">향상 영역</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{therapySummary.overallRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">전체 달성률</p>
            </div>
          </div>
          {therapySummary.lastSessionDate && (
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              최근 세션: {new Date(therapySummary.lastSessionDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skill Domain Progress - core of parent view */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">발달 영역별 성장</h2>
        <p className="text-sm text-muted-foreground mb-4">우리 아이의 발달 영역별 현재 수준과 변화를 확인하세요</p>
      </div>

      {skillDomains.map(sd => (
        <Card key={sd.domain}>
          <CardContent className="p-5 space-y-4">
            {/* Domain header with rate */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{sd.icon}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{sd.domain}</h3>
                  <p className="text-xs text-muted-foreground">{sd.independenceLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">{sd.rate}%</span>
                {sd.trend === 'up' && <Badge className="bg-success/10 text-success border-0 text-xs gap-1"><TrendingUp className="h-3 w-3" />향상</Badge>}
                {sd.trend === 'down' && <Badge className="bg-destructive/10 text-destructive border-0 text-xs gap-1"><TrendingDown className="h-3 w-3" />주의</Badge>}
                {sd.trend === 'stable' && <Badge variant="secondary" className="text-xs gap-1"><Minus className="h-3 w-3" />유지</Badge>}
              </div>
            </div>

            {/* Progress bar */}
            <Progress value={sd.rate} className="h-2.5" />

            {/* Trend chart */}
            {sd.chartData.length > 1 && (
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sd.chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="fill-muted-foreground" hide />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: '12px' }}
                      formatter={(value: number) => [`${value}%`, '달성률']}
                    />
                    <Line type="monotone" dataKey="달성률" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Example achievements */}
            {sd.examples.length > 0 && (
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Star className="h-3.5 w-3.5 text-warning" />
                  <span className="text-xs font-medium text-muted-foreground">할 수 있게 된 것들</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sd.examples.map((ex, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">
                      {ex}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* What child is learning - skills list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            현재 배우고 있는 기술
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {myGoals.map(goal => {
              const mapping = SKILL_DOMAIN_MAP[goal.category] || { domain: '기타', icon: '📋' };
              return (
                <div key={goal.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{mapping.icon}</span>
                    <span className="text-sm text-foreground">{goal.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-normal">{mapping.domain}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {skillDomains.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">아직 기록된 세션 데이터가 없습니다</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
