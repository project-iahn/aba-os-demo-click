import { useState, useMemo } from 'react';
import { 
  Sparkles, FileDown, Calendar, Check, Share2, Eye, 
  TrendingUp, TrendingDown, Minus, BarChart3, Loader2 
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ParentExplainer } from '@/components/ParentExplainer';
import type { Child, Goal, Report, Session } from '@/data/mockData';
import { promptLevelLabels } from '@/data/mockData';

interface ReportsTabProps {
  childId: string;
  child: Child;
  reports: Report[];
  sessions: Session[];
  goals: Goal[];
}

type PeriodOption = '7' | '30' | 'custom';

interface GoalStat {
  goal: Goal;
  successRate: number;
  firstRate: number;
  lastRate: number;
  avgPrompt: number;
  firstPrompt: number;
  lastPrompt: number;
  successTrend: string;
  promptTrend: string;
  problemBehaviors: number;
  sessionCount: number;
}

export function ReportsTab({ childId, child, reports, sessions, goals }: ReportsTabProps) {
  const { addReport, therapists, role } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showParentPreview, setShowParentPreview] = useState(false);
  
  // Report generation options
  const [periodOption, setPeriodOption] = useState<PeriodOption>('30');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);

  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active'), [goals]);

  const initializeDialog = () => {
    setSelectedGoalIds(activeGoals.map(g => g.id));
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setCustomStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setCustomEndDate(today.toISOString().split('T')[0]);
    setPeriodOption('30');
  };

  const getDateRange = () => {
    const today = new Date();
    let startDate: Date;
    let endDate = today;

    if (periodOption === 'custom') {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      const days = parseInt(periodOption);
      startDate = new Date();
      startDate.setDate(today.getDate() - days);
    }

    return { startDate, endDate };
  };

  // Calculate goal stats for the selected report
  const selectedReportStats = useMemo(() => {
    if (!selectedReport) return null;
    
    const { periodStart, periodEnd, includedGoals } = selectedReport;
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    
    const periodSessions = sessions.filter((s) => {
      const sessionDate = new Date(s.date);
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    const includedGoalsList = goals.filter(g => includedGoals.includes(g.id));

    return includedGoalsList.map((goal) => {
      const trials = periodSessions.flatMap((s) =>
        s.trials.filter((t) => t.goalId === goal.id)
      );

      if (trials.length === 0) return null;

      const totalTrials = trials.reduce((acc, t) => acc + t.trials, 0);
      const totalSuccesses = trials.reduce((acc, t) => acc + t.successes, 0);

      const sortedTrials = [...trials];
      const firstTrials = sortedTrials.slice(0, Math.ceil(sortedTrials.length / 2));
      const lastTrials = sortedTrials.slice(Math.ceil(sortedTrials.length / 2));

      const firstRate = firstTrials.length > 0
        ? firstTrials.reduce((acc, t) => acc + t.successes, 0) /
          firstTrials.reduce((acc, t) => acc + t.trials, 0)
        : 0;
      const lastRate = lastTrials.length > 0
        ? lastTrials.reduce((acc, t) => acc + t.successes, 0) /
          lastTrials.reduce((acc, t) => acc + t.trials, 0)
        : firstRate;

      const successTrend = lastRate > firstRate + 0.05 ? 'up' : lastRate < firstRate - 0.05 ? 'down' : 'stable';

      return {
        goal,
        successRate: Math.round((totalSuccesses / totalTrials) * 100),
        firstRate: Math.round(firstRate * 100),
        lastRate: Math.round(lastRate * 100),
        successTrend,
        sessionCount: new Set(periodSessions.filter(s => s.trials.some(t => t.goalId === goal.id)).map(s => s.id)).size,
      };
    }).filter(Boolean) as { goal: Goal; successRate: number; firstRate: number; lastRate: number; successTrend: string; sessionCount: number }[];
  }, [selectedReport, sessions, goals]);

  const generateReport = () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progressive loading
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 20;
      });
    }, 300);

    setTimeout(() => {
      clearInterval(progressInterval);
      setGenerationProgress(100);

      const { startDate, endDate } = getDateRange();
      const monthName = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
      const periodLabel = periodOption === '7' ? '최근 7일' : periodOption === '30' ? '최근 30일' : 
        `${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')}`;

      // Get sessions in the selected period
      const periodSessions = sessions.filter((s) => {
        const sessionDate = new Date(s.date);
        return sessionDate >= startDate && sessionDate <= endDate;
      });

      // Get selected goals
      const includedGoals = goals.filter(g => selectedGoalIds.includes(g.id));

      // Calculate stats per goal
      const goalStats = includedGoals.map((goal) => {
        const trials = periodSessions.flatMap((s) =>
          s.trials.filter((t) => t.goalId === goal.id)
        );

        if (trials.length === 0) return null;

        const totalTrials = trials.reduce((acc, t) => acc + t.trials, 0);
        const totalSuccesses = trials.reduce((acc, t) => acc + t.successes, 0);
        const totalProblemBehaviors = trials.reduce((acc, t) => acc + t.problemBehaviorCount, 0);

        // Calculate first and last session stats for comparison
        const sortedTrials = [...trials];
        const firstTrials = sortedTrials.slice(0, Math.ceil(sortedTrials.length / 2));
        const lastTrials = sortedTrials.slice(Math.ceil(sortedTrials.length / 2));

        const firstRate = firstTrials.length > 0
          ? firstTrials.reduce((acc, t) => acc + t.successes, 0) /
            firstTrials.reduce((acc, t) => acc + t.trials, 0)
          : 0;
        const lastRate = lastTrials.length > 0
          ? lastTrials.reduce((acc, t) => acc + t.successes, 0) /
            lastTrials.reduce((acc, t) => acc + t.trials, 0)
          : firstRate;

        const firstPrompt = firstTrials.length > 0
          ? firstTrials.reduce((acc, t) => acc + t.promptLevel, 0) / firstTrials.length
          : 0;
        const lastPrompt = lastTrials.length > 0
          ? lastTrials.reduce((acc, t) => acc + t.promptLevel, 0) / lastTrials.length
          : firstPrompt;

        const successTrend = lastRate > firstRate + 0.05 ? '향상' : lastRate < firstRate - 0.05 ? '감소' : '유지';
        const promptTrend = lastPrompt < firstPrompt - 0.3 ? '향상' : lastPrompt > firstPrompt + 0.3 ? '증가' : '유지';

        return {
          goal,
          successRate: Math.round((totalSuccesses / totalTrials) * 100),
          firstRate: Math.round(firstRate * 100),
          lastRate: Math.round(lastRate * 100),
          avgPrompt: Math.round((trials.reduce((acc, t) => acc + t.promptLevel, 0) / trials.length) * 10) / 10,
          firstPrompt: Math.round(firstPrompt * 10) / 10,
          lastPrompt: Math.round(lastPrompt * 10) / 10,
          successTrend,
          promptTrend,
          problemBehaviors: totalProblemBehaviors,
          sessionCount: new Set(periodSessions.filter(s => s.trials.some(t => t.goalId === goal.id)).map(s => s.id)).size,
        };
      }).filter(Boolean) as GoalStat[];

      const therapist = therapists.find((t) => t.id === child.therapistId);
      const improvingGoals = goalStats.filter(s => s.successTrend === '향상');
      const decliningGoals = goalStats.filter(s => s.successTrend === '감소');
      const promptImprovingGoals = goalStats.filter(s => s.promptTrend === '향상');

      // Determine overall status badge
      let overallStatus: 'improving' | 'stable' | 'attention' = 'stable';
      if (improvingGoals.length > decliningGoals.length) overallStatus = 'improving';
      else if (decliningGoals.length > improvingGoals.length) overallStatus = 'attention';

      // Generate summary
      const summaryParts: string[] = [];
      if (improvingGoals.length > 0) {
        summaryParts.push(`${improvingGoals.map(g => g.goal.title).join(', ')} 목표 성공률 향상`);
      }
      if (decliningGoals.length > 0) {
        summaryParts.push(`${decliningGoals.map(g => g.goal.title).join(', ')} 목표 주의 필요`);
      }
      if (promptImprovingGoals.length > 0) {
        summaryParts.push(`${promptImprovingGoals.map(g => g.goal.title).join(', ')} 독립성 향상`);
      }
      const summary = summaryParts.length > 0 
        ? summaryParts.join('. ') + '.'
        : `${periodSessions.length}회 세션 진행. 전반적으로 안정적인 수행.`;

      // Generate patterns section
      const patterns: string[] = [];
      if (improvingGoals.length > decliningGoals.length) {
        patterns.push('전반적으로 긍정적인 발전 추세가 관찰됩니다.');
      } else if (decliningGoals.length > improvingGoals.length) {
        patterns.push('일부 목표에서 성공률이 감소하고 있어 전략 조정이 필요할 수 있습니다.');
      }
      if (promptImprovingGoals.length > 0) {
        patterns.push(`${promptImprovingGoals.map(g => g.goal.title).join(', ')}에서 촉진 수준이 감소하여 독립성이 향상되고 있습니다.`);
      }
      const avgProblemBehavior = goalStats.reduce((acc, s) => acc + s.problemBehaviors, 0) / Math.max(periodSessions.length, 1);
      if (avgProblemBehavior < 1) {
        patterns.push('문제행동 발생 빈도가 낮게 유지되고 있습니다.');
      } else if (avgProblemBehavior > 2) {
        patterns.push('문제행동 빈도가 다소 높아 행동 관리 전략 검토가 필요합니다.');
      }

      const content = `[${child.name} 아동 - ${periodLabel} 관찰 보고서]

※ 본 리포트는 진단이나 처방이 아닌, 입력된 치료 기록을 기반으로 한 관찰 요약입니다.

안녕하세요, ${child.guardianName} 보호자님.

${periodLabel} 동안 진행된 ${periodSessions.length}회의 치료 세션에 대한 관찰 내용을 전달드립니다.

【기간 요약】
${periodSessions.length}회의 세션이 진행되었으며, ${includedGoals.length}개의 치료 목표에 대한 기록이 포함되어 있습니다. ${
  improvingGoals.length > decliningGoals.length 
    ? '전반적으로 긍정적인 발전이 관찰되었습니다.' 
    : improvingGoals.length < decliningGoals.length
    ? '일부 목표에서 추가적인 지원이 필요한 것으로 보입니다.'
    : '안정적인 수행이 유지되고 있습니다.'
}

【목표별 변화】

${goalStats
  .map(
    (stat, i) => `${i + 1}. ${stat.goal.title} (${stat.goal.category})
   - 성공률: ${stat.firstRate}% → ${stat.lastRate}% (${stat.successTrend}${stat.successTrend !== '유지' ? `, ${stat.successTrend === '향상' ? '+' : ''}${stat.lastRate - stat.firstRate}%p` : ''})
   - 촉진 수준: ${promptLevelLabels[Math.round(stat.firstPrompt)]} → ${promptLevelLabels[Math.round(stat.lastPrompt)]} (${stat.promptTrend})
   - 세션 수: ${stat.sessionCount}회
   - 문제행동: 총 ${stat.problemBehaviors}회`
  )
  .join('\n\n')}

【관찰된 패턴】
${patterns.length > 0 ? patterns.map(p => `- ${p}`).join('\n') : '- 충분한 데이터가 수집되면 패턴 분석이 가능합니다.'}

【다음 세션 관찰 포인트】
${goalStats
  .slice(0, 3)
  .map((stat) => {
    if (stat.successTrend === '감소') {
      return `- ${stat.goal.title}: 성공률 변화 원인 파악 및 전략 조정 관찰`;
    } else if (stat.promptTrend === '향상') {
      return `- ${stat.goal.title}: 독립 수행의 일반화 관찰`;
    } else if (stat.successRate >= 80) {
      return `- ${stat.goal.title}: 마스터리 기준 달성 여부 관찰`;
    } else {
      return `- ${stat.goal.title}: 현재 촉진 수준에서의 일관성 관찰`;
    }
  })
  .join('\n')}

감사합니다.
담당 치료사: ${therapist?.name || ''}`;

      const report: Report = {
        id: `r${Date.now()}`,
        childId,
        title: `${monthName} ${periodOption === '7' ? '주간' : periodOption === '30' ? '월간' : '기간'} 진행 리포트`,
        period: new Date().toISOString().slice(0, 7),
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0],
        summary,
        content,
        createdAt: new Date().toISOString(),
        createdBy: therapist?.name || '',
        includedGoals: selectedGoalIds,
      };

      addReport(report);
      setSelectedReport(report);
      setIsGenerating(false);
      setIsDialogOpen(false);
    }, 2000);
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoalIds(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const getOverallStatus = () => {
    if (!selectedReportStats || selectedReportStats.length === 0) return 'stable';
    const improving = selectedReportStats.filter(s => s.successTrend === 'up').length;
    const declining = selectedReportStats.filter(s => s.successTrend === 'down').length;
    if (improving > declining) return 'improving';
    if (declining > improving) return 'attention';
    return 'stable';
  };

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

  const canGenerate = role === 'admin';
  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Parent explainer */}
      {role === 'parent' && (
        <ParentExplainer
          title="진행 리포트란?"
          description="치료사가 정기적으로 작성하는 관찰 보고서입니다. 자녀의 목표별 성공률, 독립성 변화, 관찰된 패턴을 확인할 수 있습니다. 이 리포트는 진단이나 처방이 아닌 치료 기록 기반의 관찰 요약입니다."
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">설명 리포트 ({reports.length}개)</h2>
          <p className="text-sm text-muted-foreground">보호자에게 공유할 수 있는 관찰 문서입니다</p>
        </div>
        {canGenerate && sessions.length > 0 && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={initializeDialog}>
                <Sparkles className="h-4 w-4" />
                설명 리포트 생성
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>리포트 생성 옵션</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  세션 데이터를 기반으로 보호자 설명용 문서를 생성합니다
                </p>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Period Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">기간 선택</Label>
                  <Select value={periodOption} onValueChange={(v) => setPeriodOption(v as PeriodOption)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">최근 7일</SelectItem>
                      <SelectItem value="30">최근 30일</SelectItem>
                      <SelectItem value="custom">사용자 지정</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {periodOption === 'custom' && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="space-y-2">
                        <Label htmlFor="startDate" className="text-sm">시작일</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="text-sm">종료일</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Goal Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">포함할 목표 선택</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-border p-3">
                    {activeGoals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">활성 목표가 없습니다</p>
                    ) : (
                      activeGoals.map((goal) => (
                        <div key={goal.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={goal.id}
                            checked={selectedGoalIds.includes(goal.id)}
                            onCheckedChange={() => toggleGoal(goal.id)}
                          />
                          <Label htmlFor={goal.id} className="text-sm font-normal cursor-pointer flex-1">
                            {goal.title}
                            <span className="text-muted-foreground ml-2">({goal.category})</span>
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedGoalIds(activeGoals.map(g => g.id))}
                    >
                      전체 선택
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedGoalIds([])}
                    >
                      전체 해제
                    </Button>
                  </div>
                </div>

                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      데이터 분석 및 설명 리포트 생성 중...
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                )}

                <Button 
                  onClick={generateReport} 
                  disabled={isGenerating || selectedGoalIds.length === 0}
                  className="w-full gap-2"
                >
                  <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                  {isGenerating ? '리포트 생성 중...' : '설명 리포트 생성'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {sessions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex h-32 flex-col items-center justify-center gap-2">
            <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">세션 데이터가 있어야 설명 리포트를 생성할 수 있습니다</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Reports List */}
        <div className="space-y-3 lg:col-span-1">
          {sortedReports.length === 0 ? (
            <Card>
              <CardContent className="flex h-32 items-center justify-center">
                <p className="text-sm text-muted-foreground">생성된 리포트가 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            sortedReports.map((report) => (
              <Card
                key={report.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedReport?.id === report.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{report.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{report.period}</Badge>
                  </div>
                  {report.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                      {report.summary}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Report Viewer */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{selectedReport.title}</CardTitle>
                      {getOverallStatus() === 'improving' && (
                        <Badge className="bg-success/10 text-success border-success/20 gap-1">
                          <TrendingUp className="h-3 w-3" />
                          개선 중
                        </Badge>
                      )}
                      {getOverallStatus() === 'attention' && (
                        <Badge className="bg-warning/10 text-warning border-warning/20 gap-1">
                          <TrendingDown className="h-3 w-3" />
                          주의 필요
                        </Badge>
                      )}
                      {getOverallStatus() === 'stable' && (
                        <Badge className="bg-muted text-muted-foreground gap-1">
                          <Minus className="h-3 w-3" />
                          안정적
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {child.name} · 작성자: {selectedReport.createdBy} ·{' '}
                      {new Date(selectedReport.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => setShowParentPreview(!showParentPreview)}
                    >
                      <Eye className="h-4 w-4" />
                      {showParentPreview ? '원본 보기' : '보호자 뷰'}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      공유
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileDown className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visual Summary Cards */}
                {selectedReportStats && selectedReportStats.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="bg-muted/30">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-primary">
                          {sessions.filter(s => {
                            const d = new Date(s.date);
                            return d >= new Date(selectedReport.periodStart) && d <= new Date(selectedReport.periodEnd);
                          }).length}회
                        </p>
                        <p className="text-sm text-muted-foreground">총 세션 수</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-success">
                          {Math.round(selectedReportStats.reduce((acc, s) => acc + s.successRate, 0) / selectedReportStats.length)}%
                        </p>
                        <p className="text-sm text-muted-foreground">평균 성공률</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-accent">
                          {selectedReportStats.filter(s => s.successTrend === 'up').length}/{selectedReportStats.length}
                        </p>
                        <p className="text-sm text-muted-foreground">향상 목표</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Goal Performance Bars */}
                {selectedReportStats && selectedReportStats.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">목표별 성과</h4>
                    {selectedReportStats.map((stat) => (
                      <div key={stat.goal.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{stat.goal.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{stat.successRate}%</span>
                            {getTrendIcon(stat.successTrend)}
                          </div>
                        </div>
                        <div className="h-3 rounded-full bg-muted overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              stat.successRate >= 80 ? 'bg-success' :
                              stat.successRate >= 60 ? 'bg-accent' :
                              stat.successRate >= 40 ? 'bg-warning' : 'bg-destructive'
                            }`}
                            style={{ width: `${stat.successRate}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {stat.firstRate}% → {stat.lastRate}% · {stat.sessionCount}회 세션
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Report Content */}
                <div className="rounded-lg bg-muted/30 p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {selectedReport.content}
                  </pre>
                </div>

                {/* Disclaimer Footer */}
                <div className="rounded-lg bg-warning/5 border border-warning/20 p-3">
                  <p className="text-xs text-muted-foreground">
                    ※ 본 리포트는 진단이나 처방이 아닌, 입력된 치료 기록을 기반으로 한 관찰 요약입니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex h-64 flex-col items-center justify-center gap-2">
                <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-muted-foreground">리포트를 선택하세요</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
