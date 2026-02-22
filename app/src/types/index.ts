// User Roles
export type UserRole = 'admin' | 'creator' | 'teamlead' | 'student';

// User Status
export type UserStatus = 'active' | 'pending' | 'suspended';

// Event Status
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

// User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  institution?: string;
  createdAt: string;
  lastLogin?: string;
}

// Event Interface
export interface Event {
  id: string;
  title: string;
  description: string;
  poster?: string;
  banner?: string;
  venue: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  creatorId: string;
  creatorName: string;
  budget: number;
  totalExpenses: number;
  volunteerCount: number;
  attendeeCount: number;
  createdAt: string;
  updatedAt: string;
}

// Sub-Event Interface
export interface SubEvent {
  id: string;
  eventId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  venue: string;
  teamLeadId?: string;
  teamLeadName?: string;
  expectedTime: number;
  actualTime?: number;
  status: EventStatus;
  accessories: Accessory[];
  volunteers: Volunteer[];
}

// Accessory Interface
export interface Accessory {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  category: string;
  status: 'available' | 'in-use' | 'damaged' | 'lost';
}

// Volunteer Interface
export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  subEventId?: string;
  assignedBy: string;
  assignedAt: string;
  status: 'active' | 'inactive';
}

// Prize Interface
export interface Prize {
  id: string;
  eventId: string;
  position: number;
  title: string;
  description: string;
  value: number;
  winnerName?: string;
  winnerEmail?: string;
}

// Announcement Interface
export interface Announcement {
  id: string;
  eventId: string;
  title: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

// Chat Message Interface
export interface ChatMessage {
  id: string;
  eventId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
  isAnnouncement: boolean;
}

// Expense Interface
export interface Expense {
  id: string;
  eventId: string;
  category: string;
  description: string;
  amount: number;
  createdBy: string;
  createdAt: string;
  receiptUrl?: string;
}

// Dashboard Stats Interface
export interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  totalUsers: number;
  totalVolunteers: number;
  totalBudget: number;
  totalExpenses: number;
  recentEvents: Event[];
}

// Notification Interface
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

// Registration Interface
export interface Registration {
  id: string;
  eventId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  registeredAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  qrCode?: string;
}
