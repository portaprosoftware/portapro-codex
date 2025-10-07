/**
 * Utility functions for gas station operations
 */

/**
 * Gets the operating status of a gas station
 * @param metadata - Google Places metadata with opening hours
 * @returns Status object with type ('open', 'closed', 'closing_soon') and optional closing time
 */
export function getStationStatus(metadata: any): {
  status: 'open' | 'closed' | 'closing_soon';
  closingTime?: string;
  openingTime?: string;
} {
  if (!metadata?.open_now) {
    return { status: 'closed' };
  }

  // Check if we have opening hours info
  if (metadata.opening_hours?.periods) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    // Find today's hours
    const todayHours = metadata.opening_hours.periods.find(
      (period: any) => period.open?.day === currentDay
    );

    if (todayHours?.close) {
      const closeTime = parseInt(todayHours.close.time);
      const closeHour = Math.floor(closeTime / 100);
      const closeMinute = closeTime % 100;
      
      // Calculate time until closing in minutes
      const closeTimeDate = new Date(now);
      closeTimeDate.setHours(closeHour, closeMinute, 0, 0);
      const minutesUntilClose = (closeTimeDate.getTime() - now.getTime()) / (1000 * 60);

      // Format closing time
      const closingTime = `${closeHour > 12 ? closeHour - 12 : closeHour}:${closeMinute.toString().padStart(2, '0')} ${closeHour >= 12 ? 'PM' : 'AM'}`;

      // If closing within 1 hour
      if (minutesUntilClose > 0 && minutesUntilClose <= 60) {
        return { status: 'closing_soon', closingTime };
      }

      return { status: 'open', closingTime };
    }
  }

  return { status: 'open' };
}

/**
 * Gets badge styling for station status
 */
export function getStatusBadgeStyle(status: 'open' | 'closed' | 'closing_soon'): {
  gradient: string;
  textColor: string;
} {
  switch (status) {
    case 'open':
      return {
        gradient: 'bg-gradient-to-r from-green-500 to-green-600',
        textColor: 'text-white'
      };
    case 'closing_soon':
      return {
        gradient: 'bg-gradient-to-r from-yellow-500 to-amber-500',
        textColor: 'text-white'
      };
    case 'closed':
      return {
        gradient: 'bg-gradient-to-r from-red-500 to-red-600',
        textColor: 'text-white'
      };
  }
}
