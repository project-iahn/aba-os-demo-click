import { useState, useMemo, useCallback } from 'react';
import { Play, Square, CheckCircle, X, RotateCcw, Clock, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Goal, Session, Trial, SessionTrial } from '@/data/mockData';
import { promptLevelLabels, buildAggregatedTrials, getDomainLabel } from '@/data/mockData';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SessionsTabProps {
  childId: string;
  sessions: Session[];
  goals: Goal[];
}

// Live trial being recorded
interface LiveTrial {
  programId: string;
  stimulus: string;
  result: 'correct' | 'incorrect' | 'no_response' | null;
  promptLevel: number;
  problemBehavior: boolean;
}

// Program stimuli for quick-pick (reuse from mockData or define inline)
const COMMON_STIMULI: Record<string, string[]> = {
  mand: ['과자 줘', '물 주세요', '놀이 하고 싶어', '도와 줘', '더 줘', '이거 줘', '열어 줘', '안아 주세요', '같이 놀자', '그네 타고 싶어'],
  tact: ['사과', '자동차', '강아지', '고양이', '공', '물', '나무', '꽃', '집', '배'],
  listener: ['앉아', '일어나', '이리 와', '공 줘', '손 올려', '박수 쳐', '문 닫아', '신발 벗어', '손 씻어', '가방 가져와'],
  social: ['인사할 때', '이름 부를 때', '놀이 중', '간식 시간', '대화 중', '칭찬할 때'],
  imitation: ['박수', '만세', '점프', '돌기', '손흔들기', '고개 끄덕', '발 구르기'],
  echoic: ['사과', '바나나', '물', '자동차', '강아지', '고양이', '공', '나무', '맘마', '빠빠'],
  play: ['인형 밥주기', '블록 쌓기', '소꿉 요리', '병원 놀이', '전화 놀이', '가게 놀이'],
  vp_mts: ['모래', '점토', '물감', '스티커', '솜', '나무 블록', '고무공', '천'],
  lrffc: ['타는 것', '먹는 것', '과일', '동물', '탈것', '가구'],
  intraverbal: ['기뻐요', '슬퍼요', '화나요', '무서워요', '좋아요', '싫어요'],
  group: ['블록→그림', '그림→간식', '간식→정리', '정리→놀이'],
};

function getStimuliForGoal(goal: Goal): string[] {
  return COMMON_STIMULI[goal.domain || ''] || ['자극1', '자극2', '자극3', '자극4', '자극5'];
}

