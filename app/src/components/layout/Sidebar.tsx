import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  Bell,
  MessageSquare,
  UserCheck,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: string[];
  badgeKey?: string;
}

const navItems: NavItem[] = [
  // Admin routes
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { label: 'Users', path: '/admin/users', icon: Users, roles: ['admin'] },
  { label: 'All Events', path: '/admin/events', icon: Calendar, roles: ['admin'] },
  { label: 'Sub Events', path: '/admin/sub-events', icon: ClipboardList, roles: ['admin'] },
  { label: 'Applications', path: '/admin/team', icon: Users, roles: ['admin'] },
  { label: 'Tasks', path: '/admin/tasks', icon: ClipboardList, roles: ['admin'], badgeKey: 'tasks' },
  { label: 'Announcements', path: '/admin/announcements', icon: Bell, roles: ['admin'] },
  { label: 'Reports', path: '/admin/reports', icon: ClipboardList, roles: ['admin'] },
  { label: 'Settings', path: '/admin/settings', icon: Settings, roles: ['admin'] },

  // Creator routes
  { label: 'Dashboard', path: '/creator/dashboard', icon: LayoutDashboard, roles: ['creator'] },
  { label: 'My Events', path: '/creator/events', icon: Calendar, roles: ['creator'] },
  { label: 'Sub Events', path: '/creator/sub-events', icon: ClipboardList, roles: ['creator'] },
  { label: 'All Events', path: '/creator/all-events', icon: Calendar, roles: ['creator'] },
  { label: 'Applications', path: '/creator/team', icon: Users, roles: ['creator'] },
  { label: 'Tasks', path: '/creator/tasks', icon: ClipboardList, roles: ['creator'], badgeKey: 'tasks' },
  { label: 'Announcements', path: '/creator/announcements', icon: Bell, roles: ['creator'] },

  // Team Lead routes
  { label: 'Dashboard', path: '/teamlead/dashboard', icon: LayoutDashboard, roles: ['teamlead'] },
  { label: 'All Events', path: '/teamlead/all-events', icon: Calendar, roles: ['teamlead'] },
  { label: 'My Sub-Events', path: '/teamlead/sub-events', icon: ClipboardList, roles: ['teamlead'] },
  { label: 'My Tasks', path: '/teamlead/tasks', icon: ClipboardList, roles: ['teamlead'], badgeKey: 'tasks' },
  { label: 'Volunteers', path: '/teamlead/volunteers', icon: UserCheck, roles: ['teamlead'] },

  // Student routes
  { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard, roles: ['student'] },
  { label: 'Events', path: '/student/events', icon: Calendar, roles: ['student'] },
  { label: 'My Registrations', path: '/student/registrations', icon: ClipboardList, roles: ['student'] },
  { label: 'Announcements', path: '/student/announcements', icon: Bell, roles: ['student'] },
  { label: 'Team Messages', path: '/student/messages', icon: MessageSquare, roles: ['student'] },
  { label: 'Volunteer', path: '/student/volunteer', icon: UserCheck, roles: ['student'] },
  { label: 'My Tasks', path: '/student/tasks', icon: ClipboardList, roles: ['student'], badgeKey: 'tasks' },
  { label: 'Profile', path: '/student/profile', icon: User, roles: ['student'] },
  { label: 'Settings', path: '/student/settings', icon: Settings, roles: ['student'] },
];

export function Sidebar() {
  const { user, logout, isAdmin, isCreator, isTeamLead, isStudent } = useAuth();
  const location = useLocation();
  const { collapsed, toggleCollapsed } = useSidebar();
  const { theme } = useTheme();
  const [pendingTasks, setPendingTasks] = useState(0);

  useEffect(() => {
    fetchPendingTasks();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingTasks = async () => {
    try {
      const { data } = await api.get('/tasks/index.php');
      const pending = (data || []).filter((t: any) => t.status !== 'completed').length;
      setPendingTasks(pending);
    } catch (error) {
      // Silently fail
    }
  };

  const getRoleLabel = () => {
    if (isAdmin()) return 'Administrator';
    if (isCreator()) return 'Event Creator';
    if (isTeamLead()) return 'Team Lead';
    if (isStudent()) return 'Student';
    return 'User';
  };

  const filteredNavItems = navItems.filter(item => {
    if (isAdmin()) return item.roles.includes('admin');
    if (isCreator()) return item.roles.includes('creator');
    if (isTeamLead()) return item.roles.includes('teamlead');
    if (isStudent()) return item.roles.includes('student');
    return false;
  });

  const getBadgeCount = (key?: string) => {
    if (key === 'tasks') return pendingTasks;
    return 0;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-50',
        'bg-[var(--bg-sidebar)] border-r border-[var(--border-color)]',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" invertContext={false} />
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">EVENTRAX</h1>
              <p className="text-xs text-[var(--text-muted)]">{getRoleLabel()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const badgeCount = getBadgeCount(item.badgeKey);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                isActive
                  ? 'bg-[var(--bg-hover)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
                collapsed && 'justify-center'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-[var(--accent-primary)]')} />
                {collapsed && badgeCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>
              {!collapsed && (
                <>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs rounded border border-[var(--border-color)] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                  {badgeCount > 0 && ` (${badgeCount})`}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-[var(--border-color)]">
        <div className={cn('flex items-center gap-3 mb-3', collapsed && 'justify-center')}>
          <img
            src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
            alt={user?.name}
            className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex-shrink-0"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          className={cn(
            'w-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
            collapsed && 'px-0 justify-center'
          )}
          onClick={logout}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
        style={{ background: 'linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))' }}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
