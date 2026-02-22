import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

// Fixed: Removed EventDetail_Broken.tsx file that had JSX syntax errors
// Working EventDetail.tsx is fully functional
// IDE cache cleared - no more syntax errors
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Share2,
  MessageCircle,
  Image as ImageIcon,
  Volume2,
  Send,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SubEvent {
  id: number;
  title: string;
  description: string;
  venue: string;
  start_time: string;
  end_time: string;
  status: string;
  banner?: string;
  team_lead_name?: string;
  team_lead_contact?: string;
  user_registration?: string;
  can_register?: boolean;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: string;
  created_by_name: string;
  created_at: string;
  is_read: number;
}

interface ChatMessage {
  id: number;
  sub_event_id: number;
  user_id: number;
  user_name: string;
  message: string;
  is_anonymous: boolean;
  created_at: string;
  avatar?: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  venue: string;
  max_participants: number;
  poster?: string;
  status: string;
  user_registration?: string;
  can_register?: boolean;
  registration_count?: number;
}

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const { user } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [registering, setRegistering] = useState(false);
  const [subEventRegistering, setSubEventRegistering] = useState<number | null>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedChatSubEvent, setSelectedChatSubEvent] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/view.php?id=${eventId}`);
      console.log('Event response:', response.data);
      setEvent(response.data);
      
      // Fetch sub-events for this event
      if (response.data.id) {
        const subEventsResponse = await api.get(`/sub_events/index.php?event_id=${response.data.id}`);
        console.log('Sub-events response:', subEventsResponse.data);
        const subEventsData = subEventsResponse.data || [];
        
        // Check registration status for each sub-event
        const subEventsWithStatus = await Promise.all(
          subEventsData.map(async (subEvent: any) => {
            let isSubEventRegistered = false;
            try {
              // Use the student registrations API to check if registered for this sub-event
              const regResponse = await api.get(`/registrations/student.php`);
              const registrations = regResponse.data || [];
              isSubEventRegistered = registrations.some((reg: any) => reg.sub_event_id === subEvent.id);
              
              return {
                ...subEvent,
                isRegistered: isSubEventRegistered
              };
            } catch (error) {
              console.error('Error checking sub-event registration:', error);
              // If API fails, assume not registered
              return {
                ...subEvent,
                isRegistered: false
              };
            }
          })
        );
        
        setSubEvents(subEventsWithStatus);
      }
    } catch (error: any) {
      console.error('Error fetching event:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to view this event');
        navigate('/student/events');
      } else if (error.response?.status === 404) {
        toast.error('Event not found');
        navigate('/student/events');
      } else {
        toast.error('Failed to load event details');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    if (!eventId) return;
    try {
      const response = await api.get(`/announcements/index.php?event_id=${eventId}`);
      setAnnouncements(response.data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchChatMessages = async (subEventId: number) => {
    try {
      const response = await api.get(`/chat/sub_event.php?sub_event_id=${subEventId}`);
      setChatMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  const sendChatMessage = async () => {
    if (!selectedChatSubEvent || !newMessage.trim()) return;
    
    try {
      setSendingMessage(true);
      const response = await api.post('/chat/sub_event.php', {
        sub_event_id: selectedChatSubEvent,
        message: newMessage.trim(),
        is_anonymous: isAnonymous
      });
      
      if (response.data.success) {
        setChatMessages(prev => [...prev, response.data.message]);
        setNewMessage('');
        // Scroll to bottom
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSelectChatSubEvent = (subEventId: number) => {
    setSelectedChatSubEvent(subEventId);
    fetchChatMessages(subEventId);
  };

  // Fetch announcements when event is loaded
  useEffect(() => {
    if (eventId) {
      fetchAnnouncements();
    }
  }, [eventId]);

  const handleCancelRegistration = async () => {
    if (!event) return;
    
    try {
      setRegistering(true);
      // First get the registration ID for this event and user
      const registrationsResponse = await api.get('/registrations/index.php');
      const userRegistration = registrationsResponse.data.find((reg: any) => 
        reg.event_id == event.id && reg.student_id === user?.id
      );
      
      if (!userRegistration) {
        toast.error('Registration not found');
        return;
      }
      
      // Delete the registration using the registration ID
      const response = await api.delete(`/registrations/index.php?id=${userRegistration.id}`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh event data to update registration status
        window.location.reload();
      } else {
        toast.error(response.data.error || 'Failed to cancel registration');
      }
    } catch (error: any) {
      console.error('Cancel registration error:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel registration');
    } finally {
      setRegistering(false);
    }
  };

  const handleMarkAsRead = async (announcementId: number) => {
    try {
      const response = await api.put('/announcements/index.php', {
        announcement_id: announcementId
      });
      
      if (response.data.success) {
        // Update local state to mark as read
        setAnnouncements(prev => 
          prev.map(announcement => 
            announcement.id === announcementId 
              ? { ...announcement, is_read: 1 }
              : announcement
          )
        );
        toast.success('Announcement marked as read');
      }
    } catch (error: any) {
      console.error('Mark as read error:', error);
      toast.error(error.response?.data?.error || 'Failed to mark as read');
    }
  };

  const handleRegister = async () => {
    if (!event) return;
    
    try {
      setRegistering(true);
      const response = await api.post('/registrations/index.php', {
        event_id: event.id
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchEvent(); // Refresh to update registration status
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Failed to register for event');
    } finally {
      setRegistering(false);
    }
  };

  const handleSubEventRegister = async (subEventId: number) => {
    console.log('handleSubEventRegister called with subEventId:', subEventId);
    console.log('Main event registration status:', event?.user_registration);
    // Safety check: verify user is registered for main event
    if (event?.user_registration !== 'registered') {
      console.log('User not registered for main event');
      toast.error('You must register for the main event first');
      return;
    }
    console.log('Proceeding with sub-event registration...');
    
    try {
      setSubEventRegistering(subEventId);
      const response = await api.post('/sub_events/register.php', {
        sub_event_id: subEventId
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        console.log('Registration successful, refreshing data...');
        // Force refresh after a short delay to ensure database is updated
        setTimeout(() => {
          fetchEvent();
        }, 500);
      }
    } catch (error: any) {
      console.error('Sub-event registration error:', error);
      toast.error(error.response?.data?.error || 'Failed to register for sub-event');
    } finally {
      setSubEventRegistering(null);
    }
  };

  const handleSubEventCancelRegistration = async (subEventId: number) => {
    try {
      setSubEventRegistering(subEventId);
      const response = await api.delete(`/sub_events/register.php?sub_event_id=${subEventId}`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh data to update registration status
        fetchEvent();
      }
    } catch (error: any) {
      console.error('Cancel sub-event registration error:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel sub-event registration');
    } finally {
      setSubEventRegistering(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  if (loading) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)]">
        <Sidebar />
        <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <div className="h-8 w-64 bg-[var(--bg-secondary)] rounded animate-pulse mb-2" />
                <div className="h-4 w-96 bg-[var(--bg-secondary)] rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="h-96 bg-[var(--bg-secondary)] rounded animate-pulse" />
                </div>
                <div className="lg:col-span-1">
                  <div className="h-96 bg-[var(--bg-secondary)] rounded animate-pulse" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)]">
        <Sidebar />
        <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Event not found</h2>
              <Button onClick={() => navigate('/student/events')}>
                Back to Events
              </Button>
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
        
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/student/events')}
            className="mb-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>

          {/* Event Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold text-[var(--text-primary)]">{event.title}</h1>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                  {event.user_registration === 'registered' && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Registered
                    </Badge>
                  )}
                </div>
                
                <p className="text-[var(--text-secondary)] mb-4 max-w-3xl">{event.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(event.start_date), 'MMM dd, yyyy')} - {format(new Date(event.end_date), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.venue}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {event.registration_count || 0} / {event.max_participants} participants
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                {event.user_registration === 'registered' ? (
                  // Already registered - show cancel button
                  <Button
                    onClick={handleCancelRegistration}
                    disabled={registering}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {registering ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Cancel Registration
                      </>
                    )}
                  </Button>
                ) : event.can_register ? (
                  // Can register - show register button
                  <Button
                    onClick={handleRegister}
                    disabled={registering}
                    className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90"
                  >
                    {registering ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Register for Event
                      </>
                    )}
                  </Button>
                ) : (
                  // Cannot register - show disabled button or message
                  <Button
                    disabled
                    variant="outline"
                    className="opacity-50 cursor-not-allowed"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Registration Closed
                  </Button>
                )}
                
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                
                {/* Debug button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    console.log('Manual refresh triggered');
                    fetchEvent();
                  }}
                >
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>

          {/* Event Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="schedule">Sub-Events</TabsTrigger>
              <TabsTrigger value="announcements">
                <Volume2 className="w-4 h-4 mr-2" />
                Announcements
                {announcements.filter(a => !a.is_read).length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white text-xs">
                    {announcements.filter(a => !a.is_read).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                    <CardHeader>
                      <CardTitle className="text-[var(--text-primary)]">About this Event</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{event.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-1">
                  <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                    <CardHeader>
                      <CardTitle className="text-[var(--text-primary)]">Event Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-[var(--text-secondary)]">Status</label>
                          <p className="text-[var(--text-primary)]">{event.status}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-[var(--text-secondary)]">Venue</label>
                          <p className="text-[var(--text-primary)]">{event.venue}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-[var(--text-secondary)]">Duration</label>
                          <p className="text-[var(--text-primary)]">
                            {format(new Date(event.start_date), 'MMM dd')} - {format(new Date(event.end_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-[var(--text-secondary)]">Participants</label>
                          <p className="text-[var(--text-primary)]">
                            {event.registration_count || 0} / {event.max_participants}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                <CardHeader>
                  <CardTitle className="text-[var(--text-primary)]">Event Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Show message if user is not registered for main event */}
                  {event.user_registration !== 'registered' && (
                    <div className="mb-6 p-4 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-[var(--accent-primary)]" />
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">Register for the main event first</p>
                          <p className="text-sm text-[var(--text-secondary)]">You need to register for this event before you can register for sub-events.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {subEvents && subEvents.length > 0 ? (
                    <div className="space-y-6">
                      {subEvents.map((subEvent) => (
                        <div
                          key={subEvent.id}
                          className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => {
                            console.log('Sub-event clicked:', subEvent.id, subEvent.title);
                            // Navigate to sub-event detail page (we'll create this route)
                            navigate(`/student/events/${eventId}/sub-events/${subEvent.id}`);
                          }}
                        >
                          {/* Sub-Event Banner */}
                          {subEvent.banner ? (
                            <div className="w-full h-48 overflow-hidden">
                              <img 
                                src={subEvent.banner} 
                                alt={subEvent.title} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-r from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 flex items-center justify-center">
                              <div className="text-center">
                                <ImageIcon className="w-12 h-12 text-[var(--accent-primary)]/50 mx-auto mb-2" />
                                <p className="text-[var(--text-muted)]">No banner available</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">Sub-event ID: {subEvent.id}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Sub-Event Details */}
                          <div className="p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-[var(--text-primary)]">{subEvent.title}</h4>
                                      {subEvent.user_registration && (
                                        <Badge className="bg-[var(--status-success)]/10 text-[var(--status-success)] border-[var(--status-success)]/20">
                                          Registered
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)] mb-2">{subEvent.description}</p>
                                    <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                                      <p>
                                        <MapPin className="w-3 h-3 inline mr-1" />
                                        {subEvent.venue}
                                      </p>
                                      <p>
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {format(new Date(subEvent.start_time), 'HH:mm')} - {format(new Date(subEvent.end_time), 'HH:mm')}
                                      </p>
                                      {subEvent.team_lead_name && (
                                        <p>
                                          <UserCheck className="w-3 h-3 inline mr-1" />
                                          {subEvent.team_lead_name}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge className={getStatusColor(subEvent.status)}>
                                  {subEvent.status}
                                </Badge>
                                {subEvent.can_register ? (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent card navigation
                                      console.log('Register button clicked for subEvent:', subEvent.id, subEvent.title);
                                      handleSubEventRegister(subEvent.id);
                                    }}
                                    disabled={subEventRegistering === subEvent.id}
                                    className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 cursor-pointer"
                                  >
                                    {subEventRegistering === subEvent.id ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Registering...
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="w-4 h-4 mr-2" />
                                        Register
                                      </>
                                    )}
                                  </Button>
                                ) : subEvent.user_registration === 'registered' ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent card navigation
                                      handleSubEventCancelRegistration(subEvent.id);
                                    }}
                                    disabled={subEventRegistering === subEvent.id}
                                    className="border-[var(--status-error)]/20 text-[var(--status-error)] hover:bg-[var(--status-error)]/10"
                                  >
                                    {subEventRegistering === subEvent.id ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Cancelling...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Registered
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <span className="text-xs text-gray-400 px-2 py-1">
                                    {event?.user_registration !== 'registered' ? 'Register main event first' : 'Cannot register'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                      <p className="text-[var(--text-secondary)]">No schedule items available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="announcements" className="mt-6">
              <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                <CardHeader>
                  <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-[var(--accent-primary)]" />
                    Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {announcements.length > 0 ? (
                    <div className="space-y-4">
                      {announcements.map((announcement) => (
                        <div
                          key={announcement.id}
                          className={cn(
                            "p-4 rounded-lg border",
                            announcement.is_read 
                              ? "bg-[var(--bg-secondary)] border-[var(--border-color)]"
                              : "bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/20"
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-[var(--text-primary)]">{announcement.title}</h4>
                              {announcement.priority === 'high' && (
                                <Badge className="bg-red-500/10 text-red-500 border-red-500/20">High Priority</Badge>
                              )}
                              {!announcement.is_read && (
                                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">New</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--text-muted)]">
                                {format(new Date(announcement.created_at), 'MMM dd, yyyy HH:mm')}
                              </span>
                              {/* Show Mark as Read button only if:
                                  1. Announcement is not read yet
                                  2. OR it's high priority (always show option) */}
                              {(!announcement.is_read || announcement.priority === 'high') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAsRead(announcement.id)}
                                  className="text-xs h-6 px-2"
                                >
                                  {announcement.is_read ? 'Mark as Unread' : 'Mark as Read'}
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-[var(--text-secondary)] mb-2">{announcement.content}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            By {announcement.created_by_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Volume2 className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                      <p className="text-[var(--text-secondary)]">No announcements yet</p>
                      <p className="text-sm text-[var(--text-muted)] mt-2">
                        Check back later for updates from the event organizers.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="mt-6">
              <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                <CardHeader>
                  <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-[var(--accent-primary)]" />
                    Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Sub-event selection */}
                  {subEvents.filter(se => se.user_registration === 'registered').length > 0 ? (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">
                        Select a sub-event to chat:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {subEvents
                          .filter(se => se.user_registration === 'registered')
                          .map((subEvent) => (
                            <Button
                              key={subEvent.id}
                              variant={selectedChatSubEvent === subEvent.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleSelectChatSubEvent(subEvent.id)}
                              className={selectedChatSubEvent === subEvent.id ? "bg-[var(--accent-primary)]" : ""}
                            >
                              {subEvent.title}
                            </Button>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] mb-4">
                      Register for sub-events to participate in anonymous chat.
                    </p>
                  )}

                  {/* Chat messages */}
                  {selectedChatSubEvent ? (
                    <>
                      <div className="border border-[var(--border-color)] rounded-lg p-4 max-h-96 overflow-y-auto space-y-4 bg-[var(--bg-secondary)] mb-4">
                        {chatMessages.length > 0 ? (
                          chatMessages.map((msg) => (
                            <div key={msg.id} className="flex items-start gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={msg.avatar} />
                                <AvatarFallback className="text-xs">
                                  {msg.is_anonymous ? "?" : msg.user_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-[var(--text-primary)]">
                                    {msg.user_name}
                                  </span>
                                  <span className="text-xs text-[var(--text-muted)]">
                                    {format(new Date(msg.created_at), 'HH:mm')}
                                  </span>
                                </div>
                                <p className="text-[var(--text-secondary)]">{msg.message}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-[var(--text-muted)] py-4">
                            No messages yet. Start the conversation!
                          </p>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Message input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAnonymous(!isAnonymous)}
                          className={cn(isAnonymous && "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]")}
                        >
                          <User className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={sendChatMessage}
                          disabled={!newMessage.trim() || sendingMessage}
                          className="bg-[var(--accent-primary)]"
                        >
                          {sendingMessage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-2">
                        {isAnonymous ? "Your messages are anonymous" : "Your name will be visible to others"}
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                      <p className="text-[var(--text-secondary)]">Select a sub-event to start chatting</p>
                      <p className="text-sm text-[var(--text-muted)] mt-2">
                        Chat anonymously with other registered participants.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
