import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search, Mail, Phone, ArrowLeft, X, Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { useNavigate } from 'react-router-dom';

interface HelpSection {
  id: string;
  title: string;
  subsections: {
    id: string;
    title: string;
    steps: string[];
  }[];
}

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: '1. Getting Started',
    subsections: [
      {
        id: 'create-account',
        title: '1.1. Create Your PortaPro Account',
        steps: [
          'Go to portaprosoftware.com/signup.',
          'Enter your business email and choose a password.',
          'Verify your email by clicking the link we send you.',
          'Complete your company profile: name, address, phone, logo.'
        ]
      },
      {
        id: 'invite-team',
        title: '1.2. Invite Team Members',
        steps: [
          'In the sidebar, click Settings → Users.',
          'Click "Invite User", enter name and email, assign a role (Admin, Dispatcher, Tech).',
          'Your teammate receives an email—once they accept, they can log in.'
        ]
      },
      {
        id: 'setup-location',
        title: '1.3. Set Up Your First Location',
        steps: [
          'Go to Settings → Locations.',
          'Click "Add Location", name it (e.g. "Main Yard"), enter address.',
          'This serves as your default drop-off/pick-up point.'
        ]
      },
      {
        id: 'import-data',
        title: '1.4. Import Customers & Units',
        steps: [
          'Download our sample CSV template from Settings → Data Import.',
          'Fill in customer names, contact info, and unit serials.',
          'Upload the CSV to map fields and bulk-import.',
          'Review any errors, correct, and re-upload.'
        ]
      }
    ]
  },
  {
    id: 'jobs-dispatching',
    title: '2. Job Creation & Dispatching',
    subsections: [
      {
        id: 'create-job',
        title: '2.1. Create a New Job',
        steps: [
          'Click Jobs → New Job.',
          'Select Customer, Location, Date & Time.',
          'Choose Job Type: Cleaning, Delivery, Pickup, Service.',
          '(Optional) Add consumables or bundles—see Inventory section.',
          'Assign to a Tech or Team.',
          'Click "Save & Dispatch".'
        ]
      },
      {
        id: 'smart-scheduling',
        title: '2.2. Smart Scheduling',
        steps: [
          'Go to Jobs → Calendar.',
          'Toggle "Smart Scheduling" on to auto-slot based on proximity and availability.',
          'To adjust manually, drag the job card to a new time slot or tech.'
        ]
      },
      {
        id: 'dispatch-notifications',
        title: '2.3. Dispatch Notifications',
        steps: [
          'Techs receive SMS and in-app alerts when a job is assigned or updated.',
          'You can customize notification templates under Settings → Notifications.'
        ]
      }
    ]
  },
  {
    id: 'inventory-management',
    title: '3. Inventory & Equipment Management',
    subsections: [
      {
        id: 'bulk-vs-individual',
        title: '3.1. Bulk vs. Individual Tracking',
        steps: [
          'Bulk: Treats items as indistinguishable (e.g. 50 rolls of paper).',
          'Individual: Tracks each toilet or accessory with its own profile.'
        ]
      },
      {
        id: 'adding-units',
        title: '3.2. Adding Individual Units',
        steps: [
          'Click Inventory → Units.',
          'Click "Add Unit".',
          'Fill in Unit ID, Model, Has Lock? toggle, Consumables per use.',
          '(Optional) Snap a photo of the side panel and manually enter Tool #, Vendor ID, Date dials, Material.'
        ]
      },
      {
        id: 'qr-codes',
        title: '3.3. QR Code Setup & Scanning',
        steps: [
          'Under Inventory → QR Codes, click Generate next to each unit.',
          'Print or download labels.',
          'In the field, tech taps Scan in the mobile app—this opens the unit\'s full profile.'
        ]
      },
      {
        id: 'lock-tracking',
        title: '3.4. Lock Tracking',
        steps: [
          'Has Lock Option? toggle marks units that support locks.',
          'Is Unit Locked? toggle logs whether a lock is currently installed.',
          '(Optional) Record Lock Type and Key Code for secure sites.'
        ]
      },
      {
        id: 'consumables',
        title: '3.5. Consumables & Supplies',
        steps: [
          'When creating a job, under Consumables, choose Per-Use, Bundles, or Flat-Rate options.',
          'To track usage without billing, enable "Inventory Only" for non-chargeable items.'
        ]
      }
    ]
  },
  {
    id: 'invoicing-quotes',
    title: '4. Invoicing & Quotes',
    subsections: [
      {
        id: 'creating-quotes',
        title: '4.1. Creating Quotes',
        steps: [
          'Go to Quotes → New Quote.',
          'Select Customer and Job Type.',
          'Add line items: units, consumables, labor.',
          'Save as Draft or Send via email/PDF.'
        ]
      },
      {
        id: 'converting-quotes',
        title: '4.2. Converting Quotes to Jobs',
        steps: [
          'From the Quotes list, click "Convert to Job". This pre-fills the Job form.'
        ]
      },
      {
        id: 'sending-invoices',
        title: '4.3. Sending Invoices',
        steps: [
          'Under Invoices → New Invoice, select a completed job.',
          'Adjust payment terms and due date.',
          'Click Send, and a PDF link is emailed to the customer.'
        ]
      },
      {
        id: 'payment-tracking',
        title: '4.4. Payment Tracking & Reminders',
        steps: [
          'Payments recorded under each invoice.',
          'Automatic reminders can be set in Settings → Billing → Reminders.'
        ]
      }
    ]
  },
  {
    id: 'ai-tools',
    title: '5. AI Tools & Automations',
    subsections: [
      {
        id: 'ai-vision',
        title: '5.1. Enabling AI Vision OCR',
        steps: [
          'In Settings → AI Integrations, enter your Google Vision API key.',
          'Under Inventory → Units, click Enable OCR.',
          'In the mobile app, snap a clear photo of the molded panel.',
          'Data fields auto-populate: Tool #, Vendor ID, Dial date, Material.'
        ]
      },
      {
        id: 'job-templates',
        title: '5.2. Smart Job Templates',
        steps: [
          'Build recurring job templates under Jobs → Templates.',
          'Define equipment, consumables, frequency rules, and auto-dispatch logic.'
        ]
      },
      {
        id: 'automated-alerts',
        title: '5.3. Automated Alerts',
        steps: [
          'Go to Settings → Alerts to:',
          '• Notify when inventory falls below a threshold.',
          '• Trigger maintenance reminders based on unit age.',
          '• Alert you if a job is unassigned 24 hrs before scheduled.'
        ]
      }
    ]
  },
  {
    id: 'mobile-pwa',
    title: '6. Mobile & PWA Features',
    subsections: [
      {
        id: 'installing-pwa',
        title: '6.1. Installing the PWA',
        steps: [
          'Visit PortaPro on your mobile browser.',
          'Tap "Add to Home Screen" when prompted.',
          'The app works offline—syncs when back online.'
        ]
      },
      {
        id: 'signatures-photos',
        title: '6.2. Capturing Signatures & Photos',
        steps: [
          'Within a job, tap "Add Photo" or "Capture Signature".',
          'Photos and signatures attach directly to the service report.'
        ]
      },
      {
        id: 'offline-mode',
        title: '6.3. Offline Mode',
        steps: [
          'Jobs assigned while offline will queue locally.',
          'Data syncs automatically when connectivity returns.'
        ]
      }
    ]
  },
  {
    id: 'integrations',
    title: '7. Integrations',
    subsections: [
      {
        id: 'stripe-payments',
        title: '7.1. Stripe for Payments',
        steps: [
          'In Settings → Integrations, click Connect Stripe.',
          'Follow the OAuth flow to link your account.',
          'Invoices now accept credit cards and auto-record payments.'
        ]
      },
      {
        id: 'accounting-export',
        title: '7.2. QuickBooks / Xero Export',
        steps: [
          'Under Settings → Exports, enable your accounting platform.',
          'Map your invoice and customer fields.',
          'Click Export to push data.'
        ]
      },
      {
        id: 'api-webhooks',
        title: '7.3. API & Webhooks',
        steps: [
          'API docs live at portaprosoftware.com/api.',
          'Create webhooks for job updates, new invoices, or unit status changes under Settings → Webhooks.'
        ]
      }
    ]
  },
  {
    id: 'account-permissions',
    title: '8. Account & Permissions',
    subsections: [
      {
        id: 'user-roles',
        title: '8.1. User Roles Explained',
        steps: [
          'Admin: Full access, billing, user management.',
          'Dispatcher: Job and schedule management.',
          'Tech: Mobile access to assigned jobs only.'
        ]
      },
      {
        id: 'editing-permissions',
        title: '8.2. Editing User Permissions',
        steps: [
          'Go to Settings → Users.',
          'Click a user, then adjust their role or deactivate them as needed.'
        ]
      },
      {
        id: 'customer-portal',
        title: '8.3. Customer Portal Access',
        steps: [
          'Under Settings → Customer Portal, enable portal login.',
          'Customers can view invoices, pay online, and request new services.'
        ]
      }
    ]
  },
  {
    id: 'support-contact',
    title: '9. Support & Contact',
    subsections: [
      {
        id: 'search-help',
        title: '9.1. Search the Help Center',
        steps: [
          'Use the search bar at the top of this page to quickly find articles by keyword.'
        ]
      },
      {
        id: 'support-ticket',
        title: '9.2. Submit a Support Ticket',
        steps: [
          'Click Help → Contact Support in your dashboard.',
          'Fill in the form with issue details and attach screenshots.',
          'Our team responds within 24 hours.'
        ]
      },
      {
        id: 'feature-requests',
        title: '9.3. Feature Requests',
        steps: [
          'Have an idea? Visit Help → Feature Requests to submit and vote on your favorite suggestions.'
        ]
      },
      {
        id: 'community-beta',
        title: '9.4. Community & Beta Programs',
        steps: [
          'Join our Community Page for peer support and early access to new features.'
        ]
      }
    ]
  }
];

