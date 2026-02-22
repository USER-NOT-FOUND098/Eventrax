import type { 
  Event, SubEvent, User, Volunteer,
  Prize, Announcement, ChatMessage, Expense, Registration,
  DashboardStats 
} from '@/types';

// Mock Events
export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Tech Fest 2024',
    description: 'Annual technology festival featuring hackathons, workshops, and tech talks from industry leaders.',
    poster: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80',
    venue: 'University Main Auditorium',
    startDate: '2024-03-15T09:00:00',
    endDate: '2024-03-17T18:00:00',
    status: 'upcoming',
    creatorId: '2',
    creatorName: 'Sarah Johnson',
    budget: 50000,
    totalExpenses: 12500,
    volunteerCount: 45,
    attendeeCount: 1200,
    createdAt: '2024-01-10T10:00:00',
    updatedAt: '2024-01-25T14:30:00',
  },
  {
    id: '2',
    title: 'Cultural Night 2024',
    description: 'A celebration of diversity through music, dance, and food from different cultures.',
    poster: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    venue: 'Open Air Theater',
    startDate: '2024-02-20T18:00:00',
    endDate: '2024-02-20T23:00:00',
    status: 'ongoing',
    creatorId: '2',
    creatorName: 'Sarah Johnson',
    budget: 25000,
    totalExpenses: 22000,
    volunteerCount: 30,
    attendeeCount: 800,
    createdAt: '2024-01-05T09:00:00',
    updatedAt: '2024-01-28T10:00:00',
  },
  {
    id: '3',
    title: 'Sports Meet 2023',
    description: 'Annual inter-college sports competition with track events, team sports, and awards ceremony.',
    poster: 'https://images.unsplash.com/photo-1461896836934- voices?w=800&q=80',
    venue: 'Sports Complex',
    startDate: '2023-11-10T08:00:00',
    endDate: '2023-11-12T17:00:00',
    status: 'completed',
    creatorId: '2',
    creatorName: 'Sarah Johnson',
    budget: 35000,
    totalExpenses: 34200,
    volunteerCount: 60,
    attendeeCount: 2000,
    createdAt: '2023-10-01T10:00:00',
    updatedAt: '2023-11-15T12:00:00',
  },
  {
    id: '4',
    title: 'Career Fair Spring 2024',
    description: 'Connect with top employers, attend resume workshops, and explore internship opportunities.',
    poster: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
    venue: 'Convention Center',
    startDate: '2024-04-05T10:00:00',
    endDate: '2024-04-06T16:00:00',
    status: 'upcoming',
    creatorId: '2',
    creatorName: 'Sarah Johnson',
    budget: 40000,
    totalExpenses: 8000,
    volunteerCount: 25,
    attendeeCount: 0,
    createdAt: '2024-01-20T11:00:00',
    updatedAt: '2024-01-26T15:00:00',
  },
];

// Mock Sub-Events
export const mockSubEvents: SubEvent[] = [
  {
    id: 'se1',
    eventId: '1',
    title: 'Opening Ceremony',
    description: 'Inaugural session with keynote speakers and cultural performances.',
    startTime: '2024-03-15T09:00:00',
    endTime: '2024-03-15T11:00:00',
    venue: 'Main Auditorium',
    teamLeadId: '3',
    teamLeadName: 'Mike Chen',
    expectedTime: 120,
    actualTime: 115,
    status: 'upcoming',
    accessories: [
      { id: 'a1', name: 'Microphones', quantity: 4, unitCost: 50, totalCost: 200, category: 'Audio', status: 'available' },
      { id: 'a2', name: 'Projector', quantity: 2, unitCost: 150, totalCost: 300, category: 'Visual', status: 'available' },
    ],
    volunteers: [],
  },
  {
    id: 'se2',
    eventId: '1',
    title: 'Hackathon Finals',
    description: 'Final round of the 24-hour coding competition with project presentations.',
    startTime: '2024-03-16T10:00:00',
    endTime: '2024-03-16T16:00:00',
    venue: 'Computer Labs A & B',
    teamLeadId: '3',
    teamLeadName: 'Mike Chen',
    expectedTime: 360,
    status: 'upcoming',
    accessories: [
      { id: 'a3', name: 'Laptops', quantity: 20, unitCost: 1000, totalCost: 20000, category: 'Equipment', status: 'in-use' },
      { id: 'a4', name: 'WiFi Routers', quantity: 5, unitCost: 80, totalCost: 400, category: 'Network', status: 'available' },
    ],
    volunteers: [],
  },
  {
    id: 'se3',
    eventId: '2',
    title: 'Cultural Performances',
    description: 'Traditional dance and music performances from various cultures.',
    startTime: '2024-02-20T19:00:00',
    endTime: '2024-02-20T21:00:00',
    venue: 'Main Stage',
    teamLeadId: '3',
    teamLeadName: 'Mike Chen',
    expectedTime: 120,
    actualTime: 125,
    status: 'ongoing',
    accessories: [
      { id: 'a5', name: 'Stage Lights', quantity: 12, unitCost: 100, totalCost: 1200, category: 'Lighting', status: 'in-use' },
      { id: 'a6', name: 'Sound System', quantity: 1, unitCost: 800, totalCost: 800, category: 'Audio', status: 'in-use' },
    ],
    volunteers: [],
  },
];

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'System Admin',
    email: 'admin@eventrax.com',
    role: 'admin',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    createdAt: '2024-01-01',
    lastLogin: '2024-01-28',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@eventrax.com',
    role: 'creator',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    institution: 'Tech University',
    createdAt: '2024-01-15',
    lastLogin: '2024-01-28',
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike@eventrax.com',
    role: 'teamlead',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    createdAt: '2024-01-20',
    lastLogin: '2024-01-27',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@eventrax.com',
    role: 'student',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    institution: 'Tech University',
    createdAt: '2024-01-25',
    lastLogin: '2024-01-28',
  },
  {
    id: '5',
    name: 'Alex Wilson',
    email: 'alex@eventrax.com',
    role: 'student',
    status: 'pending',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    institution: 'Tech University',
    createdAt: '2024-01-28',
  },
  {
    id: '6',
    name: 'Jessica Brown',
    email: 'jessica@eventrax.com',
    role: 'creator',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jessica',
    institution: 'State College',
    createdAt: '2024-01-10',
    lastLogin: '2024-01-26',
  },
];

