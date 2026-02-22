import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Search,
  Plus,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Mail,
  UserCheck,
  Target,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubEvent {
  id: number;
  title: string;
  description: string;
  event_id: number;
  event_title: string;
  start_time: string;
  end_time: string;
  venue: string;
}

export default function StudentVolunteer() {
  const { collapsed } = useSidebar();
  const [applications, setApplications] = useState<any[]>([]);
  const [availableSubEvents, setAvailableSubEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedSubEvent, setSelectedSubEvent] = useState<any>(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('applications');
  const [myTeamData, setMyTeamData] = useState<any[]>([]);

  useEffect(() => {
    fetchApplications();
    fetchAvailableSubEvents();
  }, []);

  useEffect(() => {
    // When applications load, fetch team data for approved ones
    if (applications.length > 0) {
      fetchMyTeamData();
    }
  }, [applications]);

  const fetchMyTeamData = async () => {
    try {
      const approvedApps = applications.filter(app => app.status === 'approved');
      if (approvedApps.length === 0) {
        setMyTeamData([]);
        return;
      }

      // Fetch team data for each approved sub-event
      const teamDataPromises = approvedApps.map(async (app) => {
        try {
          const [teamRes, subEventRes] = await Promise.all([
            api.get(`/volunteers/index.php?sub_event_id=${app.sub_event_id}&list_type=assigned`),
            api.get(`/sub_events/index.php?id=${app.sub_event_id}`)
          ]);
          const subEvent = Array.isArray(subEventRes.data) ? subEventRes.data[0] : subEventRes.data;
          return {
            sub_event_id: app.sub_event_id,
            sub_event_title: app.sub_event_title,
            team_lead: subEvent?.team_lead_name ? {
              name: subEvent.team_lead_name,
              id: subEvent.team_lead_id
            } : null,
            volunteers: teamRes.data || []
          };
        } catch (err) {
          console.error('Error fetching team for sub-event', app.sub_event_id, err);
          return null;
        }
      });

      const results = await Promise.all(teamDataPromises);
      setMyTeamData(results.filter(Boolean));
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/volunteers/apply.php');
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSubEvents = async () => {
    try {
      // Get sub-events from events the student is registered for
      const registrationsResponse = await api.get('/registrations/student.php');
      const eventIds = registrationsResponse.data.map((reg: any) => reg.event_id);

      if (eventIds.length === 0) {
        setAvailableSubEvents([]);
        return;
      }

      // Get sub-events for these events
      const subEventsPromises = eventIds.map(async (eventId: string) => {
        const response = await api.get(`/sub_events/index.php?event_id=${eventId}`);
        return response.data.map((subEvent: any) => ({
          ...subEvent,
          event_title: subEvent.event_title || 'Unknown Event'
        }));
      });

      const allSubEvents = await Promise.all(subEventsPromises);
      const flatSubEvents = allSubEvents.flat();

      // Filter out sub-events the student has already applied to
      const appliedSubEventIds = applications.map(app => app.sub_event_id);
      const availableSubEvents = flatSubEvents.filter(
        (subEvent: SubEvent) => !appliedSubEventIds.includes(subEvent.id)
      );

      setAvailableSubEvents(availableSubEvents);
    } catch (error) {
      console.error('Error fetching available sub-events:', error);
    }
  };

  const handleApply = async () => {
    if (!selectedSubEvent) return;

    try {
      setSubmitting(true);
      const response = await api.post('/volunteers/apply.php', {
        sub_event_id: selectedSubEvent.id,
        message: applicationMessage,
      });

      if (response.data.success) {
        setShowApplyDialog(false);
        setSelectedSubEvent(null);
        setApplicationMessage('');
        await fetchApplications();
        await fetchAvailableSubEvents();
      }
    } catch (error: any) {
      console.error('Error applying:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.sub_event_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredSubEvents = availableSubEvents.filter(subEvent =>
    subEvent.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subEvent.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: applications.length,
    approved: applications.filter(app => app.status === 'approved').length,
    pending: applications.filter(app => app.status === 'pending').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Sidebar />
        <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <Header />
          <main className="p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded"></div>
                ))}
              </div>
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
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Volunteer Applications
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Apply and track your volunteer applications
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowApplyDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Apply to Volunteer
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Applications
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.total}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Approved
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.approved}
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {stats.pending}
                      </p>
                    </div>
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Rejected
                      </p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {stats.rejected}
                      </p>
                    </div>
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="applications" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    My Applications
                  </TabsTrigger>
                  <TabsTrigger value="available" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Available Positions
                  </TabsTrigger>
                  <TabsTrigger value="myteam" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    My Team ({myTeamData.length})
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  {activeTab === 'applications' && (
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="outline" size="sm" onClick={() => fetchApplications()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Applications Tab */}
              <TabsContent value="applications">
                <Card>
                  <CardHeader>
                    <CardTitle>My Volunteer Applications</CardTitle>
                    <CardDescription>
                      Track the status of your volunteer applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      {filteredApplications.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">
                            No volunteer applications yet
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            Apply to volunteer positions to get started
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredApplications.map((application) => (
                            <div
                              key={application.id}
                              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    {application.sub_event_title}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {application.event_title}
                                  </p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {application.message || 'No message provided'}
                                  </p>
                                </div>
                                <Badge className={cn("flex items-center gap-1", getStatusColor(application.status))}>
                                  {getStatusIcon(application.status)}
                                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Applied: {formatTime(application.applied_at)}</span>
                                {application.reviewed_at && (
                                  <span>Reviewed: {formatTime(application.reviewed_at)}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Available Positions Tab */}
              <TabsContent value="available">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Volunteer Positions</CardTitle>
                    <CardDescription>
                      Browse and apply for volunteer opportunities in events you're registered for
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      {filteredSubEvents.length === 0 ? (
                        <div className="text-center py-8">
                          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">
                            No available volunteer positions
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            Register for more events to see volunteer opportunities
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredSubEvents.map((subEvent) => {
                            const hasApplied = applications.some(app => app.sub_event_id === subEvent.id);
                            return (
                              <div
                                key={subEvent.id}
                                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                      {subEvent.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                      {subEvent.event_title}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                      {subEvent.description}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    disabled={hasApplied}
                                    variant={hasApplied ? "secondary" : "default"}
                                    onClick={() => {
                                      if (!hasApplied) {
                                        setSelectedSubEvent(subEvent);
                                        setShowApplyDialog(true);
                                      }
                                    }}
                                  >
                                    {hasApplied ? 'Applied' : 'Apply'}
                                  </Button>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatTime(subEvent.start_time)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {subEvent.venue}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(subEvent.end_time).getTime() - new Date(subEvent.start_time).getTime() > 0
                                      ? `${Math.round((new Date(subEvent.end_time).getTime() - new Date(subEvent.start_time).getTime()) / 60000)} min`
                                      : 'Duration TBD'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* My Team Tab */}
              <TabsContent value="myteam">
                <div className="space-y-4">
                  {myTeamData.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No team yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Get approved for a sub-event to see your team members
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    myTeamData.map((team) => (
                      <Card key={team.sub_event_id}>
                        <CardHeader>
                          <CardTitle className="text-lg">{team.sub_event_title}</CardTitle>
                          <CardDescription>Team members for this sub-event</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {/* Team Lead */}
                            {team.team_lead && (
                              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <img
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${team.team_lead.id}`}
                                  className="w-10 h-10 rounded-full bg-gray-200"
                                  alt={team.team_lead.name}
                                />
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {team.team_lead.name}
                                  </p>
                                  <p className="text-sm text-purple-600 dark:text-purple-400">Team Lead</p>
                                </div>
                              </div>
                            )}

                            {/* Volunteers */}
                            {team.volunteers.length > 0 ? (
                              team.volunteers.map((vol: any) => (
                                <div key={vol.user_id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <img
                                    src={vol.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${vol.user_id}`}
                                    className="w-10 h-10 rounded-full bg-gray-200"
                                    alt={vol.user_name}
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {vol.user_name}
                                    </p>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                      <Mail className="h-3 w-3" />
                                      <span>{vol.user_email}</span>
                                    </div>
                                  </div>
                                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    Volunteer
                                  </Badge>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-2">
                                No other volunteers yet
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Apply Dialog */}
          <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply to Volunteer</DialogTitle>
                <DialogDescription>
                  Apply for the volunteer position at {selectedSubEvent?.title}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Event</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedSubEvent?.event_title}
                  </p>
                </div>
                <div>
                  <label htmlFor="sub-event" className="text-sm font-medium">
                    Sub-Event
                  </label>
                  <select
                    id="sub-event"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    value={selectedSubEvent?.id || ''}
                    onChange={(e) => {
                      const subEvent = availableSubEvents.find(se => se.id === parseInt(e.target.value));
                      setSelectedSubEvent(subEvent || null);
                    }}
                  >
                    <option value="">Select a sub-event</option>
                    {availableSubEvents.map((subEvent) => (
                      <option key={subEvent.id} value={subEvent.id}>
                        {subEvent.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="text-sm font-medium">
                    Message (Optional)
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Tell us why you're interested in volunteering..."
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowApplyDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={submitting || !selectedSubEvent}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Apply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
