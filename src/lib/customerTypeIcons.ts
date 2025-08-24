import { 
  Utensils, 
  Hammer, 
  Siren, 
  Sparkles, 
  Landmark, 
  Cake, 
  ShoppingBag, 
  Trophy, 
  Briefcase,
  LucideIcon 
} from 'lucide-react';
import { CustomerType } from '@/types';

const customerTypeIconMap: Record<CustomerType, LucideIcon> = {
  bars_restaurants: Utensils,
  construction: Hammer,
  emergency_disaster_relief: Siren,
  events_festivals: Sparkles,
  municipal_government: Landmark,
  private_events_weddings: Cake,
  retail: ShoppingBag,
  sports_recreation: Trophy,
  other: Briefcase
};

const customerTypeColorMap: Record<CustomerType, string> = {
  bars_restaurants: 'bg-orange-500',
  construction: 'bg-yellow-600',
  emergency_disaster_relief: 'bg-red-600',
  events_festivals: 'bg-purple-500',
  municipal_government: 'bg-blue-600',
  private_events_weddings: 'bg-pink-500',
  retail: 'bg-green-600',
  sports_recreation: 'bg-indigo-600',
  other: 'bg-gray-600'
};

export const getCustomerTypeIcon = (customerType: CustomerType | string | undefined): LucideIcon => {
  if (!customerType || !(customerType in customerTypeIconMap)) {
    return Briefcase; // Default fallback
  }
  return customerTypeIconMap[customerType as CustomerType];
};

export const getCustomerTypeColor = (customerType: CustomerType | string | undefined): string => {
  if (!customerType || !(customerType in customerTypeColorMap)) {
    return 'bg-gray-600'; // Default fallback
  }
  return customerTypeColorMap[customerType as CustomerType];
};