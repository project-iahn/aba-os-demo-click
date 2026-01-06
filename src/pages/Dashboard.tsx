import { useMemo } from 'react';
import { Users, Calendar, TrendingUp, TrendingDown, FileText, AlertTriangle, Clock, ArrowRight, Upload, MessageSquareText, Lightbulb } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { StepGuide } from '@/components/StepGuide';
import { DataSyncHint } from '@/components/DataSyncHint';

export default function Dashboard() {
  const { children, sessions, reports, goals, role } = useApp();
  const navigate = useNavigate();

  // Calculate KPIs reframed as explanation-related indicators
  const kpis = useMemo(() => {
    const activeCases = children.filter((c) => c.status === 'active').length;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sessionsLast7Days = sessions.filter(
      (s) => new Date(s.date) >= sevenDaysAgo
    ).length;

    // Calculate average success rate (shareable with parents)
    const allTrials = sessions.flatMap((s) => s.trials);
    const totalTrials = allTrials.reduce((acc, t) => acc + t.trials, 0);
    const totalSuccesses = allTrials.reduce((acc, t) => acc + t.successes, 0);
    const avgSuccessRate = totalTrials > 0 ? Math.round((totalSuccesses / totalTrials) * 100) : 0;

    // Children needing reports (explanation gaps)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const explanationGapCount = children.filter((c) => {
      const hasReportThisMonth = reports.some(
        (r) => r.childId === c.id && r.period === currentMonth
      );
      return c.status === 'active' && !hasReportThisMonth;
    }).length;

    return { activeCases, sessionsLast7Days, avgSuccessRate, explanationGapCount };
  }, [children, sessions, reports]);

  // Calculate explanation risk alerts
  const alerts = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Children without explanation basis in 30 days
    const childrenWithoutEvidence = children.filter((c) => {
      if (c.status !== 'active') return false;
      const hasRecentSession = sessions.some(
        (s) => s.childId === c.id && new Date(s.date) >= thirtyDaysAgo
      );
      return !hasRecentSession;
    });

    // Children needing monthly reports
    const childrenNeedingReports = children.filter((c) => {
      const hasReportThisMonth = reports.some(
        (r) => r.childId === c.id && r.period === currentMonth
      );
      return c.status === 'active' && !hasReportThisMonth;
    });

    // Children with high success rate variance (needs explanation)
    const childrenNeedingExplanation = children.map((c) => {
      const childSessions = sessions
        .filter(s => s.childId === c.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4);
      
      if (childSessions.length < 4) return null;
      
      const recentTrials = childSessions.slice(0, 2).flatMap(s => s.trials);
      const olderTrials = childSessions.slice(2, 4).flatMap(s => s.trials);
      
      if (recentTrials.length === 0 || olderTrials.length === 0) return null;
      
      const recentRate = Math.round((recentTrials.reduce((acc, t) => acc + t.successes, 0) / 
                         recentTrials.reduce((acc, t) => acc + t.trials, 0)) * 100);
      const olderRate = Math.round((olderTrials.reduce((acc, t) => acc + t.successes, 0) / 
                        olderTrials.reduce((acc, t) => acc + t.trials, 0)) * 100);
      
      const variance = Math.abs(recentRate - olderRate);
      if (variance > 15) {
        return { child: c, recentRate, olderRate, variance, direction: recentRate > olderRate ? 'up' : 'down' };
      }
      return null;
    }).filter(Boolean) as { child: typeof children[0]; recentRate: number; olderRate: number; variance: number; direction: 'up' | 'down' }[];

    return { childrenWithoutEvidence, childrenNeedingReports, childrenNeedingExplanation };
  }, [children, sessions, reports]);

  const kpiCards = [
    {
      label: '설명 중인 케이스 수',
      value: kpis.activeCases,
      subtext: '현재 치료 진행 중',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: '최근 설명 근거 세션',
      value: kpis.sessionsLast7Days,
      subtext: '지난 7일 기록',
      icon: Calendar,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: '공유 가능 평균 성공률',
      value: `${kpis.avgSuccessRate}%`,
      subtext: '보호자 설명용',
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: '설명 공백 케이스',
      value: kpis.explanationGapCount,
      subtext: '이번 달 리포트 미생성',
      icon: MessageSquareText,
      color: kpis.explanationGapCount > 0 ? 'text-warning' : 'text-success',
      bgColor: kpis.explanationGapCount > 0 ? 'bg-warning/10' : 'bg-success/10',
    },
  ];
  return (
    <div className="animate-fade-in space-y-6">
      {/* Strategic Positioning Message - Fixed at top */}
      <Card className="border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 shrink-0">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg text-foreground">
                이 화면은 치료 기록을 관리하기 위한 화면이 아닙니다.
              </p>
              <p className="text-muted-foreground mt-1">
                보호자에게 치료 과정을 <span className="text-primary font-medium">설명하기 위한 '근거'</span>를 준비하는 화면입니다.
              </p>
              <p className="text-sm text-muted-foreground/80 mt-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                모든 기록은 자동으로 추이·해석·리포트로 연결됩니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">설명 컨트롤 타워</h1>
          <p className="text-muted-foreground">보호자 설명 준비 현황을 한눈에 파악하세요</p>
        </div>
        
        {role === 'admin' && (
          <Button 
            variant="outline" 
            className="gap-2 self-start"
            onClick={() => navigate('/migration')}
          >
            <Upload className="h-4 w-4" />
            기존 데이터 가져오기
          </Button>
        )}
      </div>

      {/* Step Guide - Show for admin and therapist */}
      {role !== 'parent' && <StepGuide />}

      {/* Migration Banner for Admins */}
      {role === 'admin' && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">기존 엑셀·수기 기록을 그대로 가져와 바로 설명 자료로 전환하세요</p>
                <p className="text-sm text-muted-foreground">
                  센터가 처음부터 시작하지 않아도 됩니다
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/migration')} className="gap-2">
              데이터 마이그레이션
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="stat-card">
            <CardContent className="p-0">
              <div className="flex items-start gap-4">
                <div className={`rounded-xl p-3 ${kpi.bgColor}`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
                <div className="flex-1">
                  <p className="kpi-value">{kpi.value}</p>
                  <p className="kpi-label">{kpi.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.subtext}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Explanation Risk Alerts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          설명 리스크 알림
        </h2>
        <p className="text-sm text-muted-foreground -mt-2">
          보호자 신뢰 유지를 위해 우선적으로 대응이 필요한 케이스입니다
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* No explanation basis in 30 days */}
          <Card className="alert-card alert-warning">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-warning" />
                최근 30일 설명 근거가 없는 케이스
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.childrenWithoutEvidence.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm">
                    <span className="font-bold text-warning text-lg">{alerts.childrenWithoutEvidence.length}명</span>
                    <span className="text-muted-foreground ml-2">보호자에게 제공할 최근 데이터가 없습니다</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {alerts.childrenWithoutEvidence.map((child) => (
                      <Badge
                        key={child.id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80 transition-colors"
                        onClick={() => navigate(`/cases/${child.id}`)}
                      >
                        {child.name}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    세션을 기록해야 설명 근거를 확보할 수 있습니다
                  </p>
                </div>
              ) : (
                <p className="text-sm text-success font-medium">✓ 모든 케이스에 최근 설명 근거가 있습니다</p>
              )}
            </CardContent>
          </Card>

          {/* Needs explanation due to variance */}
          <Card className="alert-card alert-info">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquareText className="h-5 w-5 text-accent" />
                성공률 변동 폭이 커 설명이 필요한 케이스
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.childrenNeedingExplanation.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm">
                    <span className="font-bold text-accent text-lg">{alerts.childrenNeedingExplanation.length}명</span>
                    <span className="text-muted-foreground ml-2">보호자 질문에 대비한 설명 준비가 필요합니다</span>
                  </p>
                  <div className="space-y-2">
                    {alerts.childrenNeedingExplanation.map((item) => (
                      <div
                        key={item.child.id}
                        className="flex items-center justify-between rounded-lg bg-accent/5 px-3 py-2 cursor-pointer hover:bg-accent/10 transition-colors"
                        onClick={() => navigate(`/cases/${item.child.id}`)}
                      >
                        <span className="font-medium">{item.child.name}</span>
                        <span className="text-sm">
                          <span className="text-muted-foreground">{item.olderRate}%</span>
                          <span className="mx-2">→</span>
                          <span className={item.direction === 'up' ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
                            {item.recentRate}%
                          </span>
                          <span className={`ml-1 ${item.direction === 'up' ? 'text-success' : 'text-destructive'}`}>
                            ({item.direction === 'up' ? '+' : ''}{item.recentRate - item.olderRate}%p)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    최근 4회 세션 기준 · 변동 원인 설명 준비 권장
                  </p>
                </div>
              ) : (
                <p className="text-sm text-success font-medium">✓ 모든 케이스가 안정적인 추이를 보입니다</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Data Sync Hint */}
      <DataSyncHint />

      {/* Recent Sessions - Reframed as explanation evidence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              최근 확보된 설명 근거
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/sessions')}>
              전체 보기
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            이 세션 데이터가 보호자 리포트의 수치적 근거가 됩니다
          </p>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2">
              <p className="text-sm text-muted-foreground">아직 기록된 세션이 없습니다</p>
              {role !== 'parent' && (
                <p className="text-xs text-muted-foreground">세션을 기록하면 설명 근거가 자동으로 생성됩니다</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sessions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((session) => {
                  const child = children.find((c) => c.id === session.childId);
                  const totalTrials = session.trials.reduce((acc, t) => acc + t.trials, 0);
                  const totalSuccesses = session.trials.reduce((acc, t) => acc + t.successes, 0);
                  const avgSuccess = totalTrials > 0 ? totalSuccesses / totalTrials : 0;

                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-3 transition-colors hover:bg-muted/30 cursor-pointer"
                      onClick={() => navigate(`/cases/${session.childId}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {child?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{child?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.date).toLocaleDateString('ko-KR')} · {session.duration}분 · {session.trials.length}개 목표
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          공유 가능 성공률{' '}
                          <span className={avgSuccess >= 0.7 ? 'text-success' : avgSuccess >= 0.5 ? 'text-warning' : 'text-destructive'}>
                            {Math.round(avgSuccess * 100)}%
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
