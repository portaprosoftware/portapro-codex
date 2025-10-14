import { LucideIcon, Package, Droplets, ClipboardCheck, ClipboardList, DollarSign, Smartphone, Truck, Users, BarChart3, Camera, Megaphone, MapPin, Shield, Eye, CloudOff } from 'lucide-react'

export interface FeaturePageContent {
  slug: string
  hero: {
    title: string
    subtitle: string
    primaryCTA: string
    secondaryCTA?: string
  }
  problemOutcome: Array<{
    pain: string
    outcome: string
    metric?: string
  }>
  capabilities: Array<{
    icon: LucideIcon
    title: string
    description: string
    detailSectionId?: string
  }>
  howItWorks: Array<{
    step: number
    title: string
    description: string
    screenshot?: string
  }>
  proof?: {
    logo?: string
    quote: string
    author: string
    result: string
  }
  integrations: Array<{
    name: string
    icon: LucideIcon
  }>
  faqs: Array<{
    question: string
    answer: string
  }>
  stickyCTA: {
    text: string
    action: string
  }
  relatedFeatures?: string[]
}

export const featuresContent: Record<string, FeaturePageContent> = {
  'scheduling-dispatch': {
    slug: 'scheduling-dispatch',
    hero: {
      title: 'Smart Scheduling & Dispatch',
      subtitle: 'Route smarter, dispatch faster, and keep your entire fleet in sync with intelligent job management.',
      primaryCTA: 'Book a Demo',
      secondaryCTA: 'Watch 2-min Overview'
    },
    problemOutcome: [
      {
        pain: 'Manual route planning wastes hours each week and leads to inefficient truck utilization.',
        outcome: 'Auto-assign jobs by capacity, proximity, and availability',
        metric: '–40% route planning time'
      },
      {
        pain: 'Last-minute changes force panicked phone calls and missed appointments.',
        outcome: 'Real-time updates sync to driver mobile apps instantly',
        metric: '95% on-time arrivals'
      },
      {
        pain: 'Dispatchers juggle spreadsheets, whiteboards, and memory to track daily jobs.',
        outcome: 'Visual route board with drag-and-drop scheduling',
        metric: '–60% dispatch errors'
      }
    ],
    capabilities: [
      {
        icon: MapPin,
        title: 'Route Board & Weather Overlay',
        description: 'Plan routes with live radar and traffic. See all jobs, trucks, and drivers on one intelligent map.',
        detailSectionId: 'route-board'
      },
      {
        icon: ClipboardList,
        title: 'Smart Job Wizard',
        description: 'Step-by-step job creation: delivery, service, pickup, or return. Auto-assigns crew, truck, and inventory.',
        detailSectionId: 'job-wizard'
      },
      {
        icon: Smartphone,
        title: 'Driver Mode',
        description: 'Mobile PWA for turn-by-turn navigation, photos, signatures, and offline job updates.',
        detailSectionId: 'driver-mode'
      },
      {
        icon: ClipboardCheck,
        title: 'Auto-Assign by Capacity',
        description: 'Match jobs to trucks by tank space, inventory on board, and proximity to next stop.',
        detailSectionId: 'auto-assign'
      }
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Create Job via Wizard',
        description: 'Select customer, job type (delivery/service/pickup), and date. Wizard suggests best truck and driver based on capacity and location.'
      },
      {
        step: 2,
        title: 'Auto-Assign Resources',
        description: 'System checks truck tank levels, driver availability, and route proximity. Assigns optimal vehicle and crew.'
      },
      {
        step: 3,
        title: 'Driver Receives Job',
        description: 'Mobile app sends push notification with job details, turn-by-turn nav, and customer notes.'
      },
      {
        step: 4,
        title: 'Complete & Sync',
        description: 'Driver marks complete, captures photos/signatures. Data syncs back to office in real-time.'
      },
      {
        step: 5,
        title: 'Invoice & Track',
        description: 'Job completion triggers invoice generation. Customer portal updates automatically.'
      }
    ],
    proof: {
      quote: 'We went from spending 3 hours planning routes every morning to 20 minutes. The auto-assign feature alone paid for PortaPro in the first month.',
      author: 'Mike Rodriguez',
      result: '–73% route planning time, +28% jobs per truck per day'
    },
    integrations: [
      { name: 'Mapbox', icon: MapPin },
      { name: 'Weather API', icon: MapPin },
      { name: 'Twilio', icon: Smartphone }
    ],
    faqs: [
      {
        question: 'Can drivers use this offline?',
        answer: 'Yes. The mobile PWA caches jobs and allows drivers to complete tasks, take photos, and capture signatures without internet. Data syncs when connection returns.'
      },
      {
        question: 'How does auto-assign work?',
        answer: 'The system considers truck tank capacity, inventory on board, driver certifications, current location, and scheduled route to suggest the optimal assignment for each job.'
      },
      {
        question: 'Can I override auto-assignments?',
        answer: 'Absolutely. Auto-assign is a suggestion. Dispatchers can drag-and-drop jobs to any truck or driver on the route board.'
      }
    ],
    stickyCTA: {
      text: 'Start 21-Day Trial',
      action: '/auth'
    },
    relatedFeatures: ['mobile-pwa', 'fleet-maintenance', 'inventory-truck-stock']
  },
  
  'ai-scanning': {
    slug: 'ai-scanning',
    hero: {
      title: 'Google Vision AI Panel Scanning',
      subtitle: 'Scan tool numbers and data directly from molded plastic panels. No manual typing, no errors.',
      primaryCTA: 'Book a Demo',
      secondaryCTA: 'See It Live'
    },
    problemOutcome: [
      {
        pain: 'Manually typing panel numbers from portable toilets causes data entry errors and slows down inventory tracking.',
        outcome: 'OCR reads molded panel numbers instantly',
        metric: '–90% data entry time'
      },
      {
        pain: 'Finding specific units in your yard wastes 10+ minutes per search.',
        outcome: 'Snap photo → instant unit lookup',
        metric: '99.2% scan accuracy'
      },
      {
        pain: 'New drivers struggle to identify different unit types and models.',
        outcome: 'AI identifies unit type, age, and condition from photo',
        metric: '–50% training time'
      }
    ],
    capabilities: [
      {
        icon: Camera,
        title: 'Molded Panel OCR',
        description: 'Google Vision AI reads embossed or molded panel numbers from photos. Works even on faded or dirty units.',
        detailSectionId: 'ocr'
      },
      {
        icon: Eye,
        title: 'Visual Unit Lookup',
        description: 'Take photo of any unit → system finds it in inventory, shows history, location, and maintenance records.',
        detailSectionId: 'lookup'
      },
      {
        icon: Package,
        title: 'Auto-Categorization',
        description: 'AI detects unit type (standard, ADA, trailer, sink) and suggests correct product category.',
        detailSectionId: 'categorization'
      }
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Open Camera',
        description: 'From inventory screen or mobile app, tap "Scan Panel" to activate camera.'
      },
      {
        step: 2,
        title: 'Capture Photo',
        description: 'Frame the molded panel number or QR code. AI extracts text and barcodes automatically.'
      },
      {
        step: 3,
        title: 'Instant Lookup',
        description: 'System searches inventory database and displays unit details in under 1 second.'
      },
      {
        step: 4,
        title: 'Update or Create',
        description: 'Unit found? View details. Not found? Create new inventory record with pre-filled data.'
      }
    ],
    proof: {
      quote: 'Our yard guys can now find units in 30 seconds instead of 10 minutes. The AI scanning is like having a searchable database in your pocket.',
      author: 'Sarah Chen',
      result: '–85% unit search time, 99.2% scan accuracy'
    },
    integrations: [
      { name: 'Google Vision', icon: Camera },
      { name: 'QR Codes', icon: Package }
    ],
    faqs: [
      {
        question: 'What if the panel is dirty or faded?',
        answer: 'Google Vision AI is trained to read embossed text even when dirty, faded, or partially obscured. Success rate is ~95% on well-worn units.'
      },
      {
        question: 'Does this work with QR codes too?',
        answer: 'Yes. The scanner automatically detects and reads QR codes, barcodes, and molded text in the same photo.'
      },
      {
        question: 'Can I scan from my phone?',
        answer: 'Absolutely. The mobile PWA includes the AI scanner. Works offline—scans queue and process when connection returns.'
      }
    ],
    stickyCTA: {
      text: 'Try AI Scanning',
      action: '/auth'
    },
    relatedFeatures: ['inventory-truck-stock', 'mobile-pwa']
  },

  'mobile-pwa': {
    slug: 'mobile-pwa',
    hero: {
      title: 'Driver Mobile App (PWA)',
      subtitle: 'Offline-capable route navigation, job updates, and digital checklists. No app store required.',
      primaryCTA: 'Book a Demo',
      secondaryCTA: 'Watch 2-min Overview'
    },
    problemOutcome: [
      {
        pain: 'Drivers waste time calling dispatch for job details and address updates.',
        outcome: 'All jobs sync to mobile with turn-by-turn navigation',
        metric: '–60% dispatch calls'
      },
      {
        pain: 'Paper work orders get lost, wet, or forgotten in trucks.',
        outcome: 'Digital checklists, photos, and signatures',
        metric: '100% job completion proof'
      },
      {
        pain: 'Rural job sites have no cell signal for updates.',
        outcome: 'Offline mode caches jobs and syncs later',
        metric: 'Works anywhere'
      }
    ],
    capabilities: [
      {
        icon: Smartphone,
        title: 'Progressive Web App',
        description: 'Install from browser—no app store. Works on iOS, Android, and tablets. Auto-updates in background.',
        detailSectionId: 'pwa'
      },
      {
        icon: MapPin,
        title: 'Turn-by-Turn Navigation',
        description: 'One-tap launch to Waze, Google Maps, or Apple Maps with pre-filled destination.',
        detailSectionId: 'nav'
      },
      {
        icon: Camera,
        title: 'Photo & Signature Capture',
        description: 'Take before/after photos, capture customer signatures, and attach to jobs automatically.',
        detailSectionId: 'media'
      },
      {
        icon: CloudOff,
        title: 'Offline Mode',
        description: 'All jobs cached locally. Complete tasks without internet. Data syncs when signal returns.',
        detailSectionId: 'offline'
      }
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Install PWA',
        description: 'Driver visits app.portapro.com on phone browser, taps "Add to Home Screen". No app store needed.'
      },
      {
        step: 2,
        title: 'View Daily Jobs',
        description: 'Dashboard shows today\'s route with map view. Tap any job for details, customer notes, and directions.'
      },
      {
        step: 3,
        title: 'Navigate & Complete',
        description: 'One-tap to launch navigation. On arrival, check off tasks, take photos, get signature.'
      },
      {
        step: 4,
        title: 'Sync & Invoice',
        description: 'Mark job complete. Data syncs to office. System auto-generates invoice and updates customer portal.'
      }
    ],
    proof: {
      quote: 'Our drivers love the app. They stopped losing paper tickets and calling dispatch 20 times a day. Everything they need is right there.',
      author: 'Tom Williams',
      result: '–58% dispatch calls, 100% job completion documentation'
    },
    integrations: [
      { name: 'Google Maps', icon: MapPin },
      { name: 'Camera', icon: Camera },
      { name: 'Offline Storage', icon: CloudOff }
    ],
    faqs: [
      {
        question: 'Do drivers need to download from app stores?',
        answer: 'No. It\'s a Progressive Web App (PWA). They visit the URL in their phone browser and tap "Add to Home Screen". Installs like a native app.'
      },
      {
        question: 'What happens if there\'s no cell signal?',
        answer: 'The app caches all jobs locally. Drivers can complete tasks, take photos, and capture signatures offline. Everything syncs automatically when they regain signal.'
      },
      {
        question: 'Can drivers see their entire route?',
        answer: 'Yes. Map view shows all stops for the day. They can reorder stops or launch turn-by-turn navigation to any job.'
      }
    ],
    stickyCTA: {
      text: 'Try Driver App',
      action: '/auth'
    },
    relatedFeatures: ['scheduling-dispatch', 'ai-scanning', 'dvir-inspections']
  }
}
