import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Calendar, FileDown, BarChart3, Target, Activity } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Report } from '@/data/mockData';

export default function ReportsPage() {
  const { reports, children, sessions, goals, role } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportTemplate, setExportTemplate] = useState<'default' | 'voucher' | 'insurance'>('default');

  const filteredReports = selectedChildId
    ? reports.filter((r) => r.childId === selectedChildId)
    : reports;

  const sortedReports = [...filteredReports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const reportsByChild = sortedReports.reduce((acc, report) => {
    const child = children.find((c) => c.id === report.childId);
    const childName = child?.name || '알 수 없음';
    if (!acc[childName]) acc[childName] = [];
    acc[childName].push(report);
    return acc;
  }, {} as Record<string, Report[]>);

  // Parent summary stats
  const parentSummary = useMemo(() => {
    if (role !== 'parent') return null;
    const activeChildren = children.filter(c => c.status === 'active');
    const totalSessions = sessions.length;
    const activeGoals = goals.filter(g => g.status === 'active').length;

    // Avg success rate across all sessions
    const allTrials = sessions.flatMap(s => s.trials);
    const totalTrialCount = allTrials.reduce((a, t) => a + t.trials, 0);
    const totalSuccesses = allTrials.reduce((a, t) => a + t.successes, 0);
    const avgRate = totalTrialCount > 0 ? Math.round((totalSuccesses / totalTrialCount) * 100) : 0;

    // Recent trend
    const recentSessions = [...sessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
    const recentTrials = recentSessions.flatMap(s => s.trials);
    const recentTotal = recentTrials.reduce((a, t) => a + t.trials, 0);
    const recentSuccesses = recentTrials.reduce((a, t) => a + t.successes, 0);
    const recentRate = recentTotal > 0 ? Math.round((recentSuccesses / recentTotal) * 100) : 0;

    return { activeChildren: activeChildren.length, totalSessions, activeGoals, avgRate, recentRate };
  }, [role, children, sessions, goals]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">리포트</h1>
          <p className="text-muted-foreground">
            {role === 'parent' ? '자녀의 치료 진행 리포트를 확인하세요' : '생성된 모든 리포트를 조회하세요'}
          </p>
        </div>
      </div>

      {/* Parent Summary Banner */}
      {parentSummary && (
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-5">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              세션 및 분석 요약
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-card p-3 text-center">
                <p className="text-2xl font-bold text-primary">{parentSummary.totalSessions}</p>
                <p className="text-xs text-muted-foreground mt-1">총 세션 수</p>
              </div>
              <div className="rounded-lg bg-card p-3 text-center">
                <p className="text-2xl font-bold text-accent">{parentSummary.activeGoals}</p>
                <p className="text-xs text-muted-foreground mt-1">활성 목표</p>
              </div>
              <div className="rounded-lg bg-card p-3 text-center">
                <p className="text-2xl font-bold text-success">{parentSummary.avgRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">전체 평균 성공률</p>
              </div>
              <div className="rounded-lg bg-card p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{parentSummary.recentRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">최근 3회 성공률</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedChildId || "all"}
          onValueChange={(value) => setSelectedChildId(value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="아동 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {children.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">총 {sortedReports.length}개 리포트</p>
      </div>

      {/* Reports Grid */}
      {sortedReports.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            <div className="text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">생성된 리포트가 없습니다</p>
              <p className="text-sm text-muted-foreground">
                {role === 'parent' ? '치료사가 리포트를 생성하면 여기에 표시됩니다' : '아동 상세 페이지에서 AI 리포트를 생성해보세요'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(reportsByChild).map(([childName, childReports]) => (
            <div key={childName}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {childName.charAt(0)}
                </div>
                {childName}
                <Badge variant="secondary" className="ml-2">{childReports.length}</Badge>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {childReports.map((report) => (
                  <Card key={report.id} className="cursor-pointer transition-all hover:shadow-md" onClick={() => setSelectedReport(report)}>
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                          <FileText className="h-5 w-5 text-accent" />
                        </div>
                        <Badge variant="outline">{report.period}</Badge>
                      </div>
                      <h3 className="mb-1 font-medium">{report.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">작성자: {report.createdBy}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>{selectedReport.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {children.find((c) => c.id === selectedReport.childId)?.name} ·{' '}
                      {new Date(selectedReport.createdAt).toLocaleDateString('ko-KR')} ·{' '}
                      {selectedReport.createdBy}
                    </p>
                  </div>
                  {role !== 'parent' && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowExportDialog(true)}>
                      <FileDown className="h-4 w-4" />
                      내보내기
                    </Button>
                  )}
                </div>
              </DialogHeader>
              <div className="mt-4 rounded-lg bg-muted/30 p-6">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {selectedReport.content}
                </pre>
              </div>
              {role !== 'parent' && (
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={() => { setSelectedReport(null); navigate(`/cases/${selectedReport.childId}`); }}>
                    아동 상세 보기
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Template Dialog */}
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
            <Button
              onClick={() => {
                const names = { default: '기본 템플릿', voucher: '바우처 템플릿', insurance: '실비 템플릿' };
                toast({ title: '내보내기', description: `${names[exportTemplate]}으로 내보내기를 준비합니다. (데모)` });
                setShowExportDialog(false);
              }}
              className="w-full gap-2"
            >
              <FileDown className="h-4 w-4" />
              내보내기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
