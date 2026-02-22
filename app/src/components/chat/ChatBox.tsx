import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  eventName?: string;
  className?: string;
}

export function ChatBox({ messages, onSendMessage, eventName, className }: ChatBoxProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'h:mm a');
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  return (
    <div className={cn('flex flex-col h-full bg-[#0E0E12] rounded-2xl border border-white/5 overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">{eventName || 'Event Chat'}</h3>
          <p className="text-xs text-gray-500">{messages.length} messages</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center justify-center">
                <span className="text-xs text-gray-500 bg-[#07070A] px-3 py-1 rounded-full">
                  {date}
                </span>
              </div>
              
              {dateMessages.map((message) => {
                const isOwn = message.senderId === user?.id;
                const isAnnouncement = message.isAnnouncement;
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      isOwn && 'flex-row-reverse'
                    )}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}`} />
                      <AvatarFallback className="bg-indigo-500/20 text-indigo-400 text-xs">
                        {message.senderName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={cn('flex flex-col max-w-[70%]', isOwn && 'items-end')}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'text-xs font-medium',
                          isAnnouncement ? 'text-amber-400' : 'text-gray-400'
                        )}>
                          {message.senderName}
                        </span>
                        <span className="text-xs text-gray-600">{formatTime(message.createdAt)}</span>
                      </div>
                      
                      <div
                        className={cn(
                          'px-4 py-2.5 rounded-2xl text-sm',
                          isAnnouncement
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-100'
                            : isOwn
                            ? 'bg-indigo-500 text-white'
                            : 'bg-white/5 text-gray-200'
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Send className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm">No messages yet</p>
              <p className="text-gray-600 text-xs mt-1">Be the first to start the conversation</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-white/5 flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500"
          />
          
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-white/5 flex-shrink-0"
          >
            <Smile className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            size="icon"
            className="bg-indigo-500 hover:bg-indigo-600 text-white flex-shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
