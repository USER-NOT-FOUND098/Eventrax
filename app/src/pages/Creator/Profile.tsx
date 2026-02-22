import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import {
    User,
    Calendar,
    Edit,
    Save,
    X,
    Camera,
    CheckCircle,
    AlertTriangle,
    Shield,
    Zap,
    Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    institution: string;
    avatar: string;
    phone: string;
    status: string;
    createdAt: string;
    lastLogin: string;
}

interface Stats {
    eventsCreated: number;
    totalParticipants: number;
    upcomingEvents: number;
    avgRating: number;
}

export default function CreatorProfile() {
    const navigate = useNavigate();
    const { collapsed } = useSidebar();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [stats, setStats] = useState<Stats>({
        eventsCreated: 0,
        totalParticipants: 0,
        upcomingEvents: 0,
        avgRating: 0,
    });
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showAvatarDialog, setShowAvatarDialog] = useState(false);

    const avatarTemplates = [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Creator1',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Creator2',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Creator3',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎨</text></svg>',
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎤</text></svg>',
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎬</text></svg>',
    ];

    useEffect(() => {
        fetchProfile();
        fetchStats();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users/update.php');
            setProfile(response.data);
            setFormData(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setErrorMessage('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/events/index.php');
            const events = response.data || [];
            const upcoming = events.filter((e: any) => new Date(e.start_date) > new Date()).length;

            setStats({
                eventsCreated: events.length,
                totalParticipants: 0, // Need endpoint for this
                upcomingEvents: upcoming,
                avgRating: 4.8, // Mock data for now
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleInputChange = (field: keyof UserProfile, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setErrorMessage('');
            setSuccessMessage('');

            const response = await api.put('/users/update.php', formData);

            if (response.data.success) {
                setProfile(response.data.user);
                setEditMode(false);
                setSuccessMessage('Profile updated successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error: any) {
            console.error('Error saving profile:', error);
            setErrorMessage(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarSelect = (avatarUrl: string) => {
        setAvatarPreview(avatarUrl);
        handleInputChange('avatar', avatarUrl);
        setShowAvatarDialog(false);
    };

    const formatJoinDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'creator': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
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
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                        <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Creator Profile</h1>
                                        <p className="text-gray-600 dark:text-gray-400">Manage your creator account</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {editMode ? (
                                        <>
                                            <Button variant="outline" onClick={() => { setEditMode(false); setFormData(profile || {}); setAvatarPreview(''); }}>
                                                <X className="h-4 w-4 mr-2" />Cancel
                                            </Button>
                                            <Button onClick={handleSave} disabled={saving}>
                                                <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save'}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button onClick={() => setEditMode(true)}>
                                            <Edit className="h-4 w-4 mr-2" />Edit Profile
                                        </Button>
                                    )}
                                </div>
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

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Profile Information</CardTitle>
                                        <CardDescription>{editMode ? 'Edit your details' : 'Your personal information'}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Tabs defaultValue="basic" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                                <TabsTrigger value="account">Account</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="basic" className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <Avatar className="h-20 w-20">
                                                            <AvatarImage src={avatarPreview || profile?.avatar} alt={profile?.name} />
                                                            <AvatarFallback className="text-lg">{profile?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        {editMode && (
                                                            <div className="absolute -bottom-2 -right-2">
                                                                <button onClick={() => setShowAvatarDialog(true)} className="p-1 bg-purple-600 text-white rounded-full hover:bg-purple-700">
                                                                    <Camera className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-lg">{profile?.name}</h3>
                                                        <Badge className={cn("ml-2", getRoleColor(profile?.role || ''))}>Content Creator</Badge>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="name">Full Name</Label>
                                                        <Input id="name" value={editMode ? formData.name || '' : profile?.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} disabled={!editMode} className={editMode ? 'border-purple-300' : ''} />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="email">Email Address</Label>
                                                        <Input type="email" value={profile?.email || ''} disabled={true} className="bg-gray-100 dark:bg-gray-800" />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="phone">Phone Number</Label>
                                                        <Input id="phone" value={editMode ? formData.phone || '' : profile?.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} disabled={!editMode} placeholder="+1 (555) 123-4567" className={editMode ? 'border-purple-300' : ''} />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="institution">Organization</Label>
                                                        <Input id="institution" value={editMode ? formData.institution || '' : profile?.institution || ''} onChange={(e) => handleInputChange('institution', e.target.value)} disabled={!editMode} className={editMode ? 'border-purple-300' : ''} />
                                                    </div>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="account" className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <div>
                                                        <h4 className="font-medium">Account Status</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{profile?.status === 'active' ? 'Your account is active' : 'Account status: ' + profile?.status}</p>
                                                    </div>
                                                    <Badge className={profile?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{(profile?.status || '').charAt(0).toUpperCase() + (profile?.status || '').slice(1)}</Badge>
                                                </div>
                                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <h4 className="font-medium mb-2">Member Since</h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{profile?.createdAt ? formatJoinDate(profile.createdAt) : 'Unknown'}</p>
                                                </div>
                                                <Separator />
                                                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/creator/settings')}>
                                                    <Shield className="h-4 w-4 mr-2" />Account Settings
                                                </Button>
                                            </TabsContent>
                                        </Tabs>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-1">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5" />Creator Stats</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    <span className="text-sm font-medium">Events Created</span>
                                                </div>
                                                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.eventsCreated}</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Ticket className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    <span className="text-sm font-medium">Upcoming</span>
                                                </div>
                                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.upcomingEvents}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Choose Avatar</DialogTitle>
                        <DialogDescription>Select an avatar from the available templates</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-6 gap-3 py-4 max-h-96 overflow-y-auto">
                        {avatarTemplates.map((avatar, index) => (
                            <button key={index} onClick={() => handleAvatarSelect(avatar)} className="relative group">
                                <Avatar className="h-16 w-16 mx-auto border-2 border-gray-200 group-hover:border-purple-500 transition-colors">
                                    <AvatarImage src={avatar} alt={`Avatar ${index + 1}`} />
                                    <AvatarFallback>{String.fromCharCode(65 + index)}</AvatarFallback>
                                </Avatar>
                                {(avatarPreview || profile?.avatar) === avatar && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-purple-600 text-white rounded-full p-1"><CheckCircle className="h-4 w-4" /></div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
