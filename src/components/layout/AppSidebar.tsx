import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, Activity, Upload, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: '대시보드', roles: ['admin'] },
  { to: '/cases', icon: Users, label: '케이스 관리', roles: ['admin', 'therapist'] },
  { to: '/session-summary', icon: BarChart3, label: '세션 요약', roles: ['parent'] },
  { to: '/reports', icon: FileText, label: '진행 리포트', roles: ['admin', 'therapist', 'parent'] },
  { to: '/migration', icon: Upload, label: '데이터 마이그레이션', roles: ['admin', 'therapist'] },
  { to: '/settings', icon: Settings, label: '설정', roles: ['admin', 'therapist'] },
];

export function AppSidebar() {
  const location = useLocation();
  const { role } = useApp();

  const visibleNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
          <Activity className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-sidebar-foreground">Dear One</h1>
          <p className="text-xs text-sidebar-muted">발달치료 관리</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={cn(
                    'nav-item',
                    isActive && 'nav-item-active'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/50 p-3">
          <p className="text-xs font-medium text-sidebar-foreground">아이랑 ABA 행동발달연구소</p>
          <p className="text-xs text-sidebar-muted">데모 버전 v1.0</p>
        </div>
      </div>
    </aside>
  );
}