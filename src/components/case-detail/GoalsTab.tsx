import { useState, useMemo } from 'react';
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, Check, X } from 'lucide-react';
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

  // New unified form state
  const [formDomain, setFormDomain] = useState('mand');
  const [formCustomDomain, setFormCustomDomain] = useState('');
  const [formLtoTitle, setFormLtoTitle] = useState('');
  const [formLtoDescription, setFormLtoDescription] = useState('');
  const [formStoItems, setFormStoItems] = useState<{ title: string; stimuli: string[] }[]>([{ title: '', stimuli: [] }]);
  const [formStoDescription, setFormStoDescription] = useState('');
  const [formTargetCriteria, setFormTargetCriteria] = useState('');

  // For adding stimuli to a specific STO
  const [stimuliInputs, setStimuliInputs] = useState<Record<number, string>>({});

  // Legacy states for editing existing individual goals
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    category: '',
    status: 'active',
    objectiveType: 'STO',
    domain: 'mand',
    stimuli: [],
  });
  const [stimuliInput, setStimuliInput] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

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

  const resetCreateForm = () => {
    setFormDomain('mand');
    setFormCustomDomain('');
    setFormLtoTitle('');
    setFormLtoDescription('');
    setFormStoItems([{ title: '', stimuli: [] }]);
    setFormStoDescription('');
    setFormTargetCriteria('');
    setStimuliInputs({});
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setIsEditMode(true);
    setNewGoal({ ...goal });
    setStimuliInput((goal.stimuli || []).join(', '));
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingGoal(null);
    setIsEditMode(false);
    resetCreateForm();
    setIsDialogOpen(true);
  };

  const addStoItem = () => {
    setFormStoItems(prev => [...prev, { title: '', stimuli: [] }]);
  };

  const updateStoTitle = (index: number, title: string) => {
    setFormStoItems(prev => prev.map((item, i) => i === index ? { ...item, title } : item));
  };

  const removeStoItem = (index: number) => {
    setFormStoItems(prev => prev.filter((_, i) => i !== index));
  };

  const addStimulusToSto = (stoIndex: number) => {
    const input = (stimuliInputs[stoIndex] || '').trim();
    if (!input) return;
    setFormStoItems(prev => prev.map((item, i) =>
      i === stoIndex ? { ...item, stimuli: [...item.stimuli, input] } : item
    ));
    setStimuliInputs(prev => ({ ...prev, [stoIndex]: '' }));
  };

  const removeStimulusFromSto = (stoIndex: number, stimulusIndex: number) => {
    setFormStoItems(prev => prev.map((item, i) =>
      i === stoIndex ? { ...item, stimuli: item.stimuli.filter((_, si) => si !== stimulusIndex) } : item
    ));
  };

  const handleSaveNew = () => {
    if (!formLtoTitle) return;

    const domainValue = formDomain === '_custom' ? formCustomDomain : formDomain;
    const domainLabel = formDomain === '_custom' ? formCustomDomain : getDomainLabel(formDomain);
    const now = new Date().toISOString().split('T')[0];

    // Create LTO
    const ltoId = `g${Date.now()}`;
    const lto: Goal = {
      id: ltoId,
      childId,
      title: formLtoTitle,
      description: formLtoDescription,
      category: domainLabel,
      targetCriteria: formTargetCriteria,
      createdAt: now,
      status: 'active',
      domain: domainValue,
      objectiveType: 'LTO',
    };
    addGoal(lto);

    // Create STOs
    formStoItems.forEach((sto, i) => {
      if (!sto.title) return;
      const stoGoal: Goal = {
        id: `g${Date.now() + i + 1}`,
        childId,
        title: sto.title,
        description: formStoDescription,
        category: domainLabel,
        targetCriteria: formTargetCriteria,
        createdAt: now,
        status: 'active',
        domain: domainValue,
        objectiveType: 'STO',
        parentProgramId: ltoId,
        stimuli: sto.stimuli.length > 0 ? sto.stimuli : undefined,
      };
      addGoal(stoGoal);
    });

    setIsDialogOpen(false);
    resetCreateForm();
  };

  const handleSaveEdit = () => {
    if (!newGoal.title) return;

    const parsedStimuli = stimuliInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        title: newGoal.title,
        description: newGoal.description,
        category: getDomainLabel(newGoal.domain || 'mand'),
        targetCriteria: newGoal.targetCriteria || '',
        domain: newGoal.domain,
        objectiveType: newGoal.objectiveType as ObjectiveType,
        parentProgramId: newGoal.objectiveType === 'STO' ? newGoal.parentProgramId : undefined,
        stimuli: newGoal.objectiveType === 'STO' ? parsedStimuli : undefined,
      });
    }

    setIsDialogOpen(false);
    setEditingGoal(null);
    setIsEditMode(false);
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
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingGoal(null); setIsEditMode(false); } }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4" />
                  목표 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? '목표 수정' : '새 치료 목표 추가'}</DialogTitle>
                </DialogHeader>

                {isEditMode ? (
                  /* ---- Edit existing goal form ---- */
                  <div className="grid gap-4 py-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">목표명 *</Label>
                      <Input
                        id="edit-title"
                        value={newGoal.title || ''}
                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-desc">설명</Label>
                      <Textarea
                        id="edit-desc"
                        value={newGoal.description || ''}
                        onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                      />
                    </div>
                    {newGoal.objectiveType === 'STO' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="edit-criteria">달성 기준</Label>
                          <Input
                            id="edit-criteria"
                            value={newGoal.targetCriteria || ''}
                            onChange={(e) => setNewGoal({ ...newGoal, targetCriteria: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-stimuli">하위 항목 (쉼표로 구분)</Label>
                          <Textarea
                            id="edit-stimuli"
                            value={stimuliInput}
                            onChange={(e) => setStimuliInput(e.target.value)}
                            placeholder="예: 엄마, 아빠, 물, 밥"
                            className="min-h-[60px]"
                          />
                        </div>
                      </>
                    )}
                    <Button onClick={handleSaveEdit} className="mt-2">수정 완료</Button>
                  </div>
                ) : (
                  /* ---- New unified create form ---- */
                  <div className="grid gap-4 py-4">
                    {/* 1. 영역 */}
                    <div className="space-y-2">
                      <Label>영역 *</Label>
                      <Select value={formDomain} onValueChange={setFormDomain}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {availableDomains.map((d) => (
                            <SelectItem key={d.key} value={d.key}>{d.labelKo}</SelectItem>
                          ))}
                          <SelectItem value="_custom">직접 입력</SelectItem>
                        </SelectContent>
                      </Select>
                      {formDomain === '_custom' && (
                        <Input
                          value={formCustomDomain}
                          onChange={(e) => setFormCustomDomain(e.target.value)}
                          placeholder="영역명을 입력하세요"
                          className="mt-2"
                        />
                      )}
                    </div>

                    {/* 2. 장기목표 */}
                    <div className="space-y-2">
                      <Label>장기목표 *</Label>
                      <Input
                        value={formLtoTitle}
                        onChange={(e) => setFormLtoTitle(e.target.value)}
                        placeholder="예: 맨드(요구하기)"
                      />
                    </div>

                    {/* 3. 장기목표 설명 */}
                    <div className="space-y-2">
                      <Label>장기목표 설명</Label>
                      <Textarea
                        value={formLtoDescription}
                        onChange={(e) => setFormLtoDescription(e.target.value)}
                        placeholder="필요 시 직접 기입"
                        className="min-h-[60px]"
                      />
                    </div>

                    {/* 4. 단기목표 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>단기목표 *</Label>
                        <Button type="button" variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={addStoItem}>
                          <Plus className="h-3 w-3" /> 단기목표 추가
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {formStoItems.map((sto, idx) => (
                          <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-medium min-w-[20px]">{idx + 1}.</span>
                              <Input
                                value={sto.title}
                                onChange={(e) => updateStoTitle(idx, e.target.value)}
                                placeholder="예: 단어 모방하기"
                                className="flex-1"
                              />
                              {formStoItems.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeStoItem(idx)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            {/* Sub-items (stimuli) */}
                            <div className="ml-7 space-y-1.5">
                              <div className="flex flex-wrap gap-1">
                                {sto.stimuli.map((s, si) => (
                                  <Badge key={si} variant="secondary" className="text-xs gap-1 pr-1">
                                    {s}
                                    <button type="button" onClick={() => removeStimulusFromSto(idx, si)} className="hover:text-destructive">
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex gap-1">
                                <Input
                                  value={stimuliInputs[idx] || ''}
                                  onChange={(e) => setStimuliInputs(prev => ({ ...prev, [idx]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStimulusToSto(idx); } }}
                                  placeholder="하위 항목 입력 (예: 엄마)"
                                  className="h-7 text-xs flex-1"
                                />
                                <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => addStimulusToSto(idx)}>
                                  항목 추가
                                </Button>
                              </div>
                              <p className="text-[10px] text-muted-foreground">세션 기록 시 +, -, P를 체크할 항목들입니다</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 5. 단기목표 설명 */}
                    <div className="space-y-2">
                      <Label>단기목표 설명</Label>
                      <Textarea
                        value={formStoDescription}
                        onChange={(e) => setFormStoDescription(e.target.value)}
                        placeholder="필요 시 직접 기입"
                        className="min-h-[60px]"
                      />
                    </div>

                    {/* 6. 달성 기준 */}
                    <div className="space-y-2">
                      <Label>달성 기준 *</Label>
                      <Input
                        value={formTargetCriteria}
                        onChange={(e) => setFormTargetCriteria(e.target.value)}
                        placeholder="예: 5회 연속 80% 이상 성공"
                      />
                    </div>

                    <Button
                      onClick={handleSaveNew}
                      className="mt-2"
                      disabled={!formLtoTitle || !formTargetCriteria || (formDomain === '_custom' && !formCustomDomain)}
                    >
                      목표 추가
                    </Button>
                  </div>
                )}
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
                          {sto.stimuli && sto.stimuli.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {sto.stimuli.map((s, i) => (
                                <span key={i} className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary font-medium">
                                  {s}
                                </span>
                              ))}
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
