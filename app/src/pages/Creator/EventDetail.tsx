import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExpenseSummary } from '@/components/ui-custom/ExpenseSummary';
import { DataTable } from '@/components/ui-custom/DataTable';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  Edit,
  Plus,
  UserCheck,
  Send,
  Loader2,
  Award,
  Trash2,
  CheckCircle2,
  Trash
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Event {
  id: number;
  title: string;
  description: string;
  poster?: string;
  banner?: string;
  venue: string;
  start_date: string;
  end_date: string;
  status: string;
  budget: number;
  total_expenses: number;
  sub_event_count: number;
  volunteer_count: number;
  attendee_count: number;
  prize_count: number;
  announcement_count: number;
  creator_id: number;
  assigned_creator_id?: number | null;
  creator_name: string;
}

interface SubEvent {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  venue: string;
  team_lead_name?: string;
  team_lead_contact?: string;
  unique_code?: string;
  section?: string;
  status: string;
  banner_url?: string;
}

interface Expense {
  id: number;
  title: string;
  description?: string;
  amount: number;
  quantity: number;
  category: string;
  sub_event_title?: string;
  created_at: string;
}

interface Prize {
  id: number;
  position: number;
  title: string;
  description?: string;
  value: number;
  winner_name?: string;
  winner_section?: string;
  winner_usn?: string;
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
  sender_name: string;
  sender_role: string;
  content: string;
  is_announcement: boolean;
  created_at: string;
}

interface Application {
  id: number;
  event_id: number;
  creator_id: number;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  creator_name: string;
  creator_email: string;
  creator_avatar?: string;
  applied_at: string;
}

