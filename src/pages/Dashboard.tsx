import { useMemo, useState } from 'react';
import { Users, Calendar, TrendingDown, TrendingUp, FileText, AlertTriangle, Clock, ArrowRight, ChevronDown, ChevronRight, DollarSign, CreditCard, Receipt, PieChart } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

export default function Dashboard() {
  const { children, sessions, reports, goals, therapists } = useApp();
  const navigate = useNavigate();
  const [expandedTherapists, setExpandedTherapists] = useState<Record<string, boolean>>({});

  const kpis = useMemo(() => {
    const activeCases = children.filter((c) => c.status === 'active').length;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sessionsLast7Days = sessions.filter(
      (s) => new Date(s.date) >= sevenDaysAgo
    ).length;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const activeReports = reports.filter((r) => r.period === currentMonth).length;
    return { activeCases, sessionsLast7Days, activeReports };
  }, [children, sessions, reports]);

  const alerts = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const childrenNeedingReports = children.filter((c) => {
      const hasReportThisMonth = reports.some(
        (r) => r.childId === c.id && r.period === currentMonth
      );
      return c.status === 'active' && !hasReportThisMonth;
    });

    const childrenWithDecline = children.map((c) => {
      const childSessions = sessions
        .filter(s => s.childId === c.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4);
      if (childSessions.length < 4) return null;
      const recentTrials = childSessions.slice(0, 2).flatMap(s => s.trials);
      const olderTrials = childSessions.slice(2, 4).flatMap(s => s.trials);
      if (recentTrials.length === 0 || olderTrials.length === 0) return null;
      const recentRate = Math.round((recentTrials.reduce((a, t) => a + t.successes, 0) /
        recentTrials.reduce((a, t) => a + t.trials, 0)) * 100);
      const olderRate = Math.round((olderTrials.reduce((a, t) => a + t.successes, 0) /
        olderTrials.reduce((a, t) => a + t.trials, 0)) * 100);
      if (recentRate < olderRate - 10) {
        return { child: c, recentRate, olderRate, change: recentRate - olderRate };
      }
      return null;
    }).filter(Boolean) as { child: typeof children[0]; recentRate: number; olderRate: number; change: number }[];

    return { childrenNeedingReports, childrenWithDecline };
  }, [children, sessions, reports]);

  const recentSessionsByTherapist = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const grouped: Record<string, typeof sessions> = {};
    for (const s of sorted) {
      if (!grouped[s.therapistId]) grouped[s.therapistId] = [];
      grouped[s.therapistId].push(s);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key] = grouped[key].slice(0, 5);
    }
    return grouped;
  }, [sessions]);

  // Case management summary
  const caseManagement = useMemo(() => {
    const active = children.filter(c => c.status === 'active');
    const pending = children.filter(c => c.status === 'pending');
    const inactive = children.filter(c => c.status === 'inactive');
    const totalGoals = goals.length;
    const masteredGoals = goals.filter(g => g.status === 'mastered').length;
    const activeGoals = goals.filter(g => g.status === 'active').length;

    // Therapist workload
    const therapistWorkload = therapists.map(t => {
      const caseCount = children.filter(c => c.therapistId === t.id && c.status === 'active').length;
      const sessionCount = sessions.filter(s => s.therapistId === t.id).length;
      return { ...t, activeCases: caseCount, totalSessions: sessionCount };
    });

    return { active, pending, inactive, totalGoals, masteredGoals, activeGoals, therapistWorkload };
  }, [children, goals, sessions, therapists]);

  // Mock accounting data
  const accounting = useMemo(() => {
    const activeCases = children.filter(c => c.status === 'active').length;
    const totalSessionsMonth = sessions.filter(s => {
      const d = new Date(s.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    // Mock financial data
    const sessionFee = 50000; // 5만원 per session
    const monthlyRevenue = totalSessionsMonth * sessionFee;
    const voucherCount = Math.floor(activeCases * 0.6);
    const insuranceCount = Math.floor(activeCases * 0.3);
    const selfPayCount = activeCases - voucherCount - insuranceCount;

    return {
      monthlyRevenue,
      totalSessionsMonth,
      voucherCount,
      insuranceCount,
      selfPayCount,
      pendingClaims: voucherCount + insuranceCount,
      collectedRate: 78,
    };
  }, [children, sessions]);

  const toggleTherapist = (id: string) => {
    setExpandedTherapists(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const kpiCards = [
    { label: '활성 케이스', value: kpis.activeCases, subtext: '현재 진행 중인 아동', icon: Users, color: 'text-primary', bgColor: 'bg-primary/10' },
    { label: '최근 7일 세션', value: kpis.sessionsLast7Days, subtext: '지난 일주일 치료 활동', icon: Calendar, color: 'text-accent', bgColor: 'bg-accent/10' },
    { label: '활성 리포트', value: kpis.activeReports, subtext: '이번 달 작성 완료', icon: FileText, color: 'text-success', bgColor: 'bg-success/10' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">운영 대시보드</h1>
        <p className="text-muted-foreground">센터 운영 현황을 한눈에 파악하고 관리하세요</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
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
                      <Badge key={child.id} variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => navigate(`/cases/${child.id}`)}>
                        {child.name}<ArrowRight className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-success font-medium">✓ 모든 아동의 리포트가 완료되었습니다</p>
              )}
            </CardContent>
          </Card>

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
                      <div key={item.child.id} className="flex items-center justify-between rounded-lg bg-destructive/5 px-3 py-2 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => navigate(`/cases/${item.child.id}`)}>
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
                </div>
              ) : (
                <p className="text-sm text-success font-medium">✓ 모든 아동이 안정적인 진전을 보이고 있습니다</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Case Management & Accounting Tabs */}
      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cases" className="gap-2">
            <Users className="h-4 w-4" />
            전체 케이스 관리
          </TabsTrigger>
          <TabsTrigger value="accounting" className="gap-2">
            <DollarSign className="h-4 w-4" />
            회계 관리
          </TabsTrigger>
        </TabsList>

        {/* Case Management Tab */}
        <TabsContent value="cases" className="space-y-4">
          {/* Case Status Overview */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">진행중</p>
                    <p className="text-2xl font-bold text-success">{caseManagement.active.length}</p>
                  </div>
                  <Badge className="bg-success/10 text-success border-0">Active</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">대기중</p>
                    <p className="text-2xl font-bold text-warning">{caseManagement.pending.length}</p>
                  </div>
                  <Badge className="bg-warning/10 text-warning border-0">Pending</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">종료</p>
                    <p className="text-2xl font-bold text-muted-foreground">{caseManagement.inactive.length}</p>
                  </div>
                  <Badge variant="secondary">Inactive</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Goals Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">목표 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">활성 목표</span>
                  <span className="font-semibold">{caseManagement.activeGoals}개</span>
                </div>
                <Progress value={caseManagement.totalGoals > 0 ? (caseManagement.activeGoals / caseManagement.totalGoals) * 100 : 0} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">달성 완료</span>
                  <span className="font-semibold text-success">{caseManagement.masteredGoals}개</span>
                </div>
                <Progress value={caseManagement.totalGoals > 0 ? (caseManagement.masteredGoals / caseManagement.totalGoals) * 100 : 0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Therapist Workload */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">치료사별 업무량</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>치료사</TableHead>
                    <TableHead>전문분야</TableHead>
                    <TableHead className="text-center">담당 케이스</TableHead>
                    <TableHead className="text-center">총 세션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {caseManagement.therapistWorkload.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-muted-foreground">{t.specialization}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{t.activeCases}명</Badge>
                      </TableCell>
                      <TableCell className="text-center">{t.totalSessions}회</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => navigate('/cases')}>
              전체 케이스 목록 보기 <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </TabsContent>

        {/* Accounting Tab */}
        <TabsContent value="accounting" className="space-y-4">
          {/* Revenue KPIs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-success/10 p-3">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{(accounting.monthlyRevenue / 10000).toLocaleString()}만원</p>
                    <p className="text-xs text-muted-foreground">이번 달 예상 매출</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{accounting.pendingClaims}건</p>
                    <p className="text-xs text-muted-foreground">미청구 건수</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-accent/10 p-3">
                    <PieChart className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{accounting.collectedRate}%</p>
                    <p className="text-xs text-muted-foreground">수금률</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Type Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">결제 유형별 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="text-sm">발달재활 바우처</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{accounting.voucherCount}명</span>
                    <Progress value={(accounting.voucherCount / (children.filter(c => c.status === 'active').length || 1)) * 100} className="h-2 w-24" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-accent" />
                    <span className="text-sm">실비 보험</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{accounting.insuranceCount}명</span>
                    <Progress value={(accounting.insuranceCount / (children.filter(c => c.status === 'active').length || 1)) * 100} className="h-2 w-24" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                    <span className="text-sm">자비 부담</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{accounting.selfPayCount}명</span>
                    <Progress value={(accounting.selfPayCount / (children.filter(c => c.status === 'active').length || 1)) * 100} className="h-2 w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Session Billing */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">이번 달 세션 청구 내역</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>항목</TableHead>
                    <TableHead className="text-center">건수</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>바우처 세션</TableCell>
                    <TableCell className="text-center">{Math.floor(accounting.totalSessionsMonth * 0.6)}회</TableCell>
                    <TableCell className="text-right">{(Math.floor(accounting.totalSessionsMonth * 0.6) * 50000 / 10000).toLocaleString()}만원</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>실비 세션</TableCell>
                    <TableCell className="text-center">{Math.floor(accounting.totalSessionsMonth * 0.3)}회</TableCell>
                    <TableCell className="text-right">{(Math.floor(accounting.totalSessionsMonth * 0.3) * 50000 / 10000).toLocaleString()}만원</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>자비 세션</TableCell>
                    <TableCell className="text-center">{accounting.totalSessionsMonth - Math.floor(accounting.totalSessionsMonth * 0.6) - Math.floor(accounting.totalSessionsMonth * 0.3)}회</TableCell>
                    <TableCell className="text-right">{((accounting.totalSessionsMonth - Math.floor(accounting.totalSessionsMonth * 0.6) - Math.floor(accounting.totalSessionsMonth * 0.3)) * 50000 / 10000).toLocaleString()}만원</TableCell>
                  </TableRow>
                  <TableRow className="font-semibold border-t-2">
                    <TableCell>합계</TableCell>
                    <TableCell className="text-center">{accounting.totalSessionsMonth}회</TableCell>
                    <TableCell className="text-right">{(accounting.monthlyRevenue / 10000).toLocaleString()}만원</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">* 세션당 단가 50,000원 기준 (데모 데이터)</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Sessions - grouped by therapist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            최근 치료 세션
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2">
              <p className="text-sm text-muted-foreground">아직 기록된 세션이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {therapists.map((therapist) => {
                const therapistSessions = recentSessionsByTherapist[therapist.id];
                if (!therapistSessions || therapistSessions.length === 0) return null;
                const isExpanded = expandedTherapists[therapist.id] ?? false;
                const therapistChildren = children.filter(c => c.therapistId === therapist.id);

                return (
                  <Collapsible key={therapist.id} open={isExpanded} onOpenChange={() => toggleTherapist(therapist.id)}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                          {therapist.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">{therapist.name}</p>
                          <p className="text-xs text-muted-foreground">{therapist.specialization} · 담당 {therapistChildren.length}명</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{therapistSessions.length}세션</Badge>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-1 ml-6 space-y-2 border-l-2 border-border/30 pl-4">
                        {therapistSessions.map((session) => {
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                  {child?.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{child?.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(session.date).toLocaleDateString('ko-KR')} · {session.duration}분 · {session.trials.length}개 목표
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  <span className={avgSuccess >= 0.7 ? 'text-success' : avgSuccess >= 0.5 ? 'text-warning' : 'text-destructive'}>
                                    {Math.round(avgSuccess * 100)}%
                                  </span>
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
