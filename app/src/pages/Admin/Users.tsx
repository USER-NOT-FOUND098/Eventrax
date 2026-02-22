import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { DataTable } from '@/components/ui-custom/DataTable';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
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
import { Search, Plus, UserCheck, Shield, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function AdminUsers() {
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'block' | 'role' | 'delete'>('approve');
  const [selectedRole, setSelectedRole] = useState<string>('');

  const [loading, setLoading] = useState(true);

  // Add User Dialog State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    institution: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users/index.php');
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingUsers = users.filter(u => u.status === 'pending');

  const handleAction = (user: User, action: 'approve' | 'block' | 'role' | 'delete') => {
    setSelectedUser(user);
    setActionType(action);
    if (action === 'role') {
      setSelectedRole(user.role);
    }
    setIsActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;

    try {
      if (actionType === 'approve') {
        // ... existing approve logic ...
        await api.post('/users/approve.php', { user_id: selectedUser.id });
        setUsers(prev => prev.map(user =>
          user.id === selectedUser.id ? { ...user, status: 'active' } : user
        ));
        toast.success(`${selectedUser.name} has been approved`);
      } else if (actionType === 'block') {
        // ... existing block logic ...
        const action = selectedUser.status === 'suspended' ? 'activate' : 'suspend';
        await api.post('/users/suspend.php', { user_id: selectedUser.id, action });
        setUsers(prev => prev.map(user =>
          user.id === selectedUser.id
            ? { ...user, status: action === 'suspend' ? 'suspended' : 'active' }
            : user
        ));
        toast.success(`${selectedUser.name} has been ${action === 'suspend' ? 'suspended' : 'reactivated'}`);
      } else if (actionType === 'role') {
        // ... existing role logic ...
        await api.post('/users/change-role.php', {
          user_id: selectedUser.id,
          new_role: selectedRole
        });
        setUsers(prev => prev.map(user =>
          user.id === selectedUser.id ? { ...user, role: selectedRole as User['role'] } : user
        ));
        toast.success(`${selectedUser.name}'s role changed to ${selectedRole}`);
      } else if (actionType === 'delete') {
        await api.post('/users/delete.php', { user_id: selectedUser.id });
        setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
        toast.success(`${selectedUser.name} has been permanently deleted`);
      }
    } catch (error: any) {
      console.error('Action failed', error);
      console.log('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.error || 'Action failed. Please try again.';
      toast.error(errorMessage);
    }

    setIsActionDialogOpen(false);
    setSelectedUser(null);
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/users/create.php', newUser);
      setUsers(prev => [...prev, data.user]);
      toast.success('User created successfully');
      setIsAddUserOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'student', institution: '' });
    } catch (error: any) {
      console.error('Failed to create user', error);
      toast.error(error.response?.data?.error || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickApprove = async (user: User) => {
    try {
      await api.post('/users/approve.php', { user_id: user.id });
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, status: 'active' } : u
      ));
      toast.success(`${user.name} approved!`);
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const quickReject = async (user: User) => {
    if (!confirm(`Are you sure you want to reject ${user.name}'s registration? This will delete their account.`)) {
      return;
    }
    try {
      await api.post('/users/reject.php', { user_id: user.id });
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success(`${user.name}'s registration rejected`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject user');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" style={{ color: 'var(--status-info)' }} />;
      case 'creator':
        return <UserCheck className="w-4 h-4" style={{ color: 'var(--status-success)' }} />;
      default:
        return null;
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'User',
      cell: (user: User) => (
        <div className="flex items-center gap-3">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
            alt={user.name}
            className="w-10 h-10 rounded-xl bg-gray-700"
          />
          <div>
            <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
            <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (user: User) => (
        <div className="flex items-center gap-2">
          {getRoleIcon(user.role)}
          <span className="capitalize text-[var(--text-secondary)]">{user.role}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (user: User) => <StatusBadge status={user.status} size="sm" />,
    },
    {
      key: 'institution',
      header: 'Institution',
      cell: (user: User) => (
        <span className="text-[var(--text-muted)]">{user.institution || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      cell: (user: User) => (
        <span className="text-[var(--text-muted)]">
          {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '-'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      cell: (user: User) => (
        <span className="text-[var(--text-muted)]">
          {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy') : '-'}
        </span>
      ),
    },
  ];

  const getActionItems = (user: User) => {
    const items = [];

    if (user.status === 'pending') {
      items.push({
        label: 'Approve User',
        onClick: () => handleAction(user, 'approve'),
      });
    }

    items.push({
      label: user.status === 'suspended' ? 'Reactivate User' : 'Suspend User',
      onClick: () => handleAction(user, 'block'),
      variant: user.status === 'suspended' ? 'default' : 'destructive',
    } as any);

    items.push({
      label: 'Change Role',
      onClick: () => handleAction(user, 'role'),
    });

    items.push({
      label: 'Delete User',
      onClick: () => handleAction(user, 'delete'),
      variant: 'destructive',
    });

    return items;
  };

  if (loading) {
    return <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-primary)]">Loading Users...</div>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar />
      <div className={`${collapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300`}>
        <Header />

        <main className="p-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">User Management</h1>
              <p className="text-[var(--text-secondary)] mt-1">Manage users and their permissions</p>
            </div>
            <Button
              className="bg-indigo-500 hover:bg-indigo-600"
              onClick={() => setIsAddUserOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>

          {/* Pending Approvals Section */}
          {pendingUsers.length > 0 && (
            <div
              className="mb-8 rounded-2xl p-6 border"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--status-warning), transparent 90%)',
                borderColor: 'color-mix(in srgb, var(--status-warning), transparent 70%)'
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--status-warning)' }} />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Pending Approvals ({pendingUsers.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingUsers.map(user => (
                  <div key={user.id} className="bg-[var(--bg-secondary)] rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                        alt={user.name}
                        className="w-10 h-10 rounded-xl bg-gray-700"
                      />
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{user.role} • {user.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="text-white"
                        style={{ backgroundColor: 'var(--status-success)' }}
                        onClick={() => quickApprove(user)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-rose-500 hover:bg-rose-600 text-white"
                        onClick={() => quickReject(user)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users', value: users.length, colorVar: 'var(--text-primary)', icon: Users },
              { label: 'Active', value: users.filter(u => u.status === 'active').length, colorVar: 'var(--status-success)', icon: CheckCircle },
              { label: 'Pending', value: users.filter(u => u.status === 'pending').length, colorVar: 'var(--status-warning)', icon: AlertTriangle },
              { label: 'Suspended', value: users.filter(u => u.status === 'suspended').length, colorVar: 'var(--status-error)', icon: Shield },
            ].map((stat, index) => (
              <div key={index} className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-4">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="w-4 h-4" style={{ color: stat.colorVar }} />
                  <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: stat.colorVar }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              placeholder="Search users by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Users Table */}
          <DataTable
            data={filteredUsers}
            columns={columns}
            keyExtractor={(user) => user.id}
            actions={(user) => getActionItems(user)}
            emptyMessage="No users found"
          />
        </main>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="bg-[var(--bg-secondary)] border-[var(--border-color)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">Add New User</DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              Create a new user account. The password will be hashed securely.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[var(--text-secondary)]">Full Name *</Label>
              <Input
                placeholder="John Doe"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--text-secondary)]">Email *</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--text-secondary)]">Password *</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)]"
              />
              <p className="text-xs text-[var(--text-muted)]">Password is securely hashed. You won't be able to see it.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--text-secondary)]">Role *</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                <SelectTrigger className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
                  <SelectItem value="student" className="text-[var(--text-primary)]">Student</SelectItem>
                  <SelectItem value="creator" className="text-[var(--text-primary)]">Creator</SelectItem>
                  <SelectItem value="teamlead" className="text-[var(--text-primary)]">Team Lead</SelectItem>
                  <SelectItem value="admin" className="text-[var(--text-primary)]">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--text-secondary)]">Institution</Label>
              <Input
                placeholder="University/Organization"
                value={newUser.institution}
                onChange={(e) => setNewUser(prev => ({ ...prev, institution: e.target.value }))}
                className="bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-primary)]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddUserOpen(false)}
              className="border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={isSubmitting}
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">
              {actionType === 'approve' && 'Approve User'}
              {actionType === 'block' && (selectedUser?.status === 'suspended' ? 'Reactivate User' : 'Suspend User')}
              {actionType === 'role' && 'Change Role'}
              {actionType === 'delete' && 'Delete User'}
            </DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              {actionType === 'approve' && `Are you sure you want to approve ${selectedUser?.name}?`}
              {actionType === 'block' && `Are you sure you want to ${selectedUser?.status === 'suspended' ? 'reactivate' : 'suspend'} ${selectedUser?.name}?`}
              {actionType === 'role' && `Select a new role for ${selectedUser?.name}`}
              {actionType === 'delete' && `Are you sure you want to PERMANENTLY delete ${selectedUser?.name}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'role' && (
            <div className="grid grid-cols-2 gap-2 py-4">
              {['admin', 'creator', 'teamlead', 'student'].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`p-3 rounded-xl transition-colors capitalize ${selectedRole === role
                    ? 'bg-indigo-500 text-white'
                    : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]'
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsActionDialogOpen(false)}
              className="border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              className={(actionType === 'block' && selectedUser?.status !== 'suspended') || actionType === 'delete' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-500 hover:bg-indigo-600'}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

