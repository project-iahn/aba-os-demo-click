import { useMemo } from 'react';
import { Users, Calendar, TrendingUp, TrendingDown, FileText, AlertTriangle, Clock, ArrowRight, Upload } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate, Navigate } from 'react-router-dom';
import { StepGuide } from '@/components/StepGuide';
import { DataSyncHint } from '@/components/DataSyncHint';

export default function Dashboard() {
  const { children, sessions, reports, goals, role } = useApp();
  const navigate = useNavigate();

  // Calculate KPIs with detailed evidence
  const kpis = useMemo(() => {
    const activeCases = children.filter((c) => c.status === 'active').length;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sessionsLast7Days = sessions.filter(
      (s) => new Date(s.date) >= sevenDaysAgo
    ).length;

    // Calculate average success rate
    const allTrials = sessions.flatMap((s) => s.trials);
    const totalTrials = allTrials.reduce((acc, t) => acc + t.trials, 0);
    const totalSuccesses = allTrials.reduce((acc, t) => acc + t.successes, 0);
    const avgSuccessRate = totalTrials > 0 ? Math.round((totalSuccesses / totalTrials) * 100) : 0;

    // Children needing reports (no report this month)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const reportsNeededCount = children.filter((c) => {
      const hasReportThisMonth = reports.some(
        (r) => r.childId === c.id && r.period === currentMonth
      );
      return c.status === 'active' && !hasReportThisMonth;
    }).length;

    return { activeCases, sessionsLast7Days, avgSuccessRate, reportsNeededCount };
  }, [children, sessions, reports]);

  // Calculate operational alerts with numeric evidence
  const alerts = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Children needing monthly reports
    const childrenNeedingReports = children.filter((c) => {
      const hasReportThisMonth = reports.some(
        (r) => r.childId === c.id && r.period === currentMonth
      );
      return c.status === 'active' && !hasReportThisMonth;
    });

    // Children with declining success rate in last 4 sessions (with evidence)
    const childrenWithDecline = children.map((c) => {
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
      
      if (recentRate < olderRate - 10) {
        return { child: c, recentRate, olderRate, change: recentRate - olderRate };
      }
      return null;
    }).filter(Boolean) as { child: typeof children[0]; recentRate: number; olderRate: number; change: number }[];

    return { childrenNeedingReports, childrenWithDecline };
  }, [children, sessions, reports]);

  const kpiCards = [
    {
      label: '활성 케이스',
      value: kpis.activeCases,
      subtext: '현재 진행 중인 아동',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: '최근 7일 세션',
      value: kpis.sessionsLast7Days,
      subtext: '지난 일주일 치료 활동',
      icon: Calendar,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: '평균 성공률',
      value: `${kpis.avgSuccessRate}%`,
      subtext: '전체 목표 평균',
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: '리포트 미작성',
      value: kpis.reportsNeededCount,
      subtext: '이번 달 작성 필요',
      icon: FileText,
      color: kpis.reportsNeededCount > 0 ? 'text-warning' : 'text-success',
      bgColor: kpis.reportsNeededCount > 0 ? 'bg-warning/10' : 'bg-success/10',
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">운영 대시보드</h1>
          <p className="text-muted-foreground">센터 운영 현황을 한눈에 파악하고 관리하세요</p>
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
      <StepGuide />

      {/* Migration Banner for Admins */}
      {role === 'admin' && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">엑셀·수기 기록 그대로 이전하고 바로 분석하세요</p>
                <p className="text-sm text-muted-foreground">
                  기존 데이터를 업로드하면 차트와 리포트가 자동으로 생성됩니다
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

      {/* Operational Alerts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          운영 알림
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Reports Needed Alert */}
          <Card className="alert-card alert-warning">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-warning" />
                월간 리포트가 필요한 케이스
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.childrenNeedingReports.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm">
                    <span className="font-bold text-warning text-lg">{alerts.childrenNeedingReports.length}명</span>
                    <span className="text-muted-foreground ml-2">아동에게 이번 달 리포트가 필요합니다</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {alerts.childrenNeedingReports.map((child) => (
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
                    케이스를 클릭하여 리포트를 생성하세요
                  </p>
                </div>
              ) : (
                <p className="text-sm text-success font-medium">✓ 모든 아동의 리포트가 완료되었습니다</p>
              )}
            </CardContent>
          </Card>

          {/* Declining Success Rate Alert */}
          <Card className="alert-card alert-info">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="h-5 w-5 text-destructive" />
                최근 성공률 하락 케이스
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.childrenWithDecline.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm">
                    <span className="font-bold text-destructive text-lg">{alerts.childrenWithDecline.length}명</span>
                    <span className="text-muted-foreground ml-2">아동의 최근 성공률이 하락했습니다</span>
                  </p>
                  <div className="space-y-2">
                    {alerts.childrenWithDecline.map((item) => (
                      <div
                        key={item.child.id}
                        className="flex items-center justify-between rounded-lg bg-destructive/5 px-3 py-2 cursor-pointer hover:bg-destructive/10 transition-colors"
                        onClick={() => navigate(`/cases/${item.child.id}`)}
                      >
                        <span className="font-medium">{item.child.name}</span>
                        <span className="text-sm">
                          <span className="text-muted-foreground">{item.olderRate}%</span>
                          <span className="mx-2">→</span>
                          <span className="text-destructive font-semibold">{item.recentRate}%</span>
                          <span className="text-destructive ml-1">({item.change}%p)</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    최근 4회 세션 기준 · 케이스를 클릭하여 상세 분석을 확인하세요
                  </p>
                </div>
              ) : (
                <p className="text-sm text-success font-medium">✓ 모든 아동이 안정적인 진전을 보이고 있습니다</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Data Sync Hint */}
      <DataSyncHint />

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              최근 치료 세션
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/sessions')}>
              전체 보기
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2">
              <p className="text-sm text-muted-foreground">아직 기록된 세션이 없습니다</p>
              <p className="text-xs text-muted-foreground">케이스를 선택하고 세션을 기록해보세요</p>
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
                          성공률{' '}
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
