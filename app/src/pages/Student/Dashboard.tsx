import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Calendar,
  Users,
  Trophy,
  Clock,
  AlertTriangle,
  CheckCircle,
  Star,
  Sparkles,
  Zap,
  ChevronRight,
  MapPin,
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
  start_date: string;
  end_date: string;
  status: string;
  poster?: string;
  creator_name?: string;
  category?: string;
}

interface Registration {
  id: string;
  event_id: string;
  status: string;
  registered_at: string;
  event?: Event;
}

interface StudentStats {
  totalEvents: number;
  upcomingEvents: number;
  attendedEvents: number;
  volunteerApplications: number;
  prizeWinnings: number;
  achievementBadges: number;
  learningHours: number;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentStats>({
    totalEvents: 0,
    upcomingEvents: 0,
    attendedEvents: 0,
    volunteerApplications: 0,
    prizeWinnings: 0,
    achievementBadges: 0,
    learningHours: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch student statistics
      const statsRes = await api.get('/stats/student.php');
      setStats(statsRes.data || stats);

      // Fetch all events and filter in frontend
      const eventsRes = await api.get('/events/index.php');
      const allEvents = eventsRes.data || [];
      
      // Filter upcoming events (next 30 days)
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const upcoming = allEvents.filter((e: Event) => 
        e.status === 'upcoming' && 
        new Date(e.start_date) <= thirtyDaysFromNow
      );
      setUpcomingEvents(upcoming.slice(0, 6));

      // Fetch student registrations
      const regRes = await api.get('/registrations/index.php');
      setRegistrations(regRes.data || []);

      // Filter today's events
      const today = new Date().toISOString().split('T')[0];
      const todayEvts = allEvents.filter((e: Event) => 
        e.start_date.startsWith(today)
      );
      setTodayEvents(todayEvts);

      // Use upcoming as recommended (same list for now)
      setRecommendedEvents(upcoming.slice(0, 4));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ongoing':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleRegister = async (eventId: string) => {
    try {
      const response = await api.post('/registrations/student.php', {
        event_id: eventId
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchDashboardData(); // Refresh dashboard data
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Failed to register for event');
    }
  };

  // Check if user is registered for an event
  const isRegistered = (eventId: string) => {
    return registrations.some(reg => reg.event_id === eventId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Sidebar />
        <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <Header />
          <main className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-[var(--bg-card)] border-[var(--border-color)]">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-20" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-96 lg:col-span-2" />
              <Skeleton className="h-96" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
        <Header />
        <main className="p-6">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                  Welcome back, Student! 👋
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Here's what's happening with your events today
                </p>
              </div>
              <Button
                onClick={() => navigate('/student/events')}
                className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90"
              >
                Browse Events
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Today's Alerts */}
          {todayEvents.length > 0 && (
            <Card className="mb-8 bg-gradient-to-r from-[var(--status-error)]/10 to-[var(--status-warning)]/10 border-[var(--status-error)]/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[var(--status-error)]" />
                  <CardTitle className="text-[var(--status-error)]">Today's Events</CardTitle>
                  <Badge variant="secondary" className="bg-[var(--status-error)]/20 text-[var(--status-error)]">
                    {todayEvents.length} Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {todayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[var(--status-error)]/5 border border-[var(--status-error)]/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--status-error)]/20 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-[var(--status-error)]" />
                        </div>
                        <div>
                          <h4 className="font-medium text-[var(--text-primary)]">{event.title}</h4>
                          <p className="text-sm text-[var(--text-secondary)]">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {event.venue}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/student/events/${event.id}`)}
                          className="border-[var(--status-error)]/20 text-[var(--status-error)] hover:bg-[var(--status-error)]/10"
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[var(--status-error)] hover:bg-[var(--status-error)]/90 text-white"
                        >
                          Check In
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                  Total Events
                </CardTitle>
                <Calendar className="h-4 w-4 text-[var(--accent-primary)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalEvents}</div>
                <p className="text-xs text-[var(--text-secondary)]">
                  +{stats.upcomingEvents} upcoming this month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                  My Registrations
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{registrations.length}</div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {stats.attendedEvents} attended
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                  Volunteer Apps
                </CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.volunteerApplications}</div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Pending review
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                  Achievements
                </CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.achievementBadges}</div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {stats.learningHours} learning hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Events */}
            <Card className="lg:col-span-2 bg-[var(--bg-card)] border-[var(--border-color)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--accent-primary)]" />
                    Upcoming Events
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/student/events')}
                    className="text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
                  >
                    View All
                  </Button>
                </div>
                <CardDescription className="text-[var(--text-secondary)]">
                  Events you might be interested in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingEvents.slice(0, 4).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
                      onClick={() => navigate(`/student/events/${event.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-[var(--accent-primary)]" />
                        </div>
                        <div>
                          <h4 className="font-medium text-[var(--text-primary)]">{event.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <MapPin className="w-3 h-3" />
                            {event.venue}
                            <Separator orientation="vertical" className="h-3" />
                            <Clock className="w-3 h-3" />
                            {formatDate(event.start_date)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                        {isRegistered(event.id) ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled
                            className="border-green-200 text-green-600 bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Registered
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card navigation
                              handleRegister(event.id);
                            }}
                          >
                            Register
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                <CardHeader>
                  <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[var(--accent-primary)]" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                    onClick={() => navigate('/student/events')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Browse Events
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                    onClick={() => navigate('/student/registrations')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    My Registrations
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                    onClick={() => navigate('/student/volunteer')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Apply to Volunteer
                  </Button>
                </CardContent>
              </Card>

              {/* Recommended Events */}
              <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                <CardHeader>
                  <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Recommended
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recommendedEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
                        onClick={() => navigate(`/student/events/${event.id}`)}
                      >
                        <h5 className="font-medium text-[var(--text-primary)] text-sm mb-1">
                          {event.title}
                        </h5>
                        <p className="text-xs text-[var(--text-secondary)]">{event.venue}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
