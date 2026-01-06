import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FileText, Settings, Activity, Upload, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '설명 컨트롤 타워', roles: ['admin', 'therapist', 'parent'] },
  { to: '/cases', icon: Users, label: '케이스 (아동)', roles: ['admin', 'therapist', 'parent'] },
  { to: '/sessions', icon: Calendar, label: '치료 세션', roles: ['admin', 'therapist', 'parent'] },
  { to: '/reports', icon: FileText, label: '설명 리포트', roles: ['admin', 'therapist', 'parent'] },
  { to: '/migration', icon: Upload, label: '기존 데이터 가져오기', roles: ['admin'] },
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
          <MessageSquareText className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-sidebar-foreground">ABA OS</h1>
          <p className="text-xs text-sidebar-muted">설명 인프라</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleNavItems.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);

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
          <p className="text-xs font-medium text-sidebar-foreground">해오름 발달센터</p>
          <p className="text-xs text-sidebar-muted">데모 버전 v1.0</p>
        </div>
      </div>
    </aside>
  );
}