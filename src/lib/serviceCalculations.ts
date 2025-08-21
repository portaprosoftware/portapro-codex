/**
 * Service calculation utilities for portable toilet rental scheduling
 * Implements precise business logic for service visit counting and cost calculation
 */

import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { addDays, format, startOfDay, isSameDay } from 'date-fns';

export interface ServiceVisit {
  date: Date;
  displayDate: string;
  cost: number;
}

export interface ServiceCalculationResult {
  visits: ServiceVisit[];
  totalCost: number;
  summary: string;
  dateList: string;
}

/**
 * Calculate service visits based on rental period and frequency
 */
export function calculateServiceVisits({
  startDate,
  endDate,
  frequency,
  customFrequencyDays,
  customDaysOfWeek,
  customSpecificDates,
  includeDropoffService = false,
  includePickupService = false,
  perVisitCost,
  serviceTime = '09:00',
  timezone = 'America/New_York'
}: {
  startDate: Date;
  endDate: Date;
  frequency: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'custom';
  customFrequencyDays?: number;
  customDaysOfWeek?: string[];
  customSpecificDates?: Array<{ date: Date; time?: string; notes?: string }>;
  includeDropoffService?: boolean;
  includePickupService?: boolean;
  perVisitCost: number;
  serviceTime?: string;
  timezone?: string;
}): ServiceCalculationResult {
  const visits: ServiceVisit[] = [];
  
  // Convert to timezone-aware dates
  const startDay = startOfDay(toZonedTime(startDate, timezone));
  const endDay = startOfDay(toZonedTime(endDate, timezone));
  
  // Helper function to create a service date
  const createServiceDate = (date: Date, time: string = serviceTime): Date => {
    const [hours, minutes] = time.split(':').map(Number);
    const serviceDate = new Date(date);
    serviceDate.setHours(hours, minutes, 0, 0);
    return serviceDate;
  };

  // Generate core schedule (excludes boundaries by default)
  if (frequency === 'daily') {
    let currentDate = addDays(startDay, 1);
    while (currentDate < endDay) {
      const serviceDate = createServiceDate(currentDate);
      visits.push({
        date: serviceDate,
        displayDate: format(currentDate, 'MMM d'),
        cost: perVisitCost
      });
      currentDate = addDays(currentDate, 1);
    }
  } else if (frequency === 'weekly') {
    let currentDate = addDays(startDay, 7);
    while (currentDate < endDay) {
      const serviceDate = createServiceDate(currentDate);
      visits.push({
        date: serviceDate,
        displayDate: format(currentDate, 'MMM d'),
        cost: perVisitCost
      });
      currentDate = addDays(currentDate, 7);
    }
  } else if (frequency === 'custom') {
    if (customFrequencyDays && customFrequencyDays > 0) {
      // Every X days
      let currentDate = addDays(startDay, customFrequencyDays);
      while (currentDate < endDay) {
        const serviceDate = createServiceDate(currentDate);
        visits.push({
          date: serviceDate,
          displayDate: format(currentDate, 'MMM d'),
          cost: perVisitCost
        });
        currentDate = addDays(currentDate, customFrequencyDays);
      }
    } else if (customDaysOfWeek && customDaysOfWeek.length > 0) {
      // Specific days of week
      let currentDate = addDays(startDay, 1);
      while (currentDate < endDay) {
        const dayName = format(currentDate, 'EEEE');
        if (customDaysOfWeek.includes(dayName)) {
          const serviceDate = createServiceDate(currentDate);
          visits.push({
            date: serviceDate,
            displayDate: format(currentDate, 'MMM d'),
            cost: perVisitCost
          });
        }
        currentDate = addDays(currentDate, 1);
      }
    } else if (customSpecificDates && customSpecificDates.length > 0) {
      // Specific dates
      customSpecificDates.forEach(dateDetail => {
        const dateToCheck = startOfDay(dateDetail.date);
        if (dateToCheck > startDay && dateToCheck < endDay) {
          const serviceDate = createServiceDate(dateDetail.date, dateDetail.time || serviceTime);
          visits.push({
            date: serviceDate,
            displayDate: format(dateDetail.date, 'MMM d'),
            cost: perVisitCost
          });
        }
      });
    }
  } else if (frequency === 'one-time') {
    // One-time service defaults to the day after delivery
    const oneTimeDate = addDays(startDay, 1);
    if (oneTimeDate < endDay) {
      const serviceDate = createServiceDate(oneTimeDate);
      visits.push({
        date: serviceDate,
        displayDate: format(oneTimeDate, 'MMM d'),
        cost: perVisitCost
      });
    }
  }

  // Add optional boundary services
  if (includeDropoffService) {
    const dropoffService = createServiceDate(startDay);
    // Only add if it's not a duplicate
    if (!visits.some(v => isSameDay(v.date, dropoffService))) {
      visits.unshift({
        date: dropoffService,
        displayDate: format(startDay, 'MMM d'),
        cost: perVisitCost
      });
    }
  }

  if (includePickupService) {
    const pickupService = createServiceDate(endDay);
    // Only add if it occurs before actual pickup time and not duplicate
    if (pickupService < endDate && !visits.some(v => isSameDay(v.date, pickupService))) {
      visits.push({
        date: pickupService,
        displayDate: format(endDay, 'MMM d'),
        cost: perVisitCost
      });
    }
  }

  // Sort visits by date
  visits.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate totals and summary
  const totalCost = visits.reduce((sum, visit) => sum + visit.cost, 0);
  const dateList = visits.map(v => v.displayDate).join(', ');
  const visitCount = visits.length;
  
  const frequencyText = getFrequencyDisplayText(frequency, customFrequencyDays, customDaysOfWeek, customSpecificDates);
  const summary = `${frequencyText} — ${visitCount} visit${visitCount !== 1 ? 's' : ''} (${dateList}) × $${perVisitCost.toFixed(2)}/visit = $${totalCost.toFixed(2)}`;

  return {
    visits,
    totalCost,
    summary,
    dateList
  };
}

/**
 * Get display text for frequency
 */
function getFrequencyDisplayText(
  frequency: string,
  customDays?: number,
  daysOfWeek?: string[],
  specificDates?: Array<{ date: Date }>
): string {
  switch (frequency) {
    case 'one-time': return 'One-Time';
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    case 'custom':
      if (customDays && customDays > 0) {
        return `Every ${customDays} day${customDays > 1 ? 's' : ''}`;
      } else if (daysOfWeek && daysOfWeek.length > 0) {
        return daysOfWeek.join(', ');
      } else if (specificDates && specificDates.length > 0) {
        return 'Custom Dates';
      }
      return 'Custom';
    default: return 'One-Time';
  }
}

/**
 * Calculate rental duration in days
 */
export function calculateRentalDuration(startDate: Date, endDate: Date): number {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}