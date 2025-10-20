import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';

export interface DriverNotification {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  created_at: string;
  read_at: string | null;
  related_entity_id: string | null;
  related_entity_type: string | null;
  data: any;
}

export const useDriverNotifications = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['driver-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('notification_type', [
          'job_assigned',
          'job_updated',
          'job_cancelled',
          'schedule_changed',
          'dvir_reminder',
          'vehicle_assigned',
          'message_received',
          'job_status_update'
        ])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as DriverNotification[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('driver-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notification_logs',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Driver notification update:', payload);
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user?.id) return;

      const { error } = await supabase
        .from('notification_logs')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};
