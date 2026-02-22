import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import type { Goal } from '@/data/mockData';

interface GoalsTabProps {
  childId: string;
  goals: Goal[];
}

const categories = ['의사소통', '사회성', '수용언어', '놀이', '감각통합', '자조기술', '행동', '기타'];

export function GoalsTab({ childId, goals }: GoalsTabProps) {
  const { addGoal, role } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    category: '의사소통',
    status: 'active',
  });

  const handleCreateGoal = () => {
    if (!newGoal.title || !newGoal.description) return;

    const goal: Goal = {
      id: `g${Date.now()}`,
      childId,
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category || '의사소통',
      targetCriteria: newGoal.targetCriteria || '',
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    addGoal(goal);
    setIsDialogOpen(false);
    setNewGoal({ category: '의사소통', status: 'active' });
  };

  // Only admin can add/edit goals, therapist is read-only for goals
  const canCreate = role === 'admin' || role === 'therapist';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-active border';
      case 'mastered':
        return 'bg-success/10 text-success border-success/20 border';
      default:
        return 'badge-inactive border';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">목표 ({goals.length}개)</h2>
        {canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                목표 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 목표 추가</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">목표명 *</Label>
                  <Input
                    id="title"
                    value={newGoal.title || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="예: 요청하기"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리</Label>
                  <Select
                    value={newGoal.category}
                    onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">설명 *</Label>
                  <Textarea
                    id="description"
                    value={newGoal.description || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="목표에 대한 상세 설명"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetCriteria">목표 기준</Label>
                  <Input
                    id="targetCriteria"
                    value={newGoal.targetCriteria || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, targetCriteria: e.target.value })}
                    placeholder="예: 5회 연속 80% 이상 성공"
                  />
                </div>
                <Button onClick={handleCreateGoal} className="mt-2">
                  목표 추가
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">등록된 목표가 없습니다</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <Card key={goal.id} className="transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between">
                  <Badge variant="outline" className="text-xs">
                    {goal.category}
                  </Badge>
                  <Badge className={getStatusColor(goal.status)}>
                    {goal.status === 'active' ? '활성' : goal.status === 'mastered' ? '달성' : '일시정지'}
                  </Badge>
                </div>
                <h3 className="mb-2 font-semibold">{goal.title}</h3>
                <p className="mb-3 text-sm text-muted-foreground">{goal.description}</p>
                {goal.targetCriteria && (
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">목표 기준</p>
                    <p className="text-sm">{goal.targetCriteria}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
