import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
    CheckCircle,
    Clock,
    Calendar,
    ClipboardList,
    User,
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
    assigned_by_name: string;
    title: string;
    description: string;
    deadline: string;
    status: string;
    priority: string;
    created_at: string;
}

export function StudentTasks() {
    const { collapsed } = useSidebar();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const { data } = await api.get('/tasks/index.php');
            setTasks(data || []);
            if (isRefresh) toast.success('Tasks refreshed');
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleUpdateStatus = async (taskId: string, status: string) => {
        try {
            await api.post('/tasks/update.php', { task_id: taskId, status });
            toast.success(`Task marked as ${status}`);
            fetchTasks();
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
                                View and complete tasks assigned to you
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => fetchTasks(true)}
                            disabled={refreshing}
                            className="border-[var(--border-color)] text-[var(--text-primary)]"
                        >
                            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
                            Refresh
                        </Button>
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
                                                    <p className="text-sm text-[var(--accent-primary)] mt-0.5">
                                                        {task.sub_event_title && `${task.sub_event_title} • `}{task.event_title}
                                                    </p>
                                                    <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        Assigned by: {task.assigned_by_name}
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
                        ))}

                        {filteredTasks.length === 0 && (
                            <Card className="bg-[var(--bg-card)] border-[var(--border-color)]">
                                <CardContent className="p-12 text-center">
                                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-[var(--text-primary)]">
                                        {filter === 'pending' ? 'All tasks completed!' : 'No tasks yet'}
                                    </h3>
                                    <p className="text-[var(--text-secondary)]">
                                        {filter === 'pending'
                                            ? 'Great job! You have no pending tasks.'
                                            : 'Tasks assigned to you will appear here.'}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default StudentTasks;
