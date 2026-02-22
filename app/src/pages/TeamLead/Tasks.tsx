import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    Plus,
    CheckCircle,
    Clock,
    Calendar,
    ClipboardList,
    Trash2,
    User,
    Loader2,
    Send,
    RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface Task {
    id: string;
    sub_event_id?: string;
    sub_event_title?: string;
    event_title?: string;
    assigned_to: string;
    assigned_to_name: string;
    assigned_to_role?: string;
    assigned_by: string;
    assigned_by_name: string;
    title: string;
    description: string;
    deadline: string;
    status: string;
    priority: string;
    created_at: string;
    completed_at?: string;
}

interface Assignee {
    id: string;
    name: string;
    email: string;
    role: string;
    sub_event_title?: string;
}

export function TeamLeadTasks() {
    const { collapsed } = useSidebar();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [assignees, setAssignees] = useState<Assignee[]>([]);
    const [activeTab, setActiveTab] = useState('my-tasks');

    // Create dialog state
    const [createOpen, setCreateOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assigned_to: '',
        deadline: '',
        priority: 'medium'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const [tasksRes, assigneesRes] = await Promise.all([
                api.get('/tasks/index.php'),
                api.get('/tasks/assignees.php').catch(() => ({ data: [] }))
            ]);
            setTasks(tasksRes.data || []);
            setAssignees(assigneesRes.data || []);
            if (isRefresh) toast.success('Tasks refreshed');
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.assigned_to) {
            toast.error('Title and assignee are required');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/tasks/index.php', newTask);
            toast.success('Task assigned successfully');
            setCreateOpen(false);
            setNewTask({
                title: '',
                description: '',
                assigned_to: '',
                deadline: '',
                priority: 'medium'
            });
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create task');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Delete this task?')) return;

        try {
            await api.post('/tasks/delete.php', { task_id: taskId });
            toast.success('Task deleted');
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete task');
        }
    };

    const handleUpdateStatus = async (taskId: string, status: string) => {
        try {
            await api.post('/tasks/update.php', { task_id: taskId, status });
            toast.success(`Task marked as ${status}`);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to update task');
        }
    };

    // Split tasks into received and assigned
    const myTasks = tasks.filter(t => t.assigned_to == user?.id);
    const assignedTasks = tasks.filter(t => t.assigned_by == user?.id);

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Urgent</Badge>;
            case 'high':
                return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">High</Badge>;
            case 'medium':
                return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Medium</Badge>;
            case 'low':
                return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Low</Badge>;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Completed</Badge>;
            case 'in_progress':
                return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">In Progress</Badge>;
            case 'overdue':
                return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>;
            default:
                return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>;
        }
    };

    const pendingMyTasks = myTasks.filter(t => t.status !== 'completed').length;

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <Sidebar />
                <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
                    <Header />
                    <main className="p-6">
                        <Skeleton className="h-10 w-64 mb-6" />
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-24 w-full" />
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
                            <h1 className="text-3xl font-bold text-[var(--text-primary)]">My Tasks</h1>
                            <p className="text-[var(--text-secondary)] mt-1">
                                View your tasks and assign tasks to volunteers
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => fetchData(true)}
                                disabled={refreshing}
                                className="border-[var(--border-color)] text-[var(--text-primary)]"
                            >
                                <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
                                Refresh
                            </Button>
                            {assignees.length > 0 && (
                                <Button
                                    onClick={() => setCreateOpen(true)}
                                    className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Assign Task
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[var(--text-secondary)]">My Pending</p>
                                        <p className="text-3xl font-bold text-amber-500">{pendingMyTasks}</p>
                                    </div>
                                    <Clock className="w-10 h-10 text-amber-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[var(--text-secondary)]">Tasks I Assigned</p>
                                        <p className="text-3xl font-bold text-[var(--accent-primary)]">{assignedTasks.length}</p>
                                    </div>
                                    <Send className="w-10 h-10 text-[var(--accent-primary)] opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[var(--text-secondary)]">Volunteers</p>
                                        <p className="text-3xl font-bold text-[var(--text-primary)]">{assignees.length}</p>
                                    </div>
                                    <User className="w-10 h-10 text-[var(--text-muted)] opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="bg-[var(--bg-secondary)] border border-[var(--border-color)] mb-6">
                            <TabsTrigger value="my-tasks" className="data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white">
                                <ClipboardList className="w-4 h-4 mr-2" />
                                My Tasks
                                {pendingMyTasks > 0 && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-[10px] text-white rounded-full font-bold">{pendingMyTasks}</span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="assigned" className="data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white">
                                <Send className="w-4 h-4 mr-2" />
                                Assigned by Me ({assignedTasks.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* My Tasks Tab */}
                        <TabsContent value="my-tasks" className="space-y-4">
                            {myTasks.length === 0 ? (
                                <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                                    <CardContent className="p-12 text-center">
                                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-[var(--text-primary)]">No Tasks Assigned</h3>
                                        <p className="text-[var(--text-secondary)]">
                                            Tasks assigned to you will appear here.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                myTasks.map((task) => (
                                    <Card
                                        key={task.id}
                                        className={cn(
                                            "bg-[var(--bg-card)] border-[var(--border-color)] transition-all",
                                            task.status === 'completed' && "opacity-60"
                                        )}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <Checkbox
                                                    checked={task.status === 'completed'}
                                                    onCheckedChange={() => handleUpdateStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                                                    className="mt-1 border-[var(--accent-primary)] data-[state=checked]:bg-[var(--accent-primary)]"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <h3 className={cn(
                                                                "font-semibold text-[var(--text-primary)]",
                                                                task.status === 'completed' && "line-through"
                                                            )}>
                                                                {task.title}
                                                            </h3>
                                                            <p className="text-sm text-[var(--text-muted)] mt-0.5">
                                                                From: {task.assigned_by_name}
                                                            </p>
                                                            {task.description && (
                                                                <p className="text-sm text-[var(--text-secondary)] mt-2">
                                                                    {task.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {getPriorityBadge(task.priority)}
                                                            {getStatusBadge(task.status)}
                                                        </div>
                                                    </div>
                                                    {task.deadline && (
                                                        <div className="flex items-center gap-4 mt-3 text-sm text-[var(--text-muted)]">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                Due: {format(new Date(task.deadline), 'MMM d, yyyy')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        {/* Assigned by Me Tab */}
                        <TabsContent value="assigned" className="space-y-4">
                            {assignedTasks.length === 0 ? (
                                <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                                    <CardContent className="p-12 text-center">
                                        <Send className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-[var(--text-primary)]">No Tasks Assigned</h3>
                                        <p className="text-[var(--text-secondary)]">
                                            {assignees.length > 0
                                                ? 'Click "Assign Task" to give tasks to your volunteers.'
                                                : 'You need volunteers in your sub-events to assign tasks.'}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                assignedTasks.map((task) => (
                                    <Card
                                        key={task.id}
                                        className={cn(
                                            "bg-[var(--bg-card)] border-[var(--border-color)] transition-all",
                                            task.status === 'completed' && "opacity-60"
                                        )}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-[var(--text-primary)]">{task.title}</h3>
                                                    <div className="flex items-center gap-1 text-sm text-[var(--accent-primary)] mt-0.5">
                                                        <User className="w-3.5 h-3.5" />
                                                        {task.assigned_to_name}
                                                    </div>
                                                    {task.description && (
                                                        <p className="text-sm text-[var(--text-secondary)] mt-2">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                    {task.deadline && (
                                                        <div className="flex items-center gap-1 mt-2 text-sm text-[var(--text-muted)]">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            Due: {format(new Date(task.deadline), 'MMM d, yyyy')}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getPriorityBadge(task.priority)}
                                                    {getStatusBadge(task.status)}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-rose-500 hover:bg-rose-500/10"
                                                        onClick={() => handleDeleteTask(task.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            {/* Create Task Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[var(--text-primary)]">Assign Task to Volunteer</DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            Assign a task to one of your volunteers
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                                value={newTask.title}
                                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Task title"
                                className="bg-[var(--bg-secondary)] border-[var(--border-color)]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={newTask.description}
                                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe the task..."
                                className="bg-[var(--bg-secondary)] border-[var(--border-color)] min-h-[80px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Assign To *</Label>
                            <Select
                                value={newTask.assigned_to}
                                onValueChange={(val) => setNewTask(prev => ({ ...prev, assigned_to: val }))}
                            >
                                <SelectTrigger className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
                                    <SelectValue placeholder="Select volunteer" />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
                                    {assignees.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            <span className="flex items-center gap-2">
                                                {a.name}
                                                {a.sub_event_title && (
                                                    <span className="text-xs text-[var(--text-muted)]">({a.sub_event_title})</span>
                                                )}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Deadline</Label>
                                <Input
                                    type="date"
                                    value={newTask.deadline}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, deadline: e.target.value }))}
                                    className="bg-[var(--bg-secondary)] border-[var(--border-color)]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select
                                    value={newTask.priority}
                                    onValueChange={(val) => setNewTask(prev => ({ ...prev, priority: val }))}
                                >
                                    <SelectTrigger className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCreateOpen(false)}
                            className="border-[var(--border-color)] text-[var(--text-secondary)]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateTask}
                            disabled={submitting}
                            className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Assigning...
                                </>
                            ) : 'Assign Task'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default TeamLeadTasks;
