import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    UserCheck,
    UserX,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    AlertTriangle,
    Mail,
    Calendar,
    Users,
} from 'lucide-react';
import { format } from 'date-fns';

interface VolunteerApplication {
    id: string;
    student_id: string;
    student_name: string;
    student_email: string;
    student_avatar?: string;
    sub_event_id: string;
    sub_event_title: string;
    event_title: string;
    event_id: string;
    message: string;
    status: string;
    feedback?: string;
    created_at: string;
}

interface Volunteer {
    id: string;
    user_id: string;
    name: string;
    email: string;
    avatar?: string;
    sub_event_id: string;
    sub_event_title: string;
    event_title: string;
    role: string;
    assigned_at: string;
}

export function TeamLeadVolunteers() {
    const { collapsed } = useSidebar();
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<VolunteerApplication[]>([]);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState('pending');

    // Remove dialog state
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
    const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
    const [removeReason, setRemoveReason] = useState('');
    const [removing, setRemoving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            console.log('Fetching TeamLead data...');
            const [appsRes, volsRes] = await Promise.all([
                api.get('/teamlead/applications.php'),
                api.get('/volunteers/index.php?list_type=my_team')
            ]);
            console.log('Applications response:', appsRes.data);
            console.log('My Team response:', volsRes.data);
            setApplications(appsRes.data || []);
            setVolunteers(volsRes.data || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (applicationId: string) => {
        try {
            await api.post('/teamlead/approve.php', {
                application_id: applicationId,
                action: 'approve'
            });
            toast.success('Volunteer application approved!');
            fetchData();
        } catch (error) {
            console.error('Failed to approve', error);
            toast.error('Failed to approve application');
        }
    };

    const handleReject = async (applicationId: string, feedback?: string) => {
        try {
            await api.post('/teamlead/approve.php', {
                application_id: applicationId,
                action: 'reject',
                feedback
            });
            toast.success('Volunteer application rejected');
            fetchData();
        } catch (error) {
            console.error('Failed to reject', error);
            toast.error('Failed to reject application');
        }
    };

    const handleRemoveVolunteer = async () => {
        if (!selectedVolunteer || !removeReason.trim()) {
            toast.error('Please provide a reason for removal');
            return;
        }

        setRemoving(true);
        try {
            await api.post('/teamlead/remove.php', {
                volunteer_id: selectedVolunteer.user_id,
                sub_event_id: selectedVolunteer.sub_event_id,
                reason: removeReason
            });
            toast.success('Volunteer removed successfully');
            setRemoveDialogOpen(false);
            setSelectedVolunteer(null);
            setRemoveReason('');
            fetchData();
        } catch (error) {
            console.error('Failed to remove volunteer', error);
            toast.error('Failed to remove volunteer');
        } finally {
            setRemoving(false);
        }
    };

    const pendingApps = applications.filter(a => a.status === 'pending');
    const approvedApps = applications.filter(a => a.status === 'approved');
    const rejectedApps = applications.filter(a => a.status === 'rejected');

    const filteredApps = (apps: VolunteerApplication[]) => {
        if (!searchTerm) return apps;
        const term = searchTerm.toLowerCase();
        return apps.filter(a =>
            a.student_name.toLowerCase().includes(term) ||
            a.student_email.toLowerCase().includes(term) ||
            a.sub_event_title.toLowerCase().includes(term)
        );
    };

    const filteredVolunteers = volunteers.filter(v => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return v.name.toLowerCase().includes(term) ||
            v.email.toLowerCase().includes(term) ||
            v.sub_event_title.toLowerCase().includes(term);
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>;
            case 'approved':
                return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Approved</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
            default:
                return <Badge className="bg-gray-500/20 text-gray-400">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <Sidebar />
                <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
                    <Header />
                    <main className="p-6">
                        <Skeleton className="h-10 w-64 mb-6" />
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-32 w-full" />
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
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Volunteer Management</h1>
                        <p className="text-[var(--text-secondary)] mt-1">
                            Review applications and manage your team volunteers
                        </p>
                    </div>

                    {/* Search */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                            <Input
                                placeholder="Search by name, email, or sub-event..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]"
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                        <TabsList className="bg-[var(--bg-secondary)] border border-[var(--border-color)] mb-6">
                            <TabsTrigger
                                value="pending"
                                className="data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white"
                            >
                                <Clock className="w-4 h-4 mr-2" />
                                Pending ({pendingApps.length})
                            </TabsTrigger>
                            <TabsTrigger
                                value="approved"
                                className="data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approved ({approvedApps.length})
                            </TabsTrigger>
                            <TabsTrigger
                                value="rejected"
                                className="data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Rejected ({rejectedApps.length})
                            </TabsTrigger>
                            <TabsTrigger
                                value="volunteers"
                                className="data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                My Team ({volunteers.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* Pending Applications */}
                        <TabsContent value="pending">
                            <div className="space-y-4">
                                {filteredApps(pendingApps).map((app) => (
                                    <Card key={app.id} className="bg-[var(--bg-card)] border-[var(--border-color)]">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <img
                                                        src={app.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.student_email}`}
                                                        alt={app.student_name}
                                                        className="w-12 h-12 rounded-full bg-[var(--bg-secondary)]"
                                                    />
                                                    <div>
                                                        <h3 className="font-semibold text-[var(--text-primary)]">{app.student_name}</h3>
                                                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                                            <Mail className="w-3.5 h-3.5" />
                                                            {app.student_email}
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                                                            <span className="text-[var(--accent-primary)]">{app.sub_event_title}</span>
                                                            <span>•</span>
                                                            <span>{app.event_title}</span>
                                                        </div>
                                                        {app.message && (
                                                            <p className="mt-2 text-sm text-[var(--text-secondary)] italic">
                                                                "{app.message}"
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-muted)]">
                                                            <Calendar className="w-3 h-3" />
                                                            Applied {format(new Date(app.created_at), 'MMM d, yyyy')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 self-end md:self-center">
                                                    <Button
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                                        onClick={() => handleApprove(app.id)}
                                                    >
                                                        <UserCheck className="w-4 h-4 mr-2" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                                                        onClick={() => handleReject(app.id)}
                                                    >
                                                        <UserX className="w-4 h-4 mr-2" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {filteredApps(pendingApps).length === 0 && (
                                    <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                                        <CardContent className="p-12 text-center">
                                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-[var(--text-primary)]">All caught up!</h3>
                                            <p className="text-[var(--text-secondary)]">No pending applications to review</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>

                        {/* Approved Applications */}
                        <TabsContent value="approved">
                            <div className="space-y-4">
                                {filteredApps(approvedApps).map((app) => (
                                    <Card key={app.id} className="bg-[var(--bg-card)] border-[var(--border-color)]">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={app.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.student_email}`}
                                                        alt={app.student_name}
                                                        className="w-10 h-10 rounded-full bg-[var(--bg-secondary)]"
                                                    />
                                                    <div>
                                                        <h3 className="font-medium text-[var(--text-primary)]">{app.student_name}</h3>
                                                        <p className="text-sm text-[var(--text-secondary)]">
                                                            {app.sub_event_title} • {app.event_title}
                                                        </p>
                                                    </div>
                                                </div>
                                                {getStatusBadge(app.status)}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {filteredApps(approvedApps).length === 0 && (
                                    <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                                        <CardContent className="p-12 text-center">
                                            <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                                            <p className="text-[var(--text-secondary)]">No approved applications yet</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>

                        {/* Rejected Applications */}
                        <TabsContent value="rejected">
                            <div className="space-y-4">
                                {filteredApps(rejectedApps).map((app) => (
                                    <Card key={app.id} className="bg-[var(--bg-card)] border-[var(--border-color)]">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={app.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.student_email}`}
                                                        alt={app.student_name}
                                                        className="w-10 h-10 rounded-full bg-[var(--bg-secondary)]"
                                                    />
                                                    <div>
                                                        <h3 className="font-medium text-[var(--text-primary)]">{app.student_name}</h3>
                                                        <p className="text-sm text-[var(--text-secondary)]">
                                                            {app.sub_event_title} • {app.event_title}
                                                        </p>
                                                        {app.feedback && (
                                                            <p className="text-sm text-red-400 mt-1">Feedback: {app.feedback}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {getStatusBadge(app.status)}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {filteredApps(rejectedApps).length === 0 && (
                                    <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                                        <CardContent className="p-12 text-center">
                                            <CheckCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                                            <p className="text-[var(--text-secondary)]">No rejected applications</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>

                        {/* My Team Volunteers */}
                        <TabsContent value="volunteers">
                            <div className="space-y-4">
                                {filteredVolunteers.map((vol) => (
                                    <Card key={`${vol.user_id}-${vol.sub_event_id}`} className="bg-[var(--bg-card)] border-[var(--border-color)]">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={vol.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${vol.email}`}
                                                        alt={vol.name}
                                                        className="w-12 h-12 rounded-full bg-[var(--bg-secondary)]"
                                                    />
                                                    <div>
                                                        <h3 className="font-semibold text-[var(--text-primary)]">{vol.name}</h3>
                                                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                                            <Mail className="w-3.5 h-3.5" />
                                                            {vol.email}
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-1 text-sm">
                                                            <span className="text-[var(--accent-primary)]">{vol.sub_event_title}</span>
                                                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                                {vol.role}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                                                    onClick={() => {
                                                        setSelectedVolunteer(vol);
                                                        setRemoveDialogOpen(true);
                                                    }}
                                                >
                                                    <UserX className="w-4 h-4 mr-2" />
                                                    Remove
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {filteredVolunteers.length === 0 && (
                                    <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                                        <CardContent className="p-12 text-center">
                                            <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-[var(--text-primary)]">No team members yet</h3>
                                            <p className="text-[var(--text-secondary)]">Approve volunteer applications to build your team</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            {/* Remove Volunteer Dialog */}
            <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)]">
                    <DialogHeader>
                        <DialogTitle className="text-[var(--text-primary)] flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Remove Volunteer
                        </DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            Are you sure you want to remove <strong>{selectedVolunteer?.name}</strong> from{' '}
                            <strong>{selectedVolunteer?.sub_event_title}</strong>? This action will be logged and the volunteer will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium text-[var(--text-primary)]">
                            Reason for removal <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            value={removeReason}
                            onChange={(e) => setRemoveReason(e.target.value)}
                            placeholder="Please provide a reason for removing this volunteer..."
                            className="mt-2 bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]"
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRemoveDialogOpen(false);
                                setSelectedVolunteer(null);
                                setRemoveReason('');
                            }}
                            className="border-[var(--border-color)] text-[var(--text-primary)]"
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={handleRemoveVolunteer}
                            disabled={removing || !removeReason.trim()}
                        >
                            {removing ? 'Removing...' : 'Remove Volunteer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default TeamLeadVolunteers;
