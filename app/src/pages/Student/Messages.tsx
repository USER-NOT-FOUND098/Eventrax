import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import {
  MessageCircle,
  Calendar,
  Users,
  Clock,
  MapPin,
  Search,
  ArrowLeft,
  Megaphone,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  event_id: string;
  sub_event_id?: string;
  sender_name: string;
  sender_role: string;
  content: string;
  is_announcement: boolean;
  created_at: string;
  title?: string; // For announcements
  created_by_name?: string; // For announcements
  priority?: 'low' | 'medium' | 'high'; // For announcements
  is_read?: number; // For announcements (0 = unread, 1 = read)
}

interface Event {
  id: string;
  event_id: string;
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

interface SubEvent {
  id: string;
  sub_event_id: string; // Actual sub-event ID
  title: string;
  start_time: string;
  end_time: string;
  venue: string;
  event_id: string;
  student_id?: string;
  status?: string;
  registered_at?: string;
  description?: string;
}

export default function StudentMessages() {
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
  const [selectedSubEvent, setSelectedSubEvent] = useState<SubEvent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mainEventAnnouncements, setMainEventAnnouncements] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Chat templates for students
  const chatTemplates = [
    {
      id: 'time_update',
      category: 'Time Update',
      icon: <Clock className="w-4 h-4" />,
      message: "Any last minute time update?",
      color: 'text-orange-500'
    },
    {
      id: 'dress_code',
      category: 'Dress Code',
      icon: <Users className="w-4 h-4" />,
      message: "Dress code for the event?",
      color: 'text-purple-500'
    },
    {
      id: 'event_status',
      category: 'Event Status',
      icon: <AlertTriangle className="w-4 h-4" />,
      message: "Event postponed or cancelled?",
      color: 'text-red-500'
    },
    {
      id: 'id_proof',
      category: 'ID Proof',
      icon: <CheckCircle className="w-4 h-4" />,
      message: "ID proof compulsory?",
      color: 'text-blue-500'
    },
    {
      id: 'venue_change',
      category: 'Venue',
      icon: <MapPin className="w-4 h-4" />,
      message: "Has venue been changed?",
      color: 'text-green-500'
    },
    {
      id: 'arrival_time',
      category: 'Arrival',
      icon: <Clock className="w-4 h-4" />,
      message: "What time should I arrive?",
      color: 'text-cyan-500'
    },
    {
      id: 'parking',
      category: 'Parking',
      icon: <MapPin className="w-4 h-4" />,
      message: "Parking available at venue?",
      color: 'text-yellow-500'
    },
    {
      id: 'materials',
      category: 'Materials',
      icon: <HelpCircle className="w-4 h-4" />,
      message: "Any materials to bring?",
      color: 'text-pink-500'
    }
  ];

