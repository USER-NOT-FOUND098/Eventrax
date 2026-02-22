import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
import api from '@/lib/api';
import {
    ClipboardList,
    Search,
    Loader2,
    Calendar,
    Clock,
    ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface SubEvent {
    id: number;
    event_id: number;
    event_title: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    venue: string;
    status: string;
    expected_time: number;
    team_lead_name: string;
    budget: string | number;
}

export default function SubEventsPage() {
    const { user } = useAuth();
    const { collapsed } = useSidebar();
    const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');

    useEffect(() => {
        fetchSubEvents();
    }, []);

    const fetchSubEvents = async () => {
        try {
            setLoading(true);
            const res = await api.get('/sub_events/my.php');
            setSubEvents(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Failed to fetch sub-events', error);
            toast.error('Failed to load sub-events');
        } finally {
            setLoading(false);
        }
    };

    const filteredSubEvents = subEvents.filter(se => {
        const matchesSearch = se.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            se.event_title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || se.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Sidebar />
            <div className={`${collapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300 ease-in-out`}>
                <Header />
                <main className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                                <ClipboardList className="text-indigo-500" />
                                Sub-Events Management
                            </h1>
                            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {user?.role === 'admin' ? 'Monitor all sub-events across the platform' :
                                    user?.role === 'creator' ? 'Manage sub-events for your events' :
                                        'View and manage your assigned duties'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search sub-events or parent events..."
                                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderColor: 'var(--border-input)',
                                    color: 'var(--text-primary)'
                                }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 p-1 rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                            {(['all', 'upcoming', 'ongoing', 'completed'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize",
                                        statusFilter === s ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredSubEvents.map((se) => (
                                <Link
                                    key={se.id}
                                    to={`/${user?.role}/sub-events/${se.id}`}
                                    className="group border rounded-2xl p-6 transition-all hover:scale-[1.02] active:scale-[0.98] border-b-2 hover:border-indigo-500/50"
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderColor: 'var(--border-card)'
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="space-y-1">
                                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                                {se.event_title}
                                            </Badge>
                                            <h3 className="text-lg font-bold line-clamp-1 group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                                                {se.title}
                                            </h3>
                                        </div>
                                        <StatusBadge status={se.status as any} size="sm" />
                                    </div>

                                    <p className="text-sm line-clamp-2 mb-4 h-10" style={{ color: 'var(--text-secondary)' }}>
                                        {se.description || 'No description provided for this sub-event.'}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            {format(new Date(se.start_time), 'MMM d, yyyy')}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                            <Clock className="w-3.5 h-3.5" />
                                            {format(new Date(se.start_time), 'h:mm a')}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-tighter italic" style={{ color: 'var(--text-muted)' }}>Led By</span>
                                            <span className="text-xs font-medium italic" style={{ color: 'var(--text-secondary)' }}>{se.team_lead_name || 'Unassigned'}</span>
                                        </div>
                                        <div className="flex items-center text-indigo-400 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                                            Manage <ArrowRight className="ml-1 w-3 h-3" />
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            {filteredSubEvents.length === 0 && (
                                <div className="col-span-full text-center py-20 rounded-3xl border border-dashed" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <ClipboardList className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>No sub-events found</h3>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        {searchQuery ? 'Try another search term or filter' : 'You have no assigned or available sub-events yet.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
