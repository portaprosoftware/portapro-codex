import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Query for unread feedback count
  const { data: feedbackData, refetch } = useQuery({
    queryKey: ['qr-feedback-unread'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qr_feedback')
        .select(`
          *,
          product_items (
            item_code,
            products (
              name
            )
          )
        `)
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscription for new feedback
  useEffect(() => {
    const channel = supabase
      .channel('qr-feedback-notifications')
      .on('broadcast', { event: 'new_feedback' }, (payload) => {
        console.log('New feedback received:', payload);
        refetch();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'qr_feedback'
      }, (payload) => {
        console.log('QR feedback table change:', payload);
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Update unread count when data changes
  useEffect(() => {
    if (feedbackData) {
      setUnreadCount(feedbackData.length);
    }
  }, [feedbackData]);

  const markAsRead = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from('qr_feedback')
        .update({ is_read: true })
        .eq('id', feedbackId);
      
      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error marking feedback as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('qr_feedback')
        .update({ is_read: true })
        .eq('is_read', false);
      
      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error marking all feedback as read:', error);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-5"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <NotificationDropdown
          feedbackData={feedbackData || []}
          onClose={() => setIsOpen(false)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
      )}
    </div>
  );
};