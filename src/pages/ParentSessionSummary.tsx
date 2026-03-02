import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, User, BookOpen, Sparkles, Calendar, Star, Zap, Target, BarChart3 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getMasteredStimuli, getStimulusMastery, type Trial } from '@/data/mockData';

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

const DOMAIN_MILESTONES: Record<string, { threshold: number; label: string }[]> = {
  '표현 언어': [
    { threshold: 80, label: '2단어 조합 요청 가능' },
    { threshold: 90, label: '자발적 문장 표현 가능' },
  ],
  '언어 이해': [
    { threshold: 85, label: '2단계 지시 이해 가능' },
    { threshold: 95, label: '복합 지시 독립 수행' },
  ],
  '사회적 상호작용': [
    { threshold: 80, label: '또래와 협동 놀이 가능' },
    { threshold: 90, label: '자발적 사회적 시작 가능' },
  ],
  '감각 및 행동': [
    { threshold: 80, label: '새로운 환경 적응 가능' },
    { threshold: 90, label: '독립적 감정 조절 가능' },
  ],
  '일상생활 자립': [
    { threshold: 80, label: '기본 자조기술 독립 수행' },
    { threshold: 90, label: '일상 루틴 자립 가능' },
  ],
};

interface SkillDomainData {
  domain: string;
  icon: string;
  rate: number;
  trend: 'up' | 'down' | 'stable';
  chartData: { date: string; 달성률: number }[];
  goalTitles: string[];
  masteredStimuli: string[];
  stimulusMastery: { stimulus: string; rate: number; total: number }[];
  independenceLabel: string;
  velocityPerMonth: number | null;
  velocityLabel: string;
  velocityComparison: string;
  forecast: { label: string; monthsAway: number } | null;
  periodGrowth: number | null;
  periodMonths: number;
}

