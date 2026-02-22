import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { StatChart } from '@/components/dashboard/StatChart';
import { EventCard } from '@/components/events/EventCard';
import { ExpenseSummary } from '@/components/ui-custom/ExpenseSummary';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import type { Event } from '@/types';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface CreatorStats {
  myEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  totalBudget: number;
  totalExpenses: number;
  totalVolunteers: number;
  totalAttendees: number;
  expensesByCategory: Array<{ category: string; total: number }>;
}

export function CreatorDashboard() {
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        api.get('/stats/creator.php'),
        api.get('/events/index.php?mine=true')
      ]);
      setStats(statsRes.data);
      setMyEvents(eventsRes.data);
    } catch (error) {
      console.error('Failed to fetch creator dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Expense breakdown data from backend
  const expenseCategoryData = stats?.expensesByCategory?.map(item => ({
    name: item.category,
    value: parseFloat(item.total.toString())
  })) || [];

  // Event status data
  const eventStatusData = [
    { name: 'Upcoming', value: stats?.upcomingEvents || 0 },
    { name: 'Ongoing', value: stats?.ongoingEvents || 0 },
    { name: 'Completed', value: stats?.completedEvents || 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
        <Header />

        <main className="p-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Creator Dashboard</h1>
              <p className="text-[var(--text-secondary)] mt-1">Manage your events and track progress</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                onClick={fetchData}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                className="bg-indigo-500 hover:bg-indigo-600"
                onClick={() => navigate('/creator/events/new')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <DashboardCard
              title="My Events"
              value={stats?.myEvents || 0}
              subtitle={`${stats?.upcomingEvents || 0} upcoming`}
              icon={Calendar}
              color="indigo"
            />
            <DashboardCard
              title="Total Volunteers"
              value={stats?.totalVolunteers || 0}
              subtitle="Across all events"
              icon={Users}
              color="blue"
            />
            <DashboardCard
              title="Total Budget"
              value={formatCurrency(stats?.totalBudget || 0)}
              subtitle="All events combined"
              icon={DollarSign}
              color="green"
            />
            <DashboardCard
              title="Total Attendees"
              value={(stats?.totalAttendees || 0).toLocaleString()}
              subtitle="Registered participants"
              icon={TrendingUp}
              color="violet"
            />
          </div>

          {/* Expense Summary */}
          <div className="mb-8">
            <ExpenseSummary
              budget={stats?.totalBudget || 0}
              totalExpenses={stats?.totalExpenses || 0}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <StatChart
              type="pie"
              data={expenseCategoryData}
              title="Expense Breakdown"
              subtitle="By category"
              height={280}
            />
            <StatChart
              type="bar"
              data={eventStatusData}
              title="Event Status"
              subtitle="Distribution by status"
              height={280}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">View All Events</p>
                  <p className="text-xs text-[var(--text-muted)]">Manage your events</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/creator/events')}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">View Expenses</p>
                  <p className="text-xs text-[var(--text-muted)]">Track spending</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/creator/expenses')}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Manage Team</p>
                  <p className="text-xs text-[var(--text-muted)]">Team leads & volunteers</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/creator/team')}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* My Events */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">My Events</h3>
                <p className="text-sm text-[var(--text-muted)]">Events you are managing</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                onClick={() => navigate('/creator/events')}
              >
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myEvents.slice(0, 3).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="default"
                  onView={() => navigate(`/creator/events/${event.id}`)}
                  onEdit={() => navigate(`/creator/events/${event.id}/edit`)}
                />
              ))}
            </div>

            {myEvents.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <p className="text-[var(--text-secondary)]">No events yet</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">Create your first event to get started</p>
                <Button
                  className="mt-4 bg-indigo-500 hover:bg-indigo-600"
                  onClick={() => navigate('/creator/events/new')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
