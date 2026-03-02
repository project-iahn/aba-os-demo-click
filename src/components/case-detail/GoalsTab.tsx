import { useState, useMemo } from 'react';
import { Plus, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { useApp } from '@/context/AppContext';
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
import type { Goal, VBMAPPLevel, ObjectiveType } from '@/data/mockData';
import { VBMAPP_DOMAINS, getDomainLabel } from '@/data/mockData';

interface GoalsTabProps {
  childId: string;
  goals: Goal[];
}

export function GoalsTab({ childId, goals }: GoalsTabProps) {
  const { addGoal, role } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<VBMAPPLevel | 'all'>('all');
  const [expandedLTOs, setExpandedLTOs] = useState<Set<string>>(new Set());
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    category: '',
    status: 'active',
    objectiveType: 'STO',
    vbmappLevel: 1,
    domain: 'mand',
  });

  const canCreate = role === 'admin' || role === 'therapist';

  // Separate LTOs and STOs
  const ltos = useMemo(() => goals.filter(g => g.objectiveType === 'LTO'), [goals]);
  const stos = useMemo(() => goals.filter(g => g.objectiveType === 'STO'), [goals]);

  // Filter by level
  const filteredLTOs = useMemo(() => {
    if (selectedLevel === 'all') return ltos;
    return ltos.filter(g => g.vbmappLevel === selectedLevel);
  }, [ltos, selectedLevel]);

  // Get STOs for a given LTO
  const getSTOsForLTO = (ltoId: string) => stos.filter(s => s.parentProgramId === ltoId);

  // Orphan STOs (no parent LTO)
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

  const availableDomains = useMemo(() => {
    const level = (newGoal.vbmappLevel || 1) as VBMAPPLevel;
    return VBMAPP_DOMAINS[level] || [];
  }, [newGoal.vbmappLevel]);

  // Available LTOs for STO parent selection
  const availableLTOs = useMemo(() => {
    return goals.filter(g => g.objectiveType === 'LTO' && g.childId === childId);
  }, [goals, childId]);

  const handleCreateGoal = () => {
    if (!newGoal.title || !newGoal.description) return;

    const goal: Goal = {
      id: `g${Date.now()}`,
      childId,
      title: newGoal.title,
      description: newGoal.description,
      category: getDomainLabel(newGoal.domain || 'mand'),
      targetCriteria: newGoal.targetCriteria || '',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      vbmappLevel: newGoal.vbmappLevel as VBMAPPLevel,
      domain: newGoal.domain,
      objectiveType: newGoal.objectiveType as ObjectiveType,
      parentProgramId: newGoal.objectiveType === 'STO' ? newGoal.parentProgramId : undefined,
    };

    addGoal(goal);
    setIsDialogOpen(false);
    setNewGoal({ category: '', status: 'active', objectiveType: 'STO', vbmappLevel: 1, domain: 'mand' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'badge-active border';
      case 'mastered': return 'bg-success/10 text-success border-success/20 border';
      default: return 'badge-inactive border';
    }
  };

  const getLevelBadgeColor = (level?: VBMAPPLevel) => {
    switch (level) {
      case 1: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 2: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 3: return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default: return '';
    }
  };

  const totalSTOs = stos.length;
  const activeLTOs = filteredLTOs.filter(g => g.status === 'active').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">VB-MAPP 목표</h2>
          <Badge variant="outline" className="text-xs">
            LTO {activeLTOs}개 · STO {totalSTOs}개
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Level filter */}
          <Select
            value={String(selectedLevel)}
            onValueChange={(v) => setSelectedLevel(v === 'all' ? 'all' : (Number(v) as VBMAPPLevel))}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <Layers className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 수준</SelectItem>
              <SelectItem value="1">수준 1</SelectItem>
              <SelectItem value="2">수준 2</SelectItem>
              <SelectItem value="3">수준 3</SelectItem>
            </SelectContent>
          </Select>

          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  목표 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>새 VB-MAPP 목표 추가</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Objective Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>목표 유형 *</Label>
                      <Select
                        value={newGoal.objectiveType}
                        onValueChange={(v) => setNewGoal({ ...newGoal, objectiveType: v as ObjectiveType })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LTO">장기목표 (LTO)</SelectItem>
                          <SelectItem value="STO">단기목표 (STO)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>발달 수준 *</Label>
                      <Select
                        value={String(newGoal.vbmappLevel)}
                        onValueChange={(v) => setNewGoal({ ...newGoal, vbmappLevel: Number(v) as VBMAPPLevel, domain: VBMAPP_DOMAINS[Number(v) as VBMAPPLevel]?.[0]?.key })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">수준 1</SelectItem>
                          <SelectItem value="2">수준 2</SelectItem>
                          <SelectItem value="3">수준 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Domain */}
                  <div className="space-y-2">
                    <Label>발달영역 *</Label>
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

                  {/* Parent LTO (for STO only) */}
                  {newGoal.objectiveType === 'STO' && availableLTOs.length > 0 && (
                    <div className="space-y-2">
                      <Label>상위 장기목표 (LTO)</Label>
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
                  <Button onClick={handleCreateGoal} className="mt-2">
                    목표 추가
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* LTO/STO Hierarchy */}
      {filteredLTOs.length === 0 && orphanSTOs.length === 0 ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">등록된 목표가 없습니다</p>
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
                {/* LTO Header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleLTO(lto.id)}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className={`text-[10px] ${getLevelBadgeColor(lto.vbmappLevel)}`}>
                        수준 {lto.vbmappLevel}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {lto.domain ? getDomainLabel(lto.domain) : lto.category}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">LTO</Badge>
                      <Badge className={`text-[10px] ${getStatusColor(lto.status)}`}>
                        {lto.status === 'active' ? '활성' : lto.status === 'mastered' ? '달성' : '일시정지'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm">{lto.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{lto.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    STO {activeSTOs}/{childSTOs.length}
                  </div>
                </div>

                {/* STO Children */}
                {isExpanded && childSTOs.length > 0 && (
                  <div className="border-t bg-muted/20">
                    {childSTOs.map((sto) => (
                      <div key={sto.id} className="flex items-start gap-3 p-3 pl-12 border-b last:border-b-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px]">STO</Badge>
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isExpanded && childSTOs.length === 0 && (
                  <div className="border-t p-3 pl-12 text-xs text-muted-foreground">
                    등록된 단기목표(STO)가 없습니다
                  </div>
                )}
              </Card>
            );
          })}

          {/* Orphan STOs */}
          {orphanSTOs.length > 0 && selectedLevel === 'all' && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">미분류 단기목표</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {orphanSTOs.map((sto) => (
                  <Card key={sto.id} className="transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <Badge variant="outline" className="text-xs">{sto.domain ? getDomainLabel(sto.domain) : sto.category}</Badge>
                        <Badge className={getStatusColor(sto.status)}>
                          {sto.status === 'active' ? '활성' : sto.status === 'mastered' ? '달성' : '일시정지'}
                        </Badge>
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