export const Help: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());
  const [showEmailSupport, setShowEmailSupport] = useState(false);
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    company: '',
    category: '',
    priority: 'medium',
    subject: '',
    description: '',
    currentPage: '',
    attachments: [] as File[]
  });

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleSubsection = (subsectionId: string) => {
    const newExpanded = new Set(expandedSubsections);
    if (newExpanded.has(subsectionId)) {
      newExpanded.delete(subsectionId);
    } else {
      newExpanded.add(subsectionId);
    }
    setExpandedSubsections(newExpanded);
  };

  const filteredSections = helpSections.filter(section => 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.subsections.some(subsection => 
      subsection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subsection.steps.some(step => step.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const handleSupportFormChange = (field: string, value: string | File[]) => {
    setSupportForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSupportForm(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
  };

  const removeAttachment = (index: number) => {
    setSupportForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitSupport = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your support system
    console.log('Support form submitted:', supportForm);
    alert('Support request submitted successfully! We\'ll get back to you within 24 hours.');
    setShowEmailSupport(false);
    setSupportForm({
      name: '', email: '', company: '', category: '', priority: 'medium',
      subject: '', description: '', currentPage: '', attachments: []
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <Logo />
          </div>
          <h1 className="text-xl font-bold">Help Center</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-6 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            PortaPro Help Center
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Your one-stop guide to setup, operation, and support for PortaPro Software
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white text-foreground"
            />
          </div>
        </div>
      </section>

      {/* Help Content */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-6">
            {filteredSections.map((section) => (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{section.title}</span>
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </CardTitle>
                </CardHeader>
                
                {expandedSections.has(section.id) && (
                  <CardContent className="space-y-4">
                    {section.subsections.map((subsection) => (
                      <div key={subsection.id} className="border rounded-lg">
                        <div 
                          className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => toggleSubsection(subsection.id)}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">{subsection.title}</h3>
                            {expandedSubsections.has(subsection.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                        
                        {expandedSubsections.has(subsection.id) && (
                          <div className="px-4 pb-4">
                            <ol className="space-y-2">
                              {subsection.steps.map((step, index) => (
                                <li key={index} className="flex items-start gap-3">
                                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                    {index + 1}
                                  </span>
                                  <span className="text-muted-foreground">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Contact Support Section */}
          <Card className="mt-12 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Still Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-blue-100 text-lg">
                Can't find what you're looking for? Our support team is here to help 24/7.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <Mail className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-semibold mb-2">Email Support</h3>
                  <p className="text-blue-100 text-sm mb-3">
                    Get detailed help via email with our support form
                  </p>
                  <Button 
                    className="bg-white text-blue-700 hover:bg-white/90"
                    onClick={() => setShowEmailSupport(true)}
                  >
                    Open Support Form
                  </Button>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <Phone className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="font-semibold mb-2">Phone Support</h3>
                  <p className="text-blue-100 text-sm mb-3">
                    Speak directly with our team
                  </p>
                  <Button 
                    className="bg-white text-blue-700 hover:bg-white/90"
                    onClick={() => window.location.href = 'tel:+12164123239'}
                  >
                    (216) 412-3239
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Email Support Modal */}
      {showEmailSupport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Email Support</h2>
                <p className="text-muted-foreground">Get detailed help from our support team</p>
              </div>
              <button 
                onClick={() => setShowEmailSupport(false)}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmitSupport} className="space-y-6">
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={supportForm.name}
                      onChange={(e) => handleSupportFormChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={supportForm.email}
                      onChange={(e) => handleSupportFormChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    value={supportForm.company}
                    onChange={(e) => handleSupportFormChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Your company name"
                  />
                </div>

                {/* Issue Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={supportForm.category}
                      onChange={(e) => handleSupportFormChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      <option value="getting-started">Getting Started</option>
                      <option value="jobs-dispatching">Jobs & Dispatching</option>
                      <option value="inventory">Inventory Management</option>
                      <option value="invoicing">Invoicing & Quotes</option>
                      <option value="ai-tools">AI Tools & OCR</option>
                      <option value="mobile-app">Mobile App</option>
                      <option value="integrations">Integrations</option>
                      <option value="account-billing">Account & Billing</option>
                      <option value="technical-issue">Technical Issue</option>
                      <option value="feature-request">Feature Request</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Priority
                    </label>
                    <select
                      value={supportForm.priority}
                      onChange={(e) => handleSupportFormChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="low">Low - General question</option>
                      <option value="medium">Medium - Standard support</option>
                      <option value="high">High - Affecting operations</option>
                      <option value="urgent">Urgent - System down</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={supportForm.subject}
                    onChange={(e) => handleSupportFormChange('subject', e.target.value)}
                    className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Brief description of your issue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    What page or feature were you using? (Optional)
                  </label>
                  <input
                    type="text"
                    value={supportForm.currentPage}
                    onChange={(e) => handleSupportFormChange('currentPage', e.target.value)}
                    className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Jobs Dashboard, Inventory page, Mobile app"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Detailed Description *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={supportForm.description}
                    onChange={(e) => handleSupportFormChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Please describe your issue in detail. Include:&#10;• What you were trying to do&#10;• What happened instead&#10;• Any error messages you saw&#10;• Steps to reproduce the issue"
                  ></textarea>
                </div>

                {/* File Attachments */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Attachments (Optional)
                  </label>
                  <div className="border-2 border-dashed border-muted rounded-lg p-4">
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <Paperclip className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground text-center">
                        Click to upload screenshots, documents, or other files
                        <br />
                        <span className="text-xs">Supports: JPG, PNG, PDF, DOC, TXT (Max 10MB each)</span>
                      </span>
                    </label>
                  </div>
                  
                  {supportForm.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {supportForm.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                          <span className="text-sm text-foreground truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Response Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">📧 What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• You'll receive a confirmation email immediately</li>
                    <li>• Our support team will respond within 24 hours</li>
                    <li>• For urgent issues, consider calling (216) 412-3239</li>
                    <li>• We'll keep you updated via email until resolved</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEmailSupport(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Support Request
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};