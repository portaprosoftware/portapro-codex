import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface BlogSliderProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPost: string | null;
  onSelectPost: (postId: string | null) => void;
}

export const BlogSlider: React.FC<BlogSliderProps> = ({ 
  isOpen, 
  onClose, 
  selectedPost, 
  onSelectPost 
}) => {
  if (!isOpen) return null;

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
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold border-0">Featured</Badge>
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
                
                {selectedPost === 'case-study' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Badge className="bg-gradient-to-r from-green-500 to-green-700 text-white font-bold border-0">Case Study</Badge>
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
                      <Badge className="bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold border-0">Product Update</Badge>
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
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Featured Post */}
                  <div className="md:col-span-2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-8 text-white">
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold border-0 mb-4">Featured</Badge>
                    <h3 className="text-2xl font-bold mb-3">Why We Built PortaPro: Behind the Scenes with Our Founding Team</h3>
                    <p className="text-white/90 mb-4 text-lg">
                      At PortaPro, we didn't just build another SaaS platform — we built a solution to a problem we lived. Our founding team came from the trenches of field service, operations, and tech.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">January 15, 2024 • Company</span>
                      <Button 
                        className="bg-white text-primary hover:bg-white/90"
                        onClick={() => onSelectPost('featured')}
                      >
                        Read More <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>

                  {/* Blog Post 1 */}
                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <Badge className="bg-gradient-to-r from-green-500 to-green-700 text-white font-bold border-0 mb-3">Case Study</Badge>
                      <h3 className="text-xl font-bold mb-3">How One Operator Saved 10 Hours a Week with PortaPro's Smart Scheduling</h3>
                      <p className="text-muted-foreground mb-4">
                        When Mike, a solo operator in the Midwest, came to us, his biggest complaint was simple: "I'm spending more time coordinating jobs than actually doing them."
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">January 8, 2024</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onSelectPost('case-study')}
                        >
                          Read More <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Blog Post 2 */}
                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold border-0 mb-3">Technology</Badge>
                      <h3 className="text-xl font-bold mb-3">QR Codes on Porta Potties: How It Actually Works</h3>
                      <p className="text-muted-foreground mb-4">
                        Yes, your porta potty can have a QR code — and yes, it can be life-changing. Every individual unit in PortaPro can be tagged with a unique QR code.
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">December 28, 2023</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onSelectPost('qr-codes')}
                        >
                          Read More <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Blog Post 3 */}
                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold border-0 mb-3">Business Tips</Badge>
                      <h3 className="text-xl font-bold mb-3">The Hidden Cost of Missed Cleanings (And How to Stop Them)</h3>
                      <p className="text-muted-foreground mb-4">
                        Missed cleanings don't just mean one unhappy customer. They mean negative reviews, lost contracts, overtime hours, and emergency dispatch costs.
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">December 15, 2023</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onSelectPost('missed-cleanings')}
                        >
                          Read More <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Blog Post 4 */}
                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <Badge className="bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold border-0 mb-3">Product Update</Badge>
                      <h3 className="text-xl font-bold mb-3">PortaPro Product Update: AI Lock Detection + Inventory Scanning</h3>
                      <p className="text-muted-foreground mb-4">
                        We're excited to roll out one of our most-requested features: AI-powered lock detection and molded panel scanning with Google Vision OCR.
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">December 1, 2023</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onSelectPost('ai-update')}
                        >
                          Read More <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Categories Section */}
                <div className="border-t pt-8">
                  <h3 className="text-xl font-bold mb-4">Browse by Category</h3>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors">Company News</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors">Case Studies</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors">Technology</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors">Business Tips</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors">Product Updates</Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors">Industry Insights</Badge>
                  </div>
                </div>

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