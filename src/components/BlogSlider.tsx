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
    id: 'qr-codes',
    category: 'Technology',
    title: 'QR Codes on Porta Potties: How It Actually Works',
    excerpt: 'Yes, your porta potty can have a QR code — and yes, it can be life-changing. Every individual unit in PortaPro can be tagged with a unique QR code.',
    date: 'December 28, 2023',
    badgeGradient: 'from-blue-500 to-blue-700'
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
