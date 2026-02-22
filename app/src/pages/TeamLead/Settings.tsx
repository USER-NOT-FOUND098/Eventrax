import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    Settings,
    Palette,
    Bell,
    Shield,
    Save,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    LogOut,
    User,
    Trash2,
    Download,
    Upload,
} from 'lucide-react';

interface SettingsData {
    theme: 'light' | 'dark' | 'cherry' | 'system';
    notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
        inApp: boolean;
    };
    privacy: {
        showProfile: boolean;
        showEmail: boolean;
        showPhone: boolean;
        showInstitution: boolean;
    };
    accessibility: {
        highContrast: boolean;
        reducedMotion: boolean;
        largeText: boolean;
        screenReader: boolean;
    };
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
}

export default function TeamLeadSettings() {
    const navigate = useNavigate();
    const { collapsed } = useSidebar();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<SettingsData>({
        theme: 'system',
        notifications: {
            email: true,
            push: true,
            sms: false,
            inApp: true,
        },
        privacy: {
            showProfile: true,
            showEmail: false,
            showPhone: false,
            showInstitution: true,
        },
        accessibility: {
            highContrast: false,
            reducedMotion: false,
            largeText: false,
            screenReader: false,
        },
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
    });
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [showDeleteDataDialog, setShowDeleteDataDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = () => {
        try {
            const savedSettings = localStorage.getItem('teamLeadSettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                setSettings(prev => ({ ...prev, ...parsed }));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            setErrorMessage('');
            setSuccessMessage('');

            localStorage.setItem('teamLeadSettings', JSON.stringify(settings));

            applyTheme(settings.theme);

            setSuccessMessage('Settings saved successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setErrorMessage('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const applyTheme = (theme: string) => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark', 'cherry');

        if (theme === 'system') {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            } else {
                root.classList.add('light');
            }
        } else {
            root.classList.add(theme);
        }
    };

    const handleNotificationChange = (type: keyof SettingsData['notifications'], value: boolean) => {
        setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [type]: value } }));
    };

    const handlePrivacyChange = (type: keyof SettingsData['privacy'], value: boolean) => {
        setSettings(prev => ({ ...prev, privacy: { ...prev.privacy, [type]: value } }));
    };

    const handleLogout = () => {
        localStorage.removeItem('teamLeadSettings');
        navigate('/login');
    };

    const handleDeleteData = () => {
        localStorage.removeItem('teamLeadSettings');
        localStorage.removeItem('teamLeadCache');
        sessionStorage.clear();

        setShowDeleteDataDialog(false);
        setSuccessMessage('All local data cleared successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const exportData = () => {
        const data = { settings, exportDate: new Date().toISOString(), version: '1.0.0' };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eventrax-teamlead-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSuccessMessage('Settings exported successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (data.settings) {
                setSettings(prev => ({ ...prev, ...data.settings }));
                setSuccessMessage('Settings imported successfully!');
            } else {
                throw new Error('Invalid settings file');
            }
        } catch (error) {
            console.error('Error importing settings:', error);
            setErrorMessage('Invalid settings file');
        }
        setTimeout(() => { setSuccessMessage(''); setErrorMessage(''); }, 3000);
    };

    if (loading) {
        return (
            <div className="flex h-screen bg-[var(--bg-primary)]">
                <Sidebar />
                <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
                    <Header />
                    <main className="flex-1 overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto">
                            <Skeleton className="h-8 w-64 mb-2 bg-[var(--bg-secondary)]" />
                            <Skeleton className="h-96 rounded-lg bg-[var(--bg-secondary)]" />
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[var(--bg-primary)]">
            <Sidebar />
            <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
                <Header />
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                                    <p className="text-gray-600 dark:text-gray-400">Customize your experience and preferences</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={saveSettings} disabled={saving}>
                                    <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save'}
                                </Button>
                                <Button variant="outline" onClick={loadSettings}>
                                    <RefreshCw className="h-4 w-4 mr-2" />Reset
                                </Button>
                            </div>
                        </div>

                        {successMessage && (
                            <Alert className="mb-6 bg-green-50 border-green-200">
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>{successMessage}</AlertDescription>
                            </Alert>
                        )}

                        {errorMessage && (
                            <Alert className="mb-6 bg-red-50 border-red-200">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{errorMessage}</AlertDescription>
                            </Alert>
                        )}

                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                                <TabsTrigger value="privacy">Privacy</TabsTrigger>
                                <TabsTrigger value="account">Account</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />General Preferences</CardTitle>
                                        <CardDescription>Customize your language and regional settings</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <Label>Language</Label>
                                            <Select value={settings.language} onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en">English</SelectItem>
                                                    <SelectItem value="es">Español</SelectItem>
                                                    <SelectItem value="fr">Français</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Date Format</Label>
                                                <Select value={settings.dateFormat} onValueChange={(value) => setSettings(prev => ({ ...prev, dateFormat: value }))}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Time Format</Label>
                                                <Select value={settings.timeFormat} onValueChange={(value: '12h' | '24h') => setSettings(prev => ({ ...prev, timeFormat: value }))}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="12h">12-hour</SelectItem>
                                                        <SelectItem value="24h">24-hour</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="notifications" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notifications</CardTitle>
                                        <CardDescription>Choose how you want to receive notifications</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1"><Label htmlFor="email-notifications">Email Notifications</Label><p className="text-xs text-gray-500">Receive updates via email</p></div>
                                            <Switch id="email-notifications" checked={settings.notifications.email} onCheckedChange={(checked) => handleNotificationChange('email', checked)} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1"><Label htmlFor="push-notifications">Push Notifications</Label><p className="text-xs text-gray-500">Browser push notifications</p></div>
                                            <Switch id="push-notifications" checked={settings.notifications.push} onCheckedChange={(checked) => handleNotificationChange('push', checked)} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="privacy" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Privacy</CardTitle>
                                        <CardDescription>Control what information is visible to others</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1"><Label htmlFor="show-profile">Show Profile Picture</Label></div>
                                            <Switch id="show-profile" checked={settings.privacy.showProfile} onCheckedChange={(checked) => handlePrivacyChange('showProfile', checked)} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1"><Label htmlFor="show-email">Show Email Address</Label></div>
                                            <Switch id="show-email" checked={settings.privacy.showEmail} onCheckedChange={(checked) => handlePrivacyChange('showEmail', checked)} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="account" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Account Management</CardTitle>
                                        <CardDescription>Manage your account and data</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div><h4 className="font-medium">Export Settings</h4><p className="text-sm text-gray-500">Download settings as JSON</p></div>
                                            <Button variant="outline" onClick={exportData}><Download className="h-4 w-4 mr-2" />Export</Button>
                                        </div>
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div><h4 className="font-medium">Import Settings</h4><p className="text-sm text-gray-500">Upload settings from file</p></div>
                                            <input type="file" accept=".json" onChange={importData} className="hidden" id="import-settings" />
                                            <Button variant="outline" asChild><label htmlFor="import-settings" className="cursor-pointer"><Upload className="h-4 w-4 mr-2" />Import</label></Button>
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div><h4 className="font-medium">Clear Local Data</h4><p className="text-sm text-gray-500">Remove cached data</p></div>
                                            <Button variant="outline" onClick={() => setShowDeleteDataDialog(true)}><Trash2 className="h-4 w-4 mr-2" />Clear Data</Button>
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div><h4 className="font-medium text-red-600">Logout</h4><p className="text-sm text-gray-500">Sign out of your account</p></div>
                                            <Button variant="destructive" onClick={() => setShowLogoutDialog(true)}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>

            <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Confirm Logout</DialogTitle><DialogDescription>Are you sure you want to logout? Any unsaved changes will be lost.</DialogDescription></DialogHeader>
                    <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowLogoutDialog(false)}>Cancel</Button><Button variant="destructive" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" />Logout</Button></div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDataDialog} onOpenChange={setShowDeleteDataDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Clear Local Data</DialogTitle><DialogDescription>Are you sure you want to clear all locally stored data?</DialogDescription></DialogHeader>
                    <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowDeleteDataDialog(false)}>Cancel</Button><Button variant="destructive" onClick={handleDeleteData}><Trash2 className="h-4 w-4 mr-2" />Clear Data</Button></div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
