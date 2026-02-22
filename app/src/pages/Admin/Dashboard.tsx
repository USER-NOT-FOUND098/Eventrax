import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { StatChart } from '@/components/dashboard/StatChart';
import { EventCard } from '@/components/events/EventCard';
import api from '@/lib/api';
import type { DashboardStats, Event } from '@/types';
import {
  Calendar,
  Users,
  DollarSign,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, eventsRes] = await Promise.all([
          api.get('/stats/index.php'),
          api.get('/events/index.php')
        ]);
        setStats(statsRes.data);
        setRecentEvents(eventsRes.data.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Chart data (Mocked for now as we need complex queries for monthly data)
  const eventStatusData = [
    { name: 'Upcoming', value: stats?.upcomingEvents || 0 },
    { name: 'Ongoing', value: stats?.ongoingEvents || 0 },
    { name: 'Completed', value: stats?.completedEvents || 0 },
  ];

  const monthlyExpensesData = [
    { name: 'Jan', value: 15000 },
    { name: 'Feb', value: 22000 },
    { name: 'Mar', value: 18000 },
    { name: 'Apr', value: 25000 },
    { name: 'May', value: 32000 },
    { name: 'Jun', value: 28000 },
  ];

  const userRoleData = [
    { name: 'Admins', value: 1 }, // Placeholder
    { name: 'Creators', value: 5 },
    { name: 'Team Leads', value: 10 },
    { name: 'Students', value: 50 },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />

      <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
        <Header onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        <main className="p-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>System overview and analytics</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardCard
              title="Total Events"
              value={stats?.totalEvents || 0}
              subtitle={`${stats?.upcomingEvents || 0} upcoming`}
              icon={Calendar}
              color="indigo"
              trend={{ value: 12, isPositive: true }}
            />
            <DashboardCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              subtitle="Across all roles"
              icon={Users}
              color="blue"
              trend={{ value: 8, isPositive: true }}
            />
            <DashboardCard
              title="Total Budget"
              value={formatCurrency(stats?.totalBudget || 0)}
              subtitle="All events combined"
              icon={DollarSign}
              color="green"
            />
            <DashboardCard
              title="Total Expenses"
              value={formatCurrency(stats?.totalExpenses || 0)}
              subtitle={`${((stats?.totalExpenses || 0) / (stats?.totalBudget || 1) * 100).toFixed(1)}% of budget`}
              icon={Activity}
              color="rose"
              trend={{ value: 5, isPositive: false }}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <StatChart
              type="bar"
              data={monthlyExpensesData}
              title="Monthly Expenses"
              subtitle="Expense trend over last 6 months"
              className="lg:col-span-2"
              height={280}
            />
            <StatChart
              type="pie"
              data={eventStatusData}
              title="Event Status"
              subtitle="Distribution by status"
              height={280}
            />
          </div>

          {/* Second Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <StatChart
              type="pie"
              data={userRoleData}
              title="Users by Role"
              subtitle="Distribution across the platform"
              height={260}
            />
            <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Active Users</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Active accounts</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-emerald-400">{(stats as any)?.activeUsers || 0}</span>
                </div>

                <div
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-[var(--bg-primary)] transition-colors"
                  style={{ backgroundColor: 'var(--bg-hover)' }}
                  onClick={() => navigate('/admin/users')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Pending Approvals</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Click to review</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-amber-400">{(stats as any)?.pendingApprovals || 0}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/admin/users');
                    }}
                  >
                    Review
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Suspended Users</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Accounts on hold</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-rose-400">{(stats as any)?.suspendedUsers || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Events */}
          <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Events</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Latest events across the platform</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="compact"
                  onView={() => { }}
                />
              ))}
              {recentEvents.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No events found.</p>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
