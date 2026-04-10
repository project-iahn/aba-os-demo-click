import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Minus, Search, ArrowUpDown, FileCheck, FileX, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { SessionScheduler } from '@/components/SessionScheduler';
import type { Child } from '@/data/mockData';
import { THERAPY_AREAS } from '@/data/mockData';

type SortField = 'lastSession' | 'successRate' | 'name';
type SortDirection = 'asc' | 'desc';
const ITEMS_PER_PAGE = 5;

export default function CasesList() {
  const { children, therapists, sessions, reports, addChild, role, currentTherapistId } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('lastSession');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [newChild, setNewChild] = useState<Partial<Child>>({ status: 'active', trend: 'stable' });

  const childStats = useMemo(() => {
    const stats: Record<string, { successRate: number; hasReport: boolean }> = {};
    const currentMonth = new Date().toISOString().slice(0, 7);
    children.forEach((child) => {
      const childSessions = sessions.filter(s => s.childId === child.id);
      const allTrials = childSessions.flatMap(s => s.trials);
      const totalTrials = allTrials.reduce((acc, t) => acc + t.trials, 0);
      const totalSuccesses = allTrials.reduce((acc, t) => acc + t.successes, 0);
      const successRate = totalTrials > 0 ? Math.round((totalSuccesses / totalTrials) * 100) : 0;
      const hasReport = reports.some(r => r.childId === child.id && r.period === currentMonth);
      stats[child.id] = { successRate, hasReport };
    });
    return stats;
  }, [children, sessions, reports]);

  const filteredAndSortedChildren = useMemo(() => {
    let baseChildren = role === 'therapist'
      ? children.filter(c => c.therapistId === currentTherapistId)
      : children;
    let filtered = baseChildren.filter(
      (c) => c.name.includes(searchQuery) || c.concern.includes(searchQuery) || c.diagnosis.includes(searchQuery)
    );
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'lastSession':
          comparison = new Date(a.lastSessionDate || '1900-01-01').getTime() - new Date(b.lastSessionDate || '1900-01-01').getTime();
          break;
        case 'successRate':
          comparison = (childStats[a.id]?.successRate || 0) - (childStats[b.id]?.successRate || 0);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });
    return filtered;
  }, [children, searchQuery, sortField, sortDirection, childStats, role, currentTherapistId]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedChildren.length / ITEMS_PER_PAGE));
  const paginatedChildren = filteredAndSortedChildren.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  useMemo(() => { setCurrentPage(1); }, [searchQuery]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('desc'); }
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleCreateChild = () => {
    if (!newChild.name || !newChild.concern) return;
    const age = newChild.birthDate ? calculateAge(newChild.birthDate) : 0;
    const child: Child = {
      id: `c${Date.now()}`, name: newChild.name, age,
      birthDate: newChild.birthDate || new Date().toISOString().split('T')[0],
      concern: newChild.concern, diagnosis: newChild.diagnosis || '',
      therapyArea: newChild.therapyArea,
      guardianName: newChild.guardianName || '', guardianPhone: newChild.guardianPhone || '',
      guardianRelation: newChild.guardianRelation || '', status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      therapistId: newChild.therapistId || therapists[0]?.id || '',
      lastSessionDate: '', trend: 'stable', notes: newChild.notes || '',
    };
    addChild(child);
    setIsDialogOpen(false);
    setNewChild({ status: 'active', trend: 'stable' });
    navigate(`/cases/${child.id}`);
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'up': return <Badge className="gap-1 bg-success/10 text-success border-success/20"><TrendingUp className="h-3 w-3" />개선</Badge>;
      case 'down': return <Badge className="gap-1 bg-destructive/10 text-destructive border-destructive/20"><TrendingDown className="h-3 w-3" />저하</Badge>;
      default: return <Badge className="gap-1 bg-muted text-muted-foreground"><Minus className="h-3 w-3" />유지</Badge>;
    }
  };

  const getReportStatus = (childId: string) => {
    if (childStats[childId]?.hasReport) return <Badge className="gap-1 bg-success/10 text-success border-success/20"><FileCheck className="h-3 w-3" />완료</Badge>;
    return <Badge className="gap-1 bg-warning/10 text-warning border-warning/20"><FileX className="h-3 w-3" />필요</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="badge-active border">진행중</Badge>;
      case 'pending': return <Badge className="badge-pending border">대기</Badge>;
      default: return <Badge className="badge-inactive border">종료</Badge>;
    }
  };

  const canCreate = role === 'admin' || role === 'therapist';

  // ── New Case Dialog (shared) ──
  const newCaseDialog = (showTherapist: boolean) => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" />새 케이스</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>새 케이스 등록</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">아동 이름 *</Label>
              <Input id="name" value={newChild.name || ''} onChange={(e) => setNewChild({ ...newChild, name: e.target.value })} placeholder="홍길동" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">생년월일</Label>
              <Input id="birthDate" type="date" value={newChild.birthDate || ''} onChange={(e) => setNewChild({ ...newChild, birthDate: e.target.value })} />
              {newChild.birthDate && (
                <p className="text-xs text-muted-foreground">만 {calculateAge(newChild.birthDate)}세</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="concern">주요 관심사 *</Label>
            <Textarea id="concern" value={newChild.concern || ''} onChange={(e) => setNewChild({ ...newChild, concern: e.target.value })} placeholder="언어 발달 지연, 사회적 상호작용 등" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="therapyArea">치료 영역</Label>
            <Select value={newChild.therapyArea} onValueChange={(value) => setNewChild({ ...newChild, therapyArea: value as any })}>
              <SelectTrigger><SelectValue placeholder="치료 영역을 선택하세요" /></SelectTrigger>
              <SelectContent>
                {THERAPY_AREAS.map((area) => (<SelectItem key={area} value={area}>{area}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="diagnosis">진단명</Label>
            <Input id="diagnosis" value={newChild.diagnosis || ''} onChange={(e) => setNewChild({ ...newChild, diagnosis: e.target.value })} placeholder="자폐 스펙트럼 장애 등" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guardianName">보호자 이름</Label>
              <Input id="guardianName" value={newChild.guardianName || ''} onChange={(e) => setNewChild({ ...newChild, guardianName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardianPhone">보호자 연락처</Label>
              <Input id="guardianPhone" value={newChild.guardianPhone || ''} onChange={(e) => setNewChild({ ...newChild, guardianPhone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>세션 일정</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {['월','화','수','목','금','토'].map(day => {
                const selected = (newChild.scheduleDays || '').includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const current = (newChild.scheduleDays || '').split('·').map(s => s.trim()).filter(Boolean);
                      const next = selected ? current.filter(d => d !== day) : [...current, day];
                      const ordered = ['월','화','수','목','금','토'].filter(d => next.includes(d));
                      setNewChild({ ...newChild, scheduleDays: ordered.length ? ordered.join('·') + (newChild.scheduleDays?.match(/ \d{2}:\d{2}/)?.[0] || '') : '' });
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <Input
              type="time"
              value={(newChild.scheduleDays || '').match(/\d{2}:\d{2}/)?.[0] || ''}
              onChange={(e) => {
                const days = (newChild.scheduleDays || '').replace(/ \d{2}:\d{2}/, '').trim();
                setNewChild({ ...newChild, scheduleDays: days ? `${days} ${e.target.value}` : e.target.value });
              }}
              className="max-w-[140px]"
            />
          </div>
          {showTherapist && (
            <div className="space-y-2">
              <Label htmlFor="therapist">담당 치료사</Label>
              <Select value={newChild.therapistId} onValueChange={(value) => setNewChild({ ...newChild, therapistId: value })}>
                <SelectTrigger><SelectValue placeholder="선택하세요" /></SelectTrigger>
                <SelectContent>
                  {therapists.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name} ({t.specialization})</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={handleCreateChild} className="mt-2">케이스 등록</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // ═══════════════════════════════════════════
  // Therapist view: schedule-first layout
  // ═══════════════════════════════════════════
  if (role === 'therapist') {
    const myChildren = children.filter(c => c.therapistId === currentTherapistId);
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">케이스 관리</h1>
            <p className="text-muted-foreground">스케줄에서 아동을 클릭하여 상세 내용을 확인하세요</p>
          </div>
          {newCaseDialog(false)}
        </div>

        {/* Session Scheduler as primary view */}
        <SessionScheduler />

        {/* Compact case cards for quick access */}
        <div className="rounded-xl border border-border bg-card shadow-soft p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            담당 케이스
            <Badge variant="secondary" className="text-xs">{myChildren.length}명</Badge>
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {myChildren.map(child => {
              return (
                <button
                  key={child.id}
                  onClick={() => navigate(`/cases/${child.id}`)}
                  className="flex items-center gap-3 rounded-lg border border-border/50 p-3 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {child.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{child.name}</p>
                    <p className="text-xs text-muted-foreground">{child.age}세 · {child.diagnosis || child.concern}</p>
                  </div>
                  {getStatusBadge(child.status)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Admin / Parent view: original table layout
  // ═══════════════════════════════════════════
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">케이스 관리</h1>
          <p className="text-muted-foreground">
            {role === 'parent' ? '자녀의 치료 진행 상황을 확인하세요' : '등록된 아동 목록을 확인하고 관리하세요'}
          </p>
        </div>
        {canCreate && newCaseDialog(true)}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="이름, 주요 관심사, 진단명으로 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant={sortField === 'lastSession' ? 'secondary' : 'outline'} size="sm" onClick={() => handleSort('lastSession')} className="gap-1">
            <ArrowUpDown className="h-3 w-3" />최근 세션
          </Button>
          <Button variant={sortField === 'successRate' ? 'secondary' : 'outline'} size="sm" onClick={() => handleSort('successRate')} className="gap-1">
            <ArrowUpDown className="h-3 w-3" />성공률
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="table-header hover:bg-muted/50">
              <TableHead className="w-[140px]">케이스명 (아이)</TableHead>
              <TableHead className="w-[120px]">최근 세션일</TableHead>
              <TableHead className="w-[100px] text-center">평균 성공률</TableHead>
              <TableHead className="w-[90px] text-center">추이 상태</TableHead>
              <TableHead className="w-[90px] text-center">리포트 상태</TableHead>
              <TableHead className="w-[80px] text-center">진행 상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedChildren.map((child) => {
              const successRate = childStats[child.id]?.successRate || 0;
              return (
                <TableRow key={child.id} className="cursor-pointer transition-colors hover:bg-muted/30" onClick={() => navigate(`/cases/${child.id}`)}>
                  <TableCell>
                    <div><p className="font-medium">{child.name}</p><p className="text-xs text-muted-foreground">{child.age}세</p></div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{child.lastSessionDate ? new Date(child.lastSessionDate).toLocaleDateString('ko-KR') : '-'}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-semibold ${successRate >= 70 ? 'text-success' : successRate >= 50 ? 'text-warning' : 'text-destructive'}`}>{successRate}%</span>
                  </TableCell>
                  <TableCell className="text-center">{getTrendBadge(child.trend)}</TableCell>
                  <TableCell className="text-center">{getReportStatus(child.id)}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(child.status)}</TableCell>
                </TableRow>
              );
            })}
            {paginatedChildren.length === 0 && (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">검색 결과가 없습니다</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground text-center">※ 각 케이스를 클릭하면 상세 정보를 확인할 수 있습니다.</p>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" className="w-9" onClick={() => setCurrentPage(page)}>{page}</Button>
          ))}
          <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          <span className="text-xs text-muted-foreground ml-2">총 {filteredAndSortedChildren.length}명</span>
        </div>
      )}

      <SessionScheduler />
    </div>
  );
}
