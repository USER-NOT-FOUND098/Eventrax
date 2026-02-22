import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
import api from '@/lib/api';
import {
    Bell,
    CheckCircle2,
    Search,
    Loader2,
    Trash2,
    Calendar,
    Eye,
    Plus
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Announcement {
    id: number;
    event_id: number;
    event_title: string;
    title: string;
    content: string;
    priority: string;
    created_by_name: string;
    created_at: string;
    is_read: number;
}

export default function AnnouncementsPage() {
    const { user } = useAuth();
    const { collapsed } = useSidebar();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Create State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        content: '',
        priority: 'medium',
        event_id: ''
    });
    const [events, setEvents] = useState<any[]>([]); // To populate event dropdown

    useEffect(() => {
        fetchAnnouncements();
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events/index.php');
            setEvents(res.data);
        } catch (error) {
            console.error('Failed to fetch events', error);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await api.get('/announcements/index.php');
            setAnnouncements(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Failed to fetch announcements', error);
            toast.error('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id: number) => {
        try {
            await api.post('/announcements/mark-read.php', { announcement_id: id });
            setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_read: 1 } : a));
        } catch (error) {
            console.error('Error marking as read', error);
        }
    };

    const handleCreate = async () => {
        if (!newAnnouncement.title || !newAnnouncement.content || !newAnnouncement.event_id) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/announcements/index.php', newAnnouncement);
            toast.success('Announcement published');
            setIsCreateOpen(false);
            setNewAnnouncement({ title: '', content: '', priority: 'medium', event_id: '' });
            fetchAnnouncements();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create announcement');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this announcement?')) return;
        try {
            await api.delete(`/announcements/index.php/?id=${id}`);
            toast.success('Announcement deleted');
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const filteredAnnouncements = announcements.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.event_title.toLowerCase().includes(searchQuery.toLowerCase());

        // User logic: Unread OR High Priority stay in log.
        // Others might be filtered out if 'unread' filter is on, or if we follow the specific logic requested.
        // Logic: Unread are always shown. Read are shown ONLY if high priority.
        const passesPersistence = Number(a.is_read) === 0 || a.priority === 'high';

        if (filter === 'unread') return matchesSearch && Number(a.is_read) === 0;
        if (filter === 'high') return matchesSearch && a.priority === 'high';

        return matchesSearch && passesPersistence;
    });

    const unreadCount = announcements.filter(a => Number(a.is_read) === 0).length;

    return (
        <div className="min-h-screen bg-[#07070A]">
            <Sidebar />
            <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
                <Header />
                <main className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Bell className="text-indigo-500" />
                                Announcement Log
                                {unreadCount > 0 && (
                                    <Badge variant="destructive" className="ml-2">
                                        {unreadCount} New
                                    </Badge>
                                )}
                            </h1>
                            <p className="text-gray-400 mt-1">Stay updated with the latest event news</p>
                        </div>
                        {(user?.role === 'admin' || user?.role === 'creator') && (
                            <Button
                                onClick={() => setIsCreateOpen(true)}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Announcement
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search announcements or events..."
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {(['all', 'unread', 'high'] as const).map((f) => (
                                <Button
                                    key={f}
                                    variant={filter === f ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "capitalize rounded-xl",
                                        filter === f ? "bg-indigo-600 hover:bg-indigo-700" : "border-white/10 text-gray-400"
                                    )}
                                >
                                    {f}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAnnouncements.map((announcement) => (
                                <div
                                    key={announcement.id}
                                    className={cn(
                                        "p-6 rounded-2xl border transition-all group",
                                        Number(announcement.is_read) === 0
                                            ? "bg-indigo-500/5 border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                                            : "bg-white/5 border-white/5 opacity-80"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded">
                                                    {announcement.event_title}
                                                </span>
                                                <StatusBadge status={announcement.priority as any} size="sm" />
                                                {Number(announcement.is_read) === 0 && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 animate-pulse uppercase">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className={cn(
                                                "text-lg font-semibold mb-2",
                                                Number(announcement.is_read) === 0 ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                                            )}>
                                                {announcement.title}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                                                {announcement.content}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}
                                                </div>
                                                <div>By {announcement.created_by_name}</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {Number(announcement.is_read) === 0 ? (
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4"
                                                    onClick={() => handleMarkRead(announcement.id)}
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Mark Read
                                                </Button>
                                            ) : (
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500">
                                                    <Eye className="w-4 h-4" />
                                                </div>
                                            )}

                                            {(user?.role === 'admin' || user?.role === 'creator') && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleDelete(announcement.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredAnnouncements.length === 0 && (
                                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bell className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <h3 className="text-white font-medium">No announcements found</h3>
                                    <p className="text-gray-500 text-sm mt-1">
                                        {searchQuery ? 'Try another search term' : 'You are all caught up!'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-[#1A1A1F] border-white/10 text-white sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Make an Announcement</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Share updates with your team and participants.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Target Event</Label>
                            <Select
                                value={newAnnouncement.event_id}
                                onValueChange={(val) => setNewAnnouncement(prev => ({ ...prev, event_id: val }))}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select Event" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1A1A1F] border-white/10 text-white">
                                    {events.map(e => (
                                        <SelectItem key={e.id} value={e.id.toString()}>{e.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                placeholder="Announcement Title"
                                value={newAnnouncement.title}
                                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <div className="flex gap-2">
                                {(['low', 'medium', 'high'] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setNewAnnouncement(prev => ({ ...prev, priority: p }))}
                                        className={cn(
                                            "flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                                            newAnnouncement.priority === p
                                                ? p === 'high' ? 'bg-rose-500 text-white' : p === 'medium' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                                                : "bg-white/5 text-gray-400 hover:bg-white/10"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Content</Label>
                            <Textarea
                                placeholder="Write your message here..."
                                value={newAnnouncement.content}
                                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white min-h-[100px] placeholder:text-gray-500"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-white hover:bg-white/10">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
                            Publish Announcement
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
