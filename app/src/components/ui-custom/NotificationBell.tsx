import { useState } from 'react';
import { Bell, X, Check, Trash2, Calendar, Trophy, Info, Settings, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNotifications, type Notification } from '@/contexts/NotificationContext';
import { format } from 'date-fns';

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAsUnread,
    deleteNotification,
    markAllAsRead,
    clearAll
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'event_day':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'winner':
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 'system':
        return <Settings className="w-4 h-4 text-gray-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };




  const getNotificationStyles = (type: Notification['type'], isRead: boolean) => {
    // Base styles for all notifications
    const base = "p-4 border-b border-[var(--border-color)] transition-all cursor-pointer border-l-4";

    // If read, use simpler styling but keep hover effect
    if (isRead) {
      return `${base} border-l-transparent hover:bg-[var(--bg-secondary)]`;
    }

    // If unread, apply specific color schemes
    switch (type) {
      case 'winner':
        return `${base} border-l-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20 hover:bg-yellow-500/15`;
      case 'event_day':
        return `${base} border-l-blue-500 bg-blue-500/10 dark:bg-blue-500/20 hover:bg-blue-500/15`;
      case 'system':
        return `${base} border-l-gray-500 bg-gray-500/10 dark:bg-gray-500/20 hover:bg-gray-500/15`;
      default:
        return `${base} border-l-[var(--accent-primary)] bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/15`;
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    return (
      <div
        className={getNotificationStyles(notification.type, !!notification.is_read)}
        onClick={() => {
          if (!notification.is_read) markAsRead(notification.id);
          setSelectedNotification(notification);
        }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-[var(--text-primary)] text-sm">
                {notification.title}
              </h4>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full"></div>
              )}
            </div>
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-2">
              {notification.message}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">
                {format(new Date(notification.created_at), 'MMM dd, HH:mm')}
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(notification.message);
                  }}
                  className="h-6 w-6 p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Copy content"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                {notification.is_read ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsUnread(notification.id);
                    }}
                    className="h-6 w-6 p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="h-6 w-6 p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="h-6 w-6 p-0 text-[var(--text-muted)] hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 bg-[var(--accent-primary)] text-white text-xs min-w-[18px] h-[18px] p-0 flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <Card className="absolute right-0 top-12 w-96 max-h-[500px] bg-[var(--bg-card)] border-[var(--border-color)] shadow-lg z-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-[var(--text-primary)]">Notifications</CardTitle>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAllAsRead()}
                      className="text-xs border-[var(--border-color)] text-[var(--text-secondary)]"
                    >
                      Mark all read
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => clearAll()}
                      className="text-xs border-[var(--border-color)] text-[var(--text-secondary)]"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent-primary)]"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                  <p className="text-[var(--text-secondary)]">No notifications yet</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    We'll notify you about upcoming events and prizes
                  </p>
                </div>
              ) : (
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 border-b border-[var(--border-color)]">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-[var(--bg-secondary)] text-xs"
                    >
                      All ({notifications.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="unread"
                      className="data-[state=active]:bg-[var(--bg-secondary)] text-xs"
                    >
                      Unread ({unreadCount})
                    </TabsTrigger>
                    <TabsTrigger
                      value="read"
                      className="data-[state=active]:bg-[var(--bg-secondary)] text-xs"
                    >
                      Read ({readNotifications.length})
                    </TabsTrigger>
                  </TabsList>

                  <div className="max-h-[350px] overflow-y-auto">
                    <TabsContent value="all" className="mt-0">
                      {notifications.map((notification) => (
                        <NotificationItem key={notification.id} notification={notification} />
                      ))}
                    </TabsContent>

                    <TabsContent value="unread" className="mt-0">
                      {unreadNotifications.length > 0 ? (
                        unreadNotifications.map((notification) => (
                          <NotificationItem key={notification.id} notification={notification} />
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Check className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                          <p className="text-[var(--text-secondary)]">All caught up!</p>
                          <p className="text-sm text-[var(--text-muted)] mt-1">
                            No unread notifications
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="read" className="mt-0">
                      {readNotifications.length > 0 ? (
                        readNotifications.map((notification) => (
                          <NotificationItem key={notification.id} notification={notification} />
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Bell className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                          <p className="text-[var(--text-secondary)]">No read notifications</p>
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">
              {selectedNotification?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--bg-secondary)] p-4 rounded-md border border-[var(--border-color)]">
              {selectedNotification?.message}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedNotification(null)}>
                Close
              </Button>
              <Button onClick={() => selectedNotification && handleCopy(selectedNotification.message)}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Content
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
