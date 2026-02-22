import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Event } from '@/types';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'detailed';
  onView?: (event: Event) => void;
  onEdit?: (event: Event) => void;
  onRegister?: (event: Event) => void;
  className?: string;
}

const statusColors = {
  upcoming: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ongoing: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cancelled: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

export function EventCard({
  event,
  variant = 'default',
  onView,
  onEdit,
  onRegister,
  className,
}: EventCardProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'group flex items-center gap-4 p-4 rounded-xl bg-[#0E0E12] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer',
          className
        )}
        onClick={() => onView?.(event)}
      >
        <img
          src={event.poster || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&q=80'}
          alt={event.title}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white truncate">{event.title}</h4>
            <Badge variant="outline" className={cn('text-xs', statusColors[event.status])}>
              {event.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">{formatDate(event.startDate)}</p>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'group rounded-2xl bg-[#0E0E12] border border-white/5 overflow-hidden hover:border-indigo-500/30 transition-all',
          className
        )}
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.banner || event.poster || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] to-transparent" />
          <Badge
            variant="outline"
            className={cn('absolute top-4 right-4', statusColors[event.status])}
          >
            {event.status}
          </Badge>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white">{event.title}</h3>
          <p className="text-sm text-gray-400 mt-2 line-clamp-2">{event.description}</p>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calendar className="w-4 h-4 text-indigo-400" />
              {formatDate(event.startDate)}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4 text-indigo-400" />
              {event.venue}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-4 h-4 text-indigo-400" />
              {event.attendeeCount} registered
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <DollarSign className="w-4 h-4 text-indigo-400" />
              {formatCurrency(event.budget)} budget
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button
              variant="default"
              className="flex-1 bg-indigo-500 hover:bg-indigo-600"
              onClick={() => onView?.(event)}
            >
              View Details
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5"
                onClick={() => onEdit?.(event)}
              >
                Edit
              </Button>
            )}
            {onRegister && (
              <Button
                variant="default"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                onClick={() => onRegister?.(event)}
              >
                Register
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        'group rounded-xl bg-[#0E0E12] border border-white/5 p-5 hover:border-indigo-500/30 transition-all',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <img
          src={event.poster || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&q=80'}
          alt={event.title}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-medium text-white truncate">{event.title}</h4>
            <Badge variant="outline" className={cn('text-xs', statusColors[event.status])}>
              {event.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{event.description}</p>
          
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(event.startDate)}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3.5 h-3.5" />
              {event.venue}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="w-3.5 h-3.5" />
              {event.attendeeCount}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-gray-400 hover:text-white hover:bg-white/5"
          onClick={() => onView?.(event)}
        >
          View
        </Button>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-gray-400 hover:text-white hover:bg-white/5"
            onClick={() => onEdit?.(event)}
          >
            Edit
          </Button>
        )}
        {onRegister && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            onClick={() => onRegister?.(event)}
          >
            Register
          </Button>
        )}
      </div>
    </div>
  );
}
