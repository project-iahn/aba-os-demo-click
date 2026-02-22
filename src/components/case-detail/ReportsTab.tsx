import { useState, useMemo } from 'react';
import { 
  Sparkles, FileDown, Calendar, Check, Share2, Eye, Edit3, Lock,
  TrendingUp, TrendingDown, Minus, BarChart3, Loader2 
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ParentExplainer } from '@/components/ParentExplainer';
import { useToast } from '@/hooks/use-toast';
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
type ExportTemplate = 'default' | 'voucher' | 'insurance';

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
  const { addReport, updateReport, therapists, role } = useApp();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showParentPreview, setShowParentPreview] = useState(false);
  const [showLockAlert, setShowLockAlert] = useState(false);
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editSummary, setEditSummary] = useState('');

  // Export template
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportTemplate, setExportTemplate] = useState<ExportTemplate>('default');
  
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
      startDate = new Date();
      startDate.setDate(today.getDate() - parseInt(periodOption));
    }
    return { startDate, endDate };
  };

  const selectedReportStats = useMemo(() => {
    if (!selectedReport) return null;
    const { periodStart, periodEnd, includedGoals } = selectedReport;
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    const periodSessions = sessions.filter(s => {
      const d = new Date(s.date);
      return d >= startDate && d <= endDate;
    });
    return goals.filter(g => includedGoals.includes(g.id)).map(goal => {
      const trials = periodSessions.flatMap(s => s.trials.filter(t => t.goalId === goal.id));
      if (trials.length === 0) return null;
      const totalTrials = trials.reduce((a, t) => a + t.trials, 0);
      const totalSuccesses = trials.reduce((a, t) => a + t.successes, 0);
      const first = trials.slice(0, Math.ceil(trials.length / 2));
      const last = trials.slice(Math.ceil(trials.length / 2));
      const firstRate = first.length > 0 ? first.reduce((a, t) => a + t.successes, 0) / first.reduce((a, t) => a + t.trials, 0) : 0;
      const lastRate = last.length > 0 ? last.reduce((a, t) => a + t.successes, 0) / last.reduce((a, t) => a + t.trials, 0) : firstRate;
      return {
        goal,
        successRate: Math.round((totalSuccesses / totalTrials) * 100),
        firstRate: Math.round(firstRate * 100),
        lastRate: Math.round(lastRate * 100),
        successTrend: lastRate > firstRate + 0.05 ? 'up' : lastRate < firstRate - 0.05 ? 'down' : 'stable',
        sessionCount: new Set(periodSessions.filter(s => s.trials.some(t => t.goalId === goal.id)).map(s => s.id)).size,
      };
    }).filter(Boolean) as any[];
  }, [selectedReport, sessions, goals]);

  const generateReport = () => {
    // Show lock alert
    setShowLockAlert(true);
    setIsGenerating(true);
    setGenerationProgress(0);

    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => prev >= 90 ? prev : prev + Math.random() * 20);
    }, 300);

    setTimeout(() => {
      clearInterval(progressInterval);
      setGenerationProgress(100);

      const { startDate, endDate } = getDateRange();
      const monthName = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
      const periodLabel = periodOption === '7' ? '최근 7일' : periodOption === '30' ? '최근 30일' :
        `${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')}`;

      const periodSessions = sessions.filter(s => {
        const d = new Date(s.date);
        return d >= startDate && d <= endDate;
      });

      const includedGoals = goals.filter(g => selectedGoalIds.includes(g.id));
      const goalStats = includedGoals.map(goal => {
        const trials = periodSessions.flatMap(s => s.trials.filter(t => t.goalId === goal.id));
        if (trials.length === 0) return null;
        const totalTrials = trials.reduce((a, t) => a + t.trials, 0);
        const totalSuccesses = trials.reduce((a, t) => a + t.successes, 0);
        const totalProblemBehaviors = trials.reduce((a, t) => a + t.problemBehaviorCount, 0);
        const first = trials.slice(0, Math.ceil(trials.length / 2));
        const last = trials.slice(Math.ceil(trials.length / 2));
        const firstRate = first.length > 0 ? first.reduce((a, t) => a + t.successes, 0) / first.reduce((a, t) => a + t.trials, 0) : 0;
        const lastRate = last.length > 0 ? last.reduce((a, t) => a + t.successes, 0) / last.reduce((a, t) => a + t.trials, 0) : firstRate;
        const firstPrompt = first.length > 0 ? first.reduce((a, t) => a + t.promptLevel, 0) / first.length : 0;
        const lastPrompt = last.length > 0 ? last.reduce((a, t) => a + t.promptLevel, 0) / last.length : firstPrompt;
        return {
          goal,
          successRate: Math.round((totalSuccesses / totalTrials) * 100),
          firstRate: Math.round(firstRate * 100),
          lastRate: Math.round(lastRate * 100),
          avgPrompt: Math.round((trials.reduce((a, t) => a + t.promptLevel, 0) / trials.length) * 10) / 10,
          firstPrompt: Math.round(firstPrompt * 10) / 10,
          lastPrompt: Math.round(lastPrompt * 10) / 10,
          successTrend: lastRate > firstRate + 0.05 ? '향상' : lastRate < firstRate - 0.05 ? '감소' : '유지',
          promptTrend: lastPrompt < firstPrompt - 0.3 ? '향상' : lastPrompt > firstPrompt + 0.3 ? '증가' : '유지',
          problemBehaviors: totalProblemBehaviors,
          sessionCount: new Set(periodSessions.filter(s => s.trials.some(t => t.goalId === goal.id)).map(s => s.id)).size,
        };
      }).filter(Boolean) as GoalStat[];

      const therapist = therapists.find(t => t.id === child.therapistId);
      const improvingGoals = goalStats.filter(s => s.successTrend === '향상');
      const decliningGoals = goalStats.filter(s => s.successTrend === '감소');
      const promptImprovingGoals = goalStats.filter(s => s.promptTrend === '향상');

      const summaryParts: string[] = [];
      if (improvingGoals.length > 0) summaryParts.push(`${improvingGoals.map(g => g.goal.title).join(', ')} 목표 성공률 향상`);
      if (decliningGoals.length > 0) summaryParts.push(`${decliningGoals.map(g => g.goal.title).join(', ')} 목표 주의 필요`);
      if (promptImprovingGoals.length > 0) summaryParts.push(`${promptImprovingGoals.map(g => g.goal.title).join(', ')} 독립성 향상`);
      const summary = summaryParts.length > 0 ? summaryParts.join('. ') + '.' : `${periodSessions.length}회 세션 진행. 전반적으로 안정적인 수행.`;

      const content = `[${child.name} 아동 - ${periodLabel} 관찰 보고서]

※ 본 리포트는 진단이나 처방이 아닌, 입력된 치료 기록을 기반으로 한 관찰 요약입니다.

안녕하세요, ${child.guardianName} 보호자님.

${periodLabel} 동안 진행된 ${periodSessions.length}회의 치료 세션에 대한 관찰 내용을 전달드립니다.

【기간 요약】
${periodSessions.length}회의 세션이 진행되었으며, ${includedGoals.length}개의 치료 목표에 대한 기록이 포함되어 있습니다.

【목표별 변화】

${goalStats.map((stat, i) => `${i + 1}. ${stat.goal.title} (${stat.goal.category})
   - 성공률: ${stat.firstRate}% → ${stat.lastRate}% (${stat.successTrend})
   - 촉진 수준: ${promptLevelLabels[Math.round(stat.firstPrompt)]} → ${promptLevelLabels[Math.round(stat.lastPrompt)]} (${stat.promptTrend})
   - 세션 수: ${stat.sessionCount}회
   - 문제행동: 총 ${stat.problemBehaviors}회`).join('\n\n')}

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
      setShowLockAlert(false);
    }, 2000);
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoalIds(prev => prev.includes(goalId) ? prev.filter(id => id !== goalId) : [...prev, goalId]);
  };

  const startEditing = () => {
    if (selectedReport) {
      setEditContent(selectedReport.content);
      setEditSummary(selectedReport.summary);
      setIsEditing(true);
    }
  };

  const saveEdit = () => {
    if (selectedReport) {
      updateReport(selectedReport.id, { content: editContent, summary: editSummary });
      setSelectedReport({ ...selectedReport, content: editContent, summary: editSummary });
      setIsEditing(false);
      toast({ title: '수정 완료', description: '리포트가 수정되었습니다.' });
    }
  };

  const handleExport = () => {
    const templateNames: Record<ExportTemplate, string> = {
      default: '기본 템플릿',
      voucher: '바우처 템플릿',
      insurance: '실비 템플릿',
    };
    toast({ title: '내보내기', description: `${templateNames[exportTemplate]}으로 내보내기를 준비합니다. (데모)` });
    setShowExportDialog(false);
  };

  const getOverallStatus = () => {
    if (!selectedReportStats || selectedReportStats.length === 0) return 'stable';
    const improving = selectedReportStats.filter((s: any) => s.successTrend === 'up').length;
    const declining = selectedReportStats.filter((s: any) => s.successTrend === 'down').length;
    if (improving > declining) return 'improving';
    if (declining > improving) return 'attention';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const canGenerate = role === 'admin' || role === 'therapist';
  const canEdit = role === 'admin' || role === 'therapist';
  const sortedReports = [...reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      {/* Lock alert during generation */}
      <AlertDialog open={showLockAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-warning" />
              리포트 생성 중
            </AlertDialogTitle>
            <AlertDialogDescription>
              AI가 리포트를 생성하는 동안에는 수정할 수 없습니다. 생성이 완료된 후 내용을 수정할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="w-full space-y-3">
              <Progress value={generationProgress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                {generationProgress < 100 ? '데이터 분석 및 리포트 생성 중...' : '완료!'}
              </p>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export template dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>내보내기 템플릿 선택</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[
              { value: 'default' as const, label: '기본 템플릿', desc: '표준 진행 리포트 양식' },
              { value: 'voucher' as const, label: '바우처 템플릿', desc: '발달재활 바우처 제출용 양식' },
              { value: 'insurance' as const, label: '실비 템플릿', desc: '실비 보험 청구용 양식' },
            ].map(tmpl => (
              <div
                key={tmpl.value}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  exportTemplate === tmpl.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setExportTemplate(tmpl.value)}
              >
                <p className="font-medium">{tmpl.label}</p>
                <p className="text-sm text-muted-foreground">{tmpl.desc}</p>
              </div>
            ))}
            <Button onClick={handleExport} className="w-full gap-2">
              <FileDown className="h-4 w-4" />
              내보내기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Parent explainer */}
      {role === 'parent' && (
        <ParentExplainer
          title="진행 리포트란?"
          description="치료사가 정기적으로 작성하는 관찰 보고서입니다. 자녀의 목표별 성공률, 독립성 변화, 관찰된 패턴을 확인할 수 있습니다."
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">진행 리포트 ({reports.length}개)</h2>
        {canGenerate && sessions.length > 0 && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={initializeDialog}>
                <Sparkles className="h-4 w-4" />
                AI 리포트 생성
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>리포트 생성 옵션</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <Label className="text-base font-medium">기간 선택</Label>
                  <Select value={periodOption} onValueChange={(v) => setPeriodOption(v as PeriodOption)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">최근 7일</SelectItem>
                      <SelectItem value="30">최근 30일</SelectItem>
                      <SelectItem value="custom">사용자 지정</SelectItem>
                    </SelectContent>
                  </Select>
                  {periodOption === 'custom' && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="space-y-2">
                        <Label className="text-sm">시작일</Label>
                        <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">종료일</Label>
                        <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-medium">포함할 목표 선택</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-border p-3">
                    {activeGoals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">활성 목표가 없습니다</p>
                    ) : activeGoals.map(goal => (
                      <div key={goal.id} className="flex items-center space-x-3">
                        <Checkbox id={goal.id} checked={selectedGoalIds.includes(goal.id)} onCheckedChange={() => toggleGoal(goal.id)} />
                        <Label htmlFor={goal.id} className="text-sm font-normal cursor-pointer flex-1">
                          {goal.title} <span className="text-muted-foreground ml-2">({goal.category})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedGoalIds(activeGoals.map(g => g.id))}>전체 선택</Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedGoalIds([])}>전체 해제</Button>
                  </div>
                </div>
                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      데이터 분석 및 리포트 생성 중...
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                )}
                <Button onClick={generateReport} disabled={isGenerating || selectedGoalIds.length === 0} className="w-full gap-2">
                  <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                  {isGenerating ? '리포트 생성 중...' : 'AI 리포트 생성'}
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
            <p className="text-sm text-muted-foreground">세션 데이터가 있어야 리포트를 생성할 수 있습니다</p>
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
          ) : sortedReports.map(report => (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all hover:shadow-md ${selectedReport?.id === report.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => { setSelectedReport(report); setIsEditing(false); }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{report.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{report.period}</Badge>
                </div>
                {report.summary && <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{report.summary}</p>}
              </CardContent>
            </Card>
          ))}
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
                      {getOverallStatus() === 'improving' && <Badge className="bg-success/10 text-success border-success/20 gap-1"><TrendingUp className="h-3 w-3" />개선 중</Badge>}
                      {getOverallStatus() === 'attention' && <Badge className="bg-warning/10 text-warning border-warning/20 gap-1"><TrendingDown className="h-3 w-3" />주의 필요</Badge>}
                      {getOverallStatus() === 'stable' && <Badge className="bg-muted text-muted-foreground gap-1"><Minus className="h-3 w-3" />안정적</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {child.name} · 작성자: {selectedReport.createdBy} · {new Date(selectedReport.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {canEdit && !isEditing && (
                      <Button variant="outline" size="sm" className="gap-2" onClick={startEditing}>
                        <Edit3 className="h-4 w-4" />
                        수정
                      </Button>
                    )}
                    {isEditing && (
                      <>
                        <Button size="sm" className="gap-2" onClick={saveEdit}>
                          <Check className="h-4 w-4" />
                          저장
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>취소</Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowExportDialog(true)}>
                      <FileDown className="h-4 w-4" />
                      내보내기
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
                          {Math.round(selectedReportStats.reduce((a: number, s: any) => a + s.successRate, 0) / selectedReportStats.length)}%
                        </p>
                        <p className="text-sm text-muted-foreground">평균 성공률</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-accent">
                          {selectedReportStats.filter((s: any) => s.successTrend === 'up').length}/{selectedReportStats.length}
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
                    {selectedReportStats.map((stat: any) => (
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
                              stat.successRate >= 80 ? 'bg-success' : stat.successRate >= 60 ? 'bg-accent' : stat.successRate >= 40 ? 'bg-warning' : 'bg-destructive'
                            }`}
                            style={{ width: `${stat.successRate}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{stat.firstRate}% → {stat.lastRate}% · {stat.sessionCount}회 세션</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Report Content - editable or read-only */}
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>요약</Label>
                      <Textarea value={editSummary} onChange={(e) => setEditSummary(e.target.value)} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label>내용</Label>
                      <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={20} className="font-mono text-sm" />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/30 p-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{selectedReport.content}</pre>
                  </div>
                )}

                <div className="rounded-lg bg-warning/5 border border-warning/20 p-3">
                  <p className="text-xs text-muted-foreground">※ 본 리포트는 진단이나 처방이 아닌, 입력된 치료 기록을 기반으로 한 관찰 요약입니다.</p>
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
