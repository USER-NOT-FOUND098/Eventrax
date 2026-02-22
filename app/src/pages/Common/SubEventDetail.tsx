import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import api from '@/lib/api';
import {
    Clock,
    MapPin,
    User,
    DollarSign,
    Award,
    MessageSquare,
    Loader2,
    ChevronLeft,
    Send,
    Plus,
    Trash,
    Edit,
    AlertTriangle,
    Bell,
    Camera,
    Info,
    Check,
    ImageIcon,
    Package,
    ShieldCheck,
    Users,
    UserMinus,
    Star,
    Search,
    ClipboardList,
    UserCheck
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface SubEvent {
    id: number;
    event_id: number;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    venue: string;
    status: string;
    expected_time: number;
    budget: number | string;
    team_lead_id?: number;
    team_lead_name?: string;
    event_title?: string;
    banner_url?: string;
    lead_instructions?: string;
    team_lead_contact?: string;
    creator_name?: string;
    display_creator_id?: number;
    event_creator_id?: number;
}

interface Announcement {
    id: number;
    event_id: number;
    sub_event_id?: number;
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    created_at: string;
    created_by_name: string;
    sub_event_title?: string;
    is_read?: number;
}

interface Expense {
    id: number;
    title: string;
    amount: number;
    category: string;
    description: string;
    created_at: string;
}

interface Prize {
    id: number;
    title: string;
    value: number;
    description: string;
    position: number;
    winner_name?: string;
}

interface Resource {
    id: number;
    sub_event_id: number;
    name: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    status: string;
}

interface Message {
    id: number;
    sender_id: number;
    sender_name: string;
    sender_role: string;
    content: string;
    created_at: string;
}

const BANNER_TEMPLATES = [
    { id: 'template1', url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80', label: 'Festival' },
    { id: 'template2', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', label: 'Conference' },
    { id: 'template3', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80', label: 'Tech Event' }
];

export default function SubEventDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [subEvent, setSubEvent] = useState<SubEvent | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [subEventApplications, setSubEventApplications] = useState<any[]>([]);
    const [assignedVolunteers, setAssignedVolunteers] = useState<any[]>([]);
    const [eventRegistrants, setEventRegistrants] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [volunteerStatus, setVolunteerStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
    const [isVolunteering, setIsVolunteering] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [announcementForm, setAnnouncementForm] = useState({
        title: '',
        content: '',
        priority: 'medium' as const
    });
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
    const [editingPrize, setEditingPrize] = useState<Prize | null>(null);

    // Form States
    const [editForm, setEditForm] = useState<any>(null);
    const [resourceForm, setResourceForm] = useState({
        name: '',
        quantity: 1,
        unit_cost: 0,
        status: 'available'
    });
    const [expenseForm, setExpenseForm] = useState({
        title: '',
        amount: 0,
        category: 'other',
        description: ''
    });
    const [prizeForm, setPrizeForm] = useState({
        title: '',
        description: '',
        position: 1,
        value: 0
    });

    useEffect(() => {
        fetchSubEventDetail();
    }, [id]);

    const fetchSubEventDetail = async () => {
        if (!id) return;

        try {
            setLoading(true);
            console.log('Fetching sub-event details for ID:', id);

            // Fetch main details
            const subEventRes = await api.get(`/sub_events/index.php?id=${id}`);
            const se = subEventRes.data;

            if (!se || !se.id) {
                console.error('Sub-event not found for ID:', id, se);
                toast.error('Sub-event not found');
                setSubEvent(null);
                setLoading(false);
                return;
            }

            setSubEvent(se);

            // Fetch related data in parallel with allSettled to prevent one failure from blocking everything
            const results = await Promise.allSettled([
                api.get(`/expenses/index.php?event_id=${se.event_id}&sub_event_id=${id}`),
                api.get(`/prizes/index.php?event_id=${se.event_id}&sub_event_id=${id}`),
                api.get(`/chat/index.php?event_id=${se.event_id}&sub_event_id=${id}`),
                api.get(`/sub_events/resources.php?sub_event_id=${id}`),
                api.get(`/announcements/index.php?event_id=${se.event_id}&sub_event_id=${id}`),
                user?.role === 'student' ? api.get(`/registrations/index.php`) : Promise.resolve({ data: [] }),
                user?.role === 'student' ? api.get(`/volunteers/index.php`) : Promise.resolve({ data: [] }),
                user?.role !== 'student' ? api.get(`/volunteers/index.php?sub_event_id=${id}`) : Promise.resolve({ data: [] }),
                user?.role !== 'student' ? api.get(`/registrations/index.php?event_id=${se.event_id}`) : Promise.resolve({ data: [] }),
                user?.role !== 'student' ? api.get(`/volunteers/index.php?sub_event_id=${id}&list_type=assigned`) : Promise.resolve({ data: [] })
            ]);

            const [expensesResult, prizesResult, chatResult, resourcesResult, announcementsResult, regResult, volunteerResult, subAppsResult, registrantsResult, assignedResult] = results;

            // Check if joined
            if (regResult.status === 'fulfilled' && user?.role === 'student') {
                const regs = regResult.value.data;
                const joined = Array.isArray(regs) && regs.some((r: any) => r.sub_event_id == id);
                setIsJoined(joined);
            }

            // Volunteer data for students
            if (volunteerResult.status === 'fulfilled' && user?.role === 'student') {
                const apps = volunteerResult.value.data;
                const myApp = Array.isArray(apps) && apps.find((a: any) => a.sub_event_id == id);
                if (myApp) {
                    setVolunteerStatus(myApp.status);
                }
            }

            // Management data for creators/admins
            if (subAppsResult && subAppsResult.status === 'fulfilled') {
                setSubEventApplications(subAppsResult.value.data);
            }
            if (assignedResult && assignedResult.status === 'fulfilled') {
                console.log('Assigned volunteers API result:', assignedResult.value.data);
                setAssignedVolunteers(assignedResult.value.data || []);
            }
            if (registrantsResult && registrantsResult.status === 'fulfilled') {
                // Filter out duplicates (students might have sub-event registrations too)
                const students = registrantsResult.value.data;
                const uniqueStudents = Array.from(new Map(students.map((s: any) => [s.student_id, {
                    id: s.student_id,
                    name: s.student_name,
                    email: s.student_email,
                    avatar: s.student_avatar,
                    role: 'Student'
                }])).values());
                setEventRegistrants(uniqueStudents);
            }

            // Expenses
            if (expensesResult.status === 'fulfilled') {
                setExpenses(Array.isArray(expensesResult.value.data) ? expensesResult.value.data.filter((e: any) => e.sub_event_id == id) : []);
            } else {
                console.error('Failed to load expenses:', expensesResult.reason);
            }

            // Prizes (filter to only show sub-event prizes, not main event prizes)
            if (prizesResult.status === 'fulfilled') {
                setPrizes(Array.isArray(prizesResult.value.data) ? prizesResult.value.data.filter((p: any) => p.sub_event_id == id) : []);
            } else {
                console.error('Failed to load prizes:', prizesResult.reason);
            }

            // Chat
            if (chatResult.status === 'fulfilled') {
                setMessages(Array.isArray(chatResult.value.data) ? chatResult.value.data : []);
            } else {
                console.error('Failed to load chat:', chatResult.reason);
            }

            // Resources
            if (resourcesResult.status === 'fulfilled') {
                setResources(Array.isArray(resourcesResult.value.data) ? resourcesResult.value.data : []);
            } else {
                console.error('Failed to load resources:', resourcesResult.reason);
            }

            // Announcements
            if (announcementsResult.status === 'fulfilled') {
                setAnnouncements(Array.isArray(announcementsResult.value.data) ? announcementsResult.value.data : []);
            } else {
                console.error('Failed to load announcements:', announcementsResult.reason);
            }

        } catch (error: any) {
            console.error('Failed to fetch main details:', error);
            // Log specific API error response if available
            if (error.response) {
                console.error('API Error Response:', error.response.data);
                console.error('API Status:', error.response.status);
            }
            toast.error(`Failed to load sub-event details: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !subEvent) return;

        try {
            await api.post('/chat/index.php', {
                event_id: subEvent.event_id,
                sub_event_id: subEvent.id,
                content: newMessage.trim()
            });
            setNewMessage('');
            // Refresh messages
            const chatRes = await api.get(`/chat/index.php?event_id=${subEvent.event_id}&sub_event_id=${subEvent.id}`);
            setMessages(Array.isArray(chatRes.data) ? chatRes.data : []);
        } catch (error) {
            toast.error('Failed to send message');
        }
    };

    const handleUpdateSubEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm) return;

        try {
            await api.put(`/sub_events/index.php?id=${id}`, {
                id: id, // Backend expects id in body
                ...editForm,
                start_time: editForm.start_time,
                end_time: editForm.end_time,
                banner_url: editForm.banner_url,
                lead_instructions: editForm.lead_instructions,
                team_lead_contact: editForm.team_lead_contact,
                team_lead_id: editForm.team_lead_id
            });
            toast.success('Sub-event updated successfully');
            setIsEditModalOpen(false);
            fetchSubEventDetail();
        } catch (error) {
            toast.error('Failed to update sub-event');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large. Maximum size: 5MB');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('http://localhost/api/v1/upload/image.php', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                setEditForm((prev: any) => ({ ...prev, banner_url: data.url }));
                toast.success('Image uploaded successfully!');
            } else {
                toast.error(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handlePostAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subEvent || !announcementForm.title || !announcementForm.content) return;

        try {
            await api.post('/announcements/index.php', {
                event_id: subEvent.event_id,
                sub_event_id: subEvent.id,
                title: announcementForm.title,
                content: announcementForm.content,
                priority: announcementForm.priority
            });
            toast.success('Announcement posted');
            setAnnouncementForm({ title: '', content: '', priority: 'medium' });
            setIsAnnouncementModalOpen(false);

            // Refresh announcements
            const res = await api.get(`/announcements/index.php?event_id=${subEvent.event_id}&sub_event_id=${subEvent.id}`);
            setAnnouncements(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            toast.error('Failed to post announcement');
        }
    };

    const handleMarkRead = async (announcementId: number) => {
        try {
            await api.put(`/announcements/index.php?id=${announcementId}`);
            setAnnouncements((prev: Announcement[]) =>
                prev.map((ann: Announcement) => ann.id === announcementId ? { ...ann, is_read: 1 } : ann)
            );
            toast.success('Marked as read');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteSubEvent = async () => {
        try {
            await api.post('/sub_events/delete.php', { sub_event_id: Number(id) });
            toast.success('Sub-event deleted successfully');
            setIsDeleteModalOpen(false);
            navigate(-1);
        } catch (error: any) {
            console.error('Failed to delete sub-event:', error);
            toast.error(error.response?.data?.error || 'Failed to delete sub-event');
        }
    };

    const handleSaveResource = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingResource) {
                await api.put('/sub_events/resources.php', { ...resourceForm, id: editingResource.id });
                toast.success('Resource updated successfully');
            } else {
                await api.post('/sub_events/resources.php', { ...resourceForm, sub_event_id: id });
                toast.success('Resource added successfully');
            }
            setIsResourceModalOpen(false);
            setEditingResource(null);
            setResourceForm({ name: '', quantity: 1, unit_cost: 0, status: 'available' });

            // Refresh resources
            const resourcesRes = await api.get(`/sub_events/resources.php?sub_event_id=${id}`);
            setResources(Array.isArray(resourcesRes.data) ? resourcesRes.data : []);
        } catch (error) {
            toast.error('Failed to save resource');
        }
    };

    const handleDeleteResource = async (resourceId: number) => {
        try {
            await api.delete(`/sub_events/resources.php/?id=${resourceId}`);
            toast.success('Resource deleted successfully');
            const resourcesRes = await api.get(`/sub_events/resources.php/?sub_event_id=${id}`);
            setResources(Array.isArray(resourcesRes.data) ? resourcesRes.data : []);
        } catch (error) {
            toast.error('Failed to delete resource');
        }
    };

    const openEditModal = () => {
        if (!subEvent) return;
        setEditForm({
            id: subEvent.id,
            title: subEvent.title,
            description: subEvent.description,
            start_time: subEvent.start_time,
            end_time: subEvent.end_time,
            venue: subEvent.venue,
            status: subEvent.status,
            expected_time: subEvent.expected_time,
            budget: subEvent.budget,
            banner_url: subEvent.banner_url,
            lead_instructions: subEvent.lead_instructions,
            team_lead_contact: subEvent.team_lead_contact || '',
            team_lead_id: subEvent.team_lead_id || null
        });
        setIsEditModalOpen(true);
    };

    const openAddResourceModal = () => {
        setEditingResource(null);
        setResourceForm({ name: '', quantity: 1, unit_cost: 0, status: 'available' });
        setIsResourceModalOpen(true);
    };

    const openEditResourceModal = (resource: Resource) => {
        setEditingResource(resource);
        setResourceForm({
            name: resource.name,
            quantity: Number(resource.quantity),
            unit_cost: Number(resource.unit_cost),
            status: resource.status
        });
        setIsResourceModalOpen(true);
    };

    const handleDeleteExpense = async (expenseId: number) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        if (!subEvent) return;
        try {
            await api.delete(`/expenses/index.php?id=${expenseId}`);
            toast.success('Expense deleted successfully');
            // Refresh expenses
            const expensesRes = await api.get(`/expenses/index.php?event_id=${subEvent.event_id}&sub_event_id=${id}`);
            setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data.filter((e: any) => e.sub_event_id == id) : []);
        } catch (error) {
            toast.error('Failed to delete expense');
        }
    };



    // Expense handlers
    const openAddExpenseModal = () => {
        setEditingExpense(null);
        setExpenseForm({ title: '', amount: 0, category: 'other', description: '' });
        setIsExpenseModalOpen(true);
    };

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subEvent) return;
        try {
            if (editingExpense) {
                await api.put('/expenses/index.php', { ...expenseForm, id: editingExpense.id, event_id: subEvent.event_id, sub_event_id: id });
                toast.success('Expense updated successfully');
            } else {
                await api.post('/expenses/index.php', { ...expenseForm, event_id: subEvent.event_id, sub_event_id: id });
                toast.success('Expense logged successfully');
            }
            setIsExpenseModalOpen(false);
            setEditingExpense(null);
            setExpenseForm({ title: '', amount: 0, category: 'other', description: '' });

            // Refresh expenses
            const expensesRes = await api.get(`/expenses/index.php?event_id=${subEvent.event_id}&sub_event_id=${id}`);
            setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data.filter((e: any) => e.sub_event_id == id) : []);
        } catch (error) {
            toast.error('Failed to save expense');
        }
    };

    // Prize handlers
    const handleDeletePrize = async (prizeId: number) => {
        if (!confirm('Are you sure you want to delete this prize?')) return;
        if (!subEvent) return;
        try {
            await api.delete(`/prizes/index.php?id=${prizeId}`);
            toast.success('Prize deleted successfully');

            // Refresh prizes
            const prizesRes = await api.get(`/prizes/index.php?event_id=${subEvent.event_id}&sub_event_id=${id}`);
            setPrizes(Array.isArray(prizesRes.data) ? prizesRes.data.filter((p: any) => p.sub_event_id == id) : []);
        } catch (error) {
            toast.error('Failed to delete prize');
        }
    };

    // Prize handlers
    const openAddPrizeModal = () => {
        setEditingPrize(null);
        setPrizeForm({ title: '', description: '', position: 1, value: 0 });
        setIsPrizeModalOpen(true);
    };

    const openEditPrizeModal = (prize: Prize) => {
        setEditingPrize(prize);
        setPrizeForm({
            title: prize.title,
            description: prize.description || '',
            position: Number(prize.position),
            value: Number(prize.value)
        });
        setIsPrizeModalOpen(true);
    };

    const handleJoinSubEvent = async () => {
        if (!subEvent || isJoined || isJoining || !user) return;
        setIsJoining(true);
        try {
            await api.post('/registrations/index.php', {
                event_id: subEvent.event_id,
                sub_event_id: id
            });
            toast.success('Successfully joined sub-event!');
            setIsJoined(true);
        } catch (error: any) {
            console.error('Failed to join sub-event:', error);
            toast.error(error.response?.data?.error || 'Failed to join sub-event');
        } finally {
            setIsJoining(false);
        }
    };

    const handleApplyVolunteer = async (role: 'Volunteer' | 'Team Lead' = 'Volunteer') => {
        if (!subEvent || volunteerStatus || isVolunteering || !user) return;
        setIsVolunteering(true);
        try {
            await api.post('/volunteers/index.php', {
                sub_event_id: id,
                role: role,
                message: `Applying as a ${role} for ${subEvent.title}`
            });
            toast.success(`${role} application submitted!`);
            setVolunteerStatus('pending');
        } catch (error: any) {
            console.error('Failed to apply:', error);
            toast.error(error.response?.data?.error || 'Failed to apply');
        } finally {
            setIsVolunteering(false);
        }
    };

    const handleActionApplication = async (applicationId: number, action: 'approve' | 'reject') => {
        try {
            await api.post('/volunteers/approve.php', {
                application_id: applicationId,
                action
            });
            toast.success(`Application ${action === 'approve' ? 'approved' : 'rejected'}`);
            // Refresh apps
            const subAppsRes = await api.get(`/volunteers/index.php?sub_event_id=${id}`);
            setSubEventApplications(subAppsRes.data);

            if (action === 'approve') {
                fetchSubEventDetail();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Action failed');
        }
    };

    const handleDirectAssign = async (userId: number, type: 'lead' | 'volunteer') => {
        try {
            await api.post('/volunteers/assign.php', {
                sub_event_id: id,
                user_id: userId,
                type
            });
            toast.success(`${type === 'lead' ? 'Team Lead' : 'Volunteer'} assigned!`);
            fetchSubEventDetail();
            // Refresh apps
            const subAppsRes = await api.get(`/volunteers/index.php?sub_event_id=${id}`);
            setSubEventApplications(subAppsRes.data);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Assignment failed');
        }
    };

    const handleRemoveMember = async (userId: number, type: 'lead' | 'volunteer') => {
        const reason = window.prompt(`Reason for removing ${type === 'lead' ? 'Team Lead' : 'Volunteer'}? (Optional)`);
        if (reason === null) return; // Cancelled

        try {
            await api.post('/volunteers/remove.php', {
                sub_event_id: id,
                user_id: userId,
                type,
                message: reason
            });
            toast.success(`Member removed from ${type} role`);
            fetchSubEventDetail();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Removal failed');
        }
    };

    const handleSavePrize = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subEvent) return;
        try {
            if (editingPrize) {
                await api.put('/prizes/index.php', { ...prizeForm, id: editingPrize.id, event_id: subEvent.event_id, sub_event_id: id });
                toast.success('Prize updated successfully');
            } else {
                await api.post('/prizes/index.php', { ...prizeForm, event_id: subEvent.event_id, sub_event_id: id });
                toast.success('Prize added successfully');
            }
            setIsPrizeModalOpen(false);
            setEditingPrize(null);
            setPrizeForm({ title: '', description: '', position: 1, value: 0 });

            // Refresh prizes
            const prizesRes = await api.get(`/prizes/index.php?event_id=${subEvent.event_id}&sub_event_id=${id}`);
            setPrizes(Array.isArray(prizesRes.data) ? prizesRes.data.filter((p: any) => p.sub_event_id == id) : []);
        } catch (error) {
            toast.error('Failed to save prize');
        }
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalPrizes = prizes.reduce((sum, p) => sum + Number(p.value), 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07070A] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!subEvent) {
        return (
            <div className="min-h-screen bg-[#07070A] p-20 text-center">
                <h1 className="text-white text-2xl font-bold">Sub-event not found</h1>
                <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Sidebar />
            <div className="lg:ml-64">
                <Header />
                {subEvent.banner_url && (
                    <div className="relative h-64 md:h-80 w-full overflow-hidden">
                        <img
                            src={subEvent.banner_url}
                            className="w-full h-full object-cover"
                            alt={subEvent.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
                    </div>
                )}
                <main className="p-6 relative">
                    {subEvent.banner_url && <div className="h-20" />} {/* Spacer if banner is present */}
                    <div className="mb-6">
                        <Button
                            variant="ghost"
                            className="text-gray-400 hover:text-white p-0 mb-4 h-auto"
                            onClick={() => navigate(-1)}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back to List
                        </Button>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20">
                                        Internal Duties
                                    </Badge>
                                    <StatusBadge status={subEvent.status as any} size="sm" />
                                </div>
                                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>{subEvent.title}</h1>
                                <p className="mt-1 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{subEvent.event_title || 'Main Event'}</span>
                                    •
                                    <span>{format(new Date(subEvent.start_time), 'EEEE, MMM d, yyyy')}</span>
                                </p>
                            </div>

                            {(user?.role === 'admin' || user?.role === 'creator') && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
                                        onClick={openEditModal}
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
                                        onClick={() => setIsDeleteModalOpen(true)}
                                    >
                                        <Trash className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            )}

                            {user?.role === 'student' && (
                                <div className="flex gap-2">
                                    {isJoined ? (
                                        <Button
                                            disabled
                                            className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold"
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Joined
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleJoinSubEvent}
                                            disabled={isJoining}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20"
                                        >
                                            {isJoining ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Plus className="w-4 h-4 mr-2" />
                                            )}
                                            Join Sub-Event
                                        </Button>
                                    )}

                                    {volunteerStatus === 'approved' ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4 py-2 text-sm font-bold h-10">
                                            <ShieldCheck className="w-4 h-4 mr-2" />
                                            Official Member
                                        </Badge>
                                    ) : volunteerStatus === 'pending' ? (
                                        <Button
                                            disabled
                                            className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold h-10"
                                        >
                                            <Clock className="w-4 h-4 mr-2" />
                                            App Pending
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleApplyVolunteer('Volunteer')}
                                                disabled={isVolunteering}
                                                variant="outline"
                                                className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 font-bold h-10"
                                            >
                                                {isVolunteering ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Users className="w-4 h-4 mr-2" />
                                                )}
                                                Apply Volunteer
                                            </Button>
                                            <Button
                                                onClick={() => handleApplyVolunteer('Team Lead')}
                                                disabled={isVolunteering}
                                                variant="outline"
                                                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 font-bold h-10"
                                            >
                                                <Star className="w-4 h-4 mr-2" />
                                                Apply Lead
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sub-Event Banner */}
                    {subEvent.banner_url && (
                        <div className="relative h-64 rounded-3xl overflow-hidden mb-8 border border-[var(--border-color)]">
                            <img
                                src={subEvent.banner_url.startsWith('http') ? subEvent.banner_url : `http://localhost${subEvent.banner_url}`}
                                alt={subEvent.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-6 left-8">
                                <Badge className="bg-white/20 text-white backdrop-blur-md border-white/30 mb-2">
                                    Sub-Event Highlights
                                </Badge>
                                <h2 className="text-2xl font-bold text-white">{subEvent.title}</h2>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <DashboardCard
                            title="Assigned Lead"
                            value={subEvent.team_lead_name || 'Unassigned'}
                            subtitle="Managed by"
                            icon={User}
                            color="blue"
                        />
                        <DashboardCard
                            title="Budget Allocated"
                            value={`₹${subEvent.budget}`}
                            subtitle="Total Limit"
                            icon={DollarSign}
                            color="indigo"
                        />
                        <DashboardCard
                            title="Current Spending"
                            value={`₹${totalExpenses}`}
                            subtitle={`${Math.round((totalExpenses / Number(subEvent.budget || 1)) * 100)}% of budget`}
                            icon={DollarSign}
                            color={totalExpenses > Number(subEvent.budget) ? "rose" : "green"}
                        />
                        <DashboardCard
                            title="Prizes"
                            value={`₹${totalPrizes}`}
                            subtitle={`${prizes.length} items`}
                            icon={Award}
                            color="amber"
                        />
                    </div>

                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-3 justify-start w-full border-none">
                            <TabsTrigger
                                value="overview"
                                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-transparent dark:border-white/5 hover:bg-white hover:text-black dark:hover:bg-white/10 dark:hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
                            >
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="budget"
                                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-transparent dark:border-white/5 hover:bg-white hover:text-black dark:hover:bg-white/10 dark:hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
                            >
                                Budget & Expenses
                            </TabsTrigger>
                            <TabsTrigger
                                value="prizes"
                                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-transparent dark:border-white/5 hover:bg-white hover:text-black dark:hover:bg-white/10 dark:hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
                            >
                                Prizes
                            </TabsTrigger>
                            <TabsTrigger
                                value="resources"
                                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-transparent dark:border-white/5 hover:bg-white hover:text-black dark:hover:bg-white/10 dark:hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
                            >
                                Resources
                            </TabsTrigger>
                            <TabsTrigger
                                value="announcements"
                                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-transparent dark:border-white/5 hover:bg-white hover:text-black dark:hover:bg-white/10 dark:hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
                            >
                                Announcements
                            </TabsTrigger>
                            <TabsTrigger
                                value="chat"
                                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-transparent dark:border-white/5 hover:bg-white hover:text-black dark:hover:bg-white/10 dark:hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
                            >
                                Duty Chat
                            </TabsTrigger>
                            {user?.role !== 'student' && (
                                <TabsTrigger
                                    value="team"
                                    className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-lg bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-transparent dark:border-white/5 hover:bg-white hover:text-black dark:hover:bg-white/10 dark:hover:text-white px-6 py-3 rounded-xl font-medium transition-all"
                                >
                                    Team & Apps
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="overview">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="lg:col-span-2 rounded-2xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div style={{ color: 'var(--text-secondary)' }}>
                                            {subEvent.description || 'No detailed description provided for this sub-event duties.'}
                                        </div>

                                        {subEvent.lead_instructions && (
                                            <div className="mt-6 p-4 rounded-xl border-l-4 border-indigo-500 bg-indigo-500/5">
                                                <h4 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2">
                                                    <Info className="w-4 h-4" />
                                                    Special Instructions for Team Lead
                                                </h4>
                                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                                    {subEvent.lead_instructions}
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-8 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Timing</h4>
                                                <div className="space-y-2">
                                                    <div className="flex items-center text-sm gap-2" style={{ color: 'var(--text-secondary)' }}>
                                                        <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                                        <span>Starts: {format(new Date(subEvent.start_time), 'h:mm a')}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm gap-2" style={{ color: 'var(--text-secondary)' }}>
                                                        <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                                        <span>Ends: {format(new Date(subEvent.end_time), 'h:mm a')}</span>
                                                    </div>
                                                    <div className="flex items-center text-[11px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded w-fit">
                                                        {subEvent.expected_time} MINS ESTIMATED
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Location</h4>
                                                <div className="flex items-start text-sm gap-2" style={{ color: 'var(--text-secondary)' }}>
                                                    <MapPin className="w-4 h-4 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                                                    <span>{subEvent.venue || 'TBD'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="space-y-6">
                                    <Card className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                        <div className="h-2 bg-indigo-600" />
                                        <CardHeader>
                                            <CardTitle className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Stakeholders</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                                        {subEvent.team_lead_name?.[0] || 'L'}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold tracking-tighter" style={{ color: 'var(--text-muted)' }}>Team Lead</p>
                                                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{subEvent.team_lead_name || 'Unassigned'}</p>
                                                    </div>
                                                </div>
                                                {user?.role !== 'student' && subEvent.team_lead_id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
                                                        onClick={() => handleRemoveMember(subEvent.team_lead_id!, 'lead')}
                                                    >
                                                        <UserMinus className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            {user?.role !== 'student' && subEvent?.creator_name && (
                                                <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                                                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold">
                                                        <ShieldCheck className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold tracking-tighter" style={{ color: 'var(--text-muted)' }}>Managed By</p>
                                                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                            {subEvent.creator_name} <span className="text-[10px] text-indigo-400 ml-1">#{subEvent.display_creator_id}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Banner Preview Card */}
                                    <Card className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                        <div className="h-2 bg-amber-500" />
                                        <CardHeader>
                                            <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                                <ImageIcon className="w-5 h-5 text-amber-500" />
                                                Banner
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {subEvent.banner_url ? (
                                                <div className="space-y-3">
                                                    <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                                                        <img
                                                            src={subEvent.banner_url}
                                                            alt="Sub-event banner"
                                                            className="w-full h-32 object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                                    </div>
                                                    <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                                                        Current banner image
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                                                    <ImageIcon className="w-8 h-8 mb-2" style={{ color: 'var(--text-muted)' }} />
                                                    <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                                                        No banner set
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="budget" className="space-y-6">
                            <Card className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="" style={{ color: 'var(--text-primary)' }}>Expense Tracking</CardTitle>
                                        <CardDescription style={{ color: 'var(--text-secondary)' }}>Monitor spending for this sub-event</CardDescription>
                                    </div>
                                    {(user?.role === 'admin' || user?.role === 'creator' || user?.role === 'teamlead') && (
                                        <Button size="sm" variant="secondary" className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md" onClick={openAddExpenseModal}>
                                            <Plus className="w-4 h-4 mr-2" /> Log Expense
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {expenses.map((expense) => (
                                            <div key={expense.id} className="flex items-center justify-between p-4 rounded-xl border transition-colors" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)' }}>
                                                        <DollarSign className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{expense.title}</p>
                                                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                            <span>{expense.category}</span>
                                                            <span>•</span>
                                                            <span>{format(new Date(expense.created_at), 'MMM d')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>₹{expense.amount}</p>
                                                    {(user?.role === 'admin' || user?.role === 'creator' || user?.role === 'teamlead') && (
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:text-rose-500" style={{ color: 'var(--text-muted)' }} onClick={() => handleDeleteExpense(expense.id)}>
                                                            <Trash className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {expenses.length === 0 && (
                                            <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>No expenses recorded for this sub-event.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Resource Costs Summary */}
                            <Card className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                <CardHeader>
                                    <CardTitle className="" style={{ color: 'var(--text-primary)' }}>Resource Costs</CardTitle>
                                    <CardDescription style={{ color: 'var(--text-secondary)' }}>Equipment and materials allocated for this sub-event</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {resources.map((resource) => (
                                            <div key={resource.id} className="flex items-center justify-between p-4 rounded-xl border transition-colors" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)' }}>
                                                        <Package className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{resource.name}</p>
                                                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                            <span>Qty: {resource.quantity}</span>
                                                            <span>•</span>
                                                            <span>₹{resource.unit_cost} each</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900 dark:text-white">₹{resource.total_cost}</p>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] uppercase tracking-wider mt-1",
                                                        resource.status === 'available' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                            resource.status === 'in-use' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                                "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                                    )}>
                                                        {resource.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                        {resources.length === 0 && (
                                            <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>No resources allocated yet.</div>
                                        )}
                                    </div>

                                    {/* Budget Summary */}
                                    {(expenses.length > 0 || resources.length > 0) && (
                                        <div className="mt-6 p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Expenses</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">₹{totalExpenses.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Resource Costs</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">₹{resources.reduce((sum, r) => sum + Number(r.total_cost), 0).toLocaleString()}</span>
                                            </div>
                                            <div className="pt-3 border-t flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                                                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Grand Total</span>
                                                <span className="text-xl font-bold text-indigo-500">
                                                    ₹{(totalExpenses + resources.reduce((sum, r) => sum + Number(r.total_cost), 0)).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="resources" className="space-y-6">
                            <Card className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle style={{ color: 'var(--text-primary)' }}>Required Resources</CardTitle>
                                        <CardDescription style={{ color: 'var(--text-secondary)' }}>Manage equipment and infrastructure for this sub-event</CardDescription>
                                    </div>
                                    {(user?.role === 'admin' || user?.role === 'creator') && (
                                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={openAddResourceModal}>
                                            <Plus className="w-4 h-4 mr-1" /> Add Resource
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                                        <Table>
                                            <TableHeader style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                                <TableRow className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                                                    <TableHead style={{ color: 'var(--text-muted)' }}>Resource Name</TableHead>
                                                    <TableHead style={{ color: 'var(--text-muted)' }}>Quantity</TableHead>
                                                    <TableHead style={{ color: 'var(--text-muted)' }}>Unit Cost</TableHead>
                                                    <TableHead style={{ color: 'var(--text-muted)' }}>Total Cost</TableHead>
                                                    <TableHead style={{ color: 'var(--text-muted)' }}>Status</TableHead>
                                                    {(user?.role === 'admin' || user?.role === 'creator') && (
                                                        <TableHead className="text-right" style={{ color: 'var(--text-muted)' }}>Actions</TableHead>
                                                    )}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {resources.map((resource) => (
                                                    <TableRow key={resource.id} className="border-b transition-colors" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                                                        <TableCell className="font-medium" style={{ color: 'var(--text-primary)' }}>{resource.name}</TableCell>
                                                        <TableCell style={{ color: 'var(--text-secondary)' }}>{resource.quantity}</TableCell>
                                                        <TableCell style={{ color: 'var(--text-secondary)' }}>₹{resource.unit_cost}</TableCell>
                                                        <TableCell className="font-bold" style={{ color: 'var(--text-primary)' }}>₹{resource.total_cost}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={cn(
                                                                "text-[10px] uppercase tracking-wider",
                                                                resource.status === 'available' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                                    resource.status === 'in-use' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                                        "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                                            )}>
                                                                {resource.status}
                                                            </Badge>
                                                        </TableCell>
                                                        {(user?.role === 'admin' || user?.role === 'creator') && (
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10" onClick={() => openEditResourceModal(resource)}>
                                                                        <Edit className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => handleDeleteResource(resource.id)}>
                                                                        <Trash className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))}
                                                {resources.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                                                            No resources assigned to this sub-event yet.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {resources.length > 0 && (
                                        <div className="mt-4 p-4 rounded-xl border flex justify-between items-center" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                                            <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>Grand Total for Resources</span>
                                            <span className="text-xl font-bold text-indigo-500">
                                                ₹{resources.reduce((sum, r) => sum + Number(r.total_cost), 0).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="prizes" className="space-y-6">
                            <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="" style={{ color: 'var(--text-primary)' }}>Sub-Event Prizes</CardTitle>
                                        <CardDescription style={{ color: 'var(--text-secondary)' }}>Prizes specific to this competition/duty</CardDescription>
                                    </div>
                                    {(user?.role === 'admin' || user?.role === 'creator') && (
                                        <Button size="sm" variant="secondary" className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md" onClick={openAddPrizeModal}>
                                            <Plus className="w-4 h-4 mr-2" /> Add Prize
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {prizes.map((prize) => (
                                            <div key={prize.id} className="p-4 rounded-2xl border relative group" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                                        Pos {prize.position}
                                                    </Badge>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>₹{prize.value}</p>
                                                        {(user?.role === 'admin' || user?.role === 'creator') && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                                                                    onClick={() => openEditPrizeModal(prize)}
                                                                >
                                                                    <Edit className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                                                    onClick={() => handleDeletePrize(prize.id)}
                                                                >
                                                                    <Trash className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{prize.title}</h4>
                                                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{prize.description}</p>

                                                {prize.winner_name ? (
                                                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest text-center">
                                                        Winner: {prize.winner_name}
                                                    </div>
                                                ) : (
                                                    <div className="p-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-center" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                                                        Winner Not Declared
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {prizes.length === 0 && (
                                            <div className="col-span-full text-center py-10 italic" style={{ color: 'var(--text-muted)' }}>No prizes listed for this sub-event.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="announcements" className="space-y-6">
                            <Card className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle style={{ color: 'var(--text-primary)' }}>Notice Board</CardTitle>
                                        <CardDescription style={{ color: 'var(--text-secondary)' }}>Official updates for this sub-event</CardDescription>
                                    </div>
                                    {(user?.role === 'admin' || user?.role === 'creator') && (
                                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsAnnouncementModalOpen(true)}>
                                            <Bell className="w-4 h-4 mr-2" /> Post Notice
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {announcements.map((ann) => (
                                        <div key={ann.id} className="p-4 rounded-xl border relative" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge className={cn(
                                                        "text-[10px] uppercase tracking-wider",
                                                        ann.priority === 'urgent' ? "bg-rose-500 text-white" : "bg-indigo-500/10 text-indigo-400"
                                                    )}>
                                                        {ann.priority}
                                                    </Badge>
                                                    {ann.is_read ? (
                                                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                                                            <Check className="w-3 h-3" /> Read
                                                        </span>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-2 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                                                            onClick={() => handleMarkRead(ann.id)}
                                                        >
                                                            Mark Read
                                                        </Button>
                                                    )}
                                                </div>
                                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{format(new Date(ann.created_at), 'MMM d, h:mm a')}</span>
                                            </div>
                                            <h4 className="font-bold mb-1 text-gray-900 dark:text-white">{ann.title}</h4>
                                            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{ann.content}</p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                                    <User className="w-3 h-3" />
                                                    <span>Posted by {ann.created_by_name}</span>
                                                </div>
                                                {user?.role === 'admin' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
                                                        onClick={async () => {
                                                            try {
                                                                await api.delete(`/announcements/index.php?id=${ann.id}`);
                                                                setAnnouncements(prev => prev.filter(a => a.id !== ann.id));
                                                                toast.success('Notice deleted');
                                                            } catch (error) {
                                                                toast.error('Failed to delete');
                                                            }
                                                        }}
                                                    >
                                                        <Trash className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {announcements.length === 0 && (
                                        <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>No announcements yet for this sub-event.</div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="chat" className="h-[500px] flex flex-col gap-4">
                            <Card className="flex-1 rounded-2xl overflow-hidden flex flex-col border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                <CardHeader className="py-4 border-b" style={{ backgroundColor: 'var(--bg-tertiary)', borderBottomColor: 'var(--border-color)' }}>
                                    <CardTitle className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Duty Communication Channel
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "max-w-[80%] space-y-1",
                                                String(msg.sender_id) === String(user?.id) ? "ml-auto items-end" : "mr-auto"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: 'var(--text-muted)' }}>
                                                    {msg.sender_name} ({msg.sender_role})
                                                </span>
                                                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                                    {format(new Date(msg.created_at), 'h:mm a')}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                "p-3 rounded-2xl text-sm",
                                                String(msg.sender_id) === String(user?.id)
                                                    ? "bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/10"
                                                    : "rounded-tl-none border"
                                            )} style={String(msg.sender_id) === String(user?.id) ? {} : { backgroundColor: 'var(--bg-muted)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {messages.length === 0 && (
                                        <div className="h-full flex items-center justify-center text-center p-8">
                                            <div className="space-y-3">
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                                    <MessageSquare className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                                                </div>
                                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No communications yet. Start coordinating with your team lead or creator.</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="p-4 border-t" style={{ backgroundColor: 'var(--bg-tertiary)', borderTopColor: 'var(--border-color)' }}>
                                    <form onSubmit={handleSendMessage} className="flex gap-3">
                                        <Input
                                            placeholder="Coordination message..."
                                            className="flex-1 bg-white/5 border-white/10"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                        <Button type="submit" size="icon" className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </div>
                            </Card>
                        </TabsContent>
                        <TabsContent value="team" className="space-y-6">
                            {/* Current Team Section */}
                            <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                                <Users className="w-5 h-5 text-emerald-400" />
                                                Active Team
                                            </CardTitle>
                                            <CardDescription>Members currently assigned to this sub-event</CardDescription>
                                        </div>
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                            {assignedVolunteers.length + (subEvent?.team_lead_id ? 1 : 0)} Active
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Team Lead */}
                                        {subEvent?.team_lead_name && (
                                            <div className="flex items-center justify-between p-3 rounded-xl border bg-amber-500/5 border-amber-500/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold">
                                                        <ShieldCheck className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{subEvent.team_lead_name}</p>
                                                        <p className="text-[10px] text-amber-500 font-bold uppercase">Team Lead</p>
                                                    </div>
                                                </div>
                                                {(user?.role === 'admin' || user?.role === 'creator') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
                                                        onClick={() => handleRemoveMember(subEvent.team_lead_id!, 'lead')}
                                                    >
                                                        <UserMinus className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        {/* Volunteers */}
                                        {assignedVolunteers.map((vol) => (
                                            <div key={vol.id} className="flex items-center justify-between p-3 rounded-xl border bg-white/5 border-white/10">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={vol.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${vol.user_id}`}
                                                        className="w-10 h-10 rounded-lg bg-gray-700"
                                                    />
                                                    <div>
                                                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{vol.user_name}</p>
                                                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{vol.role || 'Volunteer'}</p>
                                                    </div>
                                                </div>
                                                {(user?.role === 'admin' || user?.role === 'creator') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
                                                        onClick={() => handleRemoveMember(vol.user_id, 'volunteer')}
                                                    >
                                                        <UserMinus className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}

                                        {!subEvent?.team_lead_id && assignedVolunteers.length === 0 && (
                                            <div className="col-span-full py-8 text-center text-sm italic" style={{ color: 'var(--text-muted)' }}>
                                                The team is empty. Use the sections below to add members.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Applications Section */}
                                <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                            <ClipboardList className="w-5 h-5 text-indigo-400" />
                                            Pending Applications
                                        </CardTitle>
                                        <CardDescription>Review who wants to join this sub-event</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {subEventApplications.filter(a => a.status === 'pending').map((app) => (
                                            <div key={app.id} className="p-4 rounded-xl border bg-white/5 border-white/10 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={app.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.student_id}`}
                                                        className="w-10 h-10 rounded-lg bg-gray-700"
                                                    />
                                                    <div>
                                                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{app.student_name}</p>
                                                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-indigo-400 border-indigo-500/30">
                                                            {app.role}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3"
                                                        onClick={() => handleActionApplication(app.id, 'approve')}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 h-8 px-3"
                                                        onClick={() => handleActionApplication(app.id, 'reject')}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {subEventApplications.filter(a => a.status === 'pending').length === 0 && (
                                            <div className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                                                No pending applications.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Direct Assignment Section */}
                                <Card className="rounded-2xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                    <CardHeader>
                                        <CardTitle className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                            <UserCheck className="w-5 h-5 text-amber-400" />
                                            Direct Assignment
                                        </CardTitle>
                                        <CardDescription>Select from students registered for the main event</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                                <Input
                                                    placeholder="Search registered students (name or email)..."
                                                    className="pl-10 bg-white/5 border-white/10 h-10"
                                                    onChange={(e) => {
                                                        const query = e.target.value.toLowerCase();
                                                        const items = document.querySelectorAll('.user-assign-item');
                                                        items.forEach((item: any) => {
                                                            const name = item.getAttribute('data-name')?.toLowerCase() || '';
                                                            const email = item.getAttribute('data-email')?.toLowerCase() || '';
                                                            item.style.display = (name.includes(query) || email.includes(query)) ? 'flex' : 'none';
                                                        });
                                                    }}
                                                />
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                                {eventRegistrants.map((u) => (
                                                    <div
                                                        key={u.id}
                                                        data-name={u.name}
                                                        data-email={u.email}
                                                        className="user-assign-item p-3 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 flex items-center justify-between transition-all"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <img
                                                                src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`}
                                                                className="w-8 h-8 rounded-full bg-indigo-500/20"
                                                            />
                                                            <div>
                                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                                                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Student</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 px-2 text-[10px] text-amber-400 hover:bg-amber-500/10"
                                                                onClick={() => handleDirectAssign(u.id, 'lead')}
                                                            >
                                                                Lead
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 px-2 text-[10px] text-indigo-400 hover:bg-indigo-500/10"
                                                                onClick={() => handleDirectAssign(u.id, 'volunteer')}
                                                            >
                                                                Volunteer
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {eventRegistrants.length === 0 && (
                                                    <div className="text-center py-6 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                        No students registered for the main event yet.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            {/* Edit Sub-Event Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-none bg-primary" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <DialogHeader>
                        <DialogTitle style={{ color: 'var(--text-primary)' }}>Edit Sub-Event</DialogTitle>
                        <DialogDescription style={{ color: 'var(--text-secondary)' }}>
                            Update details for this sub-event duties.
                        </DialogDescription>
                    </DialogHeader>
                    {editForm && (
                        <div className="max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                            <form onSubmit={handleUpdateSubEvent} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label style={{ color: 'var(--text-primary)' }}>Title</Label>
                                    <Input
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label style={{ color: 'var(--text-primary)' }}>Description</Label>
                                    <Textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label style={{ color: 'var(--text-primary)' }}>Venue</Label>
                                        <Input
                                            value={editForm.venue}
                                            onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label style={{ color: 'var(--text-primary)' }}>Budget (₹)</Label>
                                        <Input
                                            type="number"
                                            value={editForm.budget}
                                            onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label style={{ color: 'var(--text-primary)' }}>Start Time</Label>
                                        <Input
                                            type="datetime-local"
                                            value={editForm.start_time ? editForm.start_time.replace(' ', 'T').substring(0, 16) : ''}
                                            onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label style={{ color: 'var(--text-primary)' }}>End Time</Label>
                                        <Input
                                            type="datetime-local"
                                            value={editForm.end_time ? editForm.end_time.replace(' ', 'T').substring(0, 16) : ''}
                                            onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label style={{ color: 'var(--text-primary)' }}>Lead Instructions</Label>
                                    <Textarea
                                        placeholder="Instructions for the team lead..."
                                        value={editForm.lead_instructions || ''}
                                        onChange={(e) => setEditForm({ ...editForm, lead_instructions: e.target.value })}
                                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        className="min-h-[100px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label style={{ color: 'var(--text-primary)' }}>Team Lead Phone</Label>
                                    <Input
                                        type="tel"
                                        placeholder="+91 9876543210"
                                        value={editForm.team_lead_contact || ''}
                                        onChange={(e) => setEditForm({ ...editForm, team_lead_contact: e.target.value })}
                                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    />
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Contact number for the team lead (visible to students)</p>
                                </div>
                                <div className="space-y-2">
                                    <Label style={{ color: 'var(--text-primary)' }}>Banner Image</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="URL or Upload"
                                            value={editForm.banner_url || ''}
                                            onChange={(e) => setEditForm({ ...editForm, banner_url: e.target.value })}
                                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                            className="flex-1"
                                        />
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            disabled={isUploading}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-dashed"
                                        >
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                        </Button>
                                    </div>

                                    {/* Templates */}
                                    <div className="grid grid-cols-3 gap-3 pt-2">
                                        {BANNER_TEMPLATES.map(template => (
                                            <button
                                                key={template.id}
                                                type="button"
                                                className={cn(
                                                    "relative rounded-lg overflow-hidden h-16 border-2 transition-all hover:scale-[1.02]",
                                                    editForm.banner_url === template.url ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-transparent"
                                                )}
                                                onClick={() => setEditForm({ ...editForm, banner_url: template.url })}
                                            >
                                                <img src={template.url} className="w-full h-full object-cover" alt={template.label} />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[8px] text-white py-0.5 text-center font-bold uppercase tracking-widest">
                                                    {template.label}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {editForm.banner_url && (
                                        <div className="mt-2 relative rounded-lg overflow-hidden h-24 border">
                                            <img
                                                src={editForm.banner_url.startsWith('http') ? editForm.banner_url : `http://localhost${editForm.banner_url}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6"
                                                onClick={() => setEditForm({ ...editForm, banner_url: '' })}
                                            >
                                                <Trash className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label style={{ color: 'var(--text-primary)' }}>Status</Label>
                                    <Select value={editForm.status} onValueChange={(val) => setEditForm({ ...editForm, status: val })}>
                                        <SelectTrigger style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                                            <SelectItem value="upcoming">Upcoming</SelectItem>
                                            <SelectItem value="ongoing">Ongoing</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>Cancel</Button>
                                    <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-bold">Save Changes</Button>
                                </DialogFooter>
                            </form>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Announcement Modal */}
            <Dialog open={isAnnouncementModalOpen} onOpenChange={setIsAnnouncementModalOpen}>
                <DialogContent className="sm:max-w-[400px]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <DialogHeader>
                        <DialogTitle style={{ color: 'var(--text-primary)' }}>Post New Notice</DialogTitle>
                        <DialogDescription style={{ color: 'var(--text-secondary)' }}>
                            Broadcast an update for this sub-event.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                        <form onSubmit={handlePostAnnouncement} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label style={{ color: 'var(--text-primary)' }}>Notice Title</Label>
                                <Input
                                    placeholder="Main heading..."
                                    value={announcementForm.title}
                                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label style={{ color: 'var(--text-primary)' }}>Content</Label>
                                <Textarea
                                    placeholder="Details of the announcement..."
                                    value={announcementForm.content}
                                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    className="min-h-[100px]"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label style={{ color: 'var(--text-primary)' }}>Priority</Label>
                                <Select value={announcementForm.priority} onValueChange={(val: any) => setAnnouncementForm({ ...announcementForm, priority: val })}>
                                    <SelectTrigger style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsAnnouncementModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>Cancel</Button>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Post Announcement</Button>
                            </DialogFooter>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Resource Modal */}
            <Dialog open={isResourceModalOpen} onOpenChange={setIsResourceModalOpen}>
                <DialogContent className="sm:max-w-[400px]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <DialogHeader>
                        <DialogTitle style={{ color: 'var(--text-primary)' }}>{editingResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
                        <DialogDescription style={{ color: 'var(--text-secondary)' }}>
                            {editingResource ? 'Update resource quantity or cost.' : 'Add equipment or materials needed.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                        <form onSubmit={handleSaveResource} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label style={{ color: 'var(--text-primary)' }}>Item Name</Label>
                                <Input
                                    placeholder="e.g. Chairs, Sound System"
                                    value={resourceForm.name}
                                    onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label style={{ color: 'var(--text-primary)' }}>Quantity</Label>
                                    <Input
                                        type="number"
                                        value={resourceForm.quantity}
                                        onChange={(e) => setResourceForm({ ...resourceForm, quantity: Number(e.target.value) })}
                                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label style={{ color: 'var(--text-primary)' }}>Unit Cost (₹)</Label>
                                    <Input
                                        type="number"
                                        value={resourceForm.unit_cost || ''}
                                        onChange={(e) => setResourceForm({ ...resourceForm, unit_cost: e.target.value === '' ? 0 : Number(e.target.value) })}
                                        placeholder="Enter unit cost"
                                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label style={{ color: 'var(--text-primary)' }}>Status</Label>
                                <Select value={resourceForm.status} onValueChange={(val) => setResourceForm({ ...resourceForm, status: val })}>
                                    <SelectTrigger style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="in-use">In Use</SelectItem>
                                        <SelectItem value="damaged">Damaged</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex justify-between items-center text-sm">
                                <span style={{ color: 'var(--text-secondary)' }}>Calculated Cost:</span>
                                <span className="font-bold text-indigo-500">₹{(resourceForm.quantity * resourceForm.unit_cost).toLocaleString()}</span>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setIsResourceModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>Cancel</Button>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                                    {editingResource ? 'Update' : 'Create'} Resource
                                </Button>
                            </DialogFooter>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Expense Modal */}
            <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
                <DialogContent className="sm:max-w-[450px]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <DialogHeader>
                        <DialogTitle style={{ color: 'var(--text-primary)' }}>{editingExpense ? 'Edit Expense' : 'Log New Expense'}</DialogTitle>
                        <DialogDescription style={{ color: 'var(--text-secondary)' }}>
                            {editingExpense ? 'Update expense details.' : 'Record a new expense for this sub-event.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveExpense} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label style={{ color: 'var(--text-primary)' }}>Expense Title</Label>
                            <Input
                                placeholder="e.g. Venue Booking, Catering"
                                value={expenseForm.title}
                                onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label style={{ color: 'var(--text-primary)' }}>Amount (₹)</Label>
                                <Input
                                    type="number"
                                    value={expenseForm.amount || ''}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value === '' ? 0 : Number(e.target.value) })}
                                    placeholder="Enter amount"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label style={{ color: 'var(--text-primary)' }}>Category</Label>
                                <Select value={expenseForm.category} onValueChange={(val) => setExpenseForm({ ...expenseForm, category: val })}>
                                    <SelectTrigger style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                                        <SelectItem value="venue">Venue</SelectItem>
                                        <SelectItem value="food">Food & Catering</SelectItem>
                                        <SelectItem value="equipment">Equipment</SelectItem>
                                        <SelectItem value="decoration">Decoration</SelectItem>
                                        <SelectItem value="transport">Transport</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label style={{ color: 'var(--text-primary)' }}>Description (Optional)</Label>
                            <Input
                                placeholder="Additional details"
                                value={expenseForm.description}
                                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsExpenseModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>Cancel</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                                {editingExpense ? 'Update' : 'Log'} Expense
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Prize Modal */}
            <Dialog open={isPrizeModalOpen} onOpenChange={setIsPrizeModalOpen}>
                <DialogContent className="sm:max-w-[450px]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <DialogHeader>
                        <DialogTitle style={{ color: 'var(--text-primary)' }}>{editingPrize ? 'Edit Prize' : 'Add New Prize'}</DialogTitle>
                        <DialogDescription style={{ color: 'var(--text-secondary)' }}>
                            {editingPrize ? 'Update prize details.' : 'Add a prize for this sub-event.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSavePrize} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label style={{ color: 'var(--text-primary)' }}>Prize Title</Label>
                            <Input
                                placeholder="e.g. First Prize, Best Performance"
                                value={prizeForm.title}
                                onChange={(e) => setPrizeForm({ ...prizeForm, title: e.target.value })}
                                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label style={{ color: 'var(--text-primary)' }}>Position</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={prizeForm.position}
                                    onChange={(e) => setPrizeForm({ ...prizeForm, position: Number(e.target.value) })}
                                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label style={{ color: 'var(--text-primary)' }}>Prize Value (₹)</Label>
                                <Input
                                    type="number"
                                    value={prizeForm.value || ''}
                                    onChange={(e) => setPrizeForm({ ...prizeForm, value: e.target.value === '' ? 0 : Number(e.target.value) })}
                                    placeholder="Enter value"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label style={{ color: 'var(--text-primary)' }}>Description</Label>
                            <Input
                                placeholder="Prize description"
                                value={prizeForm.description}
                                onChange={(e) => setPrizeForm({ ...prizeForm, description: e.target.value })}
                                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsPrizeModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>Cancel</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                                {editingPrize ? 'Update' : 'Add'} Prize
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <AlertDialogContent style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <AlertDialogHeader>
                        <AlertDialogTitle style={{ color: 'var(--text-primary)' }} className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                            Delete Sub-Event?
                        </AlertDialogTitle>
                        <AlertDialogDescription style={{ color: 'var(--text-secondary)' }}>
                            This action cannot be undone. All related data, expenses, prizes, and chat history for this sub-event will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSubEvent} className="bg-rose-600 hover:bg-rose-700">
                            Yes, Delete Sub-Event
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
