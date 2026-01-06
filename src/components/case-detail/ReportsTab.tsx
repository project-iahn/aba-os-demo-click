import { useState } from 'react';
import { Sparkles, FileDown, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Child, Goal, Report, Session } from '@/data/mockData';
import { promptLevelLabels } from '@/data/mockData';

interface ReportsTabProps {
  childId: string;
  child: Child;
  reports: Report[];
  sessions: Session[];
  goals: Goal[];
}

export function ReportsTab({ childId, child, reports, sessions, goals }: ReportsTabProps) {
  const { addReport, therapists, role } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const generateReport = () => {
    setIsGenerating(true);

    // Simulate AI generation delay
    setTimeout(() => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthName = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

      // Get recent sessions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSessions = sessions.filter((s) => new Date(s.date) >= thirtyDaysAgo);

      // Calculate stats per goal
      const goalStats = goals.map((goal) => {
        const trials = recentSessions.flatMap((s) =>
          s.trials.filter((t) => t.goalId === goal.id)
        );

        if (trials.length === 0) return null;

        const totalTrials = trials.reduce((acc, t) => acc + t.trials, 0);
        const totalSuccesses = trials.reduce((acc, t) => acc + t.successes, 0);
        const avgPrompt = trials.reduce((acc, t) => acc + t.promptLevel, 0) / trials.length;

        // Compare first half vs second half
        const firstHalf = trials.slice(0, Math.ceil(trials.length / 2));
        const secondHalf = trials.slice(Math.ceil(trials.length / 2));

        const firstRate =
          firstHalf.reduce((acc, t) => acc + t.successes, 0) /
          firstHalf.reduce((acc, t) => acc + t.trials, 0);
        const secondRate =
          secondHalf.length > 0
            ? secondHalf.reduce((acc, t) => acc + t.successes, 0) /
              secondHalf.reduce((acc, t) => acc + t.trials, 0)
            : firstRate;

        const trend = secondRate > firstRate + 0.05 ? '향상' : secondRate < firstRate - 0.05 ? '감소' : '유지';

        return {
          goal,
          successRate: Math.round((totalSuccesses / totalTrials) * 100),
          avgPrompt: Math.round(avgPrompt * 10) / 10,
          trend,
        };
      }).filter(Boolean);

      const therapist = therapists.find((t) => t.id === child.therapistId);

      const content = `[${child.name} 아동 - ${monthName} 관찰 보고서]

※ 본 보고서는 진단이나 처방이 아니라 관찰 기반 요약입니다.

안녕하세요, ${child.guardianName} 보호자님.

${monthName}에 진행된 ${recentSessions.length}회의 치료 세션에 대한 관찰 내용을 전달드립니다.

【목표별 진행 상황】

${goalStats
  .map(
    (stat, i) => `${i + 1}. ${stat!.goal.title} (${stat!.goal.category})
   - 성공률: ${stat!.successRate}% (${stat!.trend})
   - 평균 촉진 수준: ${promptLevelLabels[Math.round(stat!.avgPrompt)]}
   - 목표 기준: ${stat!.goal.targetCriteria}`
  )
  .join('\n\n')}

【전반적 관찰】
${child.name} 아동은 이번 달 동안 ${
        recentSessions.length
      }회의 세션에 참여하였습니다. ${
        goalStats.filter((s) => s!.trend === '향상').length > goalStats.length / 2
          ? '전반적으로 긍정적인 발전을 보이고 있으며, 치료 목표에 대한 참여도가 높습니다.'
          : goalStats.filter((s) => s!.trend === '감소').length > goalStats.length / 2
          ? '일부 목표에서 진전이 더디게 나타나고 있어, 전략 조정이 필요할 수 있습니다.'
          : '전반적으로 안정적인 수행을 보이고 있으며, 꾸준한 연습이 이루어지고 있습니다.'
      }

${
  child.notes
    ? `【추가 관찰 사항】
${child.notes}`
    : ''
}

【가정 연계 권장 사항】
${goalStats
  .slice(0, 3)
  .map((stat) => {
    const suggestions: Record<string, string> = {
      의사소통: '일상에서 아동이 원하는 것을 말로 표현할 기회를 많이 제공해주세요.',
      사회성: '또래나 가족과의 상호작용에서 긍정적인 피드백을 많이 제공해주세요.',
      수용언어: '간단한 지시를 일상에서 자주 연습해주세요.',
      놀이: '다양한 놀이 활동을 통해 모방과 참여를 격려해주세요.',
      감각통합: '다양한 감각 경험을 일상에서 자연스럽게 제공해주세요.',
      자조기술: '스스로 할 수 있는 기회를 충분히 제공하고, 완료 시 칭찬해주세요.',
      행동: '활동 전환 시 미리 예고하고 충분한 준비 시간을 주세요.',
    };
    return `- ${suggestions[stat!.goal.category] || '꾸준한 연습과 긍정적 피드백을 제공해주세요.'}`;
  })
  .join('\n')}

감사합니다.
담당 치료사: ${therapist?.name || ''}`;

      const report: Report = {
        id: `r${Date.now()}`,
        childId,
        title: `${monthName} 월간 보고서`,
        period: currentMonth,
        content,
        createdAt: new Date().toISOString(),
        createdBy: therapist?.name || '',
      };

      addReport(report);
      setSelectedReport(report);
      setIsGenerating(false);
    }, 1500);
  };

  const canGenerate = role === 'admin' || role === 'therapist';
  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">리포트 ({reports.length}개)</h2>
        {canGenerate && sessions.length > 0 && (
          <Button onClick={generateReport} disabled={isGenerating} className="gap-2">
            <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-pulse-soft' : ''}`} />
            {isGenerating ? 'AI 리포트 생성 중...' : 'AI 리포트 생성'}
          </Button>
        )}
      </div>

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
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{report.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <Badge variant="secondary">{report.period}</Badge>
                  </div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedReport.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      작성자: {selectedReport.createdBy} ·{' '}
                      {new Date(selectedReport.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileDown className="h-4 w-4" />
                    내보내기
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted/30 p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {selectedReport.content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">리포트를 선택하세요</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
