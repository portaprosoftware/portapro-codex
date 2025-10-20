import React, { useState } from 'react';
import { X, ArrowRight, ChevronDown, Filter } from 'lucide-react';
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

interface BlogSliderProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPost: string | null;
  onSelectPost: (postId: string | null) => void;
}

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
    id: 'ai-update',
    category: 'Product Updates',
    title: 'PortaPro Product Update: AI Lock Detection + Inventory Scanning',
    excerpt: 'We\'re excited to roll out one of our most-requested features: AI-powered lock detection and molded panel scanning with Google Vision OCR.',
    date: 'December 1, 2023',
    badgeGradient: 'from-purple-500 to-purple-700'
  },
];

const categories: BlogCategory[] = ['All', 'Company News', 'Case Studies', 'Technology', 'Business Tips', 'Product Updates', 'Industry Insights'];

export const BlogSlider: React.FC<BlogSliderProps> = ({ 
  isOpen, 
  onClose, 
  selectedPost, 
  onSelectPost 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory>('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-background shadow-2xl animate-slide-in-right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-foreground">PortaPro Blog</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedPost ? (
              /* Individual Blog Post View */
              <div className="space-y-6">
                <Button 
                  variant="ghost" 
                  onClick={() => onSelectPost(null)}
                  className="mb-4"
                >
                  ← Back to All Posts
                </Button>
                
                {selectedPost === 'featured' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold border-0">Company News</Badge>
                      <h1 className="text-3xl font-bold">Why We Built PortaPro: Behind the Scenes with Our Founding Team</h1>
                      <p className="text-muted-foreground">January 15, 2024 • Company</p>
                    </div>
                    <div className="prose max-w-none space-y-4">
                      <p>At PortaPro, we didn't just build another SaaS platform — we built a solution to a problem we lived.</p>
                      <p>Our founding team came from the trenches of field service, operations, and tech. We saw first-hand how disorganized the portable toilet industry could be — handwritten service logs, missed jobs, no unit-level tracking, and endless time spent chasing paper trails. It wasn't just inefficient — it was costing companies customers, compliance, and confidence.</p>
                      <p>We built PortaPro to give modern operators real-time visibility, automatic scheduling, and unit-level insights — all from one intuitive platform. With built-in AI tools, QR code scanning, consumable tracking, and maintenance logs, PortaPro brings clarity and control to your entire business.</p>
                      <p>We're just getting started. Our mission is to empower operators everywhere to run leaner, smarter, and faster. And we're building it with you — our community — every step of the way.</p>
                    </div>
                  </div>
                )}
                
                {selectedPost === 'texas-revenue-case-study' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Badge className="bg-gradient-to-r from-green-500 to-green-700 text-white font-bold border-0">Case Studies</Badge>
                      <h1 className="text-3xl font-bold">From Paper to Profit: How a Texas Operator Increased Revenue by 22% After Switching to PortaPro</h1>
                      <p className="text-muted-foreground">August 7, 2025</p>
                    </div>
                    <div className="prose max-w-none space-y-6">
                      <p className="text-lg">In early 2025, a portable toilet operator based in Waco, Texas, made a decision that completely changed how they ran their business: they threw out their clipboard system and switched their entire workflow—from dispatch to billing—into PortaPro. Within four months, the business increased revenue by <strong>22%</strong>, reduced unpaid invoices by nearly 40%, and cut driver overtime hours in half.</p>
                      
                      <p>This isn't a story about hiring more people, buying more trucks, or raising prices. This is about replacing paper with a tool that finally matched how they work.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">The Situation Before PortaPro</h2>
                      <p>This family-run business managed around 300 units, 5 service trucks, and a mix of construction and event clients. Operations looked like this:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Route assignments handwritten every morning</li>
                        <li>Drivers turning in crumpled service sheets at the end of the day</li>
                        <li>Invoices sent only after someone manually typed work orders into QuickBooks</li>
                        <li>No way to see how many units were actually in the field</li>
                        <li>Services occasionally missed or unbilled because paper forms got lost</li>
                      </ul>
                      
                      <p className="italic border-l-4 border-primary pl-4 py-2 bg-muted/50">"We weren't running a bad business. We were just running blind. We didn't know what we were missing, so we assumed everything was fine." — Owner</p>
                      
                      <h2 className="text-2xl font-bold mt-8">Why They Switched</h2>
                      <p>The tipping point came when they lost a <strong>$12,000 annual contract</strong> because a general contractor said he needed "a more professional partner." Not more units, not cheaper rates—just better organization and faster response.</p>
                      <p>Three weeks later, they signed up for PortaPro.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">What Changed (And Why It Worked)</h2>
                      <div className="bg-muted/30 rounded-lg p-6 my-6">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-primary">
                              <th className="text-left py-2 font-bold">PortaPro Feature</th>
                              <th className="text-left py-2 font-bold">What They Did</th>
                              <th className="text-left py-2 font-bold">Why It Increased Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            <tr>
                              <td className="py-3 font-semibold">Digital Dispatch & Routes</td>
                              <td className="py-3">Office staff built routes using drag-and-drop, sent instantly to driver phones.</td>
                              <td className="py-3 italic">No more missed stops = no more giving away free service "make-up days."</td>
                            </tr>
                            <tr>
                              <td className="py-3 font-semibold">Service Logs + Photos</td>
                              <td className="py-3">Drivers logged every pump-out with timestamp, notes, or photo.</td>
                              <td className="py-3 italic">Every service was counted and billable—no more "he said, she said."</td>
                            </tr>
                            <tr>
                              <td className="py-3 font-semibold">Automatic Quote → Job → Invoice</td>
                              <td className="py-3">Once a quote was approved, it automatically became a job and then an invoice after completion.</td>
                              <td className="py-3 italic">Eliminated delays in invoicing—cash flowed in faster.</td>
                            </tr>
                            <tr>
                              <td className="py-3 font-semibold">Tap-to-Pay & Customer Portal</td>
                              <td className="py-3">Event customers could pay on the spot or online.</td>
                              <td className="py-3 italic">38% fewer unpaid invoices in 90 days.</td>
                            </tr>
                            <tr>
                              <td className="py-3 font-semibold">Inventory Tracking</td>
                              <td className="py-3">Each unit was labeled and scanned as it left or entered the yard.</td>
                              <td className="py-3 italic">They discovered 14 "ghost units" sitting behind a barn—now back in rental rotation.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">The Numbers After 4 Months</h2>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-6 my-6">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-green-600">
                              <th className="text-left py-2 font-bold">Metric</th>
                              <th className="text-left py-2 font-bold">Before PortaPro</th>
                              <th className="text-left py-2 font-bold">After PortaPro</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-green-200 dark:divide-green-800">
                            <tr>
                              <td className="py-2">Monthly Revenue</td>
                              <td className="py-2">Baseline</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">+22% increase</td>
                            </tr>
                            <tr>
                              <td className="py-2">Unpaid/Overdue Invoices</td>
                              <td className="py-2">31% of invoices</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">19% of invoices</td>
                            </tr>
                            <tr>
                              <td className="py-2">Average Days to Get Paid</td>
                              <td className="py-2">28 days</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">12 days</td>
                            </tr>
                            <tr>
                              <td className="py-2">Driver Overtime Costs</td>
                              <td className="py-2">$1,400/mo</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">$750/mo</td>
                            </tr>
                            <tr>
                              <td className="py-2">"Missing" Units</td>
                              <td className="py-2">14 units misplaced</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">0 — all scanned/tracked</td>
                            </tr>
                            <tr>
                              <td className="py-2">Time Spent on Paperwork</td>
                              <td className="py-2">2–3 hours/day</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">Under 30 minutes/day</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">What Surprised Them Most</h2>
                      <div className="space-y-4">
                        <div className="border-l-4 border-blue-600 pl-4 py-2">
                          <p className="font-bold mb-1">1. The drivers liked it.</p>
                          <p className="text-sm text-muted-foreground">The owner worried his older drivers wouldn't accept new technology. Instead, they said the mobile app made their jobs easier—no more forgetting addresses or losing paper sheets.</p>
                        </div>
                        <div className="border-l-4 border-green-600 pl-4 py-2">
                          <p className="font-bold mb-1">2. They had been losing money quietly.</p>
                          <p className="text-sm text-muted-foreground">Units left on job sites for months without billing. Extra pump-outs done under the table to keep clients happy. None of it recorded—until now.</p>
                        </div>
                        <div className="border-l-4 border-purple-600 pl-4 py-2">
                          <p className="font-bold mb-1">3. Organization became a selling point.</p>
                          <p className="text-sm text-muted-foreground">Contractors started saying, "We like you because we don't have to chase you."</p>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white my-8">
                        <h3 className="text-xl font-bold mb-2">Final Quote from the Owner</h3>
                        <p className="italic text-lg">"PortaPro didn't make us work harder—it made us finally see the work we were already doing. Once we could see everything, the money followed."</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPost === 'indiana-case-study' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Badge className="bg-gradient-to-r from-green-500 to-green-700 text-white font-bold border-0">Case Studies</Badge>
                      <h1 className="text-3xl font-bold">How a Family-Owned Operator Cut Missed Services by 48% Using PortaPro</h1>
                      <p className="text-muted-foreground">February 12, 2025</p>
                    </div>
                    <div className="prose max-w-none space-y-6">
                      <p className="text-lg">In January 2025, a family-owned portable restroom company in northern Indiana decided they couldn't keep running their business from dry erase boards, phone calls, and paper route sheets. They had 230 units in the field, 3 service trucks, and an office run by the owner's wife and daughter. The biggest frustration? Missed services, misplaced toilets, and angry phone calls asking, "Did you even service this unit?"</p>
                      
                      <p>After switching to PortaPro, they reported a <strong>48% reduction in missed services within 60 days</strong>—without hiring anyone new or changing their routes. Here's exactly how they did it.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">Before PortaPro: A System Held Together by Memory and Phone Calls</h2>
                      <p>Like many family operators, this business relied on:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Paper calendars taped inside the office wall</li>
                        <li>Drivers calling in when they finished a route</li>
                        <li>Google Maps for directions—but no real tracking</li>
                        <li>Disputes with construction managers about whether a unit had been serviced</li>
                        <li>Zero proof of service—just "trust us"</li>
                      </ul>
                      <p className="italic border-l-4 border-primary pl-4 py-2 bg-muted/50">"We weren't lazy. We just didn't have a better system. Drivers forgot things. Rain smudged paper route sheets. And customers didn't want excuses—they wanted proof." — Business Owner</p>
                      
                      <h2 className="text-2xl font-bold mt-8">What Changed with PortaPro</h2>
                      <p>They didn't overhaul the business. They simply replaced paper and guesswork with PortaPro's mobile workflow built for field teams.</p>
                      
                      <div className="bg-muted/30 rounded-lg p-6 my-6">
                        <h3 className="text-xl font-bold mb-4">Key Features Used & Impact</h3>
                        <div className="space-y-4">
                          <div className="border-l-4 border-blue-600 pl-4">
                            <h4 className="font-bold">Digital Route Sheets</h4>
                            <p className="text-sm text-muted-foreground">Routes built on desktop, instantly sent to each driver's phone.</p>
                            <p className="text-sm italic mt-1">→ No more smudged paper or forgotten stops.</p>
                          </div>
                          <div className="border-l-4 border-green-600 pl-4">
                            <h4 className="font-bold">Service Logging (Tap to Complete)</h4>
                            <p className="text-sm text-muted-foreground">Techs tapped a unit, marked "Serviced" or "Not Serviced" with an optional note/photo.</p>
                            <p className="text-sm italic mt-1">→ Every unit either got serviced—or had a reason logged in writing.</p>
                          </div>
                          <div className="border-l-4 border-purple-600 pl-4">
                            <h4 className="font-bold">Photo Proof</h4>
                            <p className="text-sm text-muted-foreground">Drivers could take a photo after servicing a unit.</p>
                            <p className="text-sm italic mt-1">→ No more arguments with contractors—time, photo, and GPS logged automatically.</p>
                          </div>
                          <div className="border-l-4 border-orange-600 pl-4">
                            <h4 className="font-bold">Offline Mode</h4>
                            <p className="text-sm text-muted-foreground">Rural job sites had no cell signal—but the app still logged everything.</p>
                            <p className="text-sm italic mt-1">→ Drivers kept working; data synced back to office when signal returned.</p>
                          </div>
                          <div className="border-l-4 border-primary pl-4">
                            <h4 className="font-bold">Service History by Unit</h4>
                            <p className="text-sm text-muted-foreground">Every toilet now had a digital history—dates, jobs, field notes.</p>
                            <p className="text-sm italic mt-1">→ Office could answer "When was this serviced last?" in seconds.</p>
                          </div>
                        </div>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">The Results (After 60 Days)</h2>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-6 my-6">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-green-600">
                              <th className="text-left py-2 font-bold">Metric</th>
                              <th className="text-left py-2 font-bold">Before PortaPro</th>
                              <th className="text-left py-2 font-bold">After PortaPro</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-green-200 dark:divide-green-800">
                            <tr>
                              <td className="py-2">Missed Service Calls</td>
                              <td className="py-2">12–15 per week</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">6–8 per week</td>
                            </tr>
                            <tr>
                              <td className="py-2">Units with Proof of Service</td>
                              <td className="py-2">0% (trust-based)</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">82%</td>
                            </tr>
                            <tr>
                              <td className="py-2">Phone Calls from Job Sites</td>
                              <td className="py-2">20–25 per week</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">8–10 per week</td>
                            </tr>
                            <tr>
                              <td className="py-2">Time Recreating Lost Routes</td>
                              <td className="py-2">Daily</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">Almost zero</td>
                            </tr>
                            <tr>
                              <td className="py-2">New Long-Term Contracts</td>
                              <td className="py-2">Inconsistent</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">3 signed in 60 days</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <p>This wasn't a huge fleet. It was a family—all driving trucks, cleaning toilets, and managing kids' school schedules. But giving them software that <em>worked the way they did</em> meant they could perform like pros without acting like a giant company.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">Lessons for Other Operators</h2>
                      <ol className="list-decimal pl-6 space-y-2">
                        <li><strong>You don't need software that does everything</strong>—just software that does <em>your</em> job well.</li>
                        <li><strong>Proof of service isn't about policing your drivers</strong>—it's about protecting your relationships.</li>
                        <li><strong>Small fleets don't need automation</strong>—they need organization.</li>
                      </ol>
                      
                      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white my-8">
                        <h3 className="text-xl font-bold mb-2">Final Thought from the Owner</h3>
                        <p className="italic text-lg">"We didn't buy PortaPro to 'be more high-tech.' We bought it so customers would stop doubting our work. Now if someone calls and says we didn't service a toilet, we open the app and send them the photo. Conversation over."</p>
                      </div>
                    </div>
                  </div>
                )}

                
                {selectedPost === 'festival-case-study' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Badge className="bg-gradient-to-r from-green-500 to-green-700 text-white font-bold border-0">Case Studies</Badge>
                      <h1 className="text-3xl font-bold">Festival Season Success: How One Operator Managed 5 Events in One Weekend with PortaPro</h1>
                      <p className="text-muted-foreground">April 28, 2025</p>
                    </div>
                    <div className="prose max-w-none space-y-6">
                      <p className="text-lg">In April 2025, a mid-sized portable toilet company in Tennessee faced their busiest weekend of the year—five different festivals, 312 rental units, 9 hand-wash stations, and only 4 service trucks available. In previous years, this exact situation caused chaos: lost units, late deliveries, overflowing toilets, and unhappy event organizers.</p>
                      
                      <p>But this year was different. They did it all—on time, fully serviced, no missing inventory—and the event coordinators called it <strong>"the smoothest experience yet."</strong> Their only change? They switched all logistics over to PortaPro.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">The Challenge: Too Many Events, Too Many Moving Parts</h2>
                      <p>Here's what the operation looked like before PortaPro:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Google Sheets to assign units</li>
                        <li>Text messages to drivers for route instructions</li>
                        <li>Handwritten delivery logs</li>
                        <li>Guessing where spare units were when emergencies came up</li>
                        <li>No system for tracking when a unit was last cleaned during multi-day festivals</li>
                        <li>Arguments with event organizers: <em>"That unit wasn't serviced." "Actually, it was… we think."</em></li>
                      </ul>
                      
                      <p className="italic border-l-4 border-primary pl-4 py-2 bg-muted/50">"Every festival weekend felt like survival mode. You hoped your drivers remembered everything—and that you could find the units on Monday." — Operations Manager</p>
                      
                      <h2 className="text-2xl font-bold mt-8">What They Changed with PortaPro</h2>
                      <p>Instead of overhaul, they focused on three big things: <strong>planning, tracking, and communication</strong>.</p>
                      
                      <div className="bg-muted/30 rounded-lg p-6 my-6">
                        <h3 className="text-xl font-bold mb-4">✅ 1. Smart Delivery Staging & GPS Drop Pins</h3>
                        <p className="mb-3">They pre-planned each event in PortaPro:</p>
                        <div className="space-y-3">
                          <div className="border-l-4 border-blue-600 pl-4">
                            <p className="font-semibold">Dropped GPS pins for exact placement areas at venues</p>
                            <p className="text-sm text-muted-foreground italic">→ No more "Where does this unit go again?" calls</p>
                          </div>
                          <div className="border-l-4 border-green-600 pl-4">
                            <p className="font-semibold">Assigned units to events before loading trucks</p>
                            <p className="text-sm text-muted-foreground italic">→ Eliminated last-minute confusion at the yard</p>
                          </div>
                          <div className="border-l-4 border-purple-600 pl-4">
                            <p className="font-semibold">Marked "Exact Location" with photos for future service runs</p>
                            <p className="text-sm text-muted-foreground italic">→ Drivers instantly knew where units were at crowded fairgrounds</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-6 my-6">
                        <h3 className="text-xl font-bold mb-4">✅ 2. Real-Time Inventory & Service Logging</h3>
                        <ul className="list-disc pl-6 space-y-2">
                          <li>Each unit was scanned via QR code as it left the yard</li>
                          <li>Once placed on site, it was assigned to a "Location Zone" in PortaPro (Main Stage, Food Court, Parking Lot, etc.)</li>
                          <li>During multi-day events, drivers logged every pump-out and trash refill directly in the app</li>
                        </ul>
                        <p className="italic border-l-4 border-primary pl-4 py-2 bg-background mt-4">"Instead of guessing if a unit was serviced Saturday night, we could see it—time, driver, and photo."</p>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-6 my-6">
                        <h3 className="text-xl font-bold mb-4">✅ 3. Live Communication with Event Organizers</h3>
                        <p className="mb-3">For the first time, organizers received automatic updates:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li><strong>"Units Delivered — 47 Completed"</strong></li>
                          <li><strong>"First Service Sweep Complete"</strong></li>
                          <li><strong>"Hand-wash refill finished at 2:15 PM"</strong></li>
                        </ul>
                        <p className="mt-3">No last-second panic. No walkie-talkie arguments.</p>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">The Results</h2>
                      <p>After using PortaPro, here's how the numbers shifted:</p>
                      
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-6 my-6">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-green-600">
                              <th className="text-left py-2 font-bold">Metric</th>
                              <th className="text-left py-2 font-bold">Before</th>
                              <th className="text-left py-2 font-bold">After PortaPro</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-green-200 dark:divide-green-800">
                            <tr>
                              <td className="py-2">Lost / unaccounted units</td>
                              <td className="py-2">6–9 per big weekend</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">0 lost units</td>
                            </tr>
                            <tr>
                              <td className="py-2">Missed services</td>
                              <td className="py-2">10+ complaints</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">1 documented issue</td>
                            </tr>
                            <tr>
                              <td className="py-2">Calls from organizers</td>
                              <td className="py-2">30+ per weekend</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">6 total</td>
                            </tr>
                            <tr>
                              <td className="py-2">Time to reconcile units post-event</td>
                              <td className="py-2">2 full days</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">3 hours</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">Biggest Lessons from the Crew</h2>
                      <div className="space-y-4">
                        <div className="border-l-4 border-blue-600 pl-4 py-2 bg-blue-50/50 dark:bg-blue-950/50">
                          <p className="font-bold">💡 "Photos end arguments."</p>
                          <p className="text-sm text-muted-foreground">Drivers took a photo of units after placement or servicing. This stopped disputes instantly.</p>
                        </div>
                        <div className="border-l-4 border-green-600 pl-4 py-2 bg-green-50/50 dark:bg-green-950/50">
                          <p className="font-bold">💡 "Zones are smarter than addresses."</p>
                          <p className="text-sm text-muted-foreground">Festival sites don't have street addresses—so PortaPro lets you name zones and drop GPS pins for each.</p>
                        </div>
                        <div className="border-l-4 border-purple-600 pl-4 py-2 bg-purple-50/50 dark:bg-purple-950/50">
                          <p className="font-bold">💡 "You only stress when things are unknown."</p>
                          <p className="text-sm text-muted-foreground">With real-time updates, the team wasn't guessing. They <em>knew</em>.</p>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white my-8">
                        <h3 className="text-xl font-bold mb-2">Final Quote from the Owner</h3>
                        <p className="italic text-lg">"This was the first year I actually enjoyed festival weekend. We didn't work less—we just worked without chaos. That was new."</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPost === 'case-study' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Badge className="bg-gradient-to-r from-green-500 to-green-700 text-white font-bold border-0">Case Studies</Badge>
                      <h1 className="text-3xl font-bold">How One Operator Saved 10 Hours a Week with PortaPro's Smart Scheduling</h1>
                      <p className="text-muted-foreground">January 8, 2024</p>
                    </div>
                    <div className="prose max-w-none space-y-4">
                      <p>When Mike, a solo operator in the Midwest, came to us, his biggest complaint was simple: "I'm spending more time coordinating jobs than actually doing them."</p>
                      <p>He was manually assigning routes, juggling notes from customers, and constantly forgetting to reassign jobs when techs were out. Enter PortaPro.</p>
                      <p>After importing his customers, assigning assets, and enabling recurring job logic, Mike started using our Smart Scheduling system. It automatically slotted service stops based on unit type, location, and urgency — and alerted him of upcoming missed jobs.</p>
                      <p>Within one week, Mike had reclaimed over 10 hours. He now uses that time to grow his business and follow up with prospects — and his customers? They've never been happier.</p>
                      <p><strong>Smart routing. Fewer errors. More time for what matters. That's the PortaPro effect.</strong></p>
                    </div>
                  </div>
                )}
                
                {selectedPost === 'google-vision' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold border-0">Technology</Badge>
                      <h1 className="text-3xl font-bold">Using Google Vision to Track Units and Eliminate Manual Data Entry in Portable Restroom Operations</h1>
                      <p className="text-muted-foreground">January 17, 2025</p>
                    </div>
                    <div className="prose max-w-none space-y-6">
                      <p className="text-lg">One of the biggest daily headaches for portable toilet operators isn't the pumping, delivery, or scheduling — it's the <strong>tracking</strong>. Knowing which units are in the yard, which are on job sites, which need servicing, and which are missing can drain hours from office teams and drivers. Most operators still rely on handwritten labels, faded barcode stickers, or memory. And in a business where every misplaced unit costs money, manual tracking is risky.</p>
                      
                      <p>But in 2025, that's changing — because image recognition is finally becoming easy, practical, and affordable for portable sanitation. At PortaPro, we're testing and integrating <strong>Google Vision Lens</strong> to help operators scan and identify units without typing, barcodes, or even QR codes.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">What Is Google Vision and Why Does It Matter in This Industry?</h2>
                      <p><strong>Google Vision Lens</strong> is a tool that uses artificial intelligence to read text, numbers, logos, and objects using a regular smartphone camera. Unlike a normal barcode scanner that needs a label, Vision can read:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Molded unit serial numbers on the plastic body</li>
                        <li>Scratched or faded company logos</li>
                        <li>Permanent marker notes on rental units</li>
                        <li>Handwritten asset numbers on trailers, trucks, or wash stations</li>
                        <li>Sticker numbers — even if damaged or dirty</li>
                      </ul>
                      <p>That means drivers don't need perfectly scanned barcodes — they can just <strong>point their camera</strong> at the unit and PortaPro recognizes it instantly.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">How It Works Inside PortaPro</h2>
                      <p>When enabled, the process is simple:</p>
                      <div className="bg-muted/30 rounded-lg p-6 my-6">
                        <ol className="list-decimal pl-6 space-y-3">
                          <li>The driver opens the PortaPro mobile app.</li>
                          <li>They select "Scan Unit."</li>
                          <li>The camera opens with Google Vision enabled.</li>
                          <li>They point it at the front of the portable toilet (logo, number panel, or marker).</li>
                          <li>Vision reads the number in under a second.</li>
                          <li>PortaPro automatically pulls up that unit's record — location, wash history, customer, contract, etc.</li>
                        </ol>
                        <p className="mt-4 font-semibold">No typing. No stickers. No hunting for a tiny barcode label under the vent.</p>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">Why This Is a Big Deal for Operators</h2>
                      <div className="space-y-4">
                        <div className="border-l-4 border-blue-600 pl-4 py-2">
                          <h3 className="font-bold text-lg mb-1">1. Works Even When Barcodes Don't</h3>
                          <p className="text-sm text-muted-foreground">Barcodes peel off. QR codes get pressure-washed. Stickers fade in the sun. But molded plastic serial numbers and company labels rarely disappear. Vision reads those instead.</p>
                        </div>
                        <div className="border-l-4 border-green-600 pl-4 py-2">
                          <h3 className="font-bold text-lg mb-1">2. Faster Check-In and Check-Out at the Yard</h3>
                          <p className="text-sm text-muted-foreground">Drivers can scan 30–50 units in minutes when prepping for a delivery or returning from a pickup.</p>
                        </div>
                        <div className="border-l-4 border-purple-600 pl-4 py-2">
                          <h3 className="font-bold text-lg mb-1">3. Helps Recover "Lost" Units</h3>
                          <p className="text-sm text-muted-foreground">When someone calls and says, "We found one of your toilets behind the barn," the tech can scan it immediately and reassign it in PortaPro.</p>
                        </div>
                        <div className="border-l-4 border-orange-600 pl-4 py-2">
                          <h3 className="font-bold text-lg mb-1">4. Perfect for Older Units Without Smart Labels</h3>
                          <p className="text-sm text-muted-foreground">Most companies don't want to re-sticker their entire fleet. With Vision, they don't have to.</p>
                        </div>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">How Accurate Is It?</h2>
                      <p>In early field tests with PortaPro users:</p>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-6 my-6">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-blue-600">
                              <th className="text-left py-2 font-bold">Condition</th>
                              <th className="text-left py-2 font-bold">Accuracy Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-blue-200 dark:divide-blue-800">
                            <tr>
                              <td className="py-2">Molded plastic numbers (clean)</td>
                              <td className="py-2 font-bold text-blue-700 dark:text-blue-400">99%</td>
                            </tr>
                            <tr>
                              <td className="py-2">Molded numbers (muddy / dusty)</td>
                              <td className="py-2 font-bold text-blue-700 dark:text-blue-400">95%</td>
                            </tr>
                            <tr>
                              <td className="py-2">Handwritten marker numbers</td>
                              <td className="py-2 font-bold text-blue-700 dark:text-blue-400">93%</td>
                            </tr>
                            <tr>
                              <td className="py-2">Faded or partially damaged stickers</td>
                              <td className="py-2 font-bold text-blue-700 dark:text-blue-400">90%</td>
                            </tr>
                            <tr>
                              <td className="py-2">Blurry or low lighting photos</td>
                              <td className="py-2 font-bold text-blue-700 dark:text-blue-400">80–85%</td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="mt-4 font-semibold">The biggest advantage? <strong>No extra hardware is needed</strong>—just a smartphone camera.</p>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">Where This Technology Is Going</h2>
                      <p>Google Vision is just step one. PortaPro plans to connect image recognition to:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Auto-assign units to job sites when scanned on arrival</strong></li>
                        <li><strong>Detect damaged doors, cracks, or graffiti through image AI</strong></li>
                        <li><strong>Automatically log wash records by scanning instead of manually typing</strong></li>
                        <li><strong>Scan truck license plates for fuel logs and mileage tracking</strong></li>
                      </ul>
                      
                      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white my-8">
                        <h3 className="text-xl font-bold mb-2">Final Thoughts</h3>
                        <p className="text-lg">Portable restroom businesses don't need futuristic robotics—they need everyday tools that <em>save time, prevent mistakes, and recover revenue</em>. Google Vision inside PortaPro does exactly that.</p>
                        <p className="text-lg mt-3 font-semibold">Smartphone camera in → Unit identified → Job tracked → No paperwork.</p>
                        <p className="mt-3">It's simple. It's fast. And it finally works the way operators do.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedPost === 'offline-mode' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold border-0">Technology</Badge>
                      <h1 className="text-3xl font-bold">Why Offline Mode Matters: How PortaPro Works Even Without Signal on Rural Routes and Event Sites</h1>
                      <p className="text-muted-foreground">June 3, 2025</p>
                    </div>
                    <div className="prose max-w-none space-y-6">
                      <p className="text-lg">If you run a portable restroom business, you already know this truth: <strong>cell service is not guaranteed where your drivers work.</strong> Whether it's a construction site in the woods, a music festival in a field, or a rural county fairground, dead zones are part of the job. But most software assumes you're always connected.</p>
                      
                      <p>That's why Offline Mode inside PortaPro isn't a bonus feature—it's a <strong>necessity</strong>.</p>
                      
                      <p>In this article, we're breaking down how Offline Mode works, why it matters, and how it solves real problems in the field for operators and drivers.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">The Challenge: Software That Only Works with Wi-Fi or LTE</h2>
                      <p>Most routing or job management tools in other industries shut down when the internet drops. In our industry, that means:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Drivers can't see their next stop</li>
                        <li>They can't log that they serviced a unit</li>
                        <li>GPS stops tracking</li>
                        <li>Service history is lost or written on paper</li>
                        <li>Office staff thinks a driver is "inactive" when they're actually just working with no signal</li>
                      </ul>
                      
                      <p className="italic border-l-4 border-primary pl-4 py-2 bg-muted/50">"We'll just stick with paper. At least it always works." — Frustrated operators everywhere</p>
                      
                      <p className="font-semibold">PortaPro was built differently.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">How Offline Mode Actually Works in PortaPro</h2>
                      <p>When drivers start their route for the day, the app <strong>downloads everything they need</strong>—even if they lose connection later:</p>
                      
                      <div className="bg-muted/30 rounded-lg p-6 my-6">
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">✅</span>
                            <span>Service routes and stop order</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">✅</span>
                            <span>Unit locations and job site addresses</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">✅</span>
                            <span>Notes, instructions, gate codes, customer contacts</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">✅</span>
                            <span>Inventory assigned to their truck</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">✅</span>
                            <span>Job photos, signatures, and service logs (all saved locally until upload)</span>
                          </li>
                        </ul>
                        <p className="mt-4 font-semibold">If signal drops, drivers barely notice. The app keeps working exactly the same—no error messages, no spinning loaders.</p>
                        <p className="mt-2">Once the phone gets service again (even briefly), PortaPro automatically syncs everything to the office dashboard.</p>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">Real-World Uses of Offline Mode</h2>
                      <div className="space-y-4">
                        <div className="border-l-4 border-blue-600 pl-4 py-2">
                          <h3 className="font-bold text-lg mb-1">1. Rural Construction Routes</h3>
                          <p className="text-sm text-muted-foreground">A driver in Missouri runs a 120-mile service loop where half the stops don't have LTE. With Offline Mode, he logs each unit as "Serviced" or "Could Not Service" and adds notes or photos. Everything syncs automatically when he gets closer to town.</p>
                        </div>
                        <div className="border-l-4 border-green-600 pl-4 py-2">
                          <h3 className="font-bold text-lg mb-1">2. Music Festival Setup</h3>
                          <p className="text-sm text-muted-foreground">Event grounds often don't have Wi-Fi, and thousands of people flood the same cellular tower. PortaPro still records unit placement, zone names like "Main Stage Left," and service sweeps. No delays. No waiting for a signal.</p>
                        </div>
                        <div className="border-l-4 border-purple-600 pl-4 py-2">
                          <h3 className="font-bold text-lg mb-1">3. After-Storm Cleanup</h3>
                          <p className="text-sm text-muted-foreground">During one storm, power went out at multiple job sites. Drivers kept working. PortaPro kept running. Nothing got lost.</p>
                        </div>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">Why Offline Mode Saves You Money (Not Just Stress)</h2>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg p-6 my-6">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-green-600">
                              <th className="text-left py-2 font-bold">Problem Solved</th>
                              <th className="text-left py-2 font-bold">Before PortaPro</th>
                              <th className="text-left py-2 font-bold">With PortaPro Offline</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-green-200 dark:divide-green-800">
                            <tr>
                              <td className="py-2">Lost service logs</td>
                              <td className="py-2">Paper sheets damaged / lost</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">Every log saved locally and synced</td>
                            </tr>
                            <tr>
                              <td className="py-2">Missed invoices</td>
                              <td className="py-2">Drivers forgot to record jobs</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">All jobs logged in app—even offline</td>
                            </tr>
                            <tr>
                              <td className="py-2">Driver downtime</td>
                              <td className="py-2">Waiting for signal to load maps or jobs</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">Work continues uninterrupted</td>
                            </tr>
                            <tr>
                              <td className="py-2">Customer disputes</td>
                              <td className="py-2">"You didn't clean this unit"</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">Timestamp + photo proof saved offline</td>
                            </tr>
                            <tr>
                              <td className="py-2">Multi-day festivals</td>
                              <td className="py-2">No service = no tracking</td>
                              <td className="py-2 font-bold text-green-700 dark:text-green-400">Full history captured and synced</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">The Technology Behind It (Simple Explanation)</h2>
                      <div className="bg-muted/30 rounded-lg p-6 my-6">
                        <ul className="list-disc pl-6 space-y-2">
                          <li>The route data is cached locally on the device when the driver starts their shift.</li>
                          <li>Every action (photo, note, status change) is stored in an encrypted offline database inside the app.</li>
                          <li>When the phone detects service again, PortaPro pushes updates to the cloud in the correct order.</li>
                          <li>If two people update the same job, the most recent timestamp wins—but nothing is overwritten without record.</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white my-8">
                        <h3 className="text-xl font-bold mb-3">Final Thought</h3>
                        <p className="text-lg mb-3">Portable restroom work doesn't happen in offices or fiber-connected cities—it happens in fields, gravel roads, back lots, and festival grounds. Technology has to respect that reality.</p>
                        <p className="mb-2"><strong>Offline Mode means your business doesn't stop when your signal does.</strong></p>
                        <ul className="space-y-1 ml-4 mb-3">
                          <li>• It keeps routes moving.</li>
                          <li>• It keeps logs accurate.</li>
                          <li>• It keeps drivers doing their job—without calling dispatch every five minutes.</li>
                        </ul>
                        <p className="text-lg font-semibold">And most importantly—<strong>it makes software feel invisible, not fragile.</strong></p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedPost === 'tracking-comparison' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold border-0">Technology</Badge>
                      <h1 className="text-3xl font-bold">QR vs RFID vs GPS: What's the Best Way to Track Your Portable Restroom Inventory?</h1>
                      <p className="text-muted-foreground">October 1, 2025</p>
                    </div>
                    <div className="prose max-w-none space-y-6">
                      <p className="text-lg">Keeping track of hundreds of toilets, sinks, trailers, and handwash stations is one of the hardest parts of running a portable restroom company. Units get dropped for weekend events, moved by contractors, forgotten behind barns, or never returned after storm cleanup.</p>
                      
                      <p className="font-semibold text-lg">Every operator wants to know: "What's the best way to track my inventory—QR codes, GPS, RFID, or something else?"</p>
                      
                      <p>The truth: each option has pros and cons. And depending on your fleet size, terrain, and budget, one system might make more sense than the others.</p>
                      
                      <p>Here's a breakdown of what actually works in the field—based on real operator feedback and PortaPro's own testing.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">🟦 1. QR Codes — Simple, Cheap, and Effective</h2>
                      <p className="font-semibold">How it works:</p>
                      <p>A sticker is placed on each unit. Drivers scan it with their phone. PortaPro pulls up the unit's full history, location, last service date, and customer contract.</p>
                      
                      <div className="grid md:grid-cols-2 gap-4 my-6">
                        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border-l-4 border-green-600">
                          <h3 className="font-bold text-lg mb-2 text-green-700 dark:text-green-400">Pros:</h3>
                          <ul className="space-y-1 text-sm">
                            <li>• Very affordable (as low as $0.05 per label)</li>
                            <li>• Works with just a smartphone — no hardware needed</li>
                            <li>• Fast to scan during drop-off, pickup, or service</li>
                            <li>• Connects directly to PortaPro's inventory and service logs</li>
                          </ul>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border-l-4 border-red-600">
                          <h3 className="font-bold text-lg mb-2 text-red-700 dark:text-red-400">Cons:</h3>
                          <ul className="space-y-1 text-sm">
                            <li>• Stickers can fade, get pressure-washed off, or be vandalized</li>
                            <li>• Requires someone to physically scan the unit to update location</li>
                            <li>• No "live tracking" — only updates when scanned</li>
                          </ul>
                        </div>
                      </div>
                      <p className="italic font-semibold">Best for: Small to mid-size fleets, construction routes, daily service logging, and tracking units at events.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">🟦 2. RFID Tags — Hands-Free Scanning, Higher Cost</h2>
                      <p className="font-semibold">How it works:</p>
                      <p>An RFID tag is attached to the unit. Drivers carry a handheld scanner or phone with NFC. The scanner detects nearby units without direct line-of-sight.</p>
                      
                      <div className="grid md:grid-cols-2 gap-4 my-6">
                        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border-l-4 border-green-600">
                          <h3 className="font-bold text-lg mb-2 text-green-700 dark:text-green-400">Pros:</h3>
                          <ul className="space-y-1 text-sm">
                            <li>• Can scan multiple units without aiming a camera</li>
                            <li>• Works even if mud or graffiti covers the tag</li>
                            <li>• Faster than QR when scanning 50–100 units in a yard</li>
                          </ul>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border-l-4 border-red-600">
                          <h3 className="font-bold text-lg mb-2 text-red-700 dark:text-red-400">Cons:</h3>
                          <ul className="space-y-1 text-sm">
                            <li>• Tags and scanners are more expensive ($1–$5 per unit)</li>
                            <li>• Still not real-time tracking — only proximity-based</li>
                            <li>• Requires special equipment or NFC-enabled devices</li>
                          </ul>
                        </div>
                      </div>
                      <p className="italic font-semibold">Best for: Large yards, high-volume staging, winter months when labels get dirty or wet.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">🟦 3. GPS Trackers — Real-Time Location, High Cost</h2>
                      <p className="font-semibold">How it works:</p>
                      <p>A battery-powered GPS device is attached to units or trailers. Locations update every 5–15 minutes via cell or satellite.</p>
                      
                      <div className="grid md:grid-cols-2 gap-4 my-6">
                        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border-l-4 border-green-600">
                          <h3 className="font-bold text-lg mb-2 text-green-700 dark:text-green-400">Pros:</h3>
                          <ul className="space-y-1 text-sm">
                            <li>• You can see exactly where a unit is <em>right now</em></li>
                            <li>• Great for high-theft areas or tracking luxury trailers</li>
                            <li>• Provides movement alerts and geofencing</li>
                          </ul>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border-l-4 border-red-600">
                          <h3 className="font-bold text-lg mb-2 text-red-700 dark:text-red-400">Cons:</h3>
                          <ul className="space-y-1 text-sm">
                            <li>• $80–$200 per tracker + monthly data fees</li>
                            <li>• Needs charging or battery replacements</li>
                            <li>• Not realistic to put GPS on every toilet</li>
                          </ul>
                        </div>
                      </div>
                      <p className="italic font-semibold">Best for: High-value assets — luxury restroom trailers, vacuum trucks, handwash trailers, or large generator units.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">✅ So What Does PortaPro Recommend?</h2>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-6 my-6">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2 border-blue-600">
                              <th className="text-left py-2 font-bold">Unit Type</th>
                              <th className="text-left py-2 font-bold">Best Tracking Method</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-blue-200 dark:divide-blue-800">
                            <tr>
                              <td className="py-2">Standard toilets</td>
                              <td className="py-2 font-bold">QR codes or Vision-based scanning</td>
                            </tr>
                            <tr>
                              <td className="py-2">High-volume inventory yards</td>
                              <td className="py-2 font-bold">RFID or QR hybrid</td>
                            </tr>
                            <tr>
                              <td className="py-2">Handwash or specialty sinks</td>
                              <td className="py-2 font-bold">QR + service log check-ins</td>
                            </tr>
                            <tr>
                              <td className="py-2">Luxury or ADA trailers</td>
                              <td className="py-2 font-bold">GPS tracking</td>
                            </tr>
                            <tr>
                              <td className="py-2">Entire fleet visibility</td>
                              <td className="py-2 font-bold">GPS for vehicles + QR for units</td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="mt-4 text-sm">PortaPro currently supports QR and barcode scanning. RFID and GPS integrations are in active development — with the goal of letting operators mix and match tracking types depending on asset value.</p>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">💡 The Future: No Labels At All? (AI Vision + GPS Hybrid)</h2>
                      <p>Imagine this: a driver just points their camera at a row of toilets — no stickers, no tags. AI reads the molded unit numbers and assigns them a GPS location automatically.</p>
                      <p className="font-semibold">This is exactly where PortaPro + Google Vision is headed.</p>
                      
                      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white my-8">
                        <h3 className="text-xl font-bold mb-3">Final Word</h3>
                        <p className="text-lg mb-3">You don't need the most expensive tech — you need the <em>right</em> tech for your fleet.</p>
                        <ul className="space-y-2">
                          <li>• <strong>Under 500 units?</strong> QR + mobile app is more than enough.</li>
                          <li>• <strong>Multiple yards or large staging lots?</strong> Consider adding RFID.</li>
                          <li>• <strong>Luxury trailers or theft-prone jobs?</strong> GPS pays for itself.</li>
                          <li>• <strong>And if you don't know where your toilets are?</strong> You're not alone — and you don't need to stay that way.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPost === 'qr-codes' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold border-0">Technology</Badge>
                      <h1 className="text-3xl font-bold">QR Codes on Porta Potties: How It Actually Works</h1>
                      <p className="text-muted-foreground">December 28, 2023</p>
                    </div>
                    <div className="prose max-w-none space-y-4">
                      <p>Yes, your porta potty can have a QR code — and yes, it can be life-changing.</p>
                      <p>Every individual unit in PortaPro can be tagged with a unique QR code, linking directly to its profile. When scanned by a tech in the field, the system instantly pulls up:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>The unit's last service</li>
                        <li>Inspection history</li>
                        <li>Location assignments</li>
                        <li>Notes, photos, and lock status</li>
                      </ul>
                      <p>No more guessing. No more calling the office. Just scan and go.</p>
                      <p>QR codes also help automate job completion, reduce missed cleanings, and give your customers peace of mind that every unit is being tracked.</p>
                      <p>Whether you print the codes yourself or we provide them, the setup is quick — and the benefits are massive.</p>
                    </div>
                  </div>
                )}
                
                {selectedPost === 'scheduling-strategies' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold border-0">Business Tips</Badge>
                      <h1 className="text-3xl font-bold">7 Scheduling Strategies Used by High-Volume Portable Restroom Operators</h1>
                      <p className="text-muted-foreground">March 9, 2025</p>
                    </div>
                    <div className="prose max-w-none space-y-6">
                      <p className="text-lg">Whether you're running 50 units or 5,000, the most stressful part of this business usually comes down to one thing—<strong>scheduling</strong>. Who's servicing what? Which driver is on which route? Did someone already pump that unit? And why is the phone ringing again about a missed service?</p>
                      
                      <p>After talking with operators across the U.S. and Canada, we've collected seven proven scheduling strategies used by high-volume companies who manage to stay profitable, organized, and calm—even in peak season.</p>
                      
                      <p className="font-semibold">This isn't theory—these are field-tested practices from real operators.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">1. Plan Routes the Day Before, Never the Morning Of</h2>
                      <p>Many small operators build their routes in the morning while drivers wait around. High-performing teams don't.</p>
                      
                      <div className="bg-muted/30 rounded-lg p-6 my-6">
                        <p className="font-bold mb-3">What they do instead:</p>
                        <ul className="list-disc pl-6 space-y-2">
                          <li>Dispatch builds and finalizes routes <em>the evening before</em></li>
                          <li>Drivers can see their schedule on their phone before going to bed</li>
                          <li>Trucks are pre-loaded with chemicals, water, and supplies at the end of the previous day</li>
                        </ul>
                        <p className="font-bold mt-4 mb-2">Why it works:</p>
                        <ul className="list-disc pl-6 space-y-1">
                          <li>Zero yard delays in the morning</li>
                          <li>Fewer forgotten supplies or keys</li>
                          <li>Drivers immediately roll out and hit their first stop on time</li>
                        </ul>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">2. Group Stops by Zones, Not by Customer Type</h2>
                      <p>A common mistake is to schedule by account ("all construction sites first, then special events"). But the pros schedule by <strong>geography</strong>—what's closest, most efficient, and less likely to cause backtracking.</p>
                      
                      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6 my-6 border-l-4 border-blue-600">
                        <p className="font-bold mb-2">Example zone names operators use:</p>
                        <ul className="space-y-1">
                          <li>• North Industrial</li>
                          <li>• Downtown Core</li>
                          <li>• Fairgrounds / Event Side</li>
                          <li>• West Suburbs</li>
                        </ul>
                        <p className="mt-3 text-sm">This reduces drive time, fuel cost, and driver fatigue—especially when combined with live maps or route apps.</p>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">3. Use "Time Windows" for Key Customers</h2>
                      <p>Some jobs can't be missed—schools, downtown office parks, government contracts.</p>
                      <p>High-volume operators put these into <strong>locked time windows</strong> like:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>"Service before 9 AM"</li>
                        <li>"After 2 PM only—school dismissal traffic before that"</li>
                        <li>"No service during wedding ceremony between 1–2 PM"</li>
                      </ul>
                      <p>Every other stop is filled around those commitments. This keeps premium clients happy and contractual penalties to a minimum.</p>
                      
                      <h2 className="text-2xl font-bold mt-8">4. Assign Every Route a Back-Up Driver</h2>
                      <p>Things go wrong—flat tires, accidents, sick calls, flooded festival lots.</p>
                      <div className="bg-muted/30 rounded-lg p-6 my-6">
                        <p className="mb-3">High-performing teams assign a "floating driver" or backup tech each day. They don't get a full route but instead:</p>
                        <ul className="list-disc pl-6 space-y-2">
                          <li>Handle emergency calls</li>
                          <li>Pick up missed units</li>
                          <li>Support whoever falls behind</li>
                          <li>Deliver extra hand sanitizer or deodorizer when events run out</li>
                        </ul>
                        <p className="mt-4 font-semibold">This one simple change dramatically reduces stress for dispatchers and event organizers.</p>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">5. Never Rely on Verbal or Handwritten Notes</h2>
                      <p>Most missed services happen because someone "thought" a unit got done, or a driver scribbled an address that no one can read.</p>
                      <div className="bg-green-50 dark:bg-green-950 rounded-lg p-6 my-6 border-l-4 border-green-600">
                        <p className="font-bold mb-3">Operators who consistently avoid mistakes:</p>
                        <ul className="list-disc pl-6 space-y-2">
                          <li>Log every service digitally</li>
                          <li>Require drivers to tap "Serviced" or "Blocked / Could Not Service" for each stop</li>
                          <li>Use photos to confirm washes, damage, or obstructions</li>
                        </ul>
                        <p className="mt-4 font-semibold">Photos don't lie. Handwriting does.</p>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">6. Build Seasonal vs. Year-Round Route Templates</h2>
                      <p>Peak season (festival months) is a completely different rhythm from winter construction schedules.</p>
                      <div className="bg-muted/30 rounded-lg p-6 my-6">
                        <p className="mb-3 font-bold">Top operators create two versions of their routes:</p>
                        <ul className="space-y-3">
                          <li className="border-l-4 border-orange-600 pl-4 py-2">
                            <strong>Seasonal Route Templates</strong> — with extra event sites, temporary drivers, added weekend runs
                          </li>
                          <li className="border-l-4 border-blue-600 pl-4 py-2">
                            <strong>Winter / Slow Season Templates</strong> — fewer drivers, optimized fuel, fewer services per unit
                          </li>
                        </ul>
                        <p className="mt-4">This makes scaling up or down incredibly smooth.</p>
                      </div>
                      
                      <h2 className="text-2xl font-bold mt-8">7. Review Routes Weekly—Not Just When Problems Happen</h2>
                      <p>High-performing operators don't wait for complaints to check routes.</p>
                      <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-6 my-6 border-l-4 border-purple-600">
                        <p className="font-bold mb-3">Every week, they:</p>
                        <ul className="list-disc pl-6 space-y-2">
                          <li>Look at total stops per driver</li>
                          <li>Review fuel usage vs. revenue per route</li>
                          <li>Adjust routes that are too heavy or too light</li>
                          <li>Reassign units when construction jobs finish or events end</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white my-8">
                        <h3 className="text-xl font-bold mb-3">The Bottom Line</h3>
                        <p className="text-lg mb-3">Great scheduling isn't about being perfect—it's about being <em>consistent, visible, and flexible</em>.</p>
                        <p>These seven strategies won't solve every problem. But they will give you a baseline structure that prevents most of the chaos—especially during peak season when stress is highest and margins are tightest.</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedPost === 'missed-cleanings' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold border-0">Business Tips</Badge>
                      <h1 className="text-3xl font-bold">The Hidden Cost of Missed Cleanings (And How to Stop Them)</h1>
                      <p className="text-muted-foreground">December 15, 2023</p>
                    </div>
                    <div className="prose max-w-none space-y-4">
                      <p>Missed cleanings don't just mean one unhappy customer. They mean:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Negative reviews</li>
                        <li>Lost contracts</li>
                        <li>Overtime hours</li>
                        <li>Emergency dispatch costs</li>
                      </ul>
                      <p><strong>In other words: chaos.</strong></p>
                      <p>PortaPro was built to prevent this. Our job scheduling engine alerts your team before service windows are missed. Color-coded dashboards show what's coming due. And QR codes + tech sign-offs prove every job was completed.</p>
                      <p>Most companies don't realize how much missed cleanings cost until it's too late. With PortaPro, you stop guessing and start preventing. Less stress, more accountability.</p>
                    </div>
                  </div>
                )}
                
                {selectedPost === 'ai-update' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Badge className="bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold border-0">Product Updates</Badge>
                      <h1 className="text-3xl font-bold">PortaPro Product Update: AI Lock Detection + Inventory Scanning</h1>
                      <p className="text-muted-foreground">December 1, 2023</p>
                    </div>
                    <div className="prose max-w-none space-y-4">
                      <p>We're excited to roll out one of our most-requested features: <strong>AI-powered lock detection and molded panel scanning</strong>.</p>
                      <h3 className="text-xl font-bold">Here's what's new:</h3>
                      <h4 className="text-lg font-semibold">🔐 Lock Detection & Tracking</h4>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Mark which units have lock capabilities</li>
                        <li>Track if a unit is currently locked</li>
                        <li>Log lock types, key info, and access notes</li>
                      </ul>
                      <h4 className="text-lg font-semibold">🧠 Google Vision OCR Panel Scanning</h4>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Snap a photo of the molded side panel</li>
                        <li>Automatically extract tool #, vendor ID, plastic code, and date</li>
                        <li>Link data to the unit profile with high confidence scoring</li>
                      </ul>
                      <p>This update reduces data entry, prevents theft/confusion, and helps you better track unit lifespan and origin.</p>
                      <p><strong>Want to try it?</strong> Head to any individual inventory item and tap "Enable OCR Processing" — or contact our team to turn it on account-wide.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Blog Posts Grid */
              <div className="space-y-8">
                {/* Category Filter */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Browse by Category</h3>
                  {isMobile ? <CategoryFilterMobile /> : <CategoryFilterDesktop />}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {filteredPosts.map((post) => (
                    post.featured ? (
                      /* Featured Post */
                      <div key={post.id} className="md:col-span-2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-8 text-white">
                        <Badge className={`bg-gradient-to-r ${post.badgeGradient} text-white font-bold border-0 mb-4`}>{post.category}</Badge>
                        <h3 className="text-2xl font-bold mb-3">{post.title}</h3>
                        <p className="text-white/90 mb-4 text-lg">{post.excerpt}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80 text-sm">{post.date} • {post.category}</span>
                          <Button 
                            className="bg-white text-primary hover:bg-white/90"
                            onClick={() => onSelectPost(post.id)}
                          >
                            Read More <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Regular Post */
                      <Card key={post.id} className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <CardContent className="p-6">
                          <Badge className={`bg-gradient-to-r ${post.badgeGradient} text-white font-bold border-0 mb-3`}>{post.category}</Badge>
                          <h3 className="text-xl font-bold mb-3">{post.title}</h3>
                          <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">{post.date}</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onSelectPost(post.id)}
                            >
                              Read More <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  ))}
                </div>

                {filteredPosts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No blog posts found in this category.</p>
                  </div>
                )}

                {/* Subscribe Section */}
                <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-3">Stay Updated</h3>
                  <p className="text-blue-100 mb-4">
                    Get the latest insights, product updates, and industry tips delivered to your inbox.
                  </p>
                  <Button className="bg-white text-blue-700 hover:bg-white/90 font-semibold">
                    Subscribe to Blog Updates <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