export function SessionsTab({ childId, sessions, goals }: SessionsTabProps) {
  const { addSession, therapists, role } = useApp();
  const { toast } = useToast();

  // Session recording state
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  // Recorded trials during this session
  const [recordedTrials, setRecordedTrials] = useState<LiveTrial[]>([]);

  // Current prompt level (global default, adjustable per trial)
  const [currentPromptLevel, setCurrentPromptLevel] = useState(0);

  // Active STOs only
  const activeSTOs = useMemo(() =>
    goals.filter(g => g.objectiveType === 'STO' && g.status === 'active'),
    [goals]
  );

  // Last session performance per STO
  const lastPerf = useMemo(() => {
    const perf: Record<string, { rate: number; trials: number; successes: number; date: string }> = {};
    if (!sessions.length) return perf;
    const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
    activeSTOs.forEach(sto => {
      for (const s of sorted) {
        const trial = s.trials.find(t => t.goalId === sto.id);
        if (trial && trial.trials > 0) {
          perf[sto.id] = {
            rate: Math.round((trial.successes / trial.trials) * 100),
            trials: trial.trials,
            successes: trial.successes,
            date: s.date,
          };
          break;
        }
      }
    });
    return perf;
  }, [sessions, activeSTOs]);

  // Group STOs by parent LTO
  const groupedByLTO = useMemo(() => {
    const ltos = goals.filter(g => g.objectiveType === 'LTO' && g.status === 'active');
    const groups: { lto: Goal; stos: Goal[] }[] = [];
    ltos.forEach(lto => {
      const stos = activeSTOs.filter(s => s.parentProgramId === lto.id);
      if (stos.length > 0) groups.push({ lto, stos });
    });
    // Orphan STOs
    const orphans = activeSTOs.filter(s => !s.parentProgramId || !ltos.find(l => l.id === s.parentProgramId));
    if (orphans.length > 0) {
      groups.push({ lto: { id: '_orphan', title: '미분류', description: '', category: '', objectiveType: 'LTO' } as Goal, stos: orphans });
    }
    return groups;
  }, [goals, activeSTOs]);

  // Get trials for a specific program in current session
  const getTrialsForProgram = useCallback((programId: string) =>
    recordedTrials.filter(t => t.programId === programId),
    [recordedTrials]
  );

  const getSuccessRate = useCallback((programId: string) => {
    const trials = getTrialsForProgram(programId).filter(t => t.result !== null);
    if (trials.length === 0) return null;
    const correct = trials.filter(t => t.result === 'correct').length;
    return Math.round((correct / trials.length) * 100);
  }, [getTrialsForProgram]);

  // ── Start session ──
  const handleStartSession = () => {
    setIsRecording(true);
    setSessionStartTime(new Date());
    setRecordedTrials([]);
    setSessionNotes('');
    setCurrentPromptLevel(0);
    // Auto-expand first program
    if (groupedByLTO.length > 0 && groupedByLTO[0].stos.length > 0) {
      setExpandedProgram(groupedByLTO[0].stos[0].id);
    }
  };

  // ── Record a trial ──
  const recordTrial = (programId: string, stimulus: string, result: 'correct' | 'incorrect' | 'no_response') => {
    setRecordedTrials(prev => [...prev, {
      programId,
      stimulus,
      result,
      promptLevel: currentPromptLevel,
      problemBehavior: false,
    }]);
  };

  // ── Toggle problem behavior on last trial ──
  const toggleLastProblemBehavior = (programId: string) => {
    setRecordedTrials(prev => {
      const idx = [...prev].reverse().findIndex(t => t.programId === programId);
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      const updated = [...prev];
      updated[realIdx] = { ...updated[realIdx], problemBehavior: !updated[realIdx].problemBehavior };
      return updated;
    });
  };

  // ── Undo last trial for a program ──
  const undoLastTrial = (programId: string) => {
    setRecordedTrials(prev => {
      const idx = [...prev].reverse().findIndex(t => t.programId === programId);
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      return [...prev.slice(0, realIdx), ...prev.slice(realIdx + 1)];
    });
  };

  // ── End & save session ──
  const handleEndSession = () => {
    if (recordedTrials.length === 0) {
      toast({ title: '기록된 시행이 없습니다', description: '최소 1개 이상의 시행을 기록해주세요', variant: 'destructive' });
      return;
    }

    const now = new Date();
    const duration = sessionStartTime ? Math.round((now.getTime() - sessionStartTime.getTime()) / 60000) : 0;

    // Convert LiveTrials to Trial format
    const trialRecords: Trial[] = recordedTrials
      .filter(t => t.result !== null)
      .map((t, i) => ({
        id: `t-${Date.now()}-${i}`,
        sessionId: `s-${Date.now()}`,
        programId: t.programId,
        trialOrder: i + 1,
        stimulus: t.stimulus,
        response: t.result === 'correct' ? t.stimulus : '',
        result: t.result!,
        promptLevel: t.promptLevel,
        problemBehavior: t.problemBehavior,
      }));

    const session: Session = {
      id: `s${Date.now()}`,
      childId,
      therapistId: therapists[0]?.id || 'th1',
      date: now.toISOString().split('T')[0],
      startTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      duration: Math.max(duration, 1),
      notes: sessionNotes,
      trialRecords,
      trials: buildAggregatedTrials(trialRecords),
      createdAt: now.toISOString(),
    };

    addSession(session);
    setIsRecording(false);
    setRecordedTrials([]);
    setSessionStartTime(null);

    toast({
      title: '세션 저장 완료',
      description: `${trialRecords.length}개 시행이 기록되었습니다. 분석에 반영됩니다.`,
      action: <div className="flex items-center gap-2 text-success"><CheckCircle className="h-4 w-4" /></div>,
    });
  };

  const canCreate = role === 'admin' || role === 'therapist';
  const totalTrials = recordedTrials.filter(t => t.result !== null).length;
  const totalCorrect = recordedTrials.filter(t => t.result === 'correct').length;
  const overallRate = totalTrials > 0 ? Math.round((totalCorrect / totalTrials) * 100) : 0;
  const elapsed = sessionStartTime ? Math.round((Date.now() - sessionStartTime.getTime()) / 60000) : 0;

  // ── Not recording: show start button + recent history ──
  if (!isRecording) {

    return (
      <div className="space-y-6">
        {/* Start Session CTA */}
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Play className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">세션 시작하기</h2>
            <p className="text-sm text-muted-foreground mt-1">
              활성 목표 {activeSTOs.length}개 · 시행 버튼으로 실시간 기록
            </p>
          </div>
          {canCreate && activeSTOs.length > 0 && (
            <Button size="lg" className="gap-2" onClick={handleStartSession}>
              <Play className="h-5 w-5" />
              세션 시작
            </Button>
          )}
          {activeSTOs.length === 0 && (
            <p className="text-sm text-muted-foreground">활성화된 단기목표가 없습니다. 개요 탭에서 목표를 추가하세요.</p>
          )}
        </div>

        {/* Last session performance summary */}
        {Object.keys(lastPerf).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              직전 세션 수행 현황
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {activeSTOs.map(sto => {
                const perf = lastPerf[sto.id];
                if (!perf) return (
                  <div key={sto.id} className="flex items-center justify-between rounded-lg border border-border/50 p-2.5">
                    <span className="text-xs font-medium truncate">{sto.title}</span>
                    <span className="text-[11px] text-muted-foreground">기록 없음</span>
                  </div>
                );
                return (
                  <div key={sto.id} className="flex items-center justify-between rounded-lg border border-border/50 p-2.5">
                    <span className="text-xs font-medium truncate flex-1 mr-2">{sto.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        'text-xs font-bold',
                        perf.rate >= 80 ? 'text-success' : perf.rate >= 50 ? 'text-warning' : 'text-destructive'
                      )}>
                        {perf.rate}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({perf.successes}/{perf.trials})
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(perf.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════
  // RECORDING MODE
  // ══════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* Session header bar */}
      <div className="sticky top-0 z-10 rounded-xl border border-primary/30 bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 animate-pulse">
              <div className="h-3 w-3 rounded-full bg-destructive" />
            </div>
            <div>
              <p className="text-sm font-bold">세션 기록 중</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />{elapsed}분 경과
                <span>·</span>
                <span>{totalTrials}회 시행</span>
                <span>·</span>
                <span className={cn('font-semibold', overallRate >= 70 ? 'text-success' : overallRate >= 50 ? 'text-warning' : 'text-destructive')}>
                  {overallRate}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Global prompt level */}
            <div className="flex items-center gap-1">
              {promptLevelLabels.map((label, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPromptLevel(i)}
                  className={cn(
                    'rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
                    currentPromptLevel === i
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                  title={`촉진 수준: ${label}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button variant="destructive" size="sm" className="gap-1" onClick={handleEndSession}>
              <Square className="h-3 w-3" />
              종료 & 저장
            </Button>
          </div>
        </div>
      </div>

      {/* Programs to record */}
      <div className="space-y-3">
        {groupedByLTO.map(({ lto, stos }) => (
          <div key={lto.id} className="space-y-2">
            {/* LTO header */}
            <div className="flex items-center gap-2 px-1">
              <Badge variant="outline" className="text-[10px]">
                {lto.domain ? getDomainLabel(lto.domain) : lto.title}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">{lto.title}</span>
            </div>

            {/* STO recording cards */}
            {stos.map(sto => {
              const programTrials = getTrialsForProgram(sto.id);
              const completed = programTrials.filter(t => t.result !== null);
              const correct = completed.filter(t => t.result === 'correct').length;
              const rate = completed.length > 0 ? Math.round((correct / completed.length) * 100) : null;
              const isExpanded = expandedProgram === sto.id;
              const stimuli = getStimuliForGoal(sto);
              const lastTrial = programTrials[programTrials.length - 1];
              const prev = lastPerf[sto.id];

              return (
                <Card key={sto.id} className={cn(
                  'transition-all',
                  isExpanded && 'ring-1 ring-primary/30'
                )}>
                  <CardContent className="p-0">
                    {/* Program header - always visible */}
                    <Collapsible open={isExpanded} onOpenChange={() => setExpandedProgram(isExpanded ? null : sto.id)}>
                      <CollapsibleTrigger className="w-full text-left p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold truncate">{sto.title}</p>
                                {prev && (
                                  <span className={cn(
                                    'text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0',
                                    prev.rate >= 80 ? 'bg-success/10 text-success' :
                                    prev.rate >= 50 ? 'bg-warning/10 text-warning' :
                                    'bg-destructive/10 text-destructive'
                                  )}>
                                    직전 {prev.rate}%
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate">{sto.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {/* Mini trial dots */}
                            <div className="flex items-center gap-0.5">
                              {completed.slice(-10).map((t, i) => (
                                <div key={i} className={cn(
                                  'h-2.5 w-2.5 rounded-full',
                                  t.result === 'correct' ? 'bg-success' : t.result === 'incorrect' ? 'bg-destructive' : 'bg-muted-foreground'
                                )} />
                              ))}
                            </div>
                            <div className="text-right">
                              <span className={cn(
                                'text-sm font-bold',
                                rate === null ? 'text-muted-foreground' :
                                rate >= 70 ? 'text-success' : rate >= 50 ? 'text-warning' : 'text-destructive'
                              )}>
                                {rate !== null ? `${rate}%` : '—'}
                              </span>
                              <p className="text-[10px] text-muted-foreground">{completed.length}회</p>
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="border-t border-border/50 p-3 space-y-3">
                          {/* Quick-action buttons for stimuli with inline results */}
                          <div>
                            <p className="text-[10px] text-muted-foreground font-medium mb-2">자극 옆 +/-/P 로 기록</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {stimuli.map((stim) => {
                                const stimResults = completed.filter(t => t.stimulus === stim);
                                return (
                                  <div key={stim} className="flex items-center rounded-lg border border-border/50 overflow-hidden">
                                    <span className="text-xs px-2 py-1.5 truncate min-w-0 w-20 shrink-0">{stim}</span>
                                    {/* Inline recorded results */}
                                    <div className="flex items-center gap-0.5 flex-1 px-1 min-w-0 overflow-x-auto">
                                      {stimResults.map((t, i) => (
                                        <span key={i} className={cn(
                                          'text-[10px] font-bold shrink-0',
                                          t.result === 'correct' ? 'text-success' :
                                          t.result === 'no_response' ? 'text-warning' : 'text-destructive'
                                        )}>
                                          {t.result === 'correct' ? '+' : t.result === 'no_response' ? 'P' : '-'}
                                        </span>
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => recordTrial(sto.id, stim, 'correct')}
                                      className="h-full px-2.5 py-1.5 bg-success/10 text-success hover:bg-success/20 transition-colors border-l border-border/50 text-sm font-bold"
                                    >
                                      +
                                    </button>
                                    <button
                                      onClick={() => recordTrial(sto.id, stim, 'incorrect')}
                                      className="h-full px-2.5 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors border-l border-border/50 text-sm font-bold"
                                    >
                                      -
                                    </button>
                                    <button
                                      onClick={() => recordTrial(sto.id, stim, 'no_response')}
                                      className="h-full px-2.5 py-1.5 bg-warning/10 text-warning hover:bg-warning/20 transition-colors border-l border-border/50 text-sm font-bold"
                                    >
                                      P
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Controls row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {lastTrial && (
                                <>
                                  <Button
                                    variant="ghost" size="sm"
                                    className="h-7 gap-1 text-xs"
                                    onClick={() => undoLastTrial(sto.id)}
                                  >
                                    <RotateCcw className="h-3 w-3" />되돌리기
                                  </Button>
                                  <Button
                                    variant={lastTrial.problemBehavior ? 'destructive' : 'ghost'}
                                    size="sm"
                                    className="h-7 gap-1 text-xs"
                                    onClick={() => toggleLastProblemBehavior(sto.id)}
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    문제행동
                                  </Button>
                                </>
                              )}
                            </div>
                            {sto.targetCriteria && (
                              <span className="text-[10px] text-muted-foreground">🎯 {sto.targetCriteria}</span>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
      </div>

      {/* Session notes */}
      <div className="space-y-2">
        <Label className="text-sm">세션 메모</Label>
        <Textarea
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          placeholder="관찰 내용, 특이사항 등을 기록하세요..."
          rows={2}
          className="text-sm"
        />
      </div>
    </div>
  );
}
