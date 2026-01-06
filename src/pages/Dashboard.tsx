import { Users, Calendar, TrendingUp, FileText, AlertTriangle, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { children, sessions, reports } = useApp();
  const navigate = useNavigate();

  // Calculate KPIs
  const activeCases = children.filter((c) => c.status === 'active').length;
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sessionsLast7Days = sessions.filter(
    (s) => new Date(s.date) >= sevenDaysAgo
  ).length;

  // Calculate average success rate
  const allTrials = sessions.flatMap((s) => s.trials);
  const avgSuccessRate = allTrials.length > 0
    ? Math.round(
        (allTrials.reduce((acc, t) => acc + t.successes, 0) /
          allTrials.reduce((acc, t) => acc + t.trials, 0)) *
          100
      )
    : 0;

  // Children needing reports (no report this month)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const childrenNeedingReports = children.filter((c) => {
    const hasReportThisMonth = reports.some(
      (r) => r.childId === c.id && r.period === currentMonth
    );
    return c.status === 'active' && !hasReportThisMonth;
  });

  // Children with low adherence (trend down)
  const lowAdherenceChildren = children.filter((c) => c.trend === 'down');

  const kpis = [
    {
      label: '활성 케이스',
      value: activeCases,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: '최근 7일 세션',
      value: sessionsLast7Days,
      icon: Calendar,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: '평균 성공률',
      value: `${avgSuccessRate}%`,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: '생성된 리포트',
      value: reports.length,
      icon: FileText,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
        <p className="text-muted-foreground">센터 현황을 한눈에 확인하세요</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="stat-card">
            <CardContent className="p-0">
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${kpi.bgColor}`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
                <div>
                  <p className="kpi-value">{kpi.value}</p>
                  <p className="kpi-label">{kpi.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Reports Needed Alert */}
        <Card className="alert-card alert-warning">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-warning" />
              월간 리포트 필요
            </CardTitle>
          </CardHeader>
          <CardContent>
            {childrenNeedingReports.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {childrenNeedingReports.length}명의 아동에게 이번 달 리포트가 필요합니다
                </p>
                <div className="flex flex-wrap gap-2">
                  {childrenNeedingReports.map((child) => (
                    <Badge
                      key={child.id}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => navigate(`/cases/${child.id}`)}
                    >
                      {child.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-success">모든 아동의 리포트가 완료되었습니다 ✓</p>
            )}
          </CardContent>
        </Card>

        {/* Low Adherence Alert */}
        <Card className="alert-card alert-info">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              주의 필요 케이스
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowAdherenceChildren.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {lowAdherenceChildren.length}명의 아동이 최근 진전이 저조합니다
                </p>
                <div className="flex flex-wrap gap-2">
                  {lowAdherenceChildren.map((child) => (
                    <Badge
                      key={child.id}
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={() => navigate(`/cases/${child.id}`)}
                    >
                      {child.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-success">모든 아동이 긍정적 진전을 보이고 있습니다 ✓</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            최근 세션
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((session) => {
                const child = children.find((c) => c.id === session.childId);
                const avgSuccess =
                  session.trials.reduce((acc, t) => acc + t.successes, 0) /
                  session.trials.reduce((acc, t) => acc + t.trials, 0);

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {child?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{child?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.date).toLocaleDateString('ko-KR')} · {session.duration}분
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        성공률{' '}
                        <span className={avgSuccess >= 0.7 ? 'text-success' : 'text-warning'}>
                          {Math.round(avgSuccess * 100)}%
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.trials.length}개 목표
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
