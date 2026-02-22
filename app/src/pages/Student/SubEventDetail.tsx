import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
import {
  MapPin,
  ArrowLeft,
  UserCheck,
  CheckCircle,
  Loader2,
  Trophy,
  Bell,
  MessageCircle,
  Send,
  Info,
  Phone,
  MessageSquare,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { toast } from 'sonner';

interface SubEvent {
  id: number;
  title: string;
  description: string;
  venue: string;
  start_time: string;
  end_time: string;
  status: string;
  banner?: string;
  banner_url?: string;
  team_lead_name?: string;
  team_lead_contact?: string;
  team_lead_phone?: string;
  user_registration?: string | null;
  can_register?: boolean;
  event_title?: string;
  event_id?: number;
}

export function SubEventDetail() {
  const { eventId, subEventId } = useParams<{ eventId: string; subEventId: string }>();
  const navigate = useNavigate();
  const { collapsed } = useSidebar();

  const [subEvent, setSubEvent] = useState<SubEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  // Additional data
  const [prizes, setPrizes] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dutyMessages, setDutyMessages] = useState<any[]>([]);
  const [newDutyMessage, setNewDutyMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Duty chat templates for students
  const dutyChatTemplates = [
    "Is there any change in the event timing?",
    "Has the venue been changed?",
    "Is the event postponed or cancelled?",
    "What should I bring for this event?",
    "Is there any dress code for this event?",
    "Are there any last-minute updates?",
    "Will the event happen as scheduled?",
    "Is parking available at the venue?",
    "Do I need to bring any ID proof?",
    "Are refreshments provided at the event?"
  ];

  useEffect(() => {
    fetchSubEvent();
  }, [eventId, subEventId]);

  const fetchSubEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sub_events/index.php?id=${subEventId}`);
      setSubEvent(response.data);

      // Check registration status
      if (response.data.id) {
        try {
          const regResponse = await api.get(`/sub_events/register.php?sub_event_id=${subEventId}`);
          const isRegistered = regResponse.data && regResponse.data.id;
          setSubEvent(prev => prev ? ({
            ...prev,
            user_registration: isRegistered ? 'registered' : null,
            can_register: !isRegistered
          }) : null);
        } catch (error) {
          // Assume not registered if API fails
          setSubEvent(prev => prev ? ({
            ...prev,
            user_registration: null,
            can_register: true
          }) : null);
        }
      }

      // Fetch additional data
      await Promise.allSettled([
        fetchPrizes(),
        fetchAnnouncements(),
        fetchDutyMessages()
      ]);
    } catch (error: any) {
      console.error('Error fetching sub-event:', error);
      if (error.response?.status === 404) {
        toast.error('Sub-event not found');
        navigate(`/student/events/${eventId}`);
      } else {
        toast.error('Failed to load sub-event details');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPrizes = async () => {
    try {
      const response = await api.get(`/prizes/index.php?event_id=${eventId}&sub_event_id=${subEventId}`);
      setPrizes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch prizes:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get(`/announcements/index.php?event_id=${eventId}&sub_event_id=${subEventId}`);
      setAnnouncements(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  const fetchDutyMessages = async () => {
    try {
      const response = await api.get(`/chat/index.php?event_id=${eventId}&sub_event_id=${subEventId}`);
      setDutyMessages(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch duty messages:', error);
    }
  };

  const sendDutyMessage = async () => {
    const message = selectedTemplate || newDutyMessage.trim();
    if (!message) {
      toast.error('Please select a template or enter a message');
      return;
    }

    try {
      setSendingMessage(true);
      await api.post('/chat/index.php', {
        event_id: eventId,
        sub_event_id: subEventId,
        content: message,
        is_anonymous: true
      });

      toast.success('Message sent to event organizers');
      setNewDutyMessage('');
      setSelectedTemplate('');
      fetchDutyMessages(); // Refresh messages
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRegister = async () => {
    if (!subEvent) return;

    try {
      setRegistering(true);
      const response = await api.post('/sub_events/register.php', {
        sub_event_id: subEvent.id
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchSubEvent(); // Refresh to update registration status
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Failed to register for sub-event');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!subEvent) return;

    try {
      setRegistering(true);
      const response = await api.delete(`/sub_events/register.php?sub_event_id=${subEvent.id}`);

      if (response.data.success) {
        toast.success(response.data.message);
        fetchSubEvent(); // Refresh to update registration status
      }
    } catch (error: any) {
      console.error('Cancel registration error:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel registration');
    } finally {
      setRegistering(false);
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
              <div className="animate-pulse">
                <div className="h-8 w-64 bg-[var(--bg-secondary)] rounded mb-4" />
                <div className="h-96 bg-[var(--bg-secondary)] rounded" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!subEvent) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)]">
        <Sidebar />
        <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Sub-event not found</h2>
              <Button onClick={() => navigate(`/student/events/${eventId}`)}>
                Back to Event
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

        {/* Exact Admin Panel Style Banner */}
        {subEvent.banner_url || subEvent.banner ? (
          <div className="relative h-64 md:h-80 w-full overflow-hidden">
            <img
              src={subEvent.banner_url || subEvent.banner}
              className="w-full h-full object-cover"
              alt={subEvent.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        ) : null}

        <main className="p-6 relative -mt-20">
          {/* Content overlaps banner when scrolled */}
          {(subEvent.banner_url || subEvent.banner) && (
            <div className="h-20"></div>
          )}

          {/* Back Button */}
          <Button
            variant="ghost"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-0 mb-4 h-auto"
            onClick={() => navigate(`/student/events/${eventId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Event
          </Button>
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10">
                    Student View
                  </Badge>
                  <StatusBadge status={subEvent.status as any} size="sm" />
                  {subEvent.user_registration === 'registered' && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Registered
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">{subEvent.title}</h1>
                <p className="mt-1 flex items-center gap-2 text-[var(--text-secondary)]">
                  <span className="font-medium">{subEvent.event_title || 'Main Event'}</span>
                  •
                  <span>{format(new Date(subEvent.start_time), 'EEEE, MMM d, yyyy')}</span>
                  •
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {subEvent.venue}
                  </span>
                </p>
              </div>

              {/* Registration Buttons */}
              <div className="flex gap-2">
                {subEvent.can_register && (
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
                        Register for Sub-Event
                      </>
                    )}
                  </Button>
                )}

                {subEvent.user_registration === 'registered' && (
                  <Button
                    variant="outline"
                    onClick={handleCancelRegistration}
                    disabled={registering}
                    className="border-red-500 text-red-600 hover:bg-red-50"
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
                )}
              </div>
            </div>
          </div>

          {/* Tabs for different sections */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="prizes">Prizes</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="duty-chat">Duty Chat</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Team Lead Contact Card */}
              {(subEvent.team_lead_name || subEvent.team_lead_phone || subEvent.team_lead_contact) && (
                <Card className="bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5 border-[var(--accent-primary)]/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[var(--text-primary)] flex items-center gap-2 text-lg">
                      <User className="w-5 h-5 text-[var(--accent-primary)]" />
                      Team Lead Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="text-[var(--text-primary)] font-semibold text-lg">
                          {subEvent.team_lead_name || 'Team Lead'}
                        </p>
                        {(subEvent.team_lead_phone || subEvent.team_lead_contact) && (
                          <p className="text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                            <Phone className="w-4 h-4" />
                            {subEvent.team_lead_phone || subEvent.team_lead_contact}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        {(subEvent.team_lead_phone || subEvent.team_lead_contact) && (
                          <>
                            <a
                              href={`https://wa.me/${(subEvent.team_lead_phone || subEvent.team_lead_contact || '').replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                              WhatsApp
                            </a>
                            <a
                              href={`tel:${subEvent.team_lead_phone || subEvent.team_lead_contact}`}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white font-medium transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                              Call
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* About Card */}
              <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                <CardHeader>
                  <CardTitle className="text-[var(--text-primary)]">About this Sub-Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{subEvent.description}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prizes Tab */}
            <TabsContent value="prizes" className="mt-6">
              <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                <CardHeader>
                  <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Prizes & Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {prizes.length > 0 ? (
                    <div className="space-y-4">
                      {prizes.map((prize) => (
                        <div key={prize.id} className="p-4 border border-[var(--border-color)] rounded-lg">
                          <h4 className="font-semibold text-[var(--text-primary)]">{prize.title}</h4>
                          <p className="text-[var(--text-secondary)] text-sm">{prize.description}</p>
                          {prize.value && (
                            <p className="text-[var(--accent-primary)] font-medium">Value: ${prize.value}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                      <p className="text-[var(--text-muted)]">No prizes announced yet for this sub-event.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Announcements Tab */}
            <TabsContent value="announcements" className="mt-6">
              <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                <CardHeader>
                  <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {announcements.length > 0 ? (
                    <div className="space-y-4">
                      {announcements.map((announcement) => (
                        <div key={announcement.id} className="p-4 border border-[var(--border-color)] rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-[var(--text-primary)]">{announcement.title}</h4>
                            <span className="text-xs text-[var(--text-muted)]">
                              {format(new Date(announcement.created_at), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          <p className="text-[var(--text-secondary)] text-sm">{announcement.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Bell className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                      <p className="text-[var(--text-muted)]">No announcements yet for this sub-event.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Duty Chat Tab */}
            <TabsContent value="duty-chat" className="mt-6">
              <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                <CardHeader>
                  <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Duty Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Send important questions to event organizers. Messages are anonymous and limited to essential queries only.
                    </AlertDescription>
                  </Alert>

                  {/* Chat Messages */}
                  <div className="mb-6 max-h-64 overflow-y-auto space-y-3">
                    {dutyMessages.length > 0 ? (
                      dutyMessages.map((message) => (
                        <div key={message.id} className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {message.is_anonymous && (!message.sender_role || message.sender_role === 'student') ? 'Anonymous Student' :
                                message.sender_role === 'admin' ? (message.sender_name && message.sender_name.includes('(System Admin)') ? message.sender_name : `${message.sender_name || 'Admin'} (System Admin)`) :
                                  message.sender_role === 'creator' ? (message.sender_name && message.sender_name.includes('(Creator)') ? message.sender_name : `${message.sender_name || 'Creator'} (Creator)`) :
                                    message.sender_role === 'teamlead' ? (message.sender_name && message.sender_name.includes('(Team Lead)') ? message.sender_name : `${message.sender_name || 'Team Lead'} (Team Lead)`) :
                                      message.sender_name ? message.sender_name :
                                        message.is_anonymous ? 'Anonymous Student' : 'Unknown User'}
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">
                              {format(new Date(message.created_at), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">{message.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <MessageCircle className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                        <p className="text-[var(--text-muted)] text-sm">No messages yet. Be the first to ask a question!</p>
                      </div>
                    )}
                  </div>

                  {/* Message Templates Only - No Custom Input for Students */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
                      Select a question to send:
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                      {dutyChatTemplates.map((template, index) => (
                        <Button
                          key={index}
                          variant={selectedTemplate === template ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTemplate(template)}
                          className="text-left h-auto p-3 whitespace-normal"
                        >
                          {template}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={sendDutyMessage}
                    disabled={sendingMessage || !selectedTemplate}
                    className="w-full"
                  >
                    {sendingMessage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Selected Question
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

export default SubEventDetail;
