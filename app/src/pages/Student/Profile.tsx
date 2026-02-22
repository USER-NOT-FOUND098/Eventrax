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
  Trash2,
  Shield,
  Award,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student';
  institution: string;
  avatar: string;
  phone: string;
  status: string;
  createdAt: string;
  lastLogin: string;
}

interface Stats {
  eventsAttended: number;
  volunteerApplications: number;
  volunteerApproved: number;
  achievements: number;
}

export default function StudentProfile() {
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [stats, setStats] = useState<Stats>({
    eventsAttended: 0,
    volunteerApplications: 0,
    volunteerApproved: 0,
    achievements: 0,
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);

  // Avatar templates - 30 avatars (20 normal + 10 animated)
  const avatarTemplates = [
    // Male avatars (10 normal + 5 animated)
    'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley',
    // Animated male avatars (CSS + Emoji)
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐱</text></svg>',
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐶</text></svg>',
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🦅</text></svg>',
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🦉</text></svg>',
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐧</text></svg>',
    
    // Female avatars (10 normal + 5 animated)
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlotte',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Harper',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Evelyn',
    // Animated female avatars (CSS + Emoji)
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐰</text></svg>',
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🦜</text></svg>',
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐼</text></svg>',
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🦋</text></svg>',
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🐬</text></svg>',
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
      // Fetch user statistics
      const [registrationsResponse, volunteerResponse] = await Promise.all([
        api.get('/registrations/student.php'),
        api.get('/volunteers/apply.php')
      ]);

      const attendedEvents = registrationsResponse.data.filter(
        (reg: any) => reg.status === 'attended'
      ).length;
      
      const volunteerApplications = volunteerResponse.data.length;
      const volunteerApproved = volunteerResponse.data.filter(
        (app: any) => app.status === 'approved'
      ).length;

      setStats({
        eventsAttended: attendedEvents,
        volunteerApplications,
        volunteerApproved,
        achievements: attendedEvents + volunteerApproved, // Simple achievement calculation
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        
        // Clear success message after 3 seconds
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

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/users/update.php');
      setShowDeleteDialog(false);
      
      // Redirect to login after successful deletion request
      navigate('/login');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to delete account');
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'creator': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'teamlead': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'student': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
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
              <div className="mb-6">
                <Skeleton className="h-8 w-64 mb-2 bg-[var(--bg-secondary)]" />
                <Skeleton className="h-4 w-96 bg-[var(--bg-secondary)]" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Skeleton className="h-96 rounded-lg bg-[var(--bg-secondary)]" />
                </div>
                <div className="lg:col-span-1">
                  <Skeleton className="h-96 rounded-lg bg-[var(--bg-secondary)]" />
                </div>
              </div>
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
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      My Profile
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Manage your personal information and account settings
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editMode ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditMode(false);
                          setFormData(profile || {});
                          setAvatarPreview('');
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditMode(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Success/Error Messages */}
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
              {/* Profile Information */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      {editMode ? 'Edit your personal details' : 'Your personal information'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="account">Account</TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="space-y-4">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-20 w-20">
                              <AvatarImage src={avatarPreview || profile?.avatar} alt={profile?.name} />
                              <AvatarFallback className="text-lg">
                                {profile?.name?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {editMode && (
                              <div className="absolute -bottom-2 -right-2">
                                <button
                                  onClick={() => setShowAvatarDialog(true)}
                                  className="p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                                >
                                  <Camera className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{profile?.name}</h3>
                            <Badge className={cn("ml-2", getRoleColor(profile?.role || ''))}>
                              {(profile?.role || '').charAt(0).toUpperCase() + (profile?.role || '').slice(1)}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              value={editMode ? formData.name || '' : profile?.name || ''}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              disabled={!editMode}
                              className={editMode ? 'border-blue-300' : ''}
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              type="email"
                              value={profile?.email || ''}
                              disabled={true}
                              className="bg-gray-100 dark:bg-gray-800"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={editMode ? formData.phone || '' : profile?.phone || ''}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              disabled={!editMode}
                              placeholder="+1 (555) 123-4567"
                              className={editMode ? 'border-blue-300' : ''}
                            />
                          </div>
                          <div>
                            <Label htmlFor="institution">Institution</Label>
                            <Input
                              id="institution"
                              value={editMode ? formData.institution || '' : profile?.institution || ''}
                              onChange={(e) => handleInputChange('institution', e.target.value)}
                              disabled={!editMode}
                              placeholder="Your school or organization"
                              className={editMode ? 'border-blue-300' : ''}
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="account" className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <h4 className="font-medium">Account Status</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {profile?.status === 'active' ? 'Your account is active' : 'Account status: ' + profile?.status}
                              </p>
                            </div>
                            <Badge className={profile?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {(profile?.status || '').charAt(0).toUpperCase() + (profile?.status || '').slice(1)}
                            </Badge>
                          </div>

                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h4 className="font-medium mb-2">Member Since</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {profile?.createdAt ? formatJoinDate(profile.createdAt) : 'Unknown'}
                            </p>
                          </div>

                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h4 className="font-medium mb-2">Last Login</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {profile?.lastLogin ? formatLastLogin(profile.lastLogin) : 'Never'}
                            </p>
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => navigate('/student/settings')}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Account Settings
                            </Button>
                            
                            <Button
                              variant="destructive"
                              className="w-full justify-start"
                              onClick={() => setShowDeleteDialog(true)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* Stats Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Your Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium">Events Attended</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {stats.eventsAttended}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium">Volunteer Apps</span>
                        </div>
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {stats.volunteerApplications}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium">Approved</span>
                        </div>
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          {stats.volunteerApproved}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <span className="text-sm font-medium">Achievements</span>
                        </div>
                        <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                          {stats.achievements}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Deleting your account will remove all your data including:
                <ul className="list-disc list-inside mt-2">
                  <li>Event registrations</li>
                  <li>Volunteer applications</li>
                  <li>Profile information</li>
                  <li>Account settings</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar Selection Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose Avatar</DialogTitle>
            <DialogDescription>
              Select an avatar from the available templates
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-6 gap-3 py-4 max-h-96 overflow-y-auto">
            {avatarTemplates.map((avatar, index) => (
              <button
                key={index}
                onClick={() => handleAvatarSelect(avatar)}
                className="relative group"
              >
                <Avatar className="h-16 w-16 mx-auto border-2 border-gray-200 group-hover:border-blue-500 transition-colors">
                  <AvatarImage src={avatar} alt={`Avatar ${index + 1}`} />
                  <AvatarFallback>
                    {String.fromCharCode(65 + index)}
                  </AvatarFallback>
                </Avatar>
                {(avatarPreview || profile?.avatar) === avatar && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-blue-600 text-white rounded-full p-1">
                      <CheckCircle className="h-4 w-4" />
                    </div>
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
