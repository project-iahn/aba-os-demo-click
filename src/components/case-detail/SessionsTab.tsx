import { useState } from 'react';
import { Plus, Calendar, CheckCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { DataSyncHint } from '@/components/DataSyncHint';
import { useToast } from '@/hooks/use-toast';
import type { Goal, Session, SessionTrial } from '@/data/mockData';
import { promptLevelLabels } from '@/data/mockData';

interface SessionsTabProps {
  childId: string;
  sessions: Session[];
  goals: Goal[];
}

export function SessionsTab({ childId, sessions, goals }: SessionsTabProps) {
  const { addSession, therapists, role } = useApp();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: 50,
    notes: '',
  });
  const [trialData, setTrialData] = useState<Record<string, SessionTrial>>({});

  // Initialize trial data for all active goals
  const initializeTrialData = () => {
    const initial: Record<string, SessionTrial> = {};
    goals
      .filter((g) => g.status === 'active')
      .forEach((goal) => {
        initial[goal.id] = {
          goalId: goal.id,
          trials: 10,
          successes: 5,
          promptLevel: 1,
          problemBehaviorCount: 0,
        };
      });
    setTrialData(initial);
  };

  const handleOpenDialog = () => {
    initializeTrialData();
    setIsDialogOpen(true);
  };

  const handleCreateSession = () => {
    if (!newSession.date) return;

    const session: Session = {
      id: `s${Date.now()}`,
      childId,
      therapistId: therapists[0]?.id || 'th1',
      date: newSession.date,
      duration: newSession.duration,
      notes: newSession.notes,
      trials: Object.values(trialData),
      createdAt: new Date().toISOString(),
    };

    addSession(session);
    setIsDialogOpen(false);
    setNewSession({
      date: new Date().toISOString().split('T')[0],
      duration: 50,
      notes: '',
    });
    setTrialData({});

    // Show success toast with explanation framing
    toast({
      title: "세션 기록 완료",
      description: "추이 분석 및 설명 리포트에 즉시 반영됩니다",
      action: (
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="h-4 w-4" />
        </div>
      ),
    });
  };

  const updateTrialData = (goalId: string, field: keyof SessionTrial, value: number) => {
    setTrialData((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: value,
        // Ensure successes don't exceed trials
        ...(field === 'trials' && prev[goalId].successes > value
          ? { successes: value }
          : {}),
      },
    }));
  };

  const canCreate = role === 'admin' || role === 'therapist';
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">세션 기록 ({sessions.length}회)</h2>
        {canCreate && goals.length > 0 && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" onClick={handleOpenDialog}>
                <Plus className="h-4 w-4" />
                새 세션
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>새 세션 기록</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  이 세션 기록은 보호자 리포트와 설명 자료로 자동 변환됩니다.
                </p>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* Data sync hint */}
                <DataSyncHint />

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">날짜</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newSession.date}
                      onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">시간 (분)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newSession.duration}
                      onChange={(e) =>
                        setNewSession({ ...newSession, duration: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">세션 메모</Label>
                  <Textarea
                    id="notes"
                    value={newSession.notes}
                    onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                    placeholder="오늘 세션에서의 관찰 내용을 기록하세요"
                    rows={3}
                  />
                </div>

                {/* Goal Trials */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">목표별 기록</Label>
                  {goals
                    .filter((g) => g.status === 'active')
                    .map((goal) => {
                      const successRate = trialData[goal.id] 
                        ? Math.round((trialData[goal.id].successes / trialData[goal.id].trials) * 100)
                        : 0;
                      
                      return (
                        <Card key={goal.id} className="p-4">
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{goal.title}</h4>
                              <p className="text-sm text-muted-foreground">{goal.category}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${
                                successRate >= 70 ? 'text-success' : 
                                successRate >= 50 ? 'text-warning' : 'text-destructive'
                              }`}>
                                {successRate}%
                              </p>
                              <p className="text-xs text-muted-foreground">성공률</p>
                            </div>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-sm">시행 횟수: {trialData[goal.id]?.trials || 0}</Label>
                              <Slider
                                value={[trialData[goal.id]?.trials || 10]}
                                min={1}
                                max={20}
                                step={1}
                                onValueChange={([v]) => updateTrialData(goal.id, 'trials', v)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">성공 횟수: {trialData[goal.id]?.successes || 0}</Label>
                              <Slider
                                value={[trialData[goal.id]?.successes || 5]}
                                min={0}
                                max={trialData[goal.id]?.trials || 10}
                                step={1}
                                onValueChange={([v]) => updateTrialData(goal.id, 'successes', v)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">
                                촉진 수준: {promptLevelLabels[trialData[goal.id]?.promptLevel || 0]}
                              </Label>
                              <Slider
                                value={[trialData[goal.id]?.promptLevel || 0]}
                                min={0}
                                max={3}
                                step={1}
                                onValueChange={([v]) => updateTrialData(goal.id, 'promptLevel', v)}
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                {promptLevelLabels.map((label, i) => (
                                  <span key={i}>{label}</span>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">
                                문제행동: {trialData[goal.id]?.problemBehaviorCount || 0}회
                              </Label>
                              <Slider
                                value={[trialData[goal.id]?.problemBehaviorCount || 0]}
                                min={0}
                                max={10}
                                step={1}
                                onValueChange={([v]) =>
                                  updateTrialData(goal.id, 'problemBehaviorCount', v)
                                }
                              />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>

                <Button onClick={handleCreateSession} className="mt-2 gap-2">
                  <CheckCircle className="h-4 w-4" />
                  세션 저장
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Data sync hint for session list - reframed */}
      {canCreate && sessions.length > 0 && (
        <DataSyncHint 
          variant="success" 
          message="기록된 세션은 분석 탭과 설명 리포트의 수치적 근거가 됩니다"
        />
      )}

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex h-32 flex-col items-center justify-center gap-2">
            <p className="text-muted-foreground">기록된 세션이 없습니다</p>
            {canCreate && (
              <p className="text-xs text-muted-foreground">
                세션을 기록해야 보호자에게 제공할 설명 근거를 확보할 수 있습니다
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((session) => {
            const avgSuccess =
              session.trials.reduce((acc, t) => acc + t.successes, 0) /
              session.trials.reduce((acc, t) => acc + t.trials, 0);
            const avgPrompt =
              session.trials.reduce((acc, t) => acc + t.promptLevel, 0) / session.trials.length;

            return (
              <Card key={session.id} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {new Date(session.date).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">{session.duration}분</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        성공률{' '}
                        <span
                          className={`font-semibold ${
                            avgSuccess >= 0.7 ? 'text-success' : 'text-warning'
                          }`}
                        >
                          {Math.round(avgSuccess * 100)}%
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        촉진 {promptLevelLabels[Math.round(avgPrompt)]}
                      </p>
                    </div>
                  </div>
                  {session.notes && (
                    <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">{session.notes}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {session.trials.map((trial) => {
                      const goal = goals.find((g) => g.id === trial.goalId);
                      const rate = Math.round((trial.successes / trial.trials) * 100);
                      return (
                        <div
                          key={trial.goalId}
                          className="rounded-md bg-secondary px-2 py-1 text-xs"
                        >
                          {goal?.title}: {rate}%
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
