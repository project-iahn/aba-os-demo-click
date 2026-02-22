import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import {
  addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  format, isSameDay, isSameMonth, eachDayOfInterval, eachMonthOfInterval,
  getDay, isToday, startOfYear, endOfYear, isSameYear,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ViewMode = 'year' | 'month' | 'week';

export function SessionScheduler() {
  const { sessions, children, therapists, goals } = useApp();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 3)); // aligned to mock data
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getSessionsForDate = (date: Date) =>
    sessions.filter(s => isSameDay(new Date(s.date), date));

  // Month view: calendar grid
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });

    // Pad start to Monday (getDay: 0=Sun)
    const startDow = getDay(start); // 0=Sun
    const padStart = startDow === 0 ? 6 : startDow - 1; // Mon-based
    const prefixDays = Array.from({ length: padStart }, (_, i) => subDays(start, padStart - i));

    // Pad end to Sunday
    const endDow = getDay(end);
    const padEnd = endDow === 0 ? 0 : 7 - endDow;
    const suffixDays = Array.from({ length: padEnd }, (_, i) => addDays(end, i + 1));

    return [...prefixDays, ...days, ...suffixDays];
  }, [currentDate]);

  // Week view days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Year view months
  const yearMonths = useMemo(() => {
    const start = startOfYear(currentDate);
    const end = endOfYear(currentDate);
    return eachMonthOfInterval({ start, end });
  }, [currentDate]);

  const getSessionsForMonth = (month: Date) =>
    sessions.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
    });

  const displayDays = viewMode === 'month' ? monthDays : weekDays;

  const navigate_period = (dir: 1 | -1) => {
    if (viewMode === 'year') {
      setCurrentDate(prev => new Date(prev.getFullYear() + dir, 0, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1));
    } else {
      setCurrentDate(prev => addDays(prev, dir * 7));
    }
    setSelectedDate(null);
    setSelectedMonth(null);
  };

  // Selected date sessions detail
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const selectedSessions = selectedDate ? getSessionsForDate(selectedDate) : [];
  const selectedMonthSessions = selectedMonth ? getSessionsForMonth(selectedMonth) : [];

  const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            세션 스케줄
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-muted p-0.5">
              {(['year', 'month', 'week'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setViewMode(mode); setSelectedDate(null); setSelectedMonth(null); }}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                    viewMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {{ year: '연', month: '월', week: '주' }[mode]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate_period(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-semibold">
            {viewMode === 'year'
              ? format(currentDate, 'yyyy년', { locale: ko })
              : viewMode === 'month'
              ? format(currentDate, 'yyyy년 M월', { locale: ko })
              : `${format(weekDays[0], 'M/d', { locale: ko })} ~ ${format(weekDays[6], 'M/d', { locale: ko })}`
            }
          </p>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate_period(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Year View */}
        {viewMode === 'year' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {yearMonths.map((month, i) => {
              const monthSessions = getSessionsForMonth(month);
              const isSelected = selectedMonth && isSameMonth(month, selectedMonth);
              const isCurrent = isSameMonth(month, new Date());
              return (
                <button
                  key={i}
                  onClick={() => { setSelectedMonth(isSelected ? null : month); setSelectedDate(null); }}
                  className={cn(
                    'rounded-lg border p-3 text-center transition-colors',
                    isSelected ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border/50 hover:bg-muted/50',
                  )}
                >
                  <p className={cn('text-sm font-semibold', isCurrent && 'text-primary')}>{format(month, 'M월')}</p>
                  <p className="text-lg font-bold mt-1">{monthSessions.length}</p>
                  <p className="text-[10px] text-muted-foreground">세션</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Year view - selected month detail */}
        {viewMode === 'year' && selectedMonth && (
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {format(selectedMonth, 'yyyy년 M월', { locale: ko })}
              <Badge variant="secondary" className="text-xs">{selectedMonthSessions.length}세션</Badge>
            </h3>
            {selectedMonthSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">이 달에 기록된 세션이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {[...selectedMonthSessions]
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map(session => {
                    const child = children.find(c => c.id === session.childId);
                    const therapist = therapists.find(t => t.id === session.therapistId);
                    const totalTrials = session.trials.reduce((a, t) => a + t.trials, 0);
                    const totalSuccesses = session.trials.reduce((a, t) => a + t.successes, 0);
                    const avgRate = totalTrials > 0 ? Math.round((totalSuccesses / totalTrials) * 100) : 0;
                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/cases/${session.childId}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {child?.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{child?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(session.date), 'M/d (EEE)', { locale: ko })} · {therapist?.name} · {session.duration}분
                            </p>
                          </div>
                        </div>
                        <Badge className={cn('text-xs', avgRate >= 70 ? 'bg-success/10 text-success border-0' : avgRate >= 50 ? 'bg-warning/10 text-warning border-0' : 'bg-destructive/10 text-destructive border-0')}>
                          {avgRate}%
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Month/Week Calendar Grid */}
        {viewMode !== 'year' && (
        <div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_LABELS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden">
            {displayDays.map((day, i) => {
              const daySessions = getSessionsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={cn(
                    'relative flex flex-col items-center p-1.5 transition-colors bg-card',
                    viewMode === 'month' ? 'min-h-[60px]' : 'min-h-[80px]',
                    !isCurrentMonth && viewMode === 'month' && 'opacity-30',
                    isSelected && 'bg-primary/10 ring-1 ring-primary',
                    !isSelected && 'hover:bg-muted/50',
                  )}
                >
                  <span className={cn(
                    'text-xs font-medium flex items-center justify-center w-6 h-6 rounded-full',
                    today && 'bg-primary text-primary-foreground',
                    isSelected && !today && 'bg-primary/20 text-primary',
                  )}>
                    {format(day, 'd')}
                  </span>
                  {daySessions.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                      {daySessions.slice(0, 3).map((s, j) => {
                        const child = children.find(c => c.id === s.childId);
                        return (
                          <span
                            key={j}
                            className="h-1.5 w-1.5 rounded-full bg-primary"
                            title={child?.name}
                          />
                        );
                      })}
                      {daySessions.length > 3 && (
                        <span className="text-[9px] text-muted-foreground">+{daySessions.length - 3}</span>
                      )}
                    </div>
                  )}
                  {viewMode === 'week' && daySessions.length > 0 && (
                    <div className="mt-1 w-full space-y-0.5">
                      {daySessions.slice(0, 2).map((s, j) => {
                        const child = children.find(c => c.id === s.childId);
                        return (
                          <div key={j} className="text-[10px] truncate text-center text-muted-foreground">{child?.name}</div>
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* Selected Date Detail */}
        {selectedDate && (
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {format(selectedDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
              <Badge variant="secondary" className="text-xs">{selectedSessions.length}세션</Badge>
            </h3>
            {selectedSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">이 날짜에 기록된 세션이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {selectedSessions.map(session => {
                  const child = children.find(c => c.id === session.childId);
                  const therapist = therapists.find(t => t.id === session.therapistId);
                  const totalTrials = session.trials.reduce((a, t) => a + t.trials, 0);
                  const totalSuccesses = session.trials.reduce((a, t) => a + t.successes, 0);
                  const avgRate = totalTrials > 0 ? Math.round((totalSuccesses / totalTrials) * 100) : 0;

                  return (
                    <div
                      key={session.id}
                      className="rounded-lg border border-border/50 p-4 space-y-3 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/cases/${session.childId}`)}
                    >
                      {/* Session header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {child?.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{child?.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />{therapist?.name}
                              <span>·</span>
                              <Clock className="h-3 w-3" />{session.duration}분
                            </div>
                          </div>
                        </div>
                        <Badge className={cn(
                          'text-xs',
                          avgRate >= 70 ? 'bg-success/10 text-success border-0' :
                          avgRate >= 50 ? 'bg-warning/10 text-warning border-0' :
                          'bg-destructive/10 text-destructive border-0'
                        )}>
                          성공률 {avgRate}%
                        </Badge>
                      </div>

                      {/* Trials breakdown */}
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {session.trials.map((trial, ti) => {
                          const goal = goals.find(g => g.id === trial.goalId);
                          const rate = trial.trials > 0 ? Math.round((trial.successes / trial.trials) * 100) : 0;
                          return (
                            <div key={ti} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                              <span className="text-xs font-medium truncate mr-2">{goal?.title || trial.goalId}</span>
                              <span className={cn(
                                'text-xs font-semibold whitespace-nowrap',
                                rate >= 70 ? 'text-success' : rate >= 50 ? 'text-warning' : 'text-destructive'
                              )}>
                                {trial.successes}/{trial.trials} ({rate}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Notes */}
                      {session.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/20 rounded-md px-3 py-2">
                          📝 {session.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
