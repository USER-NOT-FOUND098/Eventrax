import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useTheme, type AccentColor } from '@/contexts/ThemeContext';
import {
    Settings,
    Bell,
    Shield,
    Palette,
    Database,
    Mail,
    Save,
    RefreshCw
} from 'lucide-react';

const accentColorsMap = {
    indigo: { primary: '#6366F1' },
    emerald: { primary: '#10B981' },
    amber: { primary: '#F59E0B' },
    rose: { primary: '#F43F5E' },
    violet: { primary: '#8B5CF6' },
};

export function AdminSettings() {
    const { collapsed } = useSidebar();
    console.log('Settings page - collapsed:', collapsed); // Force recompilation
    const { accentColor, setAccentColor, theme, setTheme } = useTheme();
    const [settings, setSettings] = useState({
        siteName: 'EVENTRAX',
        siteEmail: 'admin@eventrax.com',
        enableNotifications: true,
        enableEmailAlerts: true,
        maintenanceMode: false,
        requireApproval: true,
        maxEventsPerCreator: 10,
        sessionTimeout: 60,
    });

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Settings saved successfully!');
        setSaving(false);
    };

    const handleReset = () => {
        setSettings({
            siteName: 'EVENTRAX',
            siteEmail: 'admin@eventrax.com',
            enableNotifications: true,
            enableEmailAlerts: true,
            maintenanceMode: false,
            requireApproval: true,
            maxEventsPerCreator: 10,
            sessionTimeout: 60,
        });
        toast.info('Settings reset to defaults');
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Sidebar />

            <div className={`${collapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300 ease-in-out`}>
                <Header />

                <main className="p-6">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
                            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Manage system configuration and preferences</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="hover:bg-white/5"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                onClick={handleReset}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reset
                            </Button>
                            <Button
                                className="bg-indigo-500 hover:bg-indigo-600"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>

                    {/* Settings Tabs */}
                    <Tabs defaultValue="general" className="space-y-6">
                        <TabsList className="border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-input)' }}>
                            <TabsTrigger value="general" className="data-[state=active]:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                <Settings className="w-4 h-4 mr-2" />
                                General
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="data-[state=active]:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                <Bell className="w-4 h-4 mr-2" />
                                Notifications
                            </TabsTrigger>
                            <TabsTrigger value="security" className="data-[state=active]:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                <Shield className="w-4 h-4 mr-2" />
                                Security
                            </TabsTrigger>
                            <TabsTrigger value="appearance" className="data-[state=active]:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                <Palette className="w-4 h-4 mr-2" />
                                Appearance
                            </TabsTrigger>
                        </TabsList>

                        {/* General Settings */}
                        <TabsContent value="general">
                            <div className="rounded-2xl border p-6 space-y-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <Database className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                                    General Settings
                                </h3>
                                <div className="grid gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="siteName" style={{ color: 'var(--text-secondary)' }}>Site Name</Label>
                                        <Input
                                            id="siteName"
                                            value={settings.siteName}
                                            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                                            className="border"
                                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="siteEmail" style={{ color: 'var(--text-secondary)' }}>Admin Email</Label>
                                        <Input
                                            id="siteEmail"
                                            type="email"
                                            value={settings.siteEmail}
                                            onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
                                            className="border"
                                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="maxEvents" style={{ color: 'var(--text-secondary)' }}>Max Events per Creator</Label>
                                        <Input
                                            id="maxEvents"
                                            type="number"
                                            value={settings.maxEventsPerCreator}
                                            onChange={(e) => setSettings({ ...settings, maxEventsPerCreator: parseInt(e.target.value) })}
                                            className="border"
                                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Maintenance Mode</p>
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Temporarily disable the site for maintenance</p>
                                        </div>
                                        <Switch
                                            checked={settings.maintenanceMode}
                                            onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Notifications Settings */}
                        <TabsContent value="notifications">
                            <div className="rounded-2xl border p-6 space-y-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <Bell className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                                    Notification Settings
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Push Notifications</p>
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Enable in-app push notifications</p>
                                        </div>
                                        <Switch
                                            checked={settings.enableNotifications}
                                            onCheckedChange={(checked) => setSettings({ ...settings, enableNotifications: checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Email Alerts</p>
                                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Send email notifications for important events</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={settings.enableEmailAlerts}
                                            onCheckedChange={(checked) => setSettings({ ...settings, enableEmailAlerts: checked })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Security Settings */}
                        <TabsContent value="security">
                            <div className="rounded-2xl border p-6 space-y-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <Shield className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                                    Security Settings
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Require Account Approval</p>
                                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>New creator and team lead accounts need admin approval</p>
                                        </div>
                                        <Switch
                                            checked={settings.requireApproval}
                                            onCheckedChange={(checked) => setSettings({ ...settings, requireApproval: checked })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sessionTimeout" style={{ color: 'var(--text-secondary)' }}>Session Timeout (minutes)</Label>
                                        <Input
                                            id="sessionTimeout"
                                            type="number"
                                            value={settings.sessionTimeout}
                                            onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                                            className="border"
                                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
                                        />
                                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Automatically log out users after inactivity</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Appearance Settings */}
                        <TabsContent value="appearance">
                            <div className="rounded-2xl border p-6 space-y-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <Palette className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                                    Appearance Settings
                                </h3>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Theme</p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div
                                                onClick={() => setTheme('dark')}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${theme === 'dark' ? 'border-indigo-500 bg-[#07070A]' : 'border-transparent bg-[var(--bg-tertiary)] hover:opacity-80'}`}
                                            >
                                                <div className="w-full h-20 bg-[#0E0E12] rounded-lg mb-2 border border-gray-800"></div>
                                                <p className={`text-sm text-center ${theme === 'dark' ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                                                    Dark {theme === 'dark' && '(Active)'}
                                                </p>
                                            </div>
                                            <div
                                                onClick={() => setTheme('light')}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${theme === 'light' ? 'border-indigo-500 bg-white' : 'border-transparent bg-[var(--bg-tertiary)] hover:opacity-80'}`}
                                            >
                                                <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 border border-gray-200"></div>
                                                <p className={`text-sm text-center ${theme === 'light' ? 'text-gray-900' : 'text-[var(--text-secondary)]'}`}>
                                                    Light {theme === 'light' && '(Active)'}
                                                </p>
                                            </div>
                                            <div
                                                onClick={() => setTheme('cherry')}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${theme === 'cherry' ? 'border-indigo-500 bg-[#FFF0F5]' : 'border-transparent bg-[var(--bg-tertiary)] hover:opacity-80'}`}
                                            >
                                                <div className="w-full h-20 bg-white rounded-lg mb-2 border border-pink-200"></div>
                                                <p className={`text-sm text-center ${theme === 'cherry' ? 'text-gray-900' : 'text-[var(--text-secondary)]'}`}>
                                                    Cherry {theme === 'cherry' && '(Active)'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                                        <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Accent Color</p>
                                        <div className="flex gap-3">
                                            {(['indigo', 'emerald', 'amber', 'rose', 'violet'] as AccentColor[]).map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setAccentColor(color)}
                                                    className={`w-10 h-10 rounded-full cursor-pointer transition-transform hover:scale-110 flex items-center justify-center ${accentColor === color ? 'ring-2 ring-offset-2 ring-[var(--text-primary)]' : ''}`}
                                                    style={{ backgroundColor: accentColorsMap[color].primary }}
                                                >
                                                    {accentColor === color && <div className="w-2 h-2 rounded-full bg-white z-10" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    );
}
