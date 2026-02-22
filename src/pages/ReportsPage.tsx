import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, FileDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Report } from '@/data/mockData';

export default function ReportsPage() {
  const { reports, children, role } = useApp();
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

  const isParent = role === 'parent';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">진행 리포트</h1>
        <p className="text-muted-foreground">
          {isParent ? '자녀의 치료 진행 리포트를 확인하세요' : '생성된 모든 리포트를 조회하세요'}
        </p>
      </div>


      {/* ===== PARENT: Report Banner ===== */}
      {isParent && (
        <Card className="border-accent/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              진행 리포트
              <Badge variant="secondary" className="ml-auto">{sortedReports.length}건</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedReports.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">치료사가 리포트를 생성하면 여기에 표시됩니다</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(reportsByChild).map(([childName, childReports]) => (
                  <div key={childName}>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {childName.charAt(0)}
                      </div>
                      {childName}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {childReports.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center gap-3 rounded-lg border border-border/50 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => setSelectedReport(report)}
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 shrink-0">
                            <FileText className="h-4 w-4 text-accent" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{report.title}</p>
                            <p className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleDateString('ko-KR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== NON-PARENT: Original filter + grid ===== */}
      {!isParent && (
        <>
          <div className="flex items-center gap-4">
            <Select value={selectedChildId || "all"} onValueChange={(value) => setSelectedChildId(value === "all" ? "" : value)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="아동 선택" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {children.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">총 {sortedReports.length}개 리포트</p>
          </div>

          {sortedReports.length === 0 ? (
            <Card>
              <CardContent className="flex h-48 items-center justify-center">
                <div className="text-center">
                  <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">생성된 리포트가 없습니다</p>
                  <p className="text-sm text-muted-foreground">아동 상세 페이지에서 AI 리포트를 생성해보세요</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(reportsByChild).map(([childName, childReports]) => (
                <div key={childName}>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{childName.charAt(0)}</div>
                    {childName}
                    <Badge variant="secondary" className="ml-2">{childReports.length}</Badge>
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {childReports.map((report) => (
                      <Card key={report.id} className="cursor-pointer transition-all hover:shadow-md" onClick={() => setSelectedReport(report)}>
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10"><FileText className="h-5 w-5 text-accent" /></div>
                            <Badge variant="outline">{report.period}</Badge>
                          </div>
                          <h3 className="mb-1 font-medium">{report.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />{new Date(report.createdAt).toLocaleDateString('ko-KR')}
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
        </>
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
                      {children.find((c) => c.id === selectedReport.childId)?.name} · {new Date(selectedReport.createdAt).toLocaleDateString('ko-KR')} · {selectedReport.createdBy}
                    </p>
                  </div>
                  {!isParent && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowExportDialog(true)}>
                      <FileDown className="h-4 w-4" />내보내기
                    </Button>
                  )}
                </div>
              </DialogHeader>
              <div className="mt-4 rounded-lg bg-muted/30 p-6">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{selectedReport.content}</pre>
              </div>
              {!isParent && (
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={() => { setSelectedReport(null); navigate(`/cases/${selectedReport.childId}`); }}>아동 상세 보기</Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Template Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>내보내기 템플릿 선택</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            {[
              { value: 'default' as const, label: '기본 템플릿', desc: '표준 진행 리포트 양식' },
              { value: 'voucher' as const, label: '바우처 템플릿', desc: '발달재활 바우처 제출용 양식' },
              { value: 'insurance' as const, label: '실비 템플릿', desc: '실비 보험 청구용 양식' },
            ].map(tmpl => (
              <div key={tmpl.value} className={`cursor-pointer rounded-lg border p-4 transition-all ${exportTemplate === tmpl.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`} onClick={() => setExportTemplate(tmpl.value)}>
                <p className="font-medium">{tmpl.label}</p>
                <p className="text-sm text-muted-foreground">{tmpl.desc}</p>
              </div>
            ))}
            <Button onClick={() => { const names = { default: '기본 템플릿', voucher: '바우처 템플릿', insurance: '실비 템플릿' }; toast({ title: '내보내기', description: `${names[exportTemplate]}으로 내보내기를 준비합니다. (데모)` }); setShowExportDialog(false); }} className="w-full gap-2">
              <FileDown className="h-4 w-4" />내보내기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