// Mock Volunteers
export const mockVolunteers: Volunteer[] = [
  {
    id: 'v1',
    name: 'John Smith',
    email: 'john@eventrax.com',
    phone: '+1 555-0101',
    role: 'Registration Desk',
    subEventId: 'se1',
    assignedBy: '3',
    assignedAt: '2024-01-25T10:00:00',
    status: 'active',
  },
  {
    id: 'v2',
    name: 'Lisa Wong',
    email: 'lisa@eventrax.com',
    phone: '+1 555-0102',
    role: 'Technical Support',
    subEventId: 'se2',
    assignedBy: '3',
    assignedAt: '2024-01-25T11:00:00',
    status: 'active',
  },
  {
    id: 'v3',
    name: 'David Park',
    email: 'david@eventrax.com',
    phone: '+1 555-0103',
    role: 'Stage Management',
    subEventId: 'se3',
    assignedBy: '3',
    assignedAt: '2024-01-24T09:00:00',
    status: 'active',
  },
  {
    id: 'v4',
    name: 'Anna Martinez',
    email: 'anna@eventrax.com',
    phone: '+1 555-0104',
    role: 'Hospitality',
    subEventId: 'se1',
    assignedBy: '3',
    assignedAt: '2024-01-25T10:30:00',
    status: 'active',
  },
];

// Mock Prizes
export const mockPrizes: Prize[] = [
  { id: 'p1', eventId: '1', position: 1, title: 'Grand Prize', description: 'Cash prize + internship opportunity', value: 10000 },
  { id: 'p2', eventId: '1', position: 2, title: 'First Runner Up', description: 'Cash prize + tech gadgets', value: 5000 },
  { id: 'p3', eventId: '1', position: 3, title: 'Second Runner Up', description: 'Cash prize', value: 2500 },
  { id: 'p4', eventId: '3', position: 1, title: 'Overall Champion', description: 'Trophy + cash prize', value: 5000, winnerName: 'Team Alpha' },
  { id: 'p5', eventId: '3', position: 2, title: 'Runner Up', description: 'Trophy + cash prize', value: 3000, winnerName: 'Team Beta' },
];

// Mock Announcements
export const mockAnnouncements: Announcement[] = [
  {
    id: 'an1',
    eventId: '1',
    title: 'Registration Open',
    content: 'Registration for Tech Fest 2024 is now open! Early bird tickets available until Feb 15.',
    createdBy: '2',
    createdByName: 'Sarah Johnson',
    createdAt: '2024-01-20T09:00:00',
    priority: 'high',
  },
  {
    id: 'an2',
    eventId: '1',
    title: 'Volunteer Training Session',
    content: 'Mandatory training for all volunteers on March 10th at 2 PM in Room 301.',
    createdBy: '2',
    createdByName: 'Sarah Johnson',
    createdAt: '2024-01-25T14:00:00',
    priority: 'medium',
  },
  {
    id: 'an3',
    eventId: '2',
    title: 'Event Starting Soon',
    content: 'Cultural Night begins in 1 hour! Please arrive early for security check.',
    createdBy: '2',
    createdByName: 'Sarah Johnson',
    createdAt: '2024-02-20T17:00:00',
    priority: 'high',
  },
];

