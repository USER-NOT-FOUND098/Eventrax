import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Search, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
  start_date: string;
  end_date: string;
  status: string;
  poster?: string;
  banner?: string;
  creator_name?: string;
}

interface Registration {
  id: string;
  event_id: string;
  status: string;
}

export function StudentEvents() {
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all events
      const eventsRes = await api.get('/events/index.php');
      setEvents(eventsRes.data || []);

      // Fetch my registrations
      const regRes = await api.get('/registrations/index.php');
      setRegistrations(regRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const registeredEventIds = registrations.map(r => r.event_id);

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'registered') {
      return matchesSearch && registeredEventIds.includes(event.id);
    }
    if (activeTab === 'upcoming') {
      return matchesSearch && event.status === 'upcoming' && !registeredEventIds.includes(event.id);
    }

    return matchesSearch;
  });

  const handleRegister = async (event: Event) => {
    try {
      setIsRegistering(true);
      setSelectedEvent(event);
      setIsRegisterDialogOpen(true);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to prepare registration');
    }
  };

  const confirmRegistration = async () => {
    if (!selectedEvent) return;
    
    try {
      setIsRegistering(true);
      const response = await api.post('/registrations/student.php', {
        event_id: selectedEvent.id
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setRegistrationSuccess(true);
        // Refresh data
        await fetchData();
        
        // Close dialog after success
        setTimeout(() => {
          setIsRegisterDialogOpen(false);
          setRegistrationSuccess(false);
          setSelectedEvent(null);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Failed to register for event');
    } finally {
      setIsRegistering(false);
    }
  };

  const eventCounts = {
    all: events.length,
    registered: registeredEventIds.length,
    upcoming: events.filter(e => e.status === 'upcoming' && !registeredEventIds.includes(e.id)).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Events</h1>
            <p className="text-[var(--text-secondary)] mt-1">Discover and register for exciting events</p>
          </div>

          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 rounded-2xl border border-[var(--accent-primary)]/20 p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Welcome to EVENTRAX!</h2>
                <p className="text-[var(--text-secondary)]">Browse upcoming events and register to participate</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Search events by name, venue, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="bg-[var(--bg-card)] border border-[var(--border-color)] p-1">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white text-[var(--text-secondary)]"
              >
                All Events ({eventCounts.all})
              </TabsTrigger>
              <TabsTrigger
                value="registered"
                className="data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white text-[var(--text-secondary)]"
              >
                My Registrations ({eventCounts.registered})
              </TabsTrigger>
              <TabsTrigger
                value="upcoming"
                className="data-[state=active]:bg-[var(--accent-primary)] data-[state=active]:text-white text-[var(--text-secondary)]"
              >
                Available ({eventCounts.upcoming})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <div key={event.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden group hover:border-[var(--accent-primary)]/30 transition-all">
                      {/* Event Image */}
                      <div className="aspect-video bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 relative overflow-hidden">
                        {event.poster && (
                          <img src={event.poster} alt={event.title} className="w-full h-full object-cover" />
                        )}
                        <div className={cn(
                          'absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium border',
                          event.status === 'upcoming' && 'bg-[var(--status-info)]/10 text-[var(--status-info)] border-[var(--status-info)]/20',
                          event.status === 'ongoing' && 'bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/20',
                          event.status === 'completed' && 'bg-[var(--status-success)]/10 text-[var(--status-success)] border-[var(--status-success)]/20'
                        )}>
                          {event.status}
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="p-4">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-1">{event.title}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-2">{event.venue}</p>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4">{event.description}</p>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                            onClick={() => navigate(`/student/events/${event.id}`)}
                          >
                            View Details
                          </Button>
                          {registeredEventIds.includes(event.id) ? (
                            <Button size="sm" disabled className="flex-1 bg-[var(--status-success)]/10 text-[var(--status-success)] border border-[var(--status-success)]/20">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Registered
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="flex-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white"
                              onClick={() => handleRegister(event)}
                            >
                              Register Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                  <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-[var(--text-secondary)]" />
                  </div>
                  <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No events found</h3>
                  <p className="text-[var(--text-secondary)]">
                    {searchQuery ? 'Try adjusting your search terms' : 'No events available in this category'}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Registration Dialog */}
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="bg-[var(--bg-card)] border-[var(--border-color)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">Register for Event</DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)]">
              Confirm your registration for {selectedEvent?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)]">
              <h4 className="font-medium text-[var(--text-primary)]">{selectedEvent?.title}</h4>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{selectedEvent?.venue}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                By registering, you agree to attend the event and follow all guidelines.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRegisterDialogOpen(false)}
              className="border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              disabled={isRegistering}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRegistration}
              className={cn(
                'bg-[var(--status-success)] hover:bg-[var(--status-success)]/90 text-white',
                registrationSuccess && 'bg-[var(--status-success)]'
              )}
              disabled={isRegistering || registrationSuccess}
            >
              {registrationSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Registered!
                </>
              ) : isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                'Confirm Registration'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
