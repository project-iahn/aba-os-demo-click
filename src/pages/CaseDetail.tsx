import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Sparkles, Calendar, Target, BarChart3, FileText, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GoalsTab } from '@/components/case-detail/GoalsTab';
import { SessionsTab } from '@/components/case-detail/SessionsTab';
import { AnalyticsTab } from '@/components/case-detail/AnalyticsTab';
import { ReportsTab } from '@/components/case-detail/ReportsTab';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getChildById, getGoalsByChildId, getSessionsByChildId, getReportsByChildId, getTherapistById } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  const child = getChildById(id || '');
  const goals = getGoalsByChildId(id || '');
  const sessions = getSessionsByChildId(id || '');
  const reports = getReportsByChildId(id || '');
  const therapist = child ? getTherapistById(child.therapistId) : undefined;

  // Calculate statistics
  const stats = useMemo(() => {
    if (sessions.length === 0) return { avgSuccessRate: 0, totalSessions: 0, activeGoals: 0 };

    const allTrials = sessions.flatMap((s) => s.trials);
    const totalTrials = allTrials.reduce((acc, t) => acc + t.trials, 0);
    const totalSuccesses = allTrials.reduce((acc, t) => acc + t.successes, 0);

    return {
      avgSuccessRate: totalTrials > 0 ? Math.round((totalSuccesses / totalTrials) * 100) : 0,
      totalSessions: sessions.length,
      activeGoals: goals.filter((g) => g.status === 'active').length,
    };
  }, [sessions, goals]);

  if (!child) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">케이스를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cases')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{child.name}</h1>
            <Badge className={child.status === 'active' ? 'badge-active border' : 'badge-inactive border'}>
              {child.status === 'active' ? '진행중' : '종료'}
            </Badge>
          </div>
          <p className="text-muted-foreground">{child.diagnosis}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">개요</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">목표</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">세션</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">분석</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">리포트</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="stat-card">
              <CardContent className="p-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-3">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalSessions}</p>
                    <p className="text-sm text-muted-foreground">총 세션</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-accent/10 p-3">
                    <Target className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeGoals}</p>
                    <p className="text-sm text-muted-foreground">활성 목표</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="stat-card">
              <CardContent className="p-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-success/10 p-3">
                    <BarChart3 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.avgSuccessRate}%</p>
                    <p className="text-sm text-muted-foreground">평균 성공률</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Child Info */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">아동 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">나이</p>
                    <p className="font-medium">{child.age}세</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">생년월일</p>
                    <p className="font-medium">{new Date(child.birthDate).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">시작일</p>
                    <p className="font-medium">{new Date(child.startDate).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">최근 세션</p>
                    <p className="font-medium">
                      {child.lastSessionDate
                        ? new Date(child.lastSessionDate).toLocaleDateString('ko-KR')
                        : '-'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">주요 관심사</p>
                  <p className="font-medium">{child.concern}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">진단명</p>
                  <p className="font-medium">{child.diagnosis}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">보호자 및 담당 치료사</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">보호자</p>
                  <p className="font-medium">
                    {child.guardianName} ({child.guardianRelation})
                  </p>
                  <p className="text-sm text-muted-foreground">{child.guardianPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">담당 치료사</p>
                  {therapist && (
                    <>
                      <p className="font-medium">{therapist.name}</p>
                      <p className="text-sm text-muted-foreground">{therapist.specialization}</p>
                    </>
                  )}
                </div>
                {child.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">메모</p>
                    <p className="font-medium">{child.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals">
          <GoalsTab childId={id || ''} goals={goals} />
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <SessionsTab childId={id || ''} sessions={sessions} goals={goals} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AnalyticsTab sessions={sessions} goals={goals} />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <ReportsTab childId={id || ''} child={child} reports={reports} sessions={sessions} goals={goals} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
