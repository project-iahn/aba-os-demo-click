import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Child } from '@/data/mockData';

export default function CasesList() {
  const { children, therapists, addChild, role } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newChild, setNewChild] = useState<Partial<Child>>({
    status: 'active',
    trend: 'stable',
  });

  const filteredChildren = children.filter(
    (c) =>
      c.name.includes(searchQuery) ||
      c.concern.includes(searchQuery) ||
      c.diagnosis.includes(searchQuery)
  );

  const handleCreateChild = () => {
    if (!newChild.name || !newChild.concern) return;

    const child: Child = {
      id: `c${Date.now()}`,
      name: newChild.name,
      age: newChild.age || 0,
      birthDate: newChild.birthDate || new Date().toISOString().split('T')[0],
      concern: newChild.concern,
      diagnosis: newChild.diagnosis || '',
      guardianName: newChild.guardianName || '',
      guardianPhone: newChild.guardianPhone || '',
      guardianRelation: newChild.guardianRelation || '',
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      therapistId: newChild.therapistId || therapists[0]?.id || '',
      lastSessionDate: '',
      trend: 'stable',
      notes: newChild.notes || '',
    };

    addChild(child);
    setIsDialogOpen(false);
    setNewChild({ status: 'active', trend: 'stable' });
    navigate(`/cases/${child.id}`);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="badge-active border">진행중</Badge>;
      case 'pending':
        return <Badge className="badge-pending border">대기</Badge>;
      default:
        return <Badge className="badge-inactive border">종료</Badge>;
    }
  };

  // Only admin can create new cases
  const canCreate = role === 'admin';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">케이스 관리</h1>
          <p className="text-muted-foreground">등록된 아동 목록을 확인하고 관리하세요</p>
        </div>

        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                새 케이스
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>새 케이스 등록</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">아동 이름 *</Label>
                    <Input
                      id="name"
                      value={newChild.name || ''}
                      onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                      placeholder="홍길동"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">나이</Label>
                    <Input
                      id="age"
                      type="number"
                      value={newChild.age || ''}
                      onChange={(e) => setNewChild({ ...newChild, age: parseInt(e.target.value) })}
                      placeholder="5"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">생년월일</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={newChild.birthDate || ''}
                    onChange={(e) => setNewChild({ ...newChild, birthDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="concern">주요 관심사 *</Label>
                  <Textarea
                    id="concern"
                    value={newChild.concern || ''}
                    onChange={(e) => setNewChild({ ...newChild, concern: e.target.value })}
                    placeholder="언어 발달 지연, 사회적 상호작용 등"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">진단명</Label>
                  <Input
                    id="diagnosis"
                    value={newChild.diagnosis || ''}
                    onChange={(e) => setNewChild({ ...newChild, diagnosis: e.target.value })}
                    placeholder="자폐 스펙트럼 장애 등"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">보호자 이름</Label>
                    <Input
                      id="guardianName"
                      value={newChild.guardianName || ''}
                      onChange={(e) => setNewChild({ ...newChild, guardianName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianPhone">보호자 연락처</Label>
                    <Input
                      id="guardianPhone"
                      value={newChild.guardianPhone || ''}
                      onChange={(e) => setNewChild({ ...newChild, guardianPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="therapist">담당 치료사</Label>
                  <Select
                    value={newChild.therapistId}
                    onValueChange={(value) => setNewChild({ ...newChild, therapistId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {therapists.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.specialization})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateChild} className="mt-2">
                  케이스 등록
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="이름, 주요 관심사, 진단명으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="table-header hover:bg-muted/50">
              <TableHead className="w-[180px]">아동 이름</TableHead>
              <TableHead className="w-[60px]">나이</TableHead>
              <TableHead>주요 관심사</TableHead>
              <TableHead className="w-[120px]">최근 세션</TableHead>
              <TableHead className="w-[80px] text-center">추세</TableHead>
              <TableHead className="w-[100px] text-center">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChildren.map((child) => (
              <TableRow
                key={child.id}
                className="cursor-pointer transition-colors hover:bg-muted/30"
                onClick={() => navigate(`/cases/${child.id}`)}
              >
                <TableCell className="font-medium">{child.name}</TableCell>
                <TableCell>{child.age}세</TableCell>
                <TableCell className="max-w-[300px] truncate text-muted-foreground">
                  {child.concern}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {child.lastSessionDate
                    ? new Date(child.lastSessionDate).toLocaleDateString('ko-KR')
                    : '-'}
                </TableCell>
                <TableCell className="text-center">{getTrendIcon(child.trend)}</TableCell>
                <TableCell className="text-center">{getStatusBadge(child.status)}</TableCell>
              </TableRow>
            ))}
            {filteredChildren.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  검색 결과가 없습니다
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
