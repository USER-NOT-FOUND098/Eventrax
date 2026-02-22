import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Search,
  Loader2,
  ExternalLink,
  X,
  CheckCircle,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { toast } from 'sonner';

interface EventRegistration {
  id: string;
  event_id: string;
  title: string;
  description: string;
  venue: string;
  start_date: string;
  end_date: string;
  status: string;
  poster?: string;
  creator_name: string;
  registration_status: string;
  registered_at: string;
}

interface SubEventRegistration {
  id: string;
  sub_event_id: string;
  event_id: string;
  title: string;
  description: string;
  venue: string;
  start_time: string;
  end_time: string;
  status: string;
  banner?: string;
  team_lead_name?: string;
  event_title: string;
  event_poster?: string;
  registration_status: string;
  registered_at: string;
}

export default function StudentRegistrations() {
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [subEventRegistrations, setSubEventRegistrations] = useState<SubEventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, subEventsRes] = await Promise.all([
        api.get('/registrations/student.php'),
        api.get('/sub_events/my.php') // Fixed: Get user's sub-event registrations
      ]);
      
      setEventRegistrations(eventsRes.data || []);
      setSubEventRegistrations(subEventsRes.data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const cancelEventRegistration = async (eventId: string) => {
    try {
      setCancelling(eventId);
      const response = await api.delete(`/registrations/student.php?event_id=${eventId}`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchData(); // Refresh data
      }
    } catch (error: any) {
      console.error('Cancel registration error:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel registration');
    } finally {
      setCancelling(null);
    }
  };

  const cancelSubEventRegistration = async (subEventId: string) => {
    try {
      setCancelling(subEventId);
      const response = await api.delete(`/sub_events/register.php?sub_event_id=${subEventId}`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchData(); // Refresh data
      }
    } catch (error: any) {
      console.error('Cancel sub-event registration error:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel sub-event registration');
    } finally {
      setCancelling(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered':
        return 'bg-[var(--status-success)]/10 text-[var(--status-success)] border-[var(--status-success)]/20';
      case 'attended':
        return 'bg-[var(--status-info)]/10 text-[var(--status-info)] border-[var(--status-info)]/20';
      case 'cancelled':
        return 'bg-[var(--status-error)]/10 text-[var(--status-error)] border-[var(--status-error)]/20';
      default:
        return 'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20';
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-[var(--status-info)]/10 text-[var(--status-info)] border-[var(--status-info)]/20';
      case 'ongoing':
        return 'bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/20';
      case 'completed':
        return 'bg-[var(--status-success)]/10 text-[var(--status-success)] border-[var(--status-success)]/20';
      default:
        return 'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20';
    }
  };

  const filteredEventRegistrations = eventRegistrations.filter(reg =>
    reg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.creator_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubEventRegistrations = subEventRegistrations.filter(reg =>
    reg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reg.event_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (reg.team_lead_name && reg.team_lead_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      
      <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
        <Header />
        
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Registrations</h1>
            <p className="text-[var(--text-secondary)] mt-1">Manage your event and sub-event registrations</p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Search registrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Total Events</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{eventRegistrations.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[var(--status-info)]/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[var(--status-info)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Sub-Events</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{subEventRegistrations.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[var(--status-success)]/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-[var(--status-success)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Attended</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {[...eventRegistrations, ...subEventRegistrations].filter(r => r.registration_status === 'attended').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[var(--bg-card)] border border-[var(--border-color)] p-1">
              <TabsTrigger
                value="events"
                className="data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white text-[var(--text-secondary)]"
              >
                Events ({filteredEventRegistrations.length})
              </TabsTrigger>
              <TabsTrigger
                value="subevents"
                className="data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white text-[var(--text-secondary)]"
              >
                Sub-Events ({filteredSubEventRegistrations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="mt-6">
              {filteredEventRegistrations.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredEventRegistrations.map((registration) => (
                    <Card key={registration.id} className="bg-[var(--bg-card)] border-[var(--border-color)]">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-[var(--text-primary)] mb-1">{registration.title}</CardTitle>
                            <p className="text-sm text-[var(--text-secondary)]">by {registration.creator_name}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge className={getStatusColor(registration.registration_status)}>
                              {registration.registration_status}
                            </Badge>
                            <Badge className={getEventStatusColor(registration.status)}>
                              {registration.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {registration.poster && (
                            <div className="aspect-video rounded-lg overflow-hidden">
                              <img src={registration.poster} alt={registration.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          
                          <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                            {registration.description}
                          </p>
                          
                          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <p className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(registration.start_date), 'MMM dd, yyyy HH:mm')}
                            </p>
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {registration.venue}
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Registered {format(new Date(registration.registered_at), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/student/events/${registration.event_id}`)}
                              className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            
                            {registration.registration_status === 'registered' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelEventRegistration(registration.event_id)}
                                disabled={cancelling === registration.event_id}
                                className="border-[var(--status-error)]/20 text-[var(--status-error)] hover:bg-[var(--status-error)]/10"
                              >
                                {cancelling === registration.event_id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                  <Calendar className="w-20 h-20 text-[var(--text-muted)] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No event registrations</h3>
                  <p className="text-[var(--text-secondary)] mb-4">
                    {searchQuery ? 'Try adjusting your search terms' : 'Start exploring and registering for events'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => navigate('/student/events')}>
                      Browse Events
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="subevents" className="mt-6">
              {filteredSubEventRegistrations.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredSubEventRegistrations.map((registration) => (
                    <Card key={registration.id} className="bg-[var(--bg-card)] border-[var(--border-color)]">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-[var(--text-primary)] mb-1">{registration.title}</CardTitle>
                            <p className="text-sm text-[var(--text-secondary)]">Part of: {registration.event_title}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge className={getStatusColor(registration.registration_status)}>
                              {registration.registration_status}
                            </Badge>
                            <Badge className={getEventStatusColor(registration.status)}>
                              {registration.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {registration.banner && (
                            <div className="aspect-video rounded-lg overflow-hidden">
                              <img src={registration.banner} alt={registration.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          
                          <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                            {registration.description}
                          </p>
                          
                          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                            <p className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {format(new Date(registration.start_time), 'MMM dd, yyyy HH:mm')} - {format(new Date(registration.end_time), 'HH:mm')}
                            </p>
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {registration.venue}
                            </p>
                            {registration.team_lead_name && (
                              <p className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4" />
                                {registration.team_lead_name}
                              </p>
                            )}
                            <p className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Registered {format(new Date(registration.registered_at), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/student/events/${registration.event_id}/sub-events/${registration.sub_event_id}`)}
                              className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Sub-Event
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/student/events/${registration.event_id}`)}
                              className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Main Event
                            </Button>
                            
                            {registration.registration_status === 'registered' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelSubEventRegistration(registration.sub_event_id)}
                                disabled={cancelling === registration.sub_event_id}
                                className="border-[var(--status-error)]/20 text-[var(--status-error)] hover:bg-[var(--status-error)]/10"
                              >
                                {cancelling === registration.sub_event_id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                  <Users className="w-20 h-20 text-[var(--text-muted)] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No sub-event registrations</h3>
                  <p className="text-[var(--text-secondary)] mb-4">
                    {searchQuery ? 'Try adjusting your search terms' : 'Register for events to see their sub-events here'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => navigate('/student/events')}>
                      Browse Events
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
