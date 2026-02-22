import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/contexts/SidebarContext';
import { StatusBadge } from '@/components/ui-custom/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Calendar, MapPin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';


interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
  start_date: string;
  end_date: string;
  status: string;
  budget: number;
  poster?: string;
}

export function CreatorEvents() {
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events/index.php?mine=true');
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to fetch events', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'all' || event.status === activeTab;

    return matchesSearch && matchesTab;
  });

  const eventCounts = {
    all: events.length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    ongoing: events.filter(e => e.status === 'ongoing').length,
    completed: events.filter(e => e.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
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
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{isAdmin ? 'All Events' : 'My Events'}</h1>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Manage all your events in one place</p>
            </div>
            <Button
              className="bg-indigo-500 hover:bg-indigo-600"
              onClick={() => navigate(isAdmin ? '/admin/events/new' : '/creator/events/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <Input
                placeholder="Search events by name or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 placeholder:text-gray-500"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-input)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="p-1" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderWidth: '1px' }}>
              <TabsTrigger
                value="all"
                className="data-[state=active]:text-white transition-colors"
                style={{
                  // We can't easily use style for data-[state=active] bg without generic css, 
                  // but we can rely on standard classes or just inline the non-active state
                  color: 'var(--text-secondary)'
                }}

              >
                All ({eventCounts.all})
              </TabsTrigger>
              <TabsTrigger
                value="upcoming"
                className="data-[state=active]:text-white transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Upcoming ({eventCounts.upcoming})
              </TabsTrigger>
              <TabsTrigger
                value="ongoing"
                className="data-[state=active]:text-white transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Ongoing ({eventCounts.ongoing})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:text-white transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Completed ({eventCounts.completed})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border overflow-hidden group transition-all cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-card)'
                      }}
                      onClick={() => navigate(isAdmin ? `/admin/events/${event.id}` : `/creator/events/${event.id}`)}
                    >
                      {/* Event Image */}
                      <div className="aspect-video relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))' }}>
                        {event.poster ? (
                          <img src={event.poster} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full opacity-20" />
                        )}
                        <div className="absolute top-3 right-3">
                          <StatusBadge status={event.status as any} size="sm" />
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="p-4">
                        <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{event.title}</h3>
                        <div className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(event.start_date), 'MMM d, yyyy')}
                          </p>
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.venue}
                          </p>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            className="flex-1 bg-indigo-500 hover:bg-indigo-600"
                            onClick={(e) => { e.stopPropagation(); navigate(isAdmin ? `/admin/events/${event.id}` : `/creator/events/${event.id}`); }}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/10 text-gray-300 hover:bg-white/5"
                            onClick={(e) => { e.stopPropagation(); navigate(isAdmin ? `/admin/events/${event.id}/edit` : `/creator/events/${event.id}/edit`); }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-card)' }}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <Search className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No events found</h3>
                  <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'Create your first event to get started'}
                  </p>
                  {!searchQuery && (
                    <Button
                      className="bg-indigo-500 hover:bg-indigo-600"
                      onClick={() => navigate(isAdmin ? '/admin/events/new' : '/creator/events/new')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
