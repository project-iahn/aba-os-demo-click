import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, Filter, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { promptLevelLabels } from '@/data/mockData';
import type { Session } from '@/data/mockData';

export default function SessionsPage() {
  const { sessions, children, therapists, goals } = useApp();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    therapistId: '',
    childId: '',
    startDate: '',
    endDate: '',
  });
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    if (filters.therapistId && session.therapistId !== filters.therapistId) return false;
    if (filters.childId && session.childId !== filters.childId) return false;
    if (filters.startDate && session.date < filters.startDate) return false;
    if (filters.endDate && session.date > filters.endDate) return false;
    return true;
  });

  const sortedSessions = [...filteredSessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const clearFilters = () => {
    setFilters({ therapistId: '', childId: '', startDate: '', endDate: '' });
  };

  const hasFilters =
    filters.therapistId || filters.childId || filters.startDate || filters.endDate;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">세션 관리</h1>
        <p className="text-muted-foreground">모든 치료 세션을 조회하고 관리하세요</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">필터</span>
            </div>

            <Select
              value={filters.therapistId}
              onValueChange={(value) => setFilters({ ...filters, therapistId: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="치료사 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {therapists.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.childId}
              onValueChange={(value) => setFilters({ ...filters, childId: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="아동 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">전체</SelectItem>
                {children.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-40"
              />
              <span className="text-muted-foreground">~</span>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-40"
              />
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                필터 초기화
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="space-y-3">
        {sortedSessions.length === 0 ? (
          <Card>
            <CardContent className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">조건에 맞는 세션이 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          sortedSessions.map((session) => {
            const child = children.find((c) => c.id === session.childId);
            const therapist = therapists.find((t) => t.id === session.therapistId);
            const avgSuccess =
              session.trials.reduce((acc, t) => acc + t.successes, 0) /
              session.trials.reduce((acc, t) => acc + t.trials, 0);

            return (
              <Card
                key={session.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => setSelectedSession(session)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{child?.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {therapist?.name}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.date).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}{' '}
                          · {session.duration}분 · {session.trials.length}개 목표
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        <span className={avgSuccess >= 0.7 ? 'text-success' : 'text-warning'}>
                          {Math.round(avgSuccess * 100)}%
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">평균 성공률</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Session Detail Sheet */}
      <Sheet open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedSession && (
            <>
              <SheetHeader>
                <SheetTitle>세션 상세</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Session Info */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">날짜</span>
                    <span className="font-medium">
                      {new Date(selectedSession.date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">아동</span>
                    <span
                      className="cursor-pointer font-medium text-primary hover:underline"
                      onClick={() => {
                        setSelectedSession(null);
                        navigate(`/cases/${selectedSession.childId}`);
                      }}
                    >
                      {children.find((c) => c.id === selectedSession.childId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">치료사</span>
                    <span className="font-medium">
                      {therapists.find((t) => t.id === selectedSession.therapistId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">시간</span>
                    <span className="font-medium">{selectedSession.duration}분</span>
                  </div>
                </div>

                {/* Notes */}
                {selectedSession.notes && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="mb-1 text-sm font-medium">메모</p>
                    <p className="text-sm">{selectedSession.notes}</p>
                  </div>
                )}

                {/* Trial Results */}
                <div>
                  <h3 className="mb-3 font-semibold">목표별 결과</h3>
                  <div className="space-y-3">
                    {selectedSession.trials.map((trial) => {
                      const goal = goals.find((g) => g.id === trial.goalId);
                      const rate = Math.round((trial.successes / trial.trials) * 100);

                      return (
                        <div
                          key={trial.goalId}
                          className="rounded-lg border border-border bg-card p-4"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-medium">{goal?.title}</span>
                            <Badge
                              className={
                                rate >= 80
                                  ? 'bg-success/10 text-success'
                                  : rate >= 60
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-destructive/10 text-destructive'
                              }
                            >
                              {rate}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">시행/성공: </span>
                              <span>
                                {trial.successes}/{trial.trials}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">촉진: </span>
                              <span>{promptLevelLabels[trial.promptLevel]}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">문제행동: </span>
                              <span>{trial.problemBehaviorCount}회</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
