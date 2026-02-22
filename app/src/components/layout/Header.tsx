import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, Menu, Moon, Sun, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotificationBell } from '@/components/ui-custom/NotificationBell';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';



interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <header
      className="h-16 backdrop-blur-xl border-b flex items-center justify-between px-6 sticky top-0 z-40"
      style={{
        backgroundColor: 'var(--bg-header)',
        borderColor: 'var(--border-color)'
      }}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Search events, users..."
            className="w-64 pl-10"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-input)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications - For all authenticated users */}
        {user && <NotificationBell />}

        {/* Theme Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              {theme === 'dark' && <Moon className="w-5 h-5" />}
              {theme === 'light' && <Sun className="w-5 h-5" />}
              {theme === 'cherry' && <Heart className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)'
            }}
          >
            <DropdownMenuLabel className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Theme</DropdownMenuLabel>
            <DropdownMenuSeparator style={{ backgroundColor: 'var(--border-color)' }} />
            <DropdownMenuItem
              className={cn(
                "cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                theme === 'dark' && "bg-[var(--bg-hover)] text-[var(--text-primary)]"
              )}
              onClick={() => setTheme('dark')}
            >
              <Moon className="w-4 h-4 mr-2" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem
              className={cn(
                "cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                theme === 'light' && "bg-[var(--bg-hover)] text-[var(--text-primary)]"
              )}
              onClick={() => setTheme('light')}
            >
              <Sun className="w-4 h-4 mr-2" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem
              className={cn(
                "cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                theme === 'cherry' && "bg-[var(--bg-hover)] text-[var(--accent-primary)]"
              )}
              onClick={() => setTheme('cherry')}
            >
              <Heart className="w-4 h-4 mr-2" style={{ color: '#EC4899' }} />
              Cherry
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 hover:bg-[var(--bg-hover)] px-2">
              <img
                src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                alt={user?.name}
                className="w-8 h-8 rounded-lg object-cover"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              />
              <span className="hidden sm:inline text-sm font-medium text-[var(--text-primary)]">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)'
            }}
          >
            <DropdownMenuLabel className="p-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator style={{ backgroundColor: 'var(--border-color)' }} />
            <DropdownMenuItem
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
              onClick={() => {
                const role = user?.role || 'student';
                navigate(`/${role}/profile`);
              }}
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer"
              onClick={() => {
                const role = user?.role || 'student';
                navigate(`/${role}/settings`);
              }}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ backgroundColor: 'var(--border-color)' }} />
            <DropdownMenuItem className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer">
              Help & Support
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