  useEffect(() => {
    fetchRegisteredEvents();
    
    // Add a timeout fallback to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchSubEvents();
      fetchAnnouncements();
      if (selectedSubEvent) {
        fetchMessages();
      }
    }
  }, [selectedEvent, selectedSubEvent]);

  // Debug effect to track state changes
  useEffect(() => {
    console.log('STATE DEBUG - selectedSubEvent:', selectedSubEvent);
    console.log('STATE DEBUG - mainEventAnnouncements length:', mainEventAnnouncements.length);
    console.log('STATE DEBUG - messages length:', messages.length);
  }, [selectedSubEvent, mainEventAnnouncements, messages]);

  const fetchRegisteredEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/registrations/student.php');
      setEvents(response.data || []);
      console.log('All events from API:', response.data);
      if (response.data && response.data.length > 0) {
        setSelectedEvent(response.data[0]);
        console.log('Selected first event:', response.data[0]);
      } else {
        // No events found, set loading to false
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      // Set empty state on error
      setEvents([]);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubEvents = async () => {
    if (!selectedEvent) return;
    
    try {
      const response = await api.get(`/sub_events/my.php?event_id=${selectedEvent.id}`);
      setSubEvents(response.data || []);
      // Don't reset selectedSubEvent here - let user choose
    } catch (error) {
      console.error('Error fetching sub-events:', error);
      setSubEvents([]);
    }
  };

  const fetchAnnouncements = async () => {
    if (!selectedEvent) return;

    try {
      const params = new URLSearchParams();
      params.append('event_id', (selectedEvent as any).event_id || selectedEvent.id); // Use event_id, not id
      
      // For main event, only get announcements where sub_event_id is NULL
      if (selectedSubEvent) {
        params.append('sub_event_id', (selectedSubEvent as any).sub_event_id); // Use sub_event_id, not id
      } else {
        // For main event, explicitly exclude sub-event announcements
        params.append('main_event_only', 'true');
      }

      console.log('Fetching announcements with params:', params.toString());
      console.log('DEBUG - selectedEvent:', selectedEvent);
      console.log('DEBUG - selectedEvent.id:', selectedEvent?.id);
      const response = await api.get(`/announcements/index.php?${params}`);
      console.log('Announcements API response:', response.data);
      
      const announcements = response.data || [];
      console.log('Raw announcements array:', announcements);
      
      if (selectedSubEvent) {
        // Set announcements for sub-event messages
        try {
          const formattedAnnouncements = announcements.map((ann: any) => ({
            id: ann.id.toString(),
            event_id: ann.event_id?.toString() || selectedEvent.id,
            sub_event_id: ann.sub_event_id?.toString(),
            sender_name: ann.created_by_name || 'System',
            sender_role: 'admin',
            content: ann.content,
            is_announcement: true,
            created_at: ann.created_at,
            title: ann.title,
            created_by_name: ann.created_by_name,
            priority: ann.priority || 'medium',
            is_read: ann.is_read || 0
          }));
          
          console.log('Formatted sub-event announcements:', formattedAnnouncements);
          console.log('Setting messages state with announcements only');
          setMessages(formattedAnnouncements);
        } catch (mapError) {
          console.error('Error mapping sub-event announcements:', mapError);
          setMessages([]);
        }
      } else {
        // Set main event announcements
        try {
          const formattedAnnouncements = announcements.map((ann: any) => ({
            id: ann.id.toString(),
            event_id: ann.event_id?.toString() || (selectedEvent as any).event_id,
            sub_event_id: ann.sub_event_id?.toString(),
            sender_name: ann.created_by_name || 'System',
            sender_role: 'admin',
            content: ann.content,
            is_announcement: true,
            created_at: ann.created_at,
            title: ann.title,
            created_by_name: ann.created_by_name,
            priority: ann.priority || 'medium',
            is_read: ann.is_read || 0
          }));
          
          console.log('Formatted main event announcements:', formattedAnnouncements);
          console.log('Setting mainEventAnnouncements state');
          setMainEventAnnouncements(formattedAnnouncements);
        } catch (mapError) {
          console.error('Error mapping main event announcements:', mapError);
          setMainEventAnnouncements([]);
        }
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      if (selectedSubEvent) {
        setMessages([]);
      } else {
        setMainEventAnnouncements([]);
      }
    }
  };

  const fetchMessages = async () => {
    if (!selectedEvent || !selectedSubEvent) {
      // Only fetch chat messages for sub-events
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('sub_event_id', (selectedSubEvent as any).sub_event_id); // Use sub_event_id, not id

      console.log('Fetching chat messages with params:', params.toString());
      const response = await api.get(`/chat/sub_event.php?${params}`);
      console.log('Chat messages API response:', response.data);
      
      const chatMessages = response.data || [];
      
      // Combine chat messages with announcements
      const formattedChatMessages = chatMessages.map((msg: any) => ({
        id: msg.id.toString(),
        event_id: msg.event_id?.toString() || selectedEvent.id,
        sub_event_id: msg.sub_event_id?.toString() || selectedSubEvent.id,
        sender_name: msg.sender_name,
        sender_role: msg.sender_role || 'student',
        content: msg.content, // Use content field from database
        is_announcement: false,
        created_at: msg.created_at
      }));
      
      console.log('Formatted chat messages:', formattedChatMessages);
      
      setMessages(prev => {
        console.log('Previous messages (announcements):', prev);
        const combined = [
          ...prev.filter(msg => msg.is_announcement), // Keep announcements
          ...formattedChatMessages
        ];
        console.log('Combined messages:', combined);
        console.log('Final messages state being set:', combined);
        return combined;
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter(message => {
    if (activeTab === 'all') return true;
    if (activeTab === 'announcements') return message.is_announcement;
    if (activeTab === 'team') return !message.is_announcement;
    return true;
  });

  const handleTemplateSelect = (template: typeof chatTemplates[0]) => {
    setNewMessage(template.message);
    setSelectedTemplate(template.id);
  };

  const sendTemplateMessage = async () => {
    if (!newMessage.trim() || !selectedSubEvent) return;
    
    try {
      const response = await api.post('/chat/sub_event.php', {
        sub_event_id: (selectedSubEvent as any).sub_event_id,
        message: newMessage.trim(),
        is_anonymous: false
      });

      if (response.data.success) {
        const newMsg: Message = {
          id: response.data.message_id || Date.now().toString(),
          event_id: selectedEvent?.id || '',
          sub_event_id: (selectedSubEvent as any).sub_event_id,
          sender_name: 'You',
          sender_role: 'student',
          content: newMessage.trim(),
          is_announcement: false,
          created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        setSelectedTemplate(null);
      }
    } catch (error: any) {
      console.error('Send template message error:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="lg:col-span-2">
                  <div className="h-96 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        h1.team-messages-header, h1.text-3xl {
          color: #ffffff !important;
        }
        p.team-messages-desc {
          color: #d1d5db !important;
        }
        html:not(.dark) h1.team-messages-header, html:not(.dark) h1.text-3xl {
          color: #111827 !important;
        }
        html:not(.dark) p.team-messages-desc {
          color: #4b5563 !important;
        }
        div h1 {
          color: #ffffff !important;
        }
        html:not(.dark) div h1 {
          color: #111827 !important;
        }
      `}</style>
      <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
        <Header />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 
                    className="text-3xl font-bold"
                    style={{ 
                      color: '#ffffff'
                    }}
                  >
                    Team Messages
                  </h1>
                  <p 
                    style={{ 
                      color: '#d1d5db'
                    }}
                  >
                    Stay updated with announcements and team communications
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Events List */}
              <div className="lg:col-span-1">
                <Card className="bg-[var(--bg-sidebar)] border-[var(--border-color)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:!text-white">
                      <Calendar className="h-5 w-5 text-gray-600 dark:!text-gray-300" />
                      Your Registered Events
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:!text-gray-300">
                      Select an event to view messages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <Input
                          placeholder="Search events..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Events List */}
                      <ScrollArea className="h-96">
                        <div className="space-y-2">
                          {filteredEvents.length === 0 ? (
                            <div className="text-center py-8">
                              <Megaphone className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                                No Registered Events
                              </h3>
                              <p className="text-sm text-[var(--text-secondary)]">
                                You haven't registered for any events yet. Register for events to see team messages and announcements.
                              </p>
                            </div>
                          ) : (
                            filteredEvents.map((event) => (
                              <div
                                key={event.id}
                                className={cn(
                                  "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                                  selectedEvent?.id === event.id
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                )}
                                onClick={() => setSelectedEvent(event)}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">
                                    {event.title}
                                  </h3>
                                  <Badge className={cn("text-xs", getStatusColor(event.status))}>
                                    {event.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                  {event.description}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <MapPin className="h-3 w-3" />
                                  {event.venue}
                                  <Clock className="h-3 w-3 ml-2" />
                                  {formatTime(event.start_date)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Messages Area */}
              <div className="lg:col-span-2">
                {selectedEvent ? (
                  <Card className="h-full bg-[var(--bg-sidebar)] border-[var(--border-color)]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            {selectedEvent.title}
                          </CardTitle>
                          <CardDescription>
                            Team communications and announcements
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/student/events/${selectedEvent?.event_id}`)}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Event Details
                        </Button>
                      </div>

                      {/* Sub-events Tabs */}
                      {subEvents.length > 0 && (
                        <div className="mt-4">
                          <Tabs value={selectedSubEvent?.id || 'main'} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger 
                                value="main" 
                                onClick={() => setSelectedSubEvent(null)}
                                className="text-xs"
                              >
                                Main Event
                              </TabsTrigger>
                              {subEvents.slice(0, 2).map((subEvent) => (
                                <TabsTrigger
                                  key={subEvent.id}
                                  value={subEvent.id.toString()}
                                  onClick={() => setSelectedSubEvent(subEvent)}
                                  className="text-xs"
                                >
                                  {subEvent.title}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                          </Tabs>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent>
                      {!selectedSubEvent ? (
                        /* Main Event - Only Announcements */
                        <div>
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                              Main Event Announcements
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                              Official announcements for {selectedEvent?.title}
                            </p>
                          </div>
                          
                          <ScrollArea className="h-96">
                            <div className="space-y-4">
                              {mainEventAnnouncements.length === 0 ? (
                                <div className="text-center py-8">
                                  <Megaphone className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
                                  <p className="text-[var(--text-secondary)]">
                                    No announcements yet
                                  </p>
                                  <p className="text-sm text-[var(--text-secondary)]">
                                    Main event announcements will appear here
                                  </p>
                                </div>
                              ) : (
                                mainEventAnnouncements.map((announcement) => (
                                  <div
                                    key={announcement.id}
                                    className="p-4 rounded-lg border border-blue-200 dark:border-gray-700"
                                    style={{
                                      backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#eff6ff',
                                      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827'
                                    }}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium" style={{ color: 'inherit' }}>
                                          {announcement.title}
                                        </h4>
                                        {announcement.priority === 'high' && (
                                          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">High Priority</Badge>
                                        )}
                                        {!announcement.is_read && (
                                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">New</Badge>
                                        )}
                                      </div>
                                      <span className="text-xs text-gray-500 dark:text-white">
                                        {formatTime(announcement.created_at)}
                                      </span>
                                    </div>
                                    <p style={{ color: 'inherit' }} className="mb-2">
                                      {announcement.content}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-white">
                                      By {announcement.sender_name}
                                    </p>
                                  </div>
                                ))
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      ) : (
                        /* Sub-Event - Duty Chat + Announcements */
                        <div>
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {selectedSubEvent.title} - Team Communications
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                              Duty chat and announcements for {selectedSubEvent.title}
                            </p>
                          </div>

                          {/* Message Type Tabs */}
                          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                            <TabsList>
                              <TabsTrigger value="all" className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                All Messages
                              </TabsTrigger>
                              <TabsTrigger value="announcements" className="flex items-center gap-2">
                                <Megaphone className="h-4 w-4" />
                                Announcements
                              </TabsTrigger>
                              <TabsTrigger value="team" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Duty Chat
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>

                          {/* Messages */}
                          <ScrollArea className="h-96">
                            <div className="space-y-4">
                              {filteredMessages.length === 0 ? (
                                <div className="text-center py-8">
                                  <MessageCircle className="h-12 w-12 text-[var(--text-secondary)] mx-auto mb-4" />
                                  <p className="text-[var(--text-secondary)]">
                                    No messages yet
                                  </p>
                                  <p className="text-sm text-[var(--text-secondary)]">
                                    Team announcements and duty chat will appear here
                                  </p>
                                </div>
                              ) : (
                                filteredMessages.map((message) => (
                                  <div
                                    key={message.id}
                                    className={cn(
                                      "flex gap-3 p-4 rounded-lg border",
                                      message.is_announcement
                                        ? "border-blue-200 dark:border-gray-700"
                                        : "border-gray-200 dark:border-gray-700"
                                    )}
                                    style={{
                                      backgroundColor: document.documentElement.classList.contains('dark') 
                                        ? (message.is_announcement ? '#1e3a8a' : '#374151')
                                        : (message.is_announcement ? '#eff6ff' : '#f9fafb'),
                                      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827'
                                    }}
                                  >
                                    <div className="flex-shrink-0">
                                      {message.is_announcement ? (
                                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                                          <Megaphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                      ) : (
                                        <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                          <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-sm">
                                            {message.sender_name}
                                          </span>
                                          {message.is_announcement && (
                                            <Badge variant="secondary" className="text-xs">
                                              <Megaphone className="h-3 w-3 mr-1" />
                                              Announcement
                                            </Badge>
                                          )}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-white">
                                          {formatTime(message.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-sm whitespace-pre-wrap" style={{ color: 'inherit' }}>
                                        {message.content}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </ScrollArea>

                          {/* Chat Input - Only show on Duty Chat tab */}
                          {activeTab === 'team' && (
                            <div className="border-t p-4 space-y-3">
                              {/* Message Templates */}
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-2">
                                  <MessageSquare className="w-3 h-3" />
                                  Quick Templates
                                </p>
                                <ScrollArea className="w-full">
                                  <div className="flex gap-2 pb-2">
                                    {chatTemplates.map((template) => (
                                      <Button
                                        key={template.id}
                                        variant={selectedTemplate === template.id ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleTemplateSelect(template)}
                                        className={`h-auto p-3 flex flex-col items-center gap-1 min-w-fit whitespace-nowrap ${
                                          selectedTemplate === template.id 
                                            ? 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90' 
                                            : 'border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                                        }`}
                                      >
                                        <span className={selectedTemplate === template.id ? 'text-white' : template.color}>{template.icon}</span>
                                        <span className="text-xs font-medium">{template.category}</span>
                                      </Button>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                              
                              {/* Message Preview and Send */}
                              {newMessage && (
                                <div className="space-y-2">
                                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
                                    <p className="text-sm text-[var(--text-primary)]">{newMessage}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={() => {
                                        setNewMessage('');
                                        setSelectedTemplate(null);
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={sendTemplateMessage}
                                      size="sm"
                                      className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90"
                                    >
                                      Send Message
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center bg-[var(--bg-sidebar)] border-[var(--border-color)]">
                    <CardContent className="text-center py-12">
                      <MessageCircle className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Select an Event
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Choose a registered event to view team messages and announcements
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
