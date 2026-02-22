import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { AdminDashboard } from '@/pages/Admin/Dashboard';
import { AdminUsers } from '@/pages/Admin/Users';
import { AdminReports } from '@/pages/Admin/Reports';
import { AdminSettings } from '@/pages/Admin/Settings';
import { AdminTasks } from '@/pages/Admin/Tasks';
import AdminProfile from '@/pages/Admin/Profile';
import { CreateEvent } from '@/pages/Admin/CreateEvent';
import { CreatorDashboard } from '@/pages/Creator/Dashboard';
import { CreatorEvents } from '@/pages/Creator/Events';
import { AllEvents } from '@/pages/Creator/AllEvents';
import { CreatorEventDetail } from '@/pages/Creator/EventDetail';
import CreatorProfile from '@/pages/Creator/Profile';
import CreatorSettings from '@/pages/Creator/Settings';
import { TeamLeadDashboard } from '@/pages/TeamLead/Dashboard';
import { TeamLeadVolunteers } from '@/pages/TeamLead/Volunteers';
import { TeamLeadTasks } from '@/pages/TeamLead/Tasks';
import { TeamLeadAllEvents } from '@/pages/TeamLead/AllEvents';
import TeamLeadProfile from '@/pages/TeamLead/Profile';
import TeamLeadSettings from '@/pages/TeamLead/Settings';
import { StudentEvents } from '@/pages/Student/Events';
import StudentDashboard from '@/pages/Student/Dashboard';
import StudentEventDetail from '@/pages/Student/EventDetail';
import StudentSubEventDetail from '@/pages/Student/SubEventDetail';
import StudentRegistrations from '@/pages/Student/Registrations';
import StudentMessages from '@/pages/Student/Messages';
import StudentVolunteer from '@/pages/Student/Volunteer';
import StudentTasks from '@/pages/Student/Tasks';
import StudentProfile from '@/pages/Student/Profile';
import StudentSettings from '@/pages/Student/Settings';
import AnnouncementsPage from '@/pages/Common/Announcements';
import SubEventsPage from '@/pages/Common/SubEvents';
import SubEventDetailPage from '@/pages/Common/SubEventDetail';
import { TeamManagement } from '@/pages/Common/Team';
import { Toaster } from '@/components/ui/sonner';

// Protected Route Component
function ProtectedRoute({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role || '')) {
    // Redirect to appropriate dashboard based on role
    switch (user?.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'creator':
        return <Navigate to="/creator/dashboard" replace />;
      case 'teamlead':
        return <Navigate to="/teamlead/dashboard" replace />;
      case 'student':
        return <Navigate to="/student/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}

// Role-based redirect component
function RoleBasedRedirect() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'creator':
      return <Navigate to="/creator/dashboard" replace />;
    case 'teamlead':
      return <Navigate to="/teamlead/dashboard" replace />;
    case 'student':
      return <Navigate to="/student/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sub-events"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SubEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sub-events/:id"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SubEventDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/team"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <TeamManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/announcements"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AnnouncementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tasks"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CreatorEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events/new"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CreateEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events/:eventId"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CreatorEventDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events/:eventId/edit"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CreateEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminProfile />
          </ProtectedRoute>
        }
      />

      {/* Creator Routes */}
      <Route
        path="/creator/dashboard"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <CreatorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/events"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <CreatorEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/all-events"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <AllEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/events/:eventId"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <CreatorEventDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/events/new"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <CreateEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/sub-events"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <SubEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/sub-events/:id"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <SubEventDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/events/:eventId/edit"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <CreateEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/expenses"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <CreatorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/team"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <TeamManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/announcements"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <AnnouncementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/tasks"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <AdminTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/profile"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <CreatorProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator/settings"
        element={
          <ProtectedRoute allowedRoles={['creator']}>
            <CreatorSettings />
          </ProtectedRoute>
        }
      />

      {/* Team Lead Routes */}
      <Route
        path="/teamlead/dashboard"
        element={
          <ProtectedRoute allowedRoles={['teamlead']}>
            <TeamLeadDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teamlead/all-events"
        element={
          <ProtectedRoute allowedRoles={['teamlead']}>
            <TeamLeadAllEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teamlead/sub-events"
        element={
          <ProtectedRoute allowedRoles={['teamlead']}>
            <SubEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teamlead/sub-events/:id"
        element={
          <ProtectedRoute allowedRoles={['teamlead']}>
            <SubEventDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teamlead/events/:eventId"
        element={
          <ProtectedRoute allowedRoles={['teamlead']}>
            <CreatorEventDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teamlead/tasks"
        element={
          <ProtectedRoute allowedRoles={['teamlead']}>
            <TeamLeadTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teamlead/volunteers"
        element={
          <ProtectedRoute allowedRoles={['teamlead', 'admin', 'creator']}>
            <TeamLeadVolunteers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teamlead/profile"
        element={
          <ProtectedRoute allowedRoles={['teamlead']}>
            <TeamLeadProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teamlead/settings"
        element={
          <ProtectedRoute allowedRoles={['teamlead']}>
            <TeamLeadSettings />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/events"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/events/:eventId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentEventDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/events/:eventId/sub-events/:subEventId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentSubEventDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/sub-events/:id"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <SubEventDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/registrations"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentRegistrations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/announcements"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AnnouncementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/messages"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/volunteer"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentVolunteer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/tasks"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/settings"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentSettings />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/dashboard" element={<RoleBasedRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SidebarProvider>
            <NotificationProvider>
              <AppRoutes />
              <Toaster
                position="top-right"
                expand={false}
                richColors
                closeButton
                toastOptions={{
                  style: {
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  },
                }}
              />
            </NotificationProvider>
          </SidebarProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
