import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
    RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Task {
    id: string;
    sub_event_id?: string;
    sub_event_title?: string;
    event_title?: string;
    assigned_to: string;
    assigned_to_name: string;
    assigned_to_role: string;
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
    avatar?: string;
    institution?: string;
}

export function AdminTasks() {
    const { collapsed } = useSidebar();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [assignees, setAssignees] = useState<Assignee[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

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
                api.get('/tasks/assignees.php')
            ]);
            setTasks(tasksRes.data || []);
            setAssignees(assigneesRes.data || []);
            if (isRefresh) toast.success('Tasks refreshed');
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error('Failed to load tasks');
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
            toast.success('Task created successfully');
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

    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        if (filter === 'pending') return task.status !== 'completed';
        if (filter === 'completed') return task.status === 'completed';
        return true;
    });

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

    const pendingCount = tasks.filter(t => t.status !== 'completed').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <Sidebar />
                <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
                    <Header />
                    <main className="p-6">
                        <Skeleton className="h-10 w-64 mb-6" />
                        <div className="grid grid-cols-3 gap-6 mb-6">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                        </div>
                        <div className="space-y-4">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
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
                            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Task Management</h1>
                            <p className="text-[var(--text-secondary)] mt-1">
                                Assign and track tasks for Creators and Team Leads
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
                            <Button
                                onClick={() => setCreateOpen(true)}
                                className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Assign Task
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[var(--text-secondary)]">Total Tasks</p>
                                        <p className="text-3xl font-bold text-[var(--text-primary)]">{tasks.length}</p>
                                    </div>
                                    <ClipboardList className="w-10 h-10 text-[var(--accent-primary)] opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[var(--text-secondary)]">Pending</p>
                                        <p className="text-3xl font-bold text-amber-500">{pendingCount}</p>
                                    </div>
                                    <Clock className="w-10 h-10 text-amber-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[var(--text-secondary)]">Completed</p>
                                        <p className="text-3xl font-bold text-emerald-500">{completedCount}</p>
                                    </div>
                                    <CheckCircle className="w-10 h-10 text-emerald-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6">
                        {(['all', 'pending', 'completed'] as const).map((f) => (
                            <Button
                                key={f}
                                variant={filter === f ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter(f)}
                                className={cn(
                                    filter === f
                                        ? 'bg-[var(--accent-primary)] text-white'
                                        : 'border-[var(--border-color)] text-[var(--text-primary)]'
                                )}
                            >
                                {f === 'all' && 'All Tasks'}
                                {f === 'pending' && `Pending (${pendingCount})`}
                                {f === 'completed' && `Completed (${completedCount})`}
                            </Button>
                        ))}
                    </div>

                    {/* Tasks List */}
                    <div className="space-y-4">
                        {filteredTasks.map((task) => (
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
                                                    {task.description && (
                                                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 mt-3">
                                                <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span className="font-medium text-[var(--accent-primary)]">
                                                        {task.assigned_to_name}
                                                    </span>
                                                    <span className="text-xs">({task.assigned_to_role})</span>
                                                </div>
                                                {task.deadline && (
                                                    <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        Due: {format(new Date(task.deadline), 'MMM d, yyyy')}
                                                    </div>
                                                )}
                                            </div>
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
                        ))}

                        {filteredTasks.length === 0 && (
                            <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                                <CardContent className="p-12 text-center">
                                    <ClipboardList className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-[var(--text-primary)]">No Tasks</h3>
                                    <p className="text-[var(--text-secondary)]">
                                        Click "Assign Task" to create your first task.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>

            {/* Create Task Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[var(--text-primary)]">Assign New Task</DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)]">
                            Assign a task to a Creator or Team Lead
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
                                    <SelectValue placeholder="Select person" />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
                                    {assignees.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            <span className="flex items-center gap-2">
                                                {a.name}
                                                <span className="text-xs text-[var(--text-muted)]">({a.role})</span>
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
                                    Creating...
                                </>
                            ) : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AdminTasks;