// Mock Chat Messages
export const mockChatMessages: ChatMessage[] = [
  {
    id: 'cm1',
    eventId: '1',
    senderId: '2',
    senderName: 'Sarah Johnson',
    senderRole: 'creator',
    content: 'Welcome everyone to Tech Fest 2024! Feel free to ask any questions here.',
    createdAt: '2024-01-20T09:00:00',
    isAnnouncement: true,
  },
  {
    id: 'cm2',
    eventId: '1',
    senderId: '4',
    senderName: 'Emily Davis',
    senderRole: 'student',
    content: 'When will the hackathon schedule be published?',
    createdAt: '2024-01-22T10:30:00',
    isAnnouncement: false,
  },
  {
    id: 'cm3',
    eventId: '1',
    senderId: '2',
    senderName: 'Sarah Johnson',
    senderRole: 'creator',
    content: 'The detailed schedule will be published by Feb 1st. Stay tuned!',
    createdAt: '2024-01-22T11:00:00',
    isAnnouncement: false,
  },
  {
    id: 'cm4',
    eventId: '2',
    senderId: '2',
    senderName: 'Sarah Johnson',
    senderRole: 'creator',
    content: 'Cultural Night is about to begin! Excited to see you all there.',
    createdAt: '2024-02-20T17:30:00',
    isAnnouncement: true,
  },
];

// Mock Expenses
export const mockExpenses: Expense[] = [
  { id: 'e1', eventId: '1', category: 'Venue', description: 'Auditorium rental', amount: 5000, createdBy: '2', createdAt: '2024-01-15T10:00:00' },
  { id: 'e2', eventId: '1', category: 'Catering', description: 'Coffee and snacks', amount: 1500, createdBy: '2', createdAt: '2024-01-16T11:00:00' },
  { id: 'e3', eventId: '1', category: 'Marketing', description: 'Poster printing', amount: 800, createdBy: '2', createdAt: '2024-01-18T09:00:00' },
  { id: 'e4', eventId: '1', category: 'Equipment', description: 'Audio system rental', amount: 2500, createdBy: '2', createdAt: '2024-01-20T14:00:00' },
  { id: 'e5', eventId: '1', category: 'Prizes', description: 'Trophies and certificates', amount: 1200, createdBy: '2', createdAt: '2024-01-22T10:00:00' },
  { id: 'e6', eventId: '2', category: 'Venue', description: 'Theater rental', amount: 3000, createdBy: '2', createdAt: '2024-01-25T09:00:00' },
  { id: 'e7', eventId: '2', category: 'Decorations', description: 'Stage decorations', amount: 1500, createdBy: '2', createdAt: '2024-01-26T11:00:00' },
  { id: 'e8', eventId: '2', category: 'Catering', description: 'Food for performers', amount: 800, createdBy: '2', createdAt: '2024-01-27T10:00:00' },
];

// Mock Registrations
export const mockRegistrations: Registration[] = [
  { id: 'r1', eventId: '1', studentId: '4', studentName: 'Emily Davis', studentEmail: 'emily@eventrax.com', registeredAt: '2024-01-22T10:00:00', status: 'confirmed' },
  { id: 'r2', eventId: '1', studentId: '5', studentName: 'Alex Wilson', studentEmail: 'alex@eventrax.com', registeredAt: '2024-01-25T14:00:00', status: 'pending' },
  { id: 'r3', eventId: '2', studentId: '4', studentName: 'Emily Davis', studentEmail: 'emily@eventrax.com', registeredAt: '2024-02-15T09:00:00', status: 'attended' },
];

// Dashboard Stats
export const getDashboardStats = (): DashboardStats => ({
  totalEvents: mockEvents.length,
  upcomingEvents: mockEvents.filter(e => e.status === 'upcoming').length,
  ongoingEvents: mockEvents.filter(e => e.status === 'ongoing').length,
  completedEvents: mockEvents.filter(e => e.status === 'completed').length,
  totalUsers: mockUsers.length,
  totalVolunteers: mockVolunteers.length,
  totalBudget: mockEvents.reduce((sum, e) => sum + e.budget, 0),
  totalExpenses: mockEvents.reduce((sum, e) => sum + e.totalExpenses, 0),
  recentEvents: mockEvents.slice(0, 3),
});

// Helper functions
export const getEventById = (id: string) => mockEvents.find(e => e.id === id);
export const getSubEventsByEventId = (eventId: string) => mockSubEvents.filter(se => se.eventId === eventId);
export const getAnnouncementsByEventId = (eventId: string) => mockAnnouncements.filter(a => a.eventId === eventId);
export const getChatMessagesByEventId = (eventId: string) => mockChatMessages.filter(cm => cm.eventId === eventId);
export const getExpensesByEventId = (eventId: string) => mockExpenses.filter(e => e.eventId === eventId);
export const getPrizesByEventId = (eventId: string) => mockPrizes.filter(p => p.eventId === eventId);
export const getVolunteersBySubEventId = (subEventId: string) => mockVolunteers.filter(v => v.subEventId === subEventId);
export const getUserById = (id: string) => mockUsers.find(u => u.id === id);
