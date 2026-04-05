import { useState, useMemo } from 'react';
import { Plus, ChevronDown, ChevronRight, Layers, Pencil, Trash2, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Goal, ObjectiveType, Session } from '@/data/mockData';
import { ALL_DOMAINS, getDomainLabel } from '@/data/mockData';

interface GoalsTabProps {
  childId: string;
  goals: Goal[];
  sessions?: Session[];
}

export function GoalsTab({ childId, goals, sessions = [] }: GoalsTabProps) {
  const { addGoal, updateGoal, deleteGoal, role } = useApp();

  // Calculate last session performance per STO
  const lastSessionPerformance = useMemo(() => {
    const perf: Record<string, { rate: number; trials: number; successes: number; date: string }> = {};
    if (!sessions.length) return perf;
    // Sort sessions by date desc
    const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
    goals.filter(g => g.objectiveType === 'STO').forEach(sto => {
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
  }, [sessions, goals]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showMastered, setShowMastered] = useState(false);
  const [expandedLTOs, setExpandedLTOs] = useState<Set<string>>(new Set());
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    category: '',
    status: 'active',
    objectiveType: 'STO',
    domain: 'mand',
  });

  const canCreate = role === 'admin' || role === 'therapist';

  // Separate by status
  const activeGoals = useMemo(() => goals.filter(g => g.status !== 'mastered'), [goals]);
  const masteredGoals = useMemo(() => goals.filter(g => g.status === 'mastered'), [goals]);

  const currentGoals = showMastered ? masteredGoals : activeGoals;

  const ltos = useMemo(() => currentGoals.filter(g => g.objectiveType === 'LTO'), [currentGoals]);
  const stos = useMemo(() => currentGoals.filter(g => g.objectiveType === 'STO'), [currentGoals]);

  const filteredLTOs = ltos;

  const getSTOsForLTO = (ltoId: string) => stos.filter(s => s.parentProgramId === ltoId);

  const orphanSTOs = useMemo(() => {
    const ltoIds = new Set(ltos.map(l => l.id));
    return stos.filter(s => !s.parentProgramId || !ltoIds.has(s.parentProgramId));
  }, [ltos, stos]);

  const toggleLTO = (id: string) => {
    setExpandedLTOs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const availableDomains = ALL_DOMAINS;

  const availableLTOs = useMemo(() => {
    return goals.filter(g => g.objectiveType === 'LTO' && g.childId === childId);
  }, [goals, childId]);

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoal({ ...goal });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingGoal(null);
    setNewGoal({ category: '', status: 'active', objectiveType: 'STO', domain: 'mand' });
    setIsDialogOpen(true);
  };

  const handleSaveGoal = () => {
    if (!newGoal.title || !newGoal.description) return;

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        title: newGoal.title,
        description: newGoal.description,
        category: getDomainLabel(newGoal.domain || 'mand'),
        targetCriteria: newGoal.targetCriteria || '',
        domain: newGoal.domain,
        objectiveType: newGoal.objectiveType as ObjectiveType,
        parentProgramId: newGoal.objectiveType === 'STO' ? newGoal.parentProgramId : undefined,
      });
    } else {
      const goal: Goal = {
        id: `g${Date.now()}`,
        childId,
        title: newGoal.title,
        description: newGoal.description,
        category: getDomainLabel(newGoal.domain || 'mand'),
        targetCriteria: newGoal.targetCriteria || '',
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active',
        domain: newGoal.domain,
        objectiveType: newGoal.objectiveType as ObjectiveType,
        parentProgramId: newGoal.objectiveType === 'STO' ? newGoal.parentProgramId : undefined,
      };
      addGoal(goal);
    }

    setIsDialogOpen(false);
    setEditingGoal(null);
    setNewGoal({ category: '', status: 'active', objectiveType: 'STO', domain: 'mand' });
  };

  const handleDeleteGoal = (goalId: string) => {
    deleteGoal(goalId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'badge-active border';
      case 'mastered': return 'bg-success/10 text-success border-success/20 border';
      default: return 'badge-inactive border';
    }
  };


  const activeLTOCount = activeGoals.filter(g => g.objectiveType === 'LTO' && g.status === 'active').length;
  const activeSTOCount = activeGoals.filter(g => g.objectiveType === 'STO').length;
  const masteredCount = masteredGoals.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">치료 목표</h2>
          <Badge variant="outline" className="text-xs">
            장기 {activeLTOCount}개 · 단기 {activeSTOCount}개
          </Badge>
          {masteredCount > 0 && (
            <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setShowMastered(!showMastered)}>
              {showMastered ? '활성 목표 보기' : `완료 ${masteredCount}개`}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">

          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingGoal(null); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4" />
                  목표 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingGoal ? '목표 수정' : '새 치료 목표 추가'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>목표 유형 *</Label>
                      <Select
                        value={newGoal.objectiveType}
                        onValueChange={(v) => setNewGoal({ ...newGoal, objectiveType: v as ObjectiveType })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LTO">장기목표</SelectItem>
                          <SelectItem value="STO">단기목표</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>영역 *</Label>
                    <Select
                      value={newGoal.domain}
                      onValueChange={(v) => setNewGoal({ ...newGoal, domain: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {availableDomains.map((d) => (
                          <SelectItem key={d.key} value={d.key}>{d.labelKo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newGoal.objectiveType === 'STO' && availableLTOs.length > 0 && (
                    <div className="space-y-2">
                      <Label>상위 장기목표</Label>
                      <Select
                        value={newGoal.parentProgramId || ''}
                        onValueChange={(v) => setNewGoal({ ...newGoal, parentProgramId: v })}
                      >
                        <SelectTrigger><SelectValue placeholder="선택 (선택사항)" /></SelectTrigger>
                        <SelectContent>
                          {availableLTOs.map((lto) => (
                            <SelectItem key={lto.id} value={lto.id}>{lto.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="title">목표명 *</Label>
                    <Input
                      id="title"
                      value={newGoal.title || ''}
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                      placeholder={newGoal.objectiveType === 'LTO' ? '예: 맨드(요구하기)' : '예: 요청하기'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">설명 *</Label>
                    <Textarea
                      id="description"
                      value={newGoal.description || ''}
                      onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                      placeholder={newGoal.objectiveType === 'LTO'
                        ? '예: 아동이 원하는 품목이나 활동을 요구할 때, 단어를 사용할 수 있다.'
                        : '예: 신체적 촉구 없이 2개의 단어로 원하는 품목을 요구할 수 있다.'}
                    />
                  </div>
                  {newGoal.objectiveType === 'STO' && (
                    <div className="space-y-2">
                      <Label htmlFor="targetCriteria">목표 기준</Label>
                      <Input
                        id="targetCriteria"
                        value={newGoal.targetCriteria || ''}
                        onChange={(e) => setNewGoal({ ...newGoal, targetCriteria: e.target.value })}
                        placeholder="예: 5회 연속 80% 이상 성공"
                      />
                    </div>
                  )}
                  <Button onClick={handleSaveGoal} className="mt-2">
                    {editingGoal ? '수정 완료' : '목표 추가'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {showMastered && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-success/10 border border-success/20">
          <Check className="h-4 w-4 text-success" />
          <span className="text-sm text-success font-medium">완료된 목표를 보고 있습니다</span>
        </div>
      )}

      {filteredLTOs.length === 0 && orphanSTOs.length === 0 ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">
              {showMastered ? '완료된 목표가 없습니다' : '등록된 목표가 없습니다'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLTOs.map((lto) => {
            const childSTOs = getSTOsForLTO(lto.id);
            const isExpanded = expandedLTOs.has(lto.id);
            const activeSTOs = childSTOs.filter(s => s.status === 'active').length;

            return (
              <Card key={lto.id} className="overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleLTO(lto.id)}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className="text-[10px]">
                        {lto.domain ? getDomainLabel(lto.domain) : lto.category}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {lto.domain ? getDomainLabel(lto.domain) : lto.category}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">장기목표</Badge>
                      <Badge className={`text-[10px] ${getStatusColor(lto.status)}`}>
                        {lto.status === 'active' ? '활성' : lto.status === 'mastered' ? '달성' : '일시정지'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm">{lto.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{lto.description}</p>
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <div className="text-xs text-muted-foreground">
                      단기 {activeSTOs}/{childSTOs.length}
                    </div>
                    {canCreate && (
                      <>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); openEditDialog(lto); }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>목표 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{lto.title}" 장기목표와 연결된 단기목표 {childSTOs.length}개도 함께 삭제됩니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction onClick={() => {
                                childSTOs.forEach(s => handleDeleteGoal(s.id));
                                handleDeleteGoal(lto.id);
                              }}>삭제</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Switch
                          checked={lto.status === 'active'}
                          onCheckedChange={(checked) => {
                            updateGoal(lto.id, { status: checked ? 'active' : 'paused' });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="scale-75"
                        />
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && childSTOs.length > 0 && (
                  <div className="border-t bg-muted/20">
                    {childSTOs.map((sto) => (
                      <div key={sto.id} className="flex items-start gap-3 p-3 pl-12 border-b last:border-b-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px]">단기목표</Badge>
                            <Badge className={`text-[10px] ${getStatusColor(sto.status)}`}>
                              {sto.status === 'active' ? '활성' : sto.status === 'mastered' ? '달성' : '일시정지'}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm">{sto.title}</h4>
                          <p className="text-xs text-muted-foreground">{sto.description}</p>
                          {sto.targetCriteria && (
                            <div className="mt-2 rounded bg-muted/50 p-2">
                              <p className="text-[10px] text-muted-foreground">목표 기준</p>
                              <p className="text-xs">{sto.targetCriteria}</p>
                            </div>
                          )}
                          {lastSessionPerformance[sto.id] && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                                lastSessionPerformance[sto.id].rate >= 80 ? 'bg-success/10 text-success' :
                                lastSessionPerformance[sto.id].rate >= 50 ? 'bg-warning/10 text-warning' :
                                'bg-destructive/10 text-destructive'
                              }`}>
                                직전 {lastSessionPerformance[sto.id].rate}%
                                <span className="font-normal opacity-70">
                                  ({lastSessionPerformance[sto.id].successes}/{lastSessionPerformance[sto.id].trials})
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(lastSessionPerformance[sto.id].date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          )}
                        </div>
                        {canCreate && (
                          <div className="flex items-center gap-1 mt-1">
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => openEditDialog(sto)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>목표 삭제</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    "{sto.title}" 단기목표를 삭제하시겠습니까?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteGoal(sto.id)}>삭제</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Switch
                              checked={sto.status === 'active'}
                              onCheckedChange={(checked) => {
                                updateGoal(sto.id, { status: checked ? 'active' : 'paused' });
                              }}
                              className="scale-75"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {isExpanded && childSTOs.length === 0 && (
                  <div className="border-t p-3 pl-12 text-xs text-muted-foreground">
                    등록된 단기목표가 없습니다
                  </div>
                )}
              </Card>
            );
          })}

          {orphanSTOs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">미분류 단기목표</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {orphanSTOs.map((sto) => (
                  <Card key={sto.id} className="transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <Badge variant="outline" className="text-xs">{sto.domain ? getDomainLabel(sto.domain) : sto.category}</Badge>
                        <div className="flex items-center gap-1">
                          <Badge className={getStatusColor(sto.status)}>
                            {sto.status === 'active' ? '활성' : sto.status === 'mastered' ? '달성' : '일시정지'}
                          </Badge>
                          {canCreate && (
                            <>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog(sto)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>목표 삭제</AlertDialogTitle>
                                    <AlertDialogDescription>"{sto.title}" 단기목표를 삭제하시겠습니까?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteGoal(sto.id)}>삭제</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                      <h3 className="mb-1 font-semibold text-sm">{sto.title}</h3>
                      <p className="text-xs text-muted-foreground">{sto.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
