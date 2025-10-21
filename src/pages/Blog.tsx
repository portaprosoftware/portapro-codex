import React, { useState } from 'react';
import { ArrowRight, ChevronDown, Filter, ArrowLeft } from 'lucide-react';
import { LandingLogo } from '@/components/ui/landing-logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

type BlogCategory = 'All' | 'Company News' | 'Case Studies' | 'Technology' | 'Business Tips' | 'Product Updates' | 'Industry Insights';

interface BlogPost {
  id: string;
  category: Exclude<BlogCategory, 'All'>;
  title: string;
  excerpt: string;
  date: string;
  featured?: boolean;
  badgeGradient: string;
}

const blogPosts: BlogPost[] = [
  {
    id: 'featured',
    category: 'Company News',
    title: 'Why We Built PortaPro: Behind the Scenes with Our Founding Team',
    excerpt: 'At PortaPro, we didn\'t just build another SaaS platform — we built a solution to a problem we lived. Our founding team came from the trenches of field service, operations, and tech.',
    date: 'January 15, 2024',
    featured: true,
    badgeGradient: 'from-yellow-500 to-orange-600'
  },
  {
    id: 'texas-revenue-case-study',
    category: 'Case Studies',
    title: 'From Paper to Profit: How a Texas Operator Increased Revenue by 22%',
    excerpt: 'A Texas portable restroom company transitioned from paper to PortaPro and increased revenue by 22% in four months, while reducing unpaid invoices by 40% and cutting overtime in half.',
    date: 'August 7, 2025',
    badgeGradient: 'from-green-500 to-green-700'
  },
  {
    id: 'festival-case-study',
    category: 'Case Studies',
    title: 'Festival Season Success: How One Operator Managed 5 Events in One Weekend',
    excerpt: 'A mid-sized Tennessee operator coordinated 5 major festivals with 312 units and 4 trucks in one weekend using PortaPro—with zero lost units and minimal complaints.',
    date: 'April 28, 2025',
    badgeGradient: 'from-green-500 to-green-700'
  },
  {
    id: 'indiana-case-study',
    category: 'Case Studies',
    title: 'How a Family-Owned Operator Cut Missed Services by 48% Using PortaPro',
    excerpt: 'A family-owned portable restroom company in northern Indiana reduced missed services by nearly half within 60 days using PortaPro\'s route management and mobile driver tools—without hiring anyone new.',
    date: 'February 12, 2025',
    badgeGradient: 'from-green-500 to-green-700'
  },
  {
    id: 'case-study',
    category: 'Case Studies',
    title: 'How One Operator Saved 10 Hours a Week with PortaPro\'s Smart Scheduling',
    excerpt: 'When Mike, a solo operator in the Midwest, came to us, his biggest complaint was simple: "I\'m spending more time coordinating jobs than actually doing them."',
    date: 'January 8, 2024',
    badgeGradient: 'from-green-500 to-green-700'
  },
  {
    id: 'tracking-comparison',
    category: 'Technology',
    title: 'QR vs RFID vs GPS: What\'s the Best Way to Track Your Inventory?',
    excerpt: 'A practical breakdown of QR codes, RFID tags, and GPS units for tracking toilets, sinks, and trailers—what works, what doesn\'t, and what PortaPro actually recommends.',
    date: 'October 1, 2025',
    badgeGradient: 'from-blue-500 to-blue-700'
  },
  {
    id: 'offline-mode',
    category: 'Technology',
    title: 'Why Offline Mode Matters: How PortaPro Works Even Without Signal',
    excerpt: 'A deep dive into PortaPro\'s offline mode—how it helps drivers complete routes, log services, and track units even when there\'s no internet connection on rural roads or festival sites.',
    date: 'June 3, 2025',
    badgeGradient: 'from-blue-500 to-blue-700'
  },
  {
    id: 'google-vision',
    category: 'Technology',
    title: 'Using Google Vision to Track Units and Eliminate Manual Data Entry',
    excerpt: 'How Google Vision Lens helps operators scan unit numbers, eliminate manual data entry, and track inventory faster and more accurately without barcodes or QR codes.',
    date: 'January 17, 2025',
    badgeGradient: 'from-blue-500 to-blue-700'
  },
  {
    id: 'qr-codes',
    category: 'Technology',
    title: 'QR Codes on Porta Potties: How It Actually Works',
    excerpt: 'Yes, your porta potty can have a QR code — and yes, it can be life-changing. Every individual unit in PortaPro can be tagged with a unique QR code.',
    date: 'December 28, 2023',
    badgeGradient: 'from-blue-500 to-blue-700'
  },
  {
    id: 'pricing-strategy',
    category: 'Business Tips',
    title: 'How to Price Portable Toilet Rentals for Construction Sites vs Events',
    excerpt: 'A practical guide to pricing portable toilet rentals differently for construction sites and special events—so operators stay profitable while staying competitive.',
    date: 'May 25, 2025',
    badgeGradient: 'from-orange-500 to-red-600'
  },
  {
    id: 'scheduling-strategies',
    category: 'Business Tips',
    title: '7 Scheduling Strategies Used by High-Volume Portable Restroom Operators',
    excerpt: 'A practical guide to how top portable restroom operators schedule routes, reduce overtime, avoid missed services, and keep drivers and customers happy during peak season.',
    date: 'March 9, 2025',
    badgeGradient: 'from-orange-500 to-red-600'
  },
  {
    id: 'missed-cleanings',
    category: 'Business Tips',
    title: 'The Hidden Cost of Missed Cleanings (And How to Stop Them)',
    excerpt: 'Missed cleanings don\'t just mean one unhappy customer. They mean negative reviews, lost contracts, overtime hours, and emergency dispatch costs.',
    date: 'December 15, 2023',
    badgeGradient: 'from-orange-500 to-red-600'
  },
  {
    id: 'event-service-visibility',
    category: 'Industry Insights',
    title: 'Why Event Organizers Now Expect Real-Time Service Visibility from Portable Restroom Companies',
    excerpt: 'In 2025, event organizers expect real-time service tracking, digital proof of cleaning, and live communication from portable sanitation vendors. Here\'s why the industry is shifting and what operators can do to keep up.',
    date: 'October 10, 2025',
    badgeGradient: 'from-cyan-500 to-teal-600'
  },
  {
    id: 'industry-trends-2025',
    category: 'Industry Insights',
    title: '2025 Portable Sanitation Trends: Rising Demand, Labor Pressure, and the Shift to Digital Operations',
    excerpt: 'An overview of the biggest trends shaping the portable sanitation industry in 2025, including rising demand, labor shortages, digital tools, and changes in customer expectations.',
    date: 'June 18, 2025',
    badgeGradient: 'from-cyan-500 to-teal-600'
  },
  {
    id: 'mobile-first-platform',
    category: 'Product Updates',
    title: 'Why PortaPro Is 100% Mobile—For Drivers, Dispatchers, and the Entire Operation',
    excerpt: 'PortaPro is now fully mobile-friendly across the entire platform, including driver app, dispatch dashboard, service logging, invoicing, and inventory tracking—so the entire business can be run from a phone.',
    date: 'April 21, 2025',
    badgeGradient: 'from-purple-500 to-purple-700'
  },
  {
    id: 'route-optimization',
    category: 'Product Updates',
    title: 'One-Click Route Optimization Now Available in PortaPro',
    excerpt: 'PortaPro now includes one-click route optimization, helping operators reduce fuel costs, save time, and eliminate guesswork in daily service scheduling.',
    date: 'January 30, 2025',
    badgeGradient: 'from-purple-500 to-purple-700'
  },
  {
    id: 'ai-update',
    category: 'Product Updates',
    title: 'PortaPro Product Update: AI Lock Detection + Inventory Scanning',
    excerpt: "We're excited to roll out one of our most-requested features: AI-powered lock detection and molded panel scanning with Google Vision OCR.",
    date: 'December 1, 2023',
    badgeGradient: 'from-purple-500 to-purple-700'
  },
];

