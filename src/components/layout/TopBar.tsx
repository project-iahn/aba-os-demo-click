import { Search, RotateCcw, Shield, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import type { Role } from '@/data/mockData';

const roles: { value: Role; label: string; icon: React.ElementType }[] = [
  { value: 'admin', label: '센터 관리자', icon: Shield },
  { value: 'therapist', label: '치료사', icon: User },
  { value: 'parent', label: '보호자 (읽기전용)', icon: Users },
];

export function TopBar() {
  const { role, setRole, resetData } = useApp();

  return (
    <header className="fixed left-64 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="케이스, 세션, 리포트 검색..."
          className="pl-10"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Role Switcher */}
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {roles.map((r) => (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                role === r.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <r.icon className="h-4 w-4" />
              <span className="hidden lg:inline">{r.label}</span>
            </button>
          ))}
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={resetData}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">데이터 초기화</span>
        </Button>
      </div>
    </header>
  );
}
