import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Calendar,
  CheckCircle,
  Clock,
  ClipboardList,
  AlertCircle,
  Users,
  UserCheck,
  UserX,
  ChevronRight,
  MapPin,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SubEvent {
  id: string;
  event_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  venue: string;
  status: string;
  expected_time: number;
  event_title: string;
}

interface VolunteerApplication {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  sub_event_id: string;
  sub_event_title: string;
  message: string;
  status: string;
  created_at: string;
}

interface DashboardStats {
  assignedSubEvents: number;
  totalVolunteers: number;
  pendingApplications: number;
  completedTasks: number;
  upcomingTasks: number;
}

export function TeamLeadDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { collapsed } = useSidebar();
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    assignedSubEvents: 0,
    totalVolunteers: 0,
    pendingApplications: 0,
    completedTasks: 0,
    upcomingTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch assigned sub-events
      const subEventsRes = await api.get('/sub_events/my.php');
      const subEventsData = subEventsRes.data || [];
      setSubEvents(subEventsData);

      // Fetch pending volunteer applications
      const applicationsRes = await api.get('/teamlead/applications.php');
      const applicationsData = applicationsRes.data || [];
      setApplications(applicationsData.filter((app: VolunteerApplication) => app.status === 'pending'));

      // Calculate stats
      const completed = subEventsData.filter((se: SubEvent) => se.status === 'completed').length;
      const upcoming = subEventsData.filter((se: SubEvent) => se.status === 'upcoming' || se.status === 'ongoing').length;

      setStats({
        assignedSubEvents: subEventsData.length,
        totalVolunteers: 0, // Will be fetched from API later
        pendingApplications: applicationsData.filter((app: VolunteerApplication) => app.status === 'pending').length,
        completedTasks: completed,
        upcomingTasks: upcoming,
      });
    } catch (error) {
      console.error('Failed to fetch data', error);
      // Use sub-events data even if applications fail
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (applicationId: string) => {
    try {
      await api.post('/teamlead/approve.php', {
        application_id: applicationId,
        action: 'approve'
      });
      toast.success('Volunteer application approved!');
      fetchData();
    } catch (error) {
      console.error('Failed to approve application', error);
      toast.error('Failed to approve application');
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    try {
      await api.post('/teamlead/approve.php', {
        application_id: applicationId,
        action: 'reject'
      });
      toast.success('Volunteer application rejected');
      fetchData();
    } catch (error) {
      console.error('Failed to reject application', error);
      toast.error('Failed to reject application');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'ongoing':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const upcomingSubEvent = subEvents
    .filter(se => se.status === 'upcoming' || se.status === 'ongoing')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

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
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                  Welcome back, {user?.name?.split(' ')[0] || 'Team Lead'}! 👋
                </h1>
                <p className="text-[var(--text-secondary)] mt-1">
                  Manage your sub-events and team volunteers
                </p>
              </div>
              <Button
                onClick={() => navigate('/teamlead/volunteers')}
                className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90"
              >
                Review Applications
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                  My Sub-Events
                </CardTitle>
                <ClipboardList className="h-4 w-4 text-[var(--accent-primary)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.assignedSubEvents}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {stats.completedTasks} completed, {stats.upcomingTasks} upcoming
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                  Pending Applications
                </CardTitle>
                <UserCheck className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.pendingApplications}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Awaiting your review
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                  Completion Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.assignedSubEvents > 0
                    ? Math.round((stats.completedTasks / stats.assignedSubEvents) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Task completion
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[var(--bg-card)] border-[var(--border-color)] hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
                  Team Members
                </CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.totalVolunteers}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Active volunteers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Next Upcoming Task */}
          {upcomingSubEvent && (
            <Card className="mb-8 bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5 border-[var(--accent-primary)]/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-[var(--accent-primary)]" />
                  <span className="text-sm font-medium text-[var(--accent-primary)]">Next Upcoming</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">{upcomingSubEvent.title}</h3>
                    <p className="text-[var(--text-secondary)] mt-1">{upcomingSubEvent.event_title}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(upcomingSubEvent.start_time), 'MMM d, yyyy h:mm a')}
                      </span>
                      {upcomingSubEvent.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {upcomingSubEvent.venue}
                        </span>
                      )}
                      {upcomingSubEvent.expected_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {upcomingSubEvent.expected_time} mins
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/teamlead/sub-events/${upcomingSubEvent.id}`)}
                    className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My Sub-Events */}
            <Card className="lg:col-span-2 bg-[var(--bg-card)] border-[var(--border-color)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-[var(--accent-primary)]" />
                    My Sub-Events
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/teamlead/sub-events')}
                    className="text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
                  >
                    View All
                  </Button>
                </div>
                <CardDescription className="text-[var(--text-secondary)]">
                  Sub-events assigned to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subEvents.slice(0, 5).map((subEvent) => (
                    <div
                      key={subEvent.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
                      onClick={() => navigate(`/teamlead/sub-events/${subEvent.id}`)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-[var(--text-primary)]">{subEvent.title}</h4>
                        <p className="text-sm text-[var(--accent-primary)] mt-0.5">{subEvent.event_title}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(subEvent.start_time), 'MMM d, h:mm a')}
                          </span>
                          {subEvent.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {subEvent.venue}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={cn('capitalize', getStatusColor(subEvent.status))}>
                        {subEvent.status}
                      </Badge>
                    </div>
                  ))}

                  {subEvents.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-[var(--text-muted)]" />
                      </div>
                      <p className="text-[var(--text-secondary)]">No sub-events assigned yet</p>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        Wait for a creator to assign you to a sub-event
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Pending Applications */}
              <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                <CardHeader>
                  <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-500" />
                    Pending Applications
                  </CardTitle>
                  <CardDescription className="text-[var(--text-secondary)]">
                    Volunteer requests to review
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {applications.slice(0, 3).map((app) => (
                      <div
                        key={app.id}
                        className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-medium text-[var(--text-primary)] text-sm">
                              {app.student_name}
                            </h5>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {app.sub_event_title}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveApplication(app.id);
                            }}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectApplication(app.id);
                            }}
                          >
                            <UserX className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}

                    {applications.length === 0 && (
                      <div className="text-center py-6">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm text-[var(--text-secondary)]">No pending applications</p>
                      </div>
                    )}

                    {applications.length > 3 && (
                      <Button
                        variant="outline"
                        className="w-full border-[var(--border-color)] text-[var(--text-primary)]"
                        onClick={() => navigate('/teamlead/volunteers')}
                      >
                        View All ({applications.length})
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

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
                    onClick={() => navigate('/teamlead/sub-events')}
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    View All Sub-Events
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                    onClick={() => navigate('/teamlead/volunteers')}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Manage Volunteers
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                    onClick={() => navigate('/teamlead/tasks')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    View Tasks
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
