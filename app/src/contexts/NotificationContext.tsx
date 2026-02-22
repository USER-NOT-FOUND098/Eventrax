import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  user_type: string;
  type: 'event_day' | 'winner' | 'system' | 'reminder' | 'announcement';
  title: string;
  message: string;
  event_id?: string;
  sub_event_id?: string;
  is_read: boolean;
  created_at: string;
  related_title?: string;
  related_image?: string;
  related_type?: 'event' | 'sub_event' | 'system';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (type?: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const fetchNotifications = async (type?: string) => {
    // Only fetch notifications if user is authenticated
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const url = type ? `/notifications/student.php?type=${type}` : '/notifications/student.php';
      const response = await api.get(url);
      const notificationsData = response.data || [];
      
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter((n: Notification) => !n.is_read).length);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      // Don't show error toast for 405/403 errors to avoid spam
      if (error.response?.status !== 405 && error.response?.status !== 403) {
        // Optional: Show toast for other errors
        // toast.error('Failed to fetch notifications');
      }
      // Set empty state on error to prevent infinite loading
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await api.put('/notifications/student.php', {
        notification_id: notificationId,
        action: 'read'
      });

      if (response.data.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      const response = await api.put('/notifications/student.php', {
        notification_id: notificationId,
        action: 'unread'
      });

      if (response.data.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: false } : n)
        );
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      toast.error('Failed to mark notification as unread');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await api.put('/notifications/student.php', {
        notification_id: notificationId,
        action: 'delete'
      });

      if (response.data.success) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      for (const notification of unreadNotifications) {
        await api.put('/notifications/student.php', {
          notification_id: notification.id,
          action: 'read'
        });
      }

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const clearAll = async () => {
    try {
      for (const notification of notifications) {
        await api.put('/notifications/student.php', {
          notification_id: notification.id,
          action: 'delete'
        });
      }

      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  // Auto-refresh notifications every 2 minutes (only when authenticated)
  useEffect(() => {
    // Only set up polling if user is authenticated
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 120000); // 2 minutes instead of 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  // Show toast notifications for new unread notifications
  useEffect(() => {
    const newNotifications = notifications.filter(n => !n.is_read);
    
    // Only show toasts for notifications that were just added (simple approach)
    if (newNotifications.length > 0 && unreadCount > 0) {
      // This is a simplified approach - in a real app, you'd track previous notifications
      const latestNotification = newNotifications[0];
      
      if (latestNotification.type === 'event_day') {
        toast.info(latestNotification.title, {
          description: latestNotification.message,
          duration: 5000,
        });
      } else if (latestNotification.type === 'winner') {
        toast.success(latestNotification.title, {
          description: latestNotification.message,
          duration: 8000,
        });
      }
    }
  }, [notifications, unreadCount]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAsUnread,
      deleteNotification,
      markAllAsRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