const BANNER_TEMPLATES = [
  { id: 'template1', url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80', label: 'Festival' },
  { id: 'template2', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', label: 'Conference' },
  { id: 'template3', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80', label: 'Tech Event' }
];

export function CreatorEventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { collapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [event, setEvent] = useState<Event | null>(null);
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);


  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialog states
  const [isSubEventDialogOpen, setIsSubEventDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isPrizeDialogOpen, setIsPrizeDialogOpen] = useState(false);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isAssignWinnerOpen, setIsAssignWinnerOpen] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);

  // Chat state
  const [newMessage, setNewMessage] = useState('');

  // Form states with expanded fields
  const [subEventForm, setSubEventForm] = useState({
    title: '',
    description: '',
    venue: '',
    start_time: '',
    end_time: '',
    team_lead_contact: '',
    section: '',
    banner_url: ''
  });
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    description: '',
    amount: '',
    quantity: '1',
    category: 'Other',
    sub_event_id: ''
  });
  const [prizeForm, setPrizeForm] = useState({ position: '1', title: '', description: '', value: '' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', priority: 'medium' });
  const [winnerForm, setWinnerForm] = useState({ name: '', section: '', usn: '' });

  // Fetch event data
  const fetchEventData = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoading(true);

      // Fetch event details first (critical)
      try {
        const eventRes = await api.get(`/events/detail.php?id=${eventId}`);
        if (eventRes.data) {
          setEvent(eventRes.data);
        } else {
          throw new Error('Event not found');
        }
      } catch (error) {
        console.error('Critical: Failed to fetch event details', error);
        toast.error('Failed to load event details');
        setEvent(null);
        setLoading(false);
        return; // Stop if event itself is missing
      }

      // Fetch auxiliary data (non-critical)
      const fetchAuxiliary = async () => {
        const endpoints = [
          { key: 'subEvents', promise: api.get(`/sub_events/?event_id=${eventId}`) },
          { key: 'expenses', promise: api.get(`/expenses/?event_id=${eventId}`) },
          { key: 'prizes', promise: api.get(`/prizes/?event_id=${eventId}`) },
          { key: 'announcements', promise: api.get(`/announcements/?event_id=${eventId}`) },
          { key: 'chat', promise: api.get(`/chat/?event_id=${eventId}`) },
          {
            key: 'applications',
            promise: user?.role === 'admin'
              ? api.get(`/events/applications.php?event_id=${eventId}`)
              : Promise.resolve({ data: [] })
          }
        ];

        const results = await Promise.allSettled(endpoints.map(e => e.promise));

        results.forEach((result, index) => {
          const key = endpoints[index].key;
          if (result.status === 'fulfilled') {
            const data = result.value.data;
            switch (key) {
              case 'subEvents': setSubEvents(Array.isArray(data) ? data : []); break;
              case 'expenses': setExpenses(Array.isArray(data) ? data : []); break;
              case 'prizes': setPrizes(Array.isArray(data) ? data.filter((p: any) => !p.sub_event_id) : []); break;
              case 'announcements': setAnnouncements(Array.isArray(data) ? data : []); break;
              case 'chat': setChatMessages(Array.isArray(data) ? data : []); break;
              case 'applications': setApplications(Array.isArray(data) ? data : []); break;
            }
          } else {
            console.warn(`Failed to fetch ${key}:`, result.reason);
            // Don't show toast for every minor failure to avoid spamming user
          }
        });
      };

      await fetchAuxiliary();
    } catch (error: any) {
      console.error('Unexpected error fetching event data:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  // Poll chat messages every 5 seconds
  useEffect(() => {
    if (activeTab !== 'chat' || !eventId) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/chat/?event_id=${eventId}`);
        setChatMessages(res.data || []);
      } catch (error) {
        console.error('Failed to fetch chat messages:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab, eventId]);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statusColors: Record<string, string> = {
    upcoming: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    ongoing: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    cancelled: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  // Create Sub-Event with expanded fields
  const handleCreateSubEvent = async () => {
    if (!subEventForm.title || !subEventForm.venue) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/sub_events/', {
        event_id: eventId,
        title: subEventForm.title,
        description: subEventForm.description,
        venue: subEventForm.venue,
        start_time: subEventForm.start_time || new Date().toISOString(),
        end_time: subEventForm.end_time || new Date().toISOString(),
        team_lead_contact: subEventForm.team_lead_contact,
        section: subEventForm.section,
        expected_time: 60,
      });
      toast.success('Sub-event created successfully');
      setIsSubEventDialogOpen(false);
      setSubEventForm({ title: '', description: '', venue: '', start_time: '', end_time: '', team_lead_contact: '', section: '', banner_url: '' });
      fetchEventData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create sub-event');
    } finally {
      setSubmitting(false);
    }
  };

  // Create Expense with expanded fields
  const handleCreateExpense = async () => {
    if (!expenseForm.title || !expenseForm.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/expenses/', {
        event_id: eventId,
        title: expenseForm.title,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        quantity: parseInt(expenseForm.quantity) || 1,
        category: expenseForm.category,
        sub_event_id: expenseForm.sub_event_id || null,
      });
      toast.success('Expense added successfully');
      setIsExpenseDialogOpen(false);
      setExpenseForm({ title: '', description: '', amount: '', quantity: '1', category: 'Other', sub_event_id: '' });
      fetchEventData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  // Create Prize
  const handleCreatePrize = async () => {
    if (!prizeForm.title) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/prizes/', {
        event_id: eventId,
        position: parseInt(prizeForm.position),
        title: prizeForm.title,
        description: prizeForm.description,
        value: parseFloat(prizeForm.value) || 0,
      });
      toast.success('Prize added successfully');
      setIsPrizeDialogOpen(false);
      setPrizeForm({ position: '1', title: '', description: '', value: '' });
      fetchEventData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add prize');
    } finally {
      setSubmitting(false);
    }
  };

  // Assign Winner to Prize
  const handleAssignWinner = async () => {
    if (!selectedPrize || !winnerForm.name) {
      toast.error('Please enter winner name');
      return;
    }

    setSubmitting(true);
    try {
      await api.put('/prizes/', {
        id: selectedPrize.id,
        position: selectedPrize.position,
        title: selectedPrize.title,
        description: selectedPrize.description,
        value: selectedPrize.value,
        winner_name: winnerForm.name,
        winner_section: winnerForm.section,
        winner_usn: winnerForm.usn,
      });
      toast.success('Winner assigned successfully');
      setIsAssignWinnerOpen(false);
      setSelectedPrize(null);
      setWinnerForm({ name: '', section: '', usn: '' });
      fetchEventData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to assign winner');
    } finally {
      setSubmitting(false);
    }
  };

  // Create Announcement
  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/announcements/', {
        event_id: eventId,
        title: announcementForm.title,
        content: announcementForm.content,
        priority: announcementForm.priority,
      });
      toast.success('Announcement published successfully');
      setIsAnnouncementDialogOpen(false);
      setAnnouncementForm({ title: '', content: '', priority: 'medium' });
      fetchEventData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  // Send Chat Message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await api.post('/chat/', {
        event_id: eventId,
        content: newMessage.trim(),
      });
      setNewMessage('');
      const res = await api.get(`/chat/?event_id=${eventId}`);
      setChatMessages(res.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    }
  };

  const handleApplicationAction = async (applicationId: number, status: 'approved' | 'rejected') => {
    try {
      await api.post('/events/approve-application.php', {
        application_id: applicationId,
        status
      });
      toast.success(`Application ${status} successfully`);
      fetchEventData(); // Refresh to update assigned creator
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update application');
    }
  };

  const canSendMessage = user?.role === 'admin' || user?.role === 'creator' || user?.role === 'teamlead';

  const expenseColumns = [
    {
      key: 'title', header: 'Item', cell: (e: Expense) => (
        <div>
          <span className="text-white font-medium">{e.title}</span>
          {e.description && <p className="text-xs text-gray-500">{e.description}</p>}
        </div>
      )
    },
    { key: 'quantity', header: 'Qty', cell: (e: Expense) => <span className="text-gray-400">{e.quantity || 1}</span> },
    { key: 'category', header: 'Category', cell: (e: Expense) => <span className="text-gray-400">{e.category}</span> },
    { key: 'sub_event', header: 'Sub-Event', cell: (e: Expense) => <span className="text-indigo-400">{e.sub_event_title || '-'}</span> },
    { key: 'amount', header: 'Amount', cell: (e: Expense) => <span className="text-emerald-400 font-medium">{formatCurrency(e.amount)}</span> },
    { key: 'created_at', header: 'Date', cell: (e: Expense) => <span className="text-gray-500">{format(new Date(e.created_at), 'MMM d')}</span> },
    {
      key: 'actions', header: '', cell: (e: Expense) => (
        (user?.role === 'admin' || user?.role === 'creator') && (
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => handleDeleteExpense(e.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )
      )
    },
  ];

  const prizeColumns = [
    { key: 'position', header: 'Position', cell: (p: Prize) => <span className="text-gray-300">#{p.position}</span> },
    { key: 'title', header: 'Title', cell: (p: Prize) => <span className="text-white font-medium">{p.title}</span> },
    { key: 'value', header: 'Value', cell: (p: Prize) => <span className="text-emerald-400 font-medium">{formatCurrency(p.value)}</span> },
    {
      key: 'winner', header: 'Winner', cell: (p: Prize) => (
        <div>
          {p.winner_name ? (
            <div>
              <span className="text-white">{p.winner_name}</span>
              {p.winner_section && <span className="text-xs text-gray-500 block">{p.winner_section}</span>}
              {p.winner_usn && <span className="text-xs text-indigo-400">{p.winner_usn}</span>}
            </div>
          ) : (
            <span className="text-gray-500">Not announced</span>
          )}
        </div>
      )
    },
    {
      key: 'actions', header: '', cell: (p: Prize) => (
        (user?.role === 'admin' || user?.role === 'creator') && (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => { setSelectedPrize(p); setIsAssignWinnerOpen(true); setWinnerForm({ name: p.winner_name || '', section: p.winner_section || '', usn: p.winner_usn || '' }); }}>
              <Award className="w-4 h-4 mr-1" />
              {p.winner_name ? 'Edit' : 'Assign'}
            </Button>
            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => handleDeletePrize(p.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )
      )
    },
  ];

  // Add handleDeleteEvent function
  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

    try {
      await api.post('/events/delete.php', { event_id: eventId });
      toast.success('Event deleted successfully');
      navigate('/creator/events');
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      toast.error(error.response?.data?.error || 'Failed to delete event');
    }
  };

  // Add handleDeleteSubEvent function
  const handleDeleteSubEvent = async (subEventId: number) => {
    if (!confirm('Are you sure you want to delete this sub-event?')) return;

    try {
      await api.post('/sub_events/delete.php', { sub_event_id: subEventId });
      toast.success('Sub-event deleted successfully');
      // Refresh data
      fetchEventData();
    } catch (error: any) {
      console.error('Failed to delete sub-event:', error);
      toast.error(error.response?.data?.error || 'Failed to delete sub-event');
    }
  };

  // Add handleDeleteExpense function
  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await api.post('/expenses/delete.php', { expense_id: expenseId });
      toast.success('Expense deleted successfully');
      fetchEventData();
    } catch (error: any) {
      console.error('Failed to delete expense:', error);
      toast.error(error.response?.data?.error || 'Failed to delete expense');
    }
  };

  // Add handleDeletePrize function
  const handleDeletePrize = async (prizeId: number) => {
    if (!confirm('Are you sure you want to delete this prize?')) return;

    try {
      await api.post('/prizes/delete.php', { prize_id: prizeId });
      toast.success('Prize deleted successfully');
      fetchEventData();
    } catch (error: any) {
      console.error('Failed to delete prize:', error);
      toast.error(error.response?.data?.error || 'Failed to delete prize');
    }
  };

  const handleMarkAnnouncementRead = async (id: number) => {
    try {
      await api.post('/announcements/mark-read.php', { announcement_id: id });
      // Update locally to avoid full fetch if possible, but fetch is safer
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_read: 1 } : a));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleViewAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    if (Number(announcement.is_read) === 0) {
      handleMarkAnnouncementRead(announcement.id);
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/index.php?id=${id}`);
      toast.success('Announcement deleted');
      fetchEventData();
    } catch (error) {
      toast.error('Failed to delete announcement');
    }
  };

  // Determine if user can delete event
  // Per user request: Only Admins or the Original Creator can delete main events.
  const canDeleteEvent = user?.role === 'admin' || (user?.role === 'creator' && String(user?.id) === String(event?.creator_id));

  const unreadAnnouncementsCount = announcements.filter(a => Number(a.is_read) === 0).length;
  const filteredAnnouncements = announcements.filter(a => Number(a.is_read) === 0 || a.priority === 'high');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070A]">
        <Sidebar />
        <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <Header />
          <main className="p-6 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </main>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#07070A]">
        <Sidebar />
        <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
          <Header />
          <main className="p-6">
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-white">Event not found</h1>
              <Button className="mt-4 bg-indigo-500 hover:bg-indigo-600" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070A]">
      <Sidebar />

      <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
        <Header />

        <main className="p-6">
          {/* Back Button */}
          <Button variant="ghost" className="mb-4 text-gray-400 hover:text-white" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>

          {/* Event Header - Light Mode Friendly */}
          <div className="rounded-2xl overflow-hidden mb-8 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-sm">
            <div className="h-48 md:h-64 relative bg-gray-100 dark:bg-white/5">
              <img
                src={event.banner || event.poster || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80'}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex gap-3 items-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        'px-3 py-1 font-medium',
                        statusColors[event.status] || statusColors.upcoming
                      )}
                    >
                      {event.status.toUpperCase()}
                    </Badge>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {event.title}
                  </h1>

                  <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      {formatDate(event.start_date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      {event.venue}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      {event.attendee_count} attendees
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 shrink-0">
                  {(user?.role === 'admin' || (user?.role === 'creator' && (String(event.creator_id) === String(user?.id) || (event.assigned_creator_id && String(event.assigned_creator_id) === String(user?.id))))) && (
                    <Button variant="outline" className="border-gray-300 dark:border-white/20 text-slate-700 dark:text-white bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10" onClick={() => navigate(user?.role === 'admin' ? `/admin/events/${event.id}/edit` : `/creator/events/${event.id}/edit`)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Details
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs - Boxes with Black Text on Active - High Contrast Force */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-3 justify-start w-full">
              {['Overview', 'SubEvents', 'Expenses', 'Prizes', 'Announcements', 'Chat'].map((tab) => (
                <TabsTrigger
                  key={tab.toLowerCase()}
                  value={tab.toLowerCase()}
                  className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-transparent dark:border-white/5 hover:bg-white hover:text-black dark:hover:bg-white/10 dark:hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  {tab}
                  {tab === 'Announcements' && unreadAnnouncementsCount > 0 && (
                    <span className="ml-2 bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {unreadAnnouncementsCount}
                    </span>
                  )}
                </TabsTrigger>
              ))}
              {user?.role === 'admin' && (
                <TabsTrigger
                  value="applications"
                  className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-transparent dark:border-white/5 hover:bg-white hover:text-black dark:hover:bg-white/10 dark:hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  Applications
                  {applications.filter(a => a.status === 'pending').length > 0 && (
                    <span className="ml-2 bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {applications.filter(a => a.status === 'pending').length}
                    </span>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview">
              {/* Content omitted for brevity, logic remains same */}
            </TabsContent>

            {/* Can't easily replace inner content without context, using Overview end */}

            {canDeleteEvent && (
              <div className="mt-12 pt-8 border-t border-[var(--border-color)]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-red-50 dark:bg-red-950/10 p-6 rounded-xl border border-red-100 dark:border-red-900/20">
                  <div>
                    <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h3>
                    <p className="text-sm text-red-600/80 dark:text-red-400/70">
                      Deleting this event will remove all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteEvent}
                  >
                    Delete Event
                  </Button>
                </div>
              </div>
            )}

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-[#0E0E12] rounded-2xl border border-gray-200 dark:border-white/5 p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <span className="bg-indigo-50 dark:bg-indigo-500/20 p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400"><Calendar className="w-5 h-5" /></span>
                      About This Event
                    </h3>
                    <p className="text-slate-600 dark:text-gray-300 leading-relaxed text-lg">{event.description}</p>
                  </div>

                  <div className="bg-white dark:bg-[#0E0E12] rounded-2xl border border-gray-200 dark:border-white/5 p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-5">Quick Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { count: event.sub_event_count, label: 'Sub-Events' },
                        { count: event.volunteer_count, label: 'Volunteers' },
                        { count: event.prize_count, label: 'Prizes' },
                        { count: event.announcement_count, label: 'Announcements' }
                      ].map((stat, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.count}</p>
                          <p className="text-sm font-medium text-slate-500 dark:text-gray-400">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <ExpenseSummary budget={event.budget} totalExpenses={event.total_expenses} />
                </div>
              </div>
            </TabsContent>

            {/* Sub-Events Tab */}
            <TabsContent value="subevents">
              <div className="bg-white dark:bg-[#0E0E12] rounded-2xl border border-gray-200 dark:border-white/5 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-50">Sub-Events</h3>
                    <p className="text-sm text-gray-500">Manage individual event segments</p>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'creator') && (
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md" onClick={() => setIsSubEventDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Sub-Event
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {subEvents.map((subEvent) => (
                    <div key={subEvent.id} className="group p-0 rounded-2xl bg-white dark:bg-[#0E0E12] border border-gray-100 dark:border-white/5 hover:border-indigo-500/50 transition-all shadow-sm overflow-hidden flex flex-col md:flex-row">
                      {/* Banner Section */}
                      <div className="w-full md:w-48 h-32 md:h-auto relative shrink-0 overflow-hidden">
                        <img
                          src={subEvent.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          alt={subEvent.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent md:bg-gradient-to-l" />
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-5">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-xl text-slate-900 dark:text-gray-50">{subEvent.title}</h4>
                              {subEvent.unique_code && (
                                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold tracking-wider uppercase">
                                  {subEvent.unique_code}
                                </span>
                              )}
                            </div>

                            {subEvent.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                                {subEvent.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-500" />
                                {subEvent.start_time && format(new Date(subEvent.start_time), 'h:mm a')}
                              </span>
                              <span className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-emerald-500" />
                                {subEvent.venue}
                              </span>
                              <span className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-sky-500" />
                                {subEvent.team_lead_name || 'No Lead'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <StatusBadge status={(subEvent.status || 'upcoming') as any} size="sm" />
                            <div className="h-8 w-px bg-gray-100 dark:bg-white/10 mx-1 hidden md:block" />
                            <Button
                              variant="ghost"
                              className="h-9 px-4 text-indigo-500 hover:bg-indigo-500/10 font-bold"
                              onClick={() => {
                                const rolePrefix = user?.role === 'admin' ? 'admin' : user?.role === 'student' ? 'student' : 'creator';
                                navigate(`/${rolePrefix}/sub-events/${subEvent.id}`);
                              }}
                            >
                              {user?.role === 'student' ? 'View Details' : 'Manage'}
                            </Button>
                            {(user?.role === 'admin' || user?.role === 'creator') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-rose-500 hover:bg-rose-500/10"
                                onClick={() => handleDeleteSubEvent(subEvent.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {subEvents.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                      <p className="text-gray-500">No sub-events yet</p>
                      <Button variant="ghost" className="mt-2 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/5" onClick={() => setIsSubEventDialogOpen(true)}>
                        Create your first sub-event
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses">
              <div className="bg-[#0E0E12] rounded-2xl border border-white/5 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Expenses</h3>
                    <p className="text-sm text-gray-500">Track all event expenses</p>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'creator') && (
                    <Button className="bg-indigo-500 hover:bg-indigo-600" onClick={() => setIsExpenseDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Expense
                    </Button>
                  )}
                </div>

                <DataTable data={expenses} columns={expenseColumns} keyExtractor={(e) => e.id.toString()} emptyMessage="No expenses recorded yet" />
              </div>
            </TabsContent>

            {/* Prizes Tab */}
            <TabsContent value="prizes">
              <div className="bg-[#0E0E12] rounded-2xl border border-white/5 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Prizes</h3>
                    <p className="text-sm text-gray-500">Manage competition prizes and assign winners</p>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'creator') && (
                    <Button className="bg-indigo-500 hover:bg-indigo-600" onClick={() => setIsPrizeDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Prize
                    </Button>
                  )}
                </div>

                <DataTable data={prizes} columns={prizeColumns} keyExtractor={(p) => p.id.toString()} emptyMessage="No prizes defined yet" />
              </div>
            </TabsContent>

            {/* Announcements Tab */}
            <TabsContent value="announcements">
              <div className="bg-[#0E0E12] rounded-2xl border border-white/5 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Announcements</h3>
                    <p className="text-sm text-gray-500">Important updates for participants</p>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'creator') && (
                    <Button className="bg-indigo-500 hover:bg-indigo-600" onClick={() => setIsAnnouncementDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Announcement
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {filteredAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group flex items-center justify-between" onClick={() => handleViewAnnouncement(announcement)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={cn("font-medium", Number(announcement.is_read) === 0 ? "text-white" : "text-gray-400")}>
                            {announcement.title}
                            {Number(announcement.is_read) === 0 && (
                              <span className="ml-2 w-2 h-2 bg-rose-500 rounded-full inline-block"></span>
                            )}
                          </h4>
                          <StatusBadge status={announcement.priority as any} size="sm" />
                        </div>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{announcement.content}</p>
                        <p className="text-xs text-gray-500 mt-2">By {announcement.created_by_name} • {format(new Date(announcement.created_at), 'MMM d, yyyy')}</p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {Number(announcement.is_read) === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-500 hover:bg-emerald-500/10 h-8 w-8 p-0"
                            onClick={(e) => { e.stopPropagation(); handleMarkAnnouncementRead(announcement.id); }}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        {(user?.role === 'admin' || String(user?.id) === String(event?.creator_id)) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-500/10 h-8 w-8 p-0"
                            onClick={(e) => { e.stopPropagation(); handleDeleteAnnouncement(announcement.id); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredAnnouncements.length === 0 && <div className="text-center py-12"><p className="text-gray-500">No announcements found</p></div>}
                </div>
              </div>
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat">
              <div className="bg-[#0E0E12] rounded-2xl border border-white/5 p-6 h-[600px] flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-4">Event Chat</h3>
                {!canSendMessage && <p className="text-sm text-gray-500 mb-4">Only creators and team leads can send messages</p>}

                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={cn("p-3 rounded-lg max-w-[80%]", msg.is_announcement ? "bg-indigo-500/20 border border-indigo-500/30" : "bg-white/5")}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{msg.sender_name}</span>
                        <span className="text-xs text-gray-500">{msg.sender_role}</span>
                      </div>
                      <p className="text-gray-300">{msg.content}</p>
                      <p className="text-xs text-gray-500 mt-1">{format(new Date(msg.created_at), 'MMM d, h:mm a')}</p>
                    </div>
                  ))}
                  {chatMessages.length === 0 && <div className="text-center py-12"><p className="text-gray-500">No messages yet</p></div>}
                </div>

                {canSendMessage && (
                  <div className="flex gap-2">
                    <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="bg-white/5 border-white/10" />
                    <Button onClick={handleSendMessage} className="bg-indigo-500 hover:bg-indigo-600"><Send className="w-4 h-4" /></Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Applications Tab (Admin Only) */}
            {user?.role === 'admin' && (
              <TabsContent value="applications">
                <div className="bg-[#0E0E12] rounded-2xl border border-white/5 p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Creator Applications</h3>

                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div key={app.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <img
                              src={app.creator_avatar || `https://ui-avatars.com/api/?name=${app.creator_name}&background=random`}
                              alt={app.creator_name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <h4 className="font-medium text-white">{app.creator_name}</h4>
                              <p className="text-sm text-gray-400">{app.creator_email}</p>
                              <div className="mt-2 text-gray-300 bg-white/5 p-3 rounded-lg text-sm">
                                "{app.message || 'No message provided'}"
                              </div>
                              <p className="text-xs text-gray-500 mt-2">Applied on {format(new Date(app.applied_at), 'MMM d, yyyy h:mm a')}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {app.status === 'pending' ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-emerald-500 hover:bg-emerald-600"
                                  onClick={() => handleApplicationAction(app.id, 'approved')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleApplicationAction(app.id, 'rejected')}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <StatusBadge status={app.status as any} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {applications.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No applications yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>

      {/* Sub-Event Dialog - Expanded */}
      <Dialog open={isSubEventDialogOpen} onOpenChange={setIsSubEventDialogOpen}>
        <DialogContent className="bg-[#0E0E12] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Add Sub-Event</DialogTitle>
            <DialogDescription className="text-gray-400">Create a new segment for this event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label className="text-gray-300">Title *</Label>
              <Input value={subEventForm.title} onChange={(e) => setSubEventForm({ ...subEventForm, title: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="Opening Ceremony" />
            </div>
            <div>
              <Label className="text-gray-300">Description</Label>
              <Textarea value={subEventForm.description} onChange={(e) => setSubEventForm({ ...subEventForm, description: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="Brief description of this sub-event..." />
            </div>
            <div>
              <Label className="text-gray-300">Venue *</Label>
              <Input value={subEventForm.venue} onChange={(e) => setSubEventForm({ ...subEventForm, venue: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="Main Auditorium" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Start Time</Label>
                <Input type="datetime-local" value={subEventForm.start_time} onChange={(e) => setSubEventForm({ ...subEventForm, start_time: e.target.value })} className="bg-white/5 border-white/10 mt-1" />
              </div>
              <div>
                <Label className="text-gray-300">End Time</Label>
                <Input type="datetime-local" value={subEventForm.end_time} onChange={(e) => setSubEventForm({ ...subEventForm, end_time: e.target.value })} className="bg-white/5 border-white/10 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Team Lead Contact</Label>
              <Input value={subEventForm.team_lead_contact} onChange={(e) => setSubEventForm({ ...subEventForm, team_lead_contact: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="+91 9876543210" />
            </div>
            <div>
              <Label className="text-gray-300">Section (for registration)</Label>
              <Input value={subEventForm.section} onChange={(e) => setSubEventForm({ ...subEventForm, section: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="CSE-A, ECE-B, Open to all" />
            </div>
            <div>
              <Label className="text-gray-300">Banner Image</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="URL or select template below"
                  value={subEventForm.banner_url}
                  onChange={(e) => setSubEventForm({ ...subEventForm, banner_url: e.target.value })}
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3">
                {BANNER_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    type="button"
                    className={cn(
                      "relative rounded-lg overflow-hidden h-16 border-2 transition-all hover:scale-[1.02]",
                      subEventForm.banner_url === template.url ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-transparent"
                    )}
                    onClick={() => setSubEventForm({ ...subEventForm, banner_url: template.url })}
                  >
                    <img src={template.url} className="w-full h-full object-cover" alt={template.label} />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[8px] text-white py-0.5 text-center font-bold uppercase tracking-widest">
                      {template.label}
                    </div>
                  </button>
                ))}
              </div>

              {subEventForm.banner_url && (
                <div className="mt-2 relative rounded-lg overflow-hidden h-20 border border-white/10">
                  <img
                    src={subEventForm.banner_url}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setSubEventForm({ ...subEventForm, banner_url: '' })}
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubEventDialogOpen(false)} className="border-white/10">Cancel</Button>
            <Button onClick={handleCreateSubEvent} disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Sub-Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog - Expanded with Title, Description, Quantity, Sub-Event */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className="bg-[#0E0E12] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Add Expense</DialogTitle>
            <DialogDescription className="text-gray-400">Record a new expense for this event</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Item Name *</Label>
              <Input value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="Chairs" />
            </div>
            <div>
              <Label className="text-gray-300">Description / Usage</Label>
              <Textarea value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="Used in Opening Ceremony sub-event" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Quantity *</Label>
                <Input type="number" value={expenseForm.quantity} onChange={(e) => setExpenseForm({ ...expenseForm, quantity: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="50" min="1" />
              </div>
              <div>
                <Label className="text-gray-300">Amount (₹) *</Label>
                <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="5000" />
              </div>
            </div>
            <div>
              <Label className="text-gray-300">Category</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(val) => setExpenseForm({ ...expenseForm, category: val })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1F] border-white/10 text-white">
                  <SelectItem value="Venue">Venue</SelectItem>
                  <SelectItem value="Catering">Catering</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Prizes">Prizes</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {Array.isArray(subEvents) && subEvents.length > 0 && (
              <div>
                <Label className="text-gray-300">Related Sub-Event</Label>
                <Select
                  value={expenseForm.sub_event_id}
                  onValueChange={(val) => setExpenseForm({ ...expenseForm, sub_event_id: val })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 mt-1">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1F] border-white/10 text-white">
                    <SelectItem value="none">None</SelectItem>
                    {subEvents.map(se => (
                      <SelectItem key={se.id} value={se.id.toString()}>
                        {se.title || 'Untitled Sub-Event'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)} className="border-white/10">Cancel</Button>
            <Button onClick={handleCreateExpense} disabled={submitting} className="bg-indigo-500 hover:bg-indigo-600">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prize Dialog */}
      <Dialog open={isPrizeDialogOpen} onOpenChange={setIsPrizeDialogOpen}>
        <DialogContent className="bg-[#0E0E12] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Add Prize</DialogTitle>
            <DialogDescription className="text-gray-400">Define a prize for this competition</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Position</Label>
              <Select value={prizeForm.position} onValueChange={(v) => setPrizeForm({ ...prizeForm, position: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Place</SelectItem>
                  <SelectItem value="2">2nd Place</SelectItem>
                  <SelectItem value="3">3rd Place</SelectItem>
                  <SelectItem value="4">Special Award</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Title *</Label>
              <Input value={prizeForm.title} onChange={(e) => setPrizeForm({ ...prizeForm, title: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="Grand Prize" />
            </div>
            <div>
              <Label className="text-gray-300">Description</Label>
              <Textarea value={prizeForm.description} onChange={(e) => setPrizeForm({ ...prizeForm, description: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="Cash + Trophy" />
            </div>
            <div>
              <Label className="text-gray-300">Value (₹)</Label>
              <Input type="number" value={prizeForm.value} onChange={(e) => setPrizeForm({ ...prizeForm, value: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="10000" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrizeDialogOpen(false)} className="border-white/10">Cancel</Button>
            <Button onClick={handleCreatePrize} disabled={submitting} className="bg-indigo-500 hover:bg-indigo-600">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Prize'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Winner Dialog */}
      <Dialog open={isAssignWinnerOpen} onOpenChange={setIsAssignWinnerOpen}>
        <DialogContent className="bg-[#0E0E12] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Assign Winner</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedPrize && `Award "${selectedPrize.title}" to a participant`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Winner Name *</Label>
              <Input value={winnerForm.name} onChange={(e) => setWinnerForm({ ...winnerForm, name: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="John Doe" />
            </div>
            <div>
              <Label className="text-gray-300">Section</Label>
              <Input value={winnerForm.section} onChange={(e) => setWinnerForm({ ...winnerForm, section: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="CSE-A, 3rd Year" />
            </div>
            <div>
              <Label className="text-gray-300">USN / Roll Number</Label>
              <Input value={winnerForm.usn} onChange={(e) => setWinnerForm({ ...winnerForm, usn: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="1XX21CS001" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignWinnerOpen(false)} className="border-white/10">Cancel</Button>
            <Button onClick={handleAssignWinner} disabled={submitting} className="bg-indigo-500 hover:bg-indigo-600">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign Winner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcement Dialog */}
      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogContent className="bg-[#0E0E12] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">New Announcement</DialogTitle>
            <DialogDescription className="text-gray-400">Publish an important update</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Title *</Label>
              <Input value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="bg-white/5 border-white/10 mt-1" placeholder="Registration Open" />
            </div>
            <div>
              <Label className="text-gray-300">Content *</Label>
              <Textarea value={announcementForm.content} onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })} className="bg-white/5 border-white/10 mt-1 min-h-[100px]" placeholder="Write your announcement here..." />
            </div>
            <div>
              <Label className="text-gray-300">Priority</Label>
              <Select value={announcementForm.priority} onValueChange={(v) => setAnnouncementForm({ ...announcementForm, priority: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnnouncementDialogOpen(false)} className="border-white/10">Cancel</Button>
            <Button onClick={handleCreateAnnouncement} disabled={submitting} className="bg-indigo-500 hover:bg-indigo-600">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Announcement Dialog */}
      <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
        <DialogContent className="bg-[#0E0E12] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedAnnouncement?.title}</DialogTitle>
            <DialogDescription className="text-gray-400">
              By {selectedAnnouncement?.created_by_name} • {selectedAnnouncement && format(new Date(selectedAnnouncement.created_at), 'MMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <StatusBadge status={(selectedAnnouncement?.priority || 'medium') as any} className="mb-4" />
            <p className="text-gray-300 leading-relaxed">{selectedAnnouncement?.content}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
