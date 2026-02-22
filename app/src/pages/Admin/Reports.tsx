import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { StatChart } from '@/components/dashboard/StatChart';
import api from '@/lib/api';
import { Download, FileText, Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportStats {
    totalEvents: number;
    totalUsers: number;
    totalRegistrations: number;
    totalRevenue: number;
    eventsByMonth: { name: string; value: number }[];
    usersByRole: { name: string; value: number }[];
}

export function AdminReports() {
    const { collapsed } = useSidebar();
    console.log('Reports page - collapsed:', collapsed); // Force recompilation
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const [statsRes, usersRes, eventsResp] = await Promise.all([
                api.get('/stats/index.php'),
                api.get('/users/index.php'),
                api.get('/events/index.php')
            ]);

            // Process user data by role
            const users = usersRes.data || [];
            const roleCount: Record<string, number> = {};
            users.forEach((user: any) => {
                roleCount[user.role] = (roleCount[user.role] || 0) + 1;
            });

            const usersByRole = Object.entries(roleCount).map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value: value as number
            }));

            // Generate monthly event data (mock for now, can be enhanced with real data)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            const eventsByMonth = months.map((month) => ({
                name: month,
                value: Math.floor(Math.random() * 10) + 1
            }));

            const events = eventsResp.data || [];

            setStats({
                totalEvents: events.length || statsRes.data?.totalEvents || 0,
                totalUsers: statsRes.data?.totalUsers || 0,
                totalRegistrations: 0, // Can be enhanced with registrations API
                totalRevenue: statsRes.data?.totalBudget || 0,
                eventsByMonth,
                usersByRole
            });
        } catch (error) {
            console.error('Failed to fetch reports', error);
        } finally {
            setLoading(false);
        }
    };

    const exportReport = (type: string) => {
        // Placeholder for export functionality
        alert(`Export ${type} report - Feature coming soon!`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Sidebar />

            <div className={`${collapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300 ease-in-out`}>
                <Header />

                <main className="p-6">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports & Analytics</h1>
                            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>View system statistics and generate reports</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="hover:bg-white/5"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                onClick={() => exportReport('CSV')}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                            <Button
                                variant="outline"
                                className="hover:bg-white/5"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                onClick={() => exportReport('PDF')}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Export PDF
                            </Button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}>
                                    <Calendar className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                                </div>
                                <div>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Events</p>
                                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.totalEvents || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                                    <Users className="w-6 h-6" style={{ color: 'var(--status-success)' }} />
                                </div>
                                <div>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Users</p>
                                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.totalUsers || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                                    <TrendingUp className="w-6 h-6" style={{ color: 'var(--status-warning)' }} />
                                </div>
                                <div>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Registrations</p>
                                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.totalRegistrations || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                                    <DollarSign className="w-6 h-6" style={{ color: 'var(--status-error)' }} />
                                </div>
                                <div>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Budget</p>
                                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>${stats?.totalRevenue || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <StatChart
                            type="bar"
                            data={stats?.eventsByMonth || []}
                            title="Events by Month"
                            subtitle="Event creation trend over time"
                            height={300}
                        />
                        <StatChart
                            type="pie"
                            data={stats?.usersByRole || []}
                            title="Users by Role"
                            subtitle="User distribution across roles"
                            height={300}
                        />
                    </div>

                    {/* Recent Activity Table */}
                    <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Report Summary</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}>
                                        <Calendar className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Events Report</p>
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>All event statistics and metrics</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => exportReport('events')} className="hover:bg-white/10">
                                    <Download className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                                        <Users className="w-5 h-5" style={{ color: 'var(--status-success)' }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Users Report</p>
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>User activity and registrations</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => exportReport('users')} className="hover:bg-white/10">
                                    <Download className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                                        <DollarSign className="w-5 h-5" style={{ color: 'var(--status-warning)' }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Financial Report</p>
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Budget and expense tracking</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => exportReport('financial')} className="hover:bg-white/10">
                                    <Download className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>
            </div >
        </div >
    );
}
