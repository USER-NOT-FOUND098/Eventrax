import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { DataTable } from '@/components/ui-custom/DataTable';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import type { User } from '@/types';
import {
    Search,
    Users,
    CheckCircle,
    XCircle,
    UserPlus,
    ShieldCheck,
    ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TeamLeadApplication {
    id: number;
    user_id: number;
    applicant_name: string;
    applicant_email: string;
    applicant_avatar?: string;
    applicant_institution?: string;
    sub_event_id: number;
    sub_event_title: string;
    event_id: number;
    event_title: string;
    message: string;
    status: 'pending' | 'approved' | 'rejected';
    feedback?: string;
    created_at: string;
}

interface VolunteerApplication {
    id: number;
    sub_event_id: number;
    student_id: number;
    status: 'pending' | 'approved' | 'rejected';
    message: string;
    student_name: string;
    student_email: string;
    student_avatar?: string;
    sub_event_title: string;
    event_title: string;
    applied_at: string;
}

export function TeamManagement() {
    const { collapsed } = useSidebar();
    const [activeTab, setActiveTab] = useState('applications');
    const [applications, setApplications] = useState<VolunteerApplication[]>([]);
    const [teamLeadApps, setTeamLeadApps] = useState<TeamLeadApplication[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [subEvents, setSubEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Assignment Dialog State
    const [isAssignLeadOpen, setIsAssignLeadOpen] = useState(false);
    const [selectedUserForLead, setSelectedUserForLead] = useState<User | null>(null);
    const [selectedSubEvent, setSelectedSubEvent] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assignmentType, setAssignmentType] = useState<'lead' | 'volunteer'>('lead');

    // Generate Team Lead Dialog State
    const [isGenerateLeadOpen, setIsGenerateLeadOpen] = useState(false);
    const [genSubEvent, setGenSubEvent] = useState<string>('');
    const [genRecipient, setGenRecipient] = useState<string>(''); // User ID of the student receiving creds
    const [generatedCreds, setGeneratedCreds] = useState<{ email: string, password: string } | null>(null);

    const handleGenerateTeamLead = async () => {
        if (!genSubEvent) {
            toast.error('Please select a sub-event');
            return;
        }
        if (!genRecipient) {
            toast.error('Please select a student to receive the credentials');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Generate Credentials
            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            const password = Math.random().toString(36).substring(2, 10) + '!';
            const email = `active_tl_${randomSuffix}@eventrax.com`;
            const name = `Team Lead ${randomSuffix}`;

            // 2. Create User
            const createRes = await api.post('/users/create.php', {
                name,
                email,
                password,
                role: 'teamlead',
                institution: 'EventRAX Generated'
            });

            const userId = createRes.data.user.id;

            // Get Sub Event Info for notification
            const selectedSubEventInfo = subEvents.find(se => se.id.toString() === genSubEvent);
            const subEventTitle = selectedSubEventInfo?.title || 'Unknown Sub-Event';

            // 3. Assign to Sub-Event
            await api.post('/sub_events/assign.php', {
                sub_event_id: genSubEvent,
                team_lead_id: userId,
                type: 'lead'
            });

            // 4. Send Notification to Student
            await api.post('/notifications/create.php', {
                user_id: genRecipient,
                title: '🔑 Team Lead Access Granted',
                message: `You have been assigned as a Team Lead for "${subEventTitle}".\n\nLogin Credentials (valid for this event only):\nUsername: ${email}\nPassword: ${password}\n\nPlease save these details.`,
                type: 'system',
                sub_event_id: genSubEvent
            });

            // 5. Show Success
            setGeneratedCreds({ email, password });
            toast.success('Team Lead generated, assigned, and notification sent!');
            fetchData();
        } catch (error: any) {
            console.error('Generation failed', error);
            toast.error(error.response?.data?.error || 'Failed to generate Team Lead');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                api.get('/volunteers/index.php'),
                api.get('/users/index.php'),
                api.get('/sub_events/index.php?all=true'),
                api.get('/teamlead/applications-review.php')
            ]);

            if (results[0].status === 'fulfilled') {
                setApplications(results[0].value.data);
            } else {
                console.error('Volunteer applications load failed', (results[0] as PromiseRejectedResult).reason);
            }

            if (results[1].status === 'fulfilled') {
                setUsers(results[1].value.data);
            } else {
                console.error('Users load failed', (results[1] as PromiseRejectedResult).reason);
            }

            if (results[2].status === 'fulfilled') {
                setSubEvents(results[2].value.data);
            }

            if (results[3].status === 'fulfilled') {
                setTeamLeadApps(results[3].value.data || []);
            } else {
                console.error('Team Lead applications load failed', (results[3] as PromiseRejectedResult).reason);
            }

        } catch (error) {
            console.error('Data fetch failed:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleApplicationAction = async (applicationId: number, action: 'approve' | 'reject') => {
        try {
            await api.post('/volunteers/approve.php', {
                application_id: applicationId,
                action
            });
            toast.success(`Application ${action === 'approve' ? 'approved' : 'rejected'}`);
            setApplications(prev => prev.map(app =>
                app.id === applicationId ? { ...app, status: action === 'approve' ? 'approved' : 'rejected' } : app
            ));
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Action failed');
        }
    };

    const handleTeamLeadAction = async (appId: number, action: 'approve' | 'reject', feedback?: string) => {
        try {
            await api.post('/teamlead/applications-review.php', {
                application_id: appId,
                action,
                feedback
            });
            toast.success(`Team Lead application ${action === 'approve' ? 'approved' : 'rejected'}`);
            fetchData(); // Refresh all data
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Action failed');
        }
    };

    const handleAssignTeamLead = async () => {
        if (!selectedUserForLead || !selectedSubEvent) {
            toast.error('Please select both a user and a sub-event');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/volunteers/assign.php', {
                sub_event_id: selectedSubEvent,
                user_id: selectedUserForLead.id,
                type: assignmentType
            });
            toast.success(`${selectedUserForLead.name} assigned as ${assignmentType === 'lead' ? 'Team Lead' : 'Volunteer'}`);
            setIsAssignLeadOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Assignment failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignVolunteer = (user: User) => {
        setSelectedUserForLead(user);
        setAssignmentType('volunteer');
        setIsAssignLeadOpen(true);
    };

    const handleOpenAssignLead = (user: User) => {
        setSelectedUserForLead(user);
        setAssignmentType('lead');
        setIsAssignLeadOpen(true);
    };

    const filteredUsers = users.filter(user =>
        user.role !== 'admin' && (
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    const pendingApps = applications.filter(app => app.status === 'pending');
    const pendingTeamLeadApps = teamLeadApps.filter(app => app.status === 'pending');

    const appColumns = [
        {
            key: 'student',
            header: 'Applicant',
            cell: (app: VolunteerApplication) => (
                <div className="flex items-center gap-3">
                    <img
                        src={app.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.student_id}`}
                        className="w-8 h-8 rounded-lg bg-gray-700"
                    />
                    <div>
                        <p className="font-medium text-[var(--text-primary)]">{app.student_name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{app.student_email}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'sub_event',
            header: 'Target Sub-Event',
            cell: (app: VolunteerApplication) => (
                <div>
                    <p className="text-sm font-medium text-[var(--accent-primary)]">{app.sub_event_title}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{app.event_title}</p>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            cell: (app: VolunteerApplication) => {
                const statusMap: Record<string, any> = {
                    'pending': 'pending',
                    'approved': 'confirmed',
                    'rejected': 'cancelled'
                };
                return <StatusBadge status={statusMap[app.status] || 'pending'} size="sm" />;
            }
        },
        {
            key: 'applied_at',
            header: 'Applied On',
            cell: (app: VolunteerApplication) => (
                <span className="text-xs text-[var(--text-muted)]">
                    {format(new Date(app.applied_at), 'MMM d, HH:mm')}
                </span>
            )
        }
    ];

    const userColumns = [
        {
            key: 'user',
            header: 'User',
            cell: (user: User) => (
                <div className="flex items-center gap-3">
                    <img
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                        className="w-8 h-8 rounded-lg bg-gray-700"
                    />
                    <div>
                        <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{user.role}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'institution',
            header: 'Institution',
            cell: (user: User) => <span className="text-sm text-[var(--text-secondary)]">{user.institution || '-'}</span>
        }
    ];

    if (loading && applications.length === 0) {
        return <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-white">Loading Team Management...</div>;
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Sidebar />
            <div className={`${collapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300 ease-in-out`}>
                <Header />
                <main className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Team Management</h1>
                            <p className="text-[var(--text-secondary)] mt-1">Manage volunteers and assign team leads</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white"
                                onClick={() => setIsGenerateLeadOpen(true)}
                            >
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Generate Team Lead
                            </Button>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-3 justify-start w-full border-none">
                            <TabsTrigger
                                value="applications"
                                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-transparent dark:border-white/5 hover:bg-white hover:text-black dark:hover:bg-white/10 dark:hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
                            >
                                <ClipboardList className="w-4 h-4 mr-2" />
                                Applications {pendingApps.length > 0 && <span className="ml-2 px-1.5 py-0.5 bg-rose-500 text-[10px] text-white rounded-full font-bold">{pendingApps.length}</span>}
                            </TabsTrigger>
                            <TabsTrigger
                                value="directory"
                                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-transparent dark:border-white/5 hover:bg-white hover:text-black dark:hover:bg-white/10 dark:hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                User Directory
                            </TabsTrigger>
                            <TabsTrigger
                                value="teamlead-apps"
                                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-transparent dark:border-white/5 hover:bg-white hover:text-black dark:hover:bg-white/10 dark:hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
                            >
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Team Lead Requests {pendingTeamLeadApps.length > 0 && <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-[10px] text-white rounded-full font-bold">{pendingTeamLeadApps.length}</span>}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="applications" className="space-y-6">
                            <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
                                <DataTable
                                    data={applications}
                                    columns={appColumns}
                                    keyExtractor={(app) => String(app.id)}
                                    actions={(app) => app.status === 'pending' ? [
                                        {
                                            label: 'Approve',
                                            icon: <CheckCircle className="w-4 h-4" />,
                                            onClick: () => handleApplicationAction(app.id, 'approve'),
                                            className: 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20 shadow-sm'
                                        },
                                        {
                                            label: 'Reject',
                                            icon: <XCircle className="w-4 h-4" />,
                                            onClick: () => handleApplicationAction(app.id, 'reject'),
                                            className: 'text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border-rose-500/20 shadow-sm',
                                            variant: 'destructive'
                                        }
                                    ] : []}
                                    emptyMessage="No volunteer applications found"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="directory" className="space-y-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-[var(--bg-tertiary)] border-[var(--border-color)]"
                                    />
                                </div>
                            </div>
                            <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
                                <DataTable
                                    data={filteredUsers}
                                    columns={userColumns}
                                    keyExtractor={(user) => String(user.id)}
                                    actions={(user) => [
                                        {
                                            label: 'Assign as Team Lead',
                                            icon: <ShieldCheck className="w-4 h-4" />,
                                            onClick: () => handleOpenAssignLead(user),
                                            className: 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 border-amber-500/20 shadow-sm'
                                        },
                                        {
                                            label: 'Add as Volunteer',
                                            icon: <UserPlus className="w-4 h-4" />,
                                            onClick: () => handleAssignVolunteer(user),
                                            className: 'text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/20 shadow-sm'
                                        }
                                    ]}
                                    emptyMessage="No users found"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="teamlead-apps" className="space-y-6">
                            {teamLeadApps.length === 0 ? (
                                <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-12 text-center">
                                    <ShieldCheck className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-[var(--text-primary)]">No Team Lead Applications</h3>
                                    <p className="text-[var(--text-secondary)]">
                                        Team Lead applications for sub-events will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {teamLeadApps.map(app => (
                                        <div
                                            key={app.id}
                                            className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-5 hover:border-[var(--accent-primary)]/50 transition-all"
                                        >
                                            <div className="flex items-start gap-4 mb-4">
                                                <img
                                                    src={app.applicant_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.user_id}`}
                                                    className="w-12 h-12 rounded-xl bg-gray-700"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-[var(--text-primary)]">{app.applicant_name}</h4>
                                                    <p className="text-xs text-[var(--text-muted)]">{app.applicant_email}</p>
                                                    {app.applicant_institution && (
                                                        <p className="text-xs text-[var(--text-muted)]">{app.applicant_institution}</p>
                                                    )}
                                                </div>
                                                <StatusBadge status={app.status === 'pending' ? 'pending' : app.status === 'approved' ? 'confirmed' : 'cancelled'} size="sm" />
                                            </div>

                                            <div className="mb-4 p-3 rounded-lg bg-[var(--bg-tertiary)]">
                                                <p className="text-xs font-medium text-[var(--accent-primary)] mb-1">Applying for:</p>
                                                <p className="text-sm font-medium text-[var(--text-primary)]">{app.sub_event_title}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{app.event_title}</p>
                                            </div>

                                            {app.message && (
                                                <div className="mb-4 p-3 rounded-lg bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)]">
                                                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Message:</p>
                                                    <p className="text-sm text-[var(--text-primary)]">{app.message}</p>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    Applied {format(new Date(app.created_at), 'MMM d, yyyy')}
                                                </span>

                                                {app.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                                            onClick={() => handleTeamLeadAction(app.id, 'approve')}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="bg-rose-500 hover:bg-rose-600"
                                                            onClick={() => handleTeamLeadAction(app.id, 'reject')}
                                                        >
                                                            <XCircle className="w-4 h-4 mr-1" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            {/* Assignment Dialog */}
            <Dialog open={isAssignLeadOpen} onOpenChange={setIsAssignLeadOpen}>
                <DialogContent className="bg-[var(--bg-secondary)] border-[var(--border-color)] text-white">
                    <DialogHeader>
                        <DialogTitle>Assign {assignmentType === 'lead' ? 'Team Lead' : 'Volunteer'}</DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            Assign <strong>{selectedUserForLead?.name}</strong> as a {assignmentType} for a sub-event.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Select Sub-Event</Label>
                            <Select value={selectedSubEvent} onValueChange={setSelectedSubEvent}>
                                <SelectTrigger className="bg-[var(--bg-tertiary)] border-[var(--border-color)]">
                                    <SelectValue placeholder="Choose a sub-event..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
                                    {subEvents.length > 0 ? (
                                        subEvents.map((se: any) => (
                                            <SelectItem key={se.id} value={se.id.toString()} className="text-white">
                                                {se.title}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-center text-xs text-[var(--text-muted)]">No sub-events available</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAssignLeadOpen(false)} className="text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Cancel</Button>
                        <Button onClick={handleAssignTeamLead} disabled={isSubmitting} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90">
                            {isSubmitting ? 'Assigning...' : `Assign as ${assignmentType === 'lead' ? 'Team Lead' : 'Volunteer'}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Generate Team Lead Dialog */}
            <Dialog open={isGenerateLeadOpen} onOpenChange={(open) => {
                setIsGenerateLeadOpen(open);
                if (!open) setGeneratedCreds(null);
            }}>
                <DialogContent className="bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]">
                    <DialogHeader>
                        <DialogTitle>Generate Team Lead Credentials</DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            Automatically create a Team Lead account and assign it to a sub-event.
                        </DialogDescription>
                    </DialogHeader>

                    {!generatedCreds ? (
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Select Sub-Event for Assignment</Label>
                                <Select value={genSubEvent} onValueChange={setGenSubEvent}>
                                    <SelectTrigger className="bg-[var(--bg-tertiary)] border-[var(--border-color)]">
                                        <SelectValue placeholder="Choose a sub-event..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
                                        {subEvents.map((se: any) => (
                                            <SelectItem key={se.id} value={se.id.toString()} className="text-[var(--text-primary)]">
                                                {se.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsGenerateLeadOpen(false)} className="border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">Cancel</Button>
                                <Button onClick={handleGenerateTeamLead} disabled={isSubmitting} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white">
                                    {isSubmitting ? 'Generating...' : 'Generate & Assign'}
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <div className="py-4 space-y-4 animate-in fade-in zoom-in-95 font-mono">
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                                <h3 className="text-lg font-bold text-emerald-500">Credentials Generated!</h3>
                                <p className="text-sm text-[var(--text-muted)]">Please copy these details now.</p>
                            </div>

                            <div className="space-y-3 bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)]">
                                <div>
                                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Email / Username</p>
                                    <div className="flex items-center justify-between">
                                        <code className="text-[var(--text-primary)] font-bold text-lg">{generatedCreds.email}</code>
                                        <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(generatedCreds.email)}>Copy</Button>
                                    </div>
                                </div>
                                <div className="h-px bg-[var(--border-color)]" />
                                <div>
                                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Password</p>
                                    <div className="flex items-center justify-between">
                                        <code className="text-[var(--text-primary)] font-bold text-lg">{generatedCreds.password}</code>
                                        <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(generatedCreds.password)}>Copy</Button>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button className="w-full bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]" onClick={() => setIsGenerateLeadOpen(false)}>
                                    Done
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isGenerateLeadOpen} onOpenChange={(open) => {
                setIsGenerateLeadOpen(open);
                if (!open) setGeneratedCreds(null);
            }}>
                <DialogContent className="bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)]">
                    <DialogHeader>
                        <DialogTitle>Generate Team Lead Credentials</DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            Automatically create a Team Lead account and assign it to a sub-event.
                        </DialogDescription>
                    </DialogHeader>

                    {!generatedCreds ? (
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Select Student to Notify</Label>
                                <Select value={genRecipient} onValueChange={setGenRecipient}>
                                    <SelectTrigger className="bg-[var(--bg-tertiary)] border-[var(--border-color)]">
                                        <SelectValue placeholder="Choose a student recipient..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--bg-secondary)] border-[var(--border-color)] max-h-[200px]">
                                        {users.filter(u => u.role === 'student').map((u) => (
                                            <SelectItem key={u.id} value={u.id.toString()} className="text-[var(--text-primary)]">
                                                {u.name} ({u.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Select Sub-Event for Assignment</Label>
                                <Select value={genSubEvent} onValueChange={setGenSubEvent}>
                                    <SelectTrigger className="bg-[var(--bg-tertiary)] border-[var(--border-color)]">
                                        <SelectValue placeholder="Choose a sub-event..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
                                        {subEvents.map((se: any) => (
                                            <SelectItem key={se.id} value={se.id.toString()} className="text-[var(--text-primary)]">
                                                {se.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsGenerateLeadOpen(false)} className="border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">Cancel</Button>
                                <Button onClick={handleGenerateTeamLead} disabled={isSubmitting} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white">
                                    {isSubmitting ? 'Generating...' : 'Generate & Assign'}
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <div className="py-4 space-y-4 animate-in fade-in zoom-in-95 font-mono">
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                                <h3 className="text-lg font-bold text-emerald-500">Credentials Generated!</h3>
                                <p className="text-sm text-[var(--text-muted)]">Please copy these details now.</p>
                            </div>

                            <div className="space-y-3 bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)]">
                                <div>
                                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Email / Username</p>
                                    <div className="flex items-center justify-between">
                                        <code className="text-[var(--text-primary)] font-bold text-lg">{generatedCreds.email}</code>
                                        <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(generatedCreds.email)}>Copy</Button>
                                    </div>
                                </div>
                                <div className="h-px bg-[var(--border-color)]" />
                                <div>
                                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Password</p>
                                    <div className="flex items-center justify-between">
                                        <code className="text-[var(--text-primary)] font-bold text-lg">{generatedCreds.password}</code>
                                        <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(generatedCreds.password)}>Copy</Button>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button className="w-full bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]" onClick={() => setIsGenerateLeadOpen(false)}>
                                    Done
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
