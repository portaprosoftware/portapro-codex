import { useCallback } from 'react';

export type AnalyticsEvent = 
  | 'vehicle_profile_viewed'
  | 'vehicle_tab_changed'
  | 'vehicle_work_order_created'
  | 'vehicle_fuel_log_created'
  | 'vehicle_document_uploaded'
  | 'vehicle_assignment_created'
  | 'vehicle_incident_reported'
  | 'vehicle_decon_logged'
  | 'vehicle_view_all_clicked'
  | 'vehicle_context_filter_applied'
  | 'vehicle_context_filter_cleared';

interface AnalyticsEventData {
  vehicleId?: string;
  vehicleName?: string;
  tab?: string;
  context?: string;
  [key: string]: any;
}

export function useAnalytics() {
  const trackEvent = useCallback((event: AnalyticsEvent, data?: AnalyticsEventData) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event, data);
    }

    // In production, this would send to your analytics service
    // Example: analytics.track(event, { ...data, timestamp: Date.now() });
    
    // For now, we'll store in sessionStorage for debugging
    try {
      const events = JSON.parse(sessionStorage.getItem('analytics_events') || '[]');
      events.push({
        event,
        data,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 100 events
      if (events.length > 100) events.shift();
      sessionStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to track analytics:', error);
    }
  }, []);

  return { trackEvent };
}
