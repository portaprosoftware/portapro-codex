import { useState, useEffect } from 'react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HticCqJBXbqceej9F3ePBdOQMJ2SPwQPsHmV4Lf2P4V8zS2MnKQUcbE'; // You'll need to generate this

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(userId?: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Get current subscription from server
  const { data: serverSubscription } = useQuery({
    queryKey: ['push-subscription', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId && isSupported,
  });

  // Subscribe to push notifications
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!isSupported || !userId) {
        throw new Error('Push notifications not supported or user not logged in');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        throw new Error('Push notification permission denied');
      }

      // Register service worker
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Save subscription to database
      const subscriptionData = JSON.parse(JSON.stringify(subscription));
      
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscriptionData.endpoint,
          p256dh_key: subscriptionData.keys.p256dh,
          auth_key: subscriptionData.keys.auth,
          user_agent: navigator.userAgent,
          is_active: true
        });

      if (error) throw error;

      setSubscription(subscriptionData);
      return subscriptionData;
    },
    onSuccess: () => {
      toast({
        title: "Notifications Enabled",
        description: "You'll receive job updates and alerts",
      });
    },
    onError: (error) => {
      toast({
        title: "Notification Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Unsubscribe from push notifications
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User not logged in');

      // Unsubscribe from push manager
      if (subscription) {
        const registration = await navigator.serviceWorker.ready;
        const pushSubscription = await registration.pushManager.getSubscription();
        if (pushSubscription) {
          await pushSubscription.unsubscribe();
        }
      }

      // Deactivate subscription in database
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;

      setSubscription(null);
    },
    onSuccess: () => {
      toast({
        title: "Notifications Disabled",
        description: "You won't receive push notifications",
      });
    },
    onError: (error) => {
      toast({
        title: "Unsubscribe Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    isSupported,
    permission,
    subscription: subscription || serverSubscription,
    subscribe: subscribeMutation.mutate,
    unsubscribe: unsubscribeMutation.mutate,
    isSubscribing: subscribeMutation.isPending,
    isUnsubscribing: unsubscribeMutation.isPending,
  };
}