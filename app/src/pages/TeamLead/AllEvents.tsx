import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    Calendar,
    MapPin,
    Clock,
    Users,
    Send,
    CheckCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
    Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Event {
    id: string;
    title: string;
    description: string;
    venue: string;
    start_date: string;
    end_date: string;
    status: string;
    banner?: string;
    image?: string;
    creator_name?: string;
}

interface SubEvent {
    id: string;
    event_id: string;
    title: string;
    description: string;
    venue: string;
    start_time: string;
    end_time: string;
    status: string;
    banner?: string;
    image?: string;
    team_lead_id?: string;
    team_lead_name?: string;
}

interface Application {
    id: string;
    sub_event_id: string;
    sub_event_title: string;
    event_title: string;
    status: string;
    message: string;
    feedback?: string;
    created_at: string;
}

// Placeholder gradients for events without banners
const eventGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

export function TeamLeadAllEvents() {
    const { collapsed } = useSidebar();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<Event[]>([]);
    const [subEvents, setSubEvents] = useState<Record<string, SubEvent[]>>({});
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
    const [myApplications, setMyApplications] = useState<Application[]>([]);

    // Apply dialog state
    const [applyDialogOpen, setApplyDialogOpen] = useState(false);
    const [selectedSubEvent, setSelectedSubEvent] = useState<SubEvent | null>(null);
    const [selectedEventTitle, setSelectedEventTitle] = useState('');
    const [applicationMessage, setApplicationMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const eventsRes = await api.get('/events/index.php');
            setEvents(eventsRes.data || []);

            const subEventsMap: Record<string, SubEvent[]> = {};
            for (const event of eventsRes.data || []) {
                try {
                    const subRes = await api.get(`/sub_events/index.php?event_id=${event.id}`);
                    subEventsMap[event.id] = subRes.data || [];
                } catch {
                    subEventsMap[event.id] = [];
                }
            }
            setSubEvents(subEventsMap);

            try {
                const appRes = await api.get('/teamlead/apply.php');
                setMyApplications(appRes.data || []);
            } catch {
                setMyApplications([]);
            }
        } catch (error) {
            console.error('Failed to fetch events', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleEvent = (eventId: string) => {
        setExpandedEvents(prev => {
            const next = new Set(prev);
            if (next.has(eventId)) {
                next.delete(eventId);
            } else {
                next.add(eventId);
            }
            return next;
        });
    };

    const openApplyDialog = (subEvent: SubEvent, eventTitle: string) => {
        setSelectedSubEvent(subEvent);
        setSelectedEventTitle(eventTitle);
        setApplicationMessage('');
        setApplyDialogOpen(true);
    };

    const submitApplication = async () => {
        if (!selectedSubEvent) return;

        setSubmitting(true);
        try {
            const { data } = await api.post('/teamlead/apply.php', {
                sub_event_id: selectedSubEvent.id,
                message: applicationMessage
            });

            toast.success(data.message || 'Application submitted!');
            setApplyDialogOpen(false);

            const appRes = await api.get('/teamlead/apply.php');
            setMyApplications(appRes.data || []);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to submit application');
        } finally {
            setSubmitting(false);
        }
    };

    const getApplicationStatus = (subEventId: string) => {
        return myApplications.find(app => app.sub_event_id === subEventId);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>;
            case 'approved':
                return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Approved</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
            default:
                return null;
        }
    };

    const getEventGradient = (index: number) => {
        return eventGradients[index % eventGradients.length];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <Sidebar />
                <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
                    <Header />
                    <main className="p-6">
                        <Skeleton className="h-10 w-64 mb-6" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-64 w-full rounded-2xl" />
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
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--text-primary)]">All Events</h1>
                            <p className="text-[var(--text-secondary)] mt-1">
                                Browse events and apply to lead sub-events
                            </p>
                        </div>
                    </div>

                    {/* My Applications Summary */}
                    {myApplications.length > 0 && (
                        <Card className="bg-[var(--bg-card)] border-[var(--border-color)] mb-6">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg text-[var(--text-primary)]">
                                    My Applications ({myApplications.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-3">
                                    {myApplications.map(app => (
                                        <div
                                            key={app.id}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)]"
                                        >
                                            <span className="text-sm text-[var(--text-primary)]">{app.sub_event_title}</span>
                                            {getStatusBadge(app.status)}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Events Grid */}
                    {events.length === 0 ? (
                        <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                            <CardContent className="p-12 text-center">
                                <Calendar className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-[var(--text-primary)]">No Events Available</h3>
                                <p className="text-[var(--text-secondary)]">
                                    There are currently no events to browse.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {events.map((event, eventIndex) => {
                                const isExpanded = expandedEvents.has(event.id);
                                const eventSubEvents = subEvents[event.id] || [];
                                const availableSubEvents = eventSubEvents.filter(se => !se.team_lead_id);
                                const eventBanner = event.banner || event.image;

                                return (
                                    <div
                                        key={event.id}
                                        className="rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)]"
                                    >
                                        {/* Event Banner/Header */}
                                        <div
                                            className="relative h-48 cursor-pointer group"
                                            onClick={() => toggleEvent(event.id)}
                                            style={{
                                                background: eventBanner ? `url(${eventBanner}) center/cover` : getEventGradient(eventIndex)
                                            }}
                                        >
                                            {/* Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                                            {/* Event Info on Banner */}
                                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                                                                {event.title}
                                                            </h3>
                                                            <Badge
                                                                className={cn(
                                                                    "text-xs font-semibold",
                                                                    event.status === 'upcoming' && "bg-blue-500 text-white",
                                                                    event.status === 'ongoing' && "bg-emerald-500 text-white",
                                                                    event.status === 'completed' && "bg-gray-500 text-white"
                                                                )}
                                                            >
                                                                {event.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-white/80">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                {format(new Date(event.start_date), 'MMM d')} - {format(new Date(event.end_date), 'MMM d, yyyy')}
                                                            </span>
                                                            {event.venue && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="w-4 h-4" />
                                                                    {event.venue}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-4 h-4" />
                                                                {eventSubEvents.length} sub-events
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {availableSubEvents.length > 0 && (
                                                            <Badge className="bg-[var(--accent-primary)] text-white animate-pulse">
                                                                {availableSubEvents.length} need Team Lead
                                                            </Badge>
                                                        )}
                                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-5 h-5 text-white" />
                                                            ) : (
                                                                <ChevronDown className="w-5 h-5 text-white" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* No Banner Icon */}
                                            {!eventBanner && (
                                                <div className="absolute top-4 right-4">
                                                    <ImageIcon className="w-6 h-6 text-white/30" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Description (if expanded) */}
                                        {isExpanded && event.description && (
                                            <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                                                <p className="text-sm text-[var(--text-secondary)]">{event.description}</p>
                                            </div>
                                        )}

                                        {/* Sub-Events List */}
                                        {isExpanded && (
                                            <div className="bg-[var(--bg-secondary)]/50">
                                                {eventSubEvents.length === 0 ? (
                                                    <div className="p-8 text-center text-[var(--text-muted)]">
                                                        No sub-events available for this event.
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                                        {eventSubEvents.map((subEvent, subIndex) => {
                                                            const application = getApplicationStatus(subEvent.id);
                                                            const hasTeamLead = !!subEvent.team_lead_id;
                                                            const subEventBanner = subEvent.banner || subEvent.image;

                                                            return (
                                                                <div
                                                                    key={subEvent.id}
                                                                    className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)]/50 transition-all hover:shadow-lg"
                                                                >
                                                                    {/* Sub-Event Banner */}
                                                                    <div
                                                                        className="h-24 relative"
                                                                        style={{
                                                                            background: subEventBanner
                                                                                ? `url(${subEventBanner}) center/cover`
                                                                                : getEventGradient(eventIndex + subIndex + 1)
                                                                        }}
                                                                    >
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                                        {hasTeamLead && (
                                                                            <div className="absolute top-2 right-2">
                                                                                <Badge className="bg-emerald-500 text-white text-xs">
                                                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                                                    Assigned
                                                                                </Badge>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Sub-Event Info */}
                                                                    <div className="p-4">
                                                                        <h4 className="font-semibold text-[var(--text-primary)] mb-2 line-clamp-1">
                                                                            {subEvent.title}
                                                                        </h4>
                                                                        <div className="space-y-1 mb-3">
                                                                            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                                                                <Clock className="w-3 h-3" />
                                                                                {format(new Date(subEvent.start_time), 'MMM d, h:mm a')}
                                                                            </div>
                                                                            {subEvent.venue && (
                                                                                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                                                                    <MapPin className="w-3 h-3" />
                                                                                    <span className="line-clamp-1">{subEvent.venue}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Action Area */}
                                                                        <div className="pt-3 border-t border-[var(--border-color)]">
                                                                            {hasTeamLead ? (
                                                                                <span className="text-xs text-emerald-500 flex items-center gap-1">
                                                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                                                    Has Team Lead assigned
                                                                                </span>
                                                                            ) : application ? (
                                                                                <div className="flex items-center gap-2">
                                                                                    {getStatusBadge(application.status)}
                                                                                    {application.status === 'rejected' && application.feedback && (
                                                                                        <span className="text-xs text-red-400 line-clamp-1">
                                                                                            {application.feedback}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        openApplyDialog(subEvent, event.title);
                                                                                    }}
                                                                                >
                                                                                    <Send className="w-4 h-4 mr-2" />
                                                                                    Apply as Team Lead
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* Apply Dialog */}
            <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[var(--text-primary)]">
                            Apply to Lead Sub-Event
                        </DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            <span className="font-medium text-[var(--accent-primary)]">{selectedSubEvent?.title}</span>
                            <br />
                            <span className="text-xs">Event: {selectedEventTitle}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                                Why do you want to lead this sub-event? (optional)
                            </label>
                            <Textarea
                                value={applicationMessage}
                                onChange={(e) => setApplicationMessage(e.target.value)}
                                placeholder="Share your experience, skills, or why you'd be a great Team Lead for this sub-event..."
                                className="bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)] min-h-[120px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setApplyDialogOpen(false)}
                            className="border-[var(--border-color)] text-[var(--text-secondary)]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={submitApplication}
                            disabled={submitting}
                            className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit Application
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default TeamLeadAllEvents;