export default function ParentSessionSummary() {
  const { sessions, goals, children } = useApp();

  const PARENT_CHILD_IDS = ['c1'];
  const myChildren = children.filter(c => PARENT_CHILD_IDS.includes(c.id));
  const mySessions = sessions.filter(s => PARENT_CHILD_IDS.includes(s.childId));
  const myGoals = goals.filter(g => PARENT_CHILD_IDS.includes(g.childId) && g.status === 'active');

  // Collect all trial records across sessions
  const allTrialRecords: Trial[] = useMemo(() => {
    return mySessions.flatMap(s => s.trialRecords || []);
  }, [mySessions]);

  const skillDomains = useMemo((): SkillDomainData[] => {
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

    const sortedSessions = [...mySessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return Array.from(domainMap.entries()).map(([domain, { icon, goalIds, goalTitles }]) => {
      const allTrials = mySessions.flatMap(s => s.trials.filter(t => goalIds.includes(t.goalId)));
      const totalTrials = allTrials.reduce((a, t) => a + t.trials, 0);
      const totalSuccesses = allTrials.reduce((a, t) => a + t.successes, 0);
      const rate = totalTrials > 0 ? Math.round((totalSuccesses / totalTrials) * 100) : 0;

      const relevantSessions = sortedSessions.filter(s => s.trials.some(t => goalIds.includes(t.goalId)));
      const recent = relevantSessions.slice(-3).flatMap(s => s.trials.filter(t => goalIds.includes(t.goalId)));
      const older = relevantSessions.slice(-6, -3).flatMap(s => s.trials.filter(t => goalIds.includes(t.goalId)));
      const recentRate = recent.length > 0 ? recent.reduce((a, t) => a + t.successes, 0) / recent.reduce((a, t) => a + t.trials, 0) : 0;
      const olderRate = older.length > 0 ? older.reduce((a, t) => a + t.successes, 0) / older.reduce((a, t) => a + t.trials, 0) : 0;
      const trend: 'up' | 'down' | 'stable' = older.length === 0 ? 'stable' : recentRate > olderRate + 0.05 ? 'up' : recentRate < olderRate - 0.05 ? 'down' : 'stable';

      // Session time series for velocity
      const sessionRates = relevantSessions.map(s => {
        const trials = s.trials.filter(t => goalIds.includes(t.goalId));
        const t = trials.reduce((a, x) => a + x.trials, 0);
        const su = trials.reduce((a, x) => a + x.successes, 0);
        return { date: new Date(s.date), rate: t > 0 ? (su / t) * 100 : 0 };
      });

      let velocityPerMonth: number | null = null;
      let periodGrowth: number | null = null;
      let periodMonths = 0;

      if (sessionRates.length >= 2) {
        const first = sessionRates[0];
        const last = sessionRates[sessionRates.length - 1];
        const daysDiff = (last.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24);
        periodMonths = Math.max(daysDiff / 30, 0.5);
        periodGrowth = Math.round(last.rate - first.rate);
        velocityPerMonth = Math.round((last.rate - first.rate) / periodMonths);
      }

      let velocityLabel = '';
      let velocityComparison = '';
      if (velocityPerMonth !== null) {
        if (velocityPerMonth > 10) { velocityLabel = '빠른 성장'; velocityComparison = '또래 평균 성장 속도보다 빠른 편입니다'; }
        else if (velocityPerMonth > 5) { velocityLabel = '꾸준한 성장'; velocityComparison = '안정적인 속도로 발전하고 있습니다'; }
        else if (velocityPerMonth > 0) { velocityLabel = '완만한 성장'; velocityComparison = '천천히 하지만 꾸준히 성장하고 있습니다'; }
        else if (velocityPerMonth === 0) { velocityLabel = '유지 중'; velocityComparison = '현재 수준을 유지하고 있습니다'; }
        else { velocityLabel = '관찰 필요'; velocityComparison = '치료사와 상담을 권장합니다'; }
      }

      let forecast: { label: string; monthsAway: number } | null = null;
      if (velocityPerMonth !== null && velocityPerMonth > 0) {
        const milestones = DOMAIN_MILESTONES[domain] || [];
        const nextMilestone = milestones.find(m => m.threshold > rate);
        if (nextMilestone) {
          const monthsAway = Math.ceil((nextMilestone.threshold - rate) / velocityPerMonth);
          if (monthsAway <= 12) forecast = { label: nextMilestone.label, monthsAway };
        }
      }

      // Chart data
      const monthlyData = new Map<string, { trials: number; successes: number }>();
      sortedSessions.forEach(s => {
        const domainTrials = s.trials.filter(t => goalIds.includes(t.goalId));
        if (domainTrials.length === 0) return;
        const monthKey = new Date(s.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        const existing = monthlyData.get(monthKey) || { trials: 0, successes: 0 };
        domainTrials.forEach(t => { existing.trials += t.trials; existing.successes += t.successes; });
        monthlyData.set(monthKey, existing);
      });
      const chartData = Array.from(monthlyData.entries()).map(([date, d]) => ({
        date,
        달성률: d.trials > 0 ? Math.round((d.successes / d.trials) * 100) : 0,
      }));

      // Trial-level: mastered stimuli and stimulus mastery breakdown
      const domainTrialRecords = allTrialRecords.filter(t => goalIds.includes(t.programId));
      const masteredStimuli = goalIds.flatMap(gid => getMasteredStimuli(allTrialRecords, gid));
      const stimulusMastery = goalIds.flatMap(gid => getStimulusMastery(allTrialRecords, gid)).slice(0, 8);

      // Independence level
      const avgPrompt = allTrials.length > 0
        ? allTrials.reduce((a, t) => a + t.promptLevel, 0) / allTrials.length
        : 3;
      const independenceLabel = avgPrompt <= 0.5 ? '혼자서 해요' : avgPrompt <= 1.5 ? '조금만 도와주면 해요' : avgPrompt <= 2.5 ? '도움이 필요해요' : '많이 도와줘야 해요';

      return {
        domain, icon, rate, trend, chartData, goalTitles,
        masteredStimuli, stimulusMastery,
        independenceLabel,
        velocityPerMonth, velocityLabel, velocityComparison,
        forecast, periodGrowth, periodMonths,
      };
    });
  }, [mySessions, myGoals, myChildren, allTrialRecords]);

  const therapySummary = useMemo(() => {
    const totalSessions = mySessions.length;
    const allTrials = mySessions.flatMap(s => s.trials);
    const totalTrialCount = allTrials.reduce((a, t) => a + t.trials, 0);
    const totalSuccesses = allTrials.reduce((a, t) => a + t.successes, 0);
    const overallRate = totalTrialCount > 0 ? Math.round((totalSuccesses / totalTrialCount) * 100) : 0;
    const improvingDomains = skillDomains.filter(d => d.trend === 'up').length;
    const lastSession = [...mySessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const avgVelocity = skillDomains.filter(d => d.velocityPerMonth !== null).length > 0
      ? Math.round(skillDomains.filter(d => d.velocityPerMonth !== null).reduce((a, d) => a + (d.velocityPerMonth || 0), 0) / skillDomains.filter(d => d.velocityPerMonth !== null).length)
      : null;
    const totalTrialRecords = allTrialRecords.length;

    return { totalSessions, overallRate, improvingDomains, lastSessionDate: lastSession?.date, avgVelocity, totalTrialRecords };
  }, [mySessions, skillDomains, allTrialRecords]);

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

      {/* Therapy summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            치료 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{therapySummary.totalSessions}회</p>
              <p className="text-xs text-muted-foreground mt-1">누적 세션</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{therapySummary.overallRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">전체 달성률</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{therapySummary.improvingDomains}개</p>
              <p className="text-xs text-muted-foreground mt-1">향상 영역</p>
            </div>
            <div>
              {therapySummary.avgVelocity !== null ? (
                <>
                  <p className={`text-2xl font-bold ${therapySummary.avgVelocity > 0 ? 'text-success' : therapySummary.avgVelocity < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {therapySummary.avgVelocity > 0 ? '+' : ''}{therapySummary.avgVelocity}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">월 평균 성장</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-muted-foreground">—</p>
                  <p className="text-xs text-muted-foreground mt-1">월 평균 성장</p>
                </>
              )}
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

      {/* Skill Domain Progress */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">발달 영역별 성장</h2>
        <p className="text-sm text-muted-foreground mb-4">현재 수준, 성장 속도, 예상 발달 경로를 확인하세요</p>
      </div>

      {skillDomains.map(sd => (
        <Card key={sd.domain}>
          <CardContent className="p-5 space-y-4">
            {/* Domain header */}
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

            <Progress value={sd.rate} className="h-2.5" />

            {/* Velocity & Growth */}
            {sd.velocityPerMonth !== null && (
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className={`h-4 w-4 ${sd.velocityPerMonth > 5 ? 'text-success' : sd.velocityPerMonth > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium text-foreground">성장 속도</span>
                  </div>
                  <span className={`text-sm font-bold ${sd.velocityPerMonth > 0 ? 'text-success' : sd.velocityPerMonth < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    월 {sd.velocityPerMonth > 0 ? '+' : ''}{sd.velocityPerMonth}%p
                  </span>
                </div>
                {sd.periodGrowth !== null && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>최근 {sd.periodMonths < 1 ? '2주' : `${Math.round(sd.periodMonths)}개월`} 변화</span>
                    <span className={sd.periodGrowth > 0 ? 'text-success font-medium' : sd.periodGrowth < 0 ? 'text-destructive font-medium' : ''}>
                      {sd.periodGrowth > 0 ? '+' : ''}{sd.periodGrowth}%p
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-xs font-normal">{sd.velocityLabel}</Badge>
                  <span className="text-xs text-muted-foreground">{sd.velocityComparison}</span>
                </div>
              </div>
            )}

            {/* Development Forecast */}
            {sd.forecast && (
              <div className="rounded-lg bg-primary/5 border border-primary/15 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">발달 예측</span>
                </div>
                <p className="text-sm text-foreground">
                  현재 속도 기준, <span className="font-semibold text-primary">약 {sd.forecast.monthsAway}개월 후</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  "{sd.forecast.label}" 수준 도달 예상
                </p>
              </div>
            )}

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

            {/* Stimulus mastery (trial-level data, shown as "체감" info) */}
            {sd.stimulusMastery.length > 0 && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart3 className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-medium text-muted-foreground">세부 항목별 습득률</span>
                </div>
                <div className="space-y-1.5">
                  {sd.stimulusMastery.slice(0, 6).map((sm, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-foreground w-20 truncate">{sm.stimulus}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${sm.rate >= 80 ? 'bg-success' : sm.rate >= 50 ? 'bg-primary' : 'bg-warning'}`}
                          style={{ width: `${sm.rate}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium w-10 text-right ${sm.rate >= 80 ? 'text-success' : sm.rate >= 50 ? 'text-foreground' : 'text-warning'}`}>
                        {sm.rate}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mastered items */}
            {sd.masteredStimuli.length > 0 && (
              <div className="rounded-lg bg-success/5 border border-success/15 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Star className="h-3.5 w-3.5 text-success" />
                  <span className="text-xs font-medium text-success">할 수 있게 된 것들</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sd.masteredStimuli.map((stim, i) => (
                    <Badge key={i} className="bg-success/10 text-success border-0 text-xs font-normal">
                      {stim}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Current skills */}
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
