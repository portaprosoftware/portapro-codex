import { LucideIcon, Package, Droplets, ClipboardCheck, ClipboardList, DollarSign, Smartphone, Truck, Users, BarChart3, Camera, Megaphone } from 'lucide-react'

export type FeatureItem = {
  key: string
  label: string
  description: string
  icon: LucideIcon
  href: string
  badge?: string
}

export type FeatureGroup = {
  key: string
  title: string
  items: FeatureItem[]
}

export const featureGroups: FeatureGroup[] = [
  {
    key: 'operations',
    title: 'Operations & Workflow',
    items: [
      {
        key: 'inventory',
        label: 'Inventory & Supplies',
        description: 'Track units and consumables across multiple sites.',
        icon: Package,
        href: '/features/inventory-truck-stock',
      },
      {
        key: 'consumables',
        label: 'Consumables',
        description: 'Manage TP, sanitizer, deodorizer, and cleaning stock.',
        icon: Droplets,
        href: '/features/inventory-truck-stock',
      },
      {
        key: 'services-hub',
        label: 'Services Hub',
        description: 'Coordinate pumping, cleaning, and maintenance tasks.',
        icon: ClipboardCheck,
        href: '/features/scheduling-dispatch',
      },
      {
        key: 'job-wizard',
        label: 'Smart Job Wizard',
        description: 'Step-by-step job creation with assignments and dates.',
        icon: ClipboardList,
        href: '/features/scheduling-dispatch',
      },
      {
        key: 'quotes',
        label: 'Quotes & Payments',
        description: 'Build quotes and collect deposits via Stripe.',
        icon: DollarSign,
        href: '/features/billing-payments',
      },
      {
        key: 'driver-app',
        label: 'Driver Mobile App',
        description: 'Offline routes, job updates, and checklists.',
        icon: Smartphone,
        href: '/features/mobile-pwa',
      },
    ],
  },
  {
    key: 'management',
    title: 'Management & Intelligence',
    items: [
      {
        key: 'fleet-management',
        label: 'Fleet Management',
        description: 'Track vehicles, fuel, and maintenance schedules.',
        icon: Truck,
        href: '/features/fleet-maintenance',
      },
      {
        key: 'team-management',
        label: 'Team Management',
        description: 'Schedule crews, roles, and permissions.',
        icon: Users,
        href: '/features/scheduling-dispatch',
      },
      {
        key: 'customer-portal',
        label: 'Customer Portal',
        description: 'Give customers self-serve access to key info.',
        icon: Users,
        href: '/features/customer-portal',
      },
      {
        key: 'company-analytics',
        label: 'Company Analytics',
        description: '24+ KPIs, six tabs, and one-click reporting.',
        icon: BarChart3,
        href: '/features/analytics-reporting',
      },
      {
        key: 'google-vision',
        label: 'Google Vision',
        description: 'OCR for molded panel numbers and labels.',
        icon: Camera,
        href: '/features/ai-scanning',
        badge: 'New',
      },
      {
        key: 'marketing',
        label: 'Marketing Tools',
        description: 'Segments, campaigns, and customer outreach.',
        icon: Megaphone,
        href: '/features/messaging-reminders',
      },
    ],
  },
]
