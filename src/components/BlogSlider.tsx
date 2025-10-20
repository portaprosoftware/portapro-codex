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
