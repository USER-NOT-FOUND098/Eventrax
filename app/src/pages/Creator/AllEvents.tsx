import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { Plus, Search, Calendar, MapPin, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Event {
    id: string;
    title: string;
    description: string;
    venue: string;
    start_date: string;
    end_date: string;
    status: string;
    budget: number;
    poster?: string;
    creator_id: string;
    assigned_creator_id?: string;
    creator_name: string;
}

interface Application {
    id: string;
    event_id: string;
    status: 'pending' | 'approved' | 'rejected';
}

export function AllEvents() {
    const navigate = useNavigate();
    const { collapsed } = useSidebar();

    const [events, setEvents] = useState<Event[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(true);
    const [applyDialogOpen, setApplyDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [applicationMessage, setApplicationMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                api.get('/events/index.php?created_by_admin=true'),
                api.get('/events/applications.php?my_applications=true')
            ]);

            const [eventsResult, appsResult] = results;

            if (eventsResult.status === 'fulfilled') {
                setEvents(eventsResult.value.data || []);
            } else {
                console.error('Failed to fetch events:', eventsResult.reason);
                toast.error('Failed to load events list');
            }

            if (appsResult.status === 'fulfilled') {
                setApplications(appsResult.value.data || []);
            } else {
                // Silent fail for applications or specific warning
                console.error('Failed to fetch applications:', appsResult.reason);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const getApplicationStatus = (eventId: string) => {
        return applications.find(app => app.event_id === eventId);
    };

    const handleApply = (event: Event) => {
        setSelectedEvent(event);
        setApplicationMessage('');
        setApplyDialogOpen(true);
    };

    const submitApplication = async () => {
        if (!selectedEvent) return;

        setSubmitting(true);
        try {
            await api.post('/events/apply.php', {
                event_id: selectedEvent.id,
                message: applicationMessage
            });

            toast.success('Application submitted successfully!');

            setApplyDialogOpen(false);
            fetchData(); // Refresh data
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to submit application');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch =
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.venue.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTab = activeTab === 'all' || event.status === activeTab;

        return matchesSearch && matchesTab;
    });

    const eventCounts = {
        all: events.length,
        upcoming: events.filter(e => e.status === 'upcoming').length,
        ongoing: events.filter(e => e.status === 'ongoing').length,
        completed: events.filter(e => e.status === 'completed').length,
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Sidebar />

            <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
                <Header />

                <main className="p-6">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>All Events</h1>
                            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Browse and apply to manage events</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            <Input
                                placeholder="Search events by name or venue..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 placeholder:text-gray-500"
                                style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderColor: 'var(--border-input)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                        <TabsList className="p-1" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>
                            <TabsTrigger value="all" className="data-[state=active]:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                All ({eventCounts.all})
                            </TabsTrigger>
                            <TabsTrigger value="upcoming" className="data-[state=active]:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                Upcoming ({eventCounts.upcoming})
                            </TabsTrigger>
                            <TabsTrigger value="ongoing" className="data-[state=active]:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                Ongoing ({eventCounts.ongoing})
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="data-[state=active]:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                Completed ({eventCounts.completed})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-6">
                            {filteredEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredEvents.map((event) => {
                                        const application = getApplicationStatus(event.id);

                                        return (
                                            <div
                                                key={event.id}
                                                className="rounded-2xl border overflow-hidden group transition-all"
                                                style={{
                                                    backgroundColor: 'var(--bg-secondary)',
                                                    borderColor: 'var(--border-card)'
                                                }}
                                            >
                                                {/* Event Image */}
                                                <div className="aspect-video relative overflow-hidden"
                                                    style={{ background: 'linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))' }}>
                                                    {event.poster ? (
                                                        <img src={event.poster} alt={event.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full opacity-20" />
                                                    )}
                                                    <div className="absolute top-3 right-3">
                                                        <StatusBadge status={event.status as any} size="sm" />
                                                    </div>
                                                </div>

                                                {/* Event Details */}
                                                <div className="p-4">
                                                    <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{event.title}</h3>
                                                    <div className="space-y-1 text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                                                        <p className="flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {format(new Date(event.start_date), 'MMM d, yyyy')}
                                                        </p>
                                                        <p className="flex items-center gap-1">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            {event.venue}
                                                        </p>
                                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                            Created by: {event.creator_name}
                                                        </p>
                                                    </div>

                                                    {/* Application Status */}
                                                    {application ? (
                                                        <div className="mb-3">
                                                            {application.status === 'pending' && (
                                                                <div className="flex items-center gap-2 text-amber-400 text-sm">
                                                                    <Clock className="w-4 h-4" />
                                                                    <span>Application Pending</span>
                                                                </div>
                                                            )}
                                                            {application.status === 'approved' && (
                                                                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    <span>Assigned to You</span>
                                                                </div>
                                                            )}
                                                            {application.status === 'rejected' && (
                                                                <div className="flex items-center gap-2 text-rose-400 text-sm">
                                                                    <XCircle className="w-4 h-4" />
                                                                    <span>Application Rejected</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null}

                                                    {/* Actions */}
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1"
                                                            onClick={() => navigate(`/creator/events/${event.id}`)}
                                                        >
                                                            View Details
                                                        </Button>
                                                        {!application && !event.assigned_creator_id && (
                                                            <Button
                                                                size="sm"
                                                                className="flex-1 bg-indigo-500 hover:bg-indigo-600"
                                                                onClick={() => handleApply(event)}
                                                            >
                                                                <Plus className="w-4 h-4 mr-1" />
                                                                Apply
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <Search className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No events found</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        {searchQuery ? 'Try adjusting your search terms' : 'No events available'}
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            {/* Apply Dialog */}
            <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Apply to Manage Event</DialogTitle>
                        <DialogDescription>
                            Submit your application to manage "{selectedEvent?.title}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Message (Optional)</label>
                            <Textarea
                                placeholder="Tell the admin why you want to manage this event..."
                                value={applicationMessage}
                                onChange={(e) => setApplicationMessage(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submitApplication} disabled={submitting}>
                            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Submit Application
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