const categories: BlogCategory[] = ['All', 'Company News', 'Case Studies', 'Technology', 'Business Tips', 'Product Updates', 'Industry Insights'];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory>('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const filteredPosts = selectedCategory === 'All' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const CategoryFilterDesktop = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          {selectedCategory}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-background z-50">
        {categories.map((category) => (
          <DropdownMenuItem
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? 'bg-accent' : ''}
          >
            {category}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const CategoryFilterMobile = () => (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4" />
          {selectedCategory}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[75vh]">
        <DrawerHeader>
          <DrawerTitle>Browse by Category</DrawerTitle>
          <DrawerDescription>Filter blog posts by category</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-6 space-y-2 overflow-y-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setDrawerOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-white font-semibold'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Logo */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </a>
          </div>
          <LandingLogo />
          <div className="w-24"></div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header with Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">PortaPro Blog</h2>
            <p className="text-muted-foreground">Industry insights, best practices, and updates</p>
          </div>
          {isMobile ? <CategoryFilterMobile /> : <CategoryFilterDesktop />}
        </div>

        {/* Featured Post */}
        {selectedCategory === 'All' && (
          <Card className="mb-8 overflow-hidden border-2 border-primary/20 shadow-lg">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold border-0 mb-4">
                Featured • Company News
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Why We Built PortaPro: Behind the Scenes with Our Founding Team
              </h3>
              <p className="text-muted-foreground mb-4">
                At PortaPro, we didn't just build another SaaS platform — we built a solution to a problem we lived. Our founding team came from the trenches of field service, operations, and tech.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>January 15, 2024</span>
              </div>
            </div>
          </Card>
        )}

        {/* Blog Posts Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.filter(post => !post.featured || selectedCategory !== 'All').map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Badge className={`bg-gradient-to-r ${post.badgeGradient} text-white font-bold border-0 mb-3`}>
                  {post.category}
                </Badge>
                <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{post.date}</span>
                  <Button variant="ghost" size="sm" className="gap-1 h-auto p-0 hover:bg-transparent">
                    Read More <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}