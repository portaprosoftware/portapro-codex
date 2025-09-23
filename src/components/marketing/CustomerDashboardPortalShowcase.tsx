import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home,
  History,
  MapPin,
  FileText,
  CreditCard,
  Users,
  ShieldCheck,
  MessageSquare,
  HelpCircle,
  ClipboardList,
  CheckCircle,
  Monitor,
  Smartphone,
  Calendar,
  DollarSign,
  Truck,
  Clock,
  Briefcase,
  Phone,
  AlertTriangle,
  Smile,
  BarChart3,
  Camera,
  Lightbulb,
  Zap,
  FileSignature,
  AlertOctagon,
  Frown,
  ExternalLink,
} from "lucide-react";

// Mock customer data
const mockCustomerData = {
  name: "ABC Construction Co.",
  stats: {
    totalJobs: 18,
    outstandingBalance: 0,
    outstandingInvoices: 0,
    nextDelivery: "8/22/2025",
  },
  contacts: [
    { name: "John Smith", role: "Project Manager", phone: "(555) 123-4567", email: "john@abcconstruction.com" },
    { name: "Sarah Johnson", role: "Site Supervisor", phone: "(555) 987-6543", email: "sarah@abcconstruction.com" },
  ],
  jobs: [
    { id: "JOB-001", site: "Downtown Office Build", status: "Active", units: 8, startDate: "2024-01-15", nextService: "Tomorrow" },
    { id: "JOB-002", site: "Residential Complex", status: "Completed", units: 12, startDate: "2023-11-20", completedDate: "2024-01-10" },
    { id: "JOB-003", site: "Shopping Center Renovation", status: "Scheduled", units: 6, startDate: "2024-02-01", nextService: "Next Week" },
  ],
  locations: [
    { name: "Main Office", address: "123 Business Ave, City, ST 12345", type: "Corporate HQ" },
    { name: "Construction Site A", address: "456 Build St, City, ST 12345", type: "Active Job Site" },
    { name: "Warehouse", address: "789 Storage Rd, City, ST 12345", type: "Storage Facility" },
  ]
};

export const CustomerDashboardPortalShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  return (
    <section id="customer-portal" className="py-8 bg-white">
      <div className="container mx-auto max-w-6xl px-6">
        <header className="mb-8 space-y-2">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Accounts & Portal</h2>
          <p className="text-muted-foreground">
            <strong>Accounts:</strong> Internal customer account management for your team. <strong>Portal:</strong> Self-service portals for your customers.
          </p>
        </header>

        {/* Customer Portal Section */}
        <div className="space-y-2 mb-8">
          <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Monitor className="w-6 h-6 text-green-600" />
            Customer Portal
          </h3>
          <p className="text-muted-foreground">Self-service portals for your customers</p>
        </div>

        {/* Before & After Comparison Table */}
        <div className="mb-12">
          <Card className="rounded-2xl border border-border shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2">
                {/* Without Portal Column */}
                <div className="p-8 border-r border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Without a Portal</h3>
                      <p className="text-sm text-red-600">Frustration, wasted time, lost trust</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                        <span className="text-red-600 text-sm font-bold">❌</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-foreground">Endless update calls</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                        <span className="text-red-600 text-sm font-bold">❌</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-foreground">Lost paperwork</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                        <span className="text-red-600 text-sm font-bold">❌</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-foreground">No verification</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                        <span className="text-red-600 text-sm font-bold">❌</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-foreground">Confusion</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* With Portal Column */}
                <div className="p-8 bg-white">
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="text-xl font-bold text-foreground">With PortaPro</h3>
                      <p className="text-sm text-green-700">Clarity, confidence, and self-service access</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                        <span className="text-green-600 text-sm font-bold">✅</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-foreground font-medium">Instant visibility</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                        <span className="text-green-600 text-sm font-bold">✅</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-foreground font-medium">Online payments & autopay</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                        <span className="text-green-600 text-sm font-bold">✅</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-foreground font-medium">GPS + photos</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                        <span className="text-green-600 text-sm font-bold">✅</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-foreground font-medium">24/7 ticketing</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Portal Hero Section */}
        <div className="mb-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Portal Screenshot */}
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-border bg-white">
                <img 
                  src="/src/assets/customer-portal-dashboard.png" 
                  alt="PortaPro Customer Portal Dashboard"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="order-1 lg:order-2 space-y-6">
              <div>
                <h3 className="text-3xl font-bold text-foreground mb-3">PortaPro Customer Portal</h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Everything your customers need, in one place:
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-lg font-medium text-foreground">Real-time visibility</span>
                    <p className="text-sm text-muted-foreground">Services, requests, and balances</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <span className="text-lg font-medium text-foreground">Digital proof & history</span>
                    <p className="text-sm text-muted-foreground">Photos, GPS, and reports</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <span className="text-lg font-medium text-foreground">Self-service tools</span>
                    <p className="text-sm text-muted-foreground">Billing, payments, quotes, and support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Callout Bar */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-6">
          <div className="flex items-center justify-center gap-3 text-center">
            <Lightbulb className="w-6 h-6 text-blue-600" />
            <p className="text-lg font-medium text-blue-800">
              Customers stay informed, confident, and connected — without calling your office.
            </p>
          </div>
        </div>

        {/* Internal Accounts Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="space-y-2 mb-6">
            <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Internal Customer Accounts
            </h3>
            <p className="text-muted-foreground">Comprehensive account management for your team</p>
          </div>

          {/* Interactive Customer Account Management */}
          <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
            {/* Interactive Demo Info */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground">
                Interactive: Click the tabs below to explore different customer profile segments
              </p>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-semibold text-foreground">{mockCustomerData.name}</h4>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Customer Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card className="border-l-4 border-l-blue-600 bg-background shadow-sm">
                <CardContent className="p-4 relative">
                  <Calendar className="w-4 h-4 text-blue-600 absolute top-3 right-3" />
                  <div className="text-2xl font-bold text-foreground mb-1">{mockCustomerData.stats.totalJobs}</div>
                  <div className="text-sm text-muted-foreground">Total Job History</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-600 bg-background shadow-sm">
                <CardContent className="p-4 relative">
                  <DollarSign className="w-4 h-4 text-green-600 absolute top-3 right-3" />
                  <div className="text-2xl font-bold text-foreground mb-1">${mockCustomerData.stats.outstandingBalance}</div>
                  <div className="text-sm text-muted-foreground">Outstanding Balance</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-orange-600 bg-background shadow-sm">
                <CardContent className="p-4 relative">
                  <FileText className="w-4 h-4 text-orange-600 absolute top-3 right-3" />
                  <div className="text-2xl font-bold text-foreground mb-1">{mockCustomerData.stats.outstandingInvoices}</div>
                  <div className="text-sm text-muted-foreground">Outstanding Invoices</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-600 bg-background shadow-sm">
                <CardContent className="p-4 relative">
                  <Truck className="w-4 h-4 text-purple-600 absolute top-3 right-3" />
                  <div className="text-2xl font-bold text-foreground mb-1">{mockCustomerData.stats.nextDelivery}</div>
                  <div className="text-sm text-muted-foreground">Next Delivery</div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-2">
              <p className="text-xs text-muted-foreground mb-3">Click the buttons below to navigate between different sections</p>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'overview', label: 'Overview', icon: Home },
                  { id: 'contacts', label: 'Contacts', icon: Users },
                  { id: 'locations', label: 'Service Locations', icon: MapPin },
                  { id: 'jobs', label: 'Jobs', icon: Briefcase },
                  { id: 'reports', label: 'Service Reports', icon: BarChart3 },
                  { id: 'financial', label: 'Financial', icon: DollarSign },
                  { id: 'communication', label: 'Communication', icon: MessageSquare },
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="w-3 h-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className={`${activeTab === 'reports' ? 'min-h-[100px]' : 'min-h-[200px]'}`}>
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  <h5 className="font-medium text-foreground">Account Summary</h5>
                  <p className="text-sm text-muted-foreground">
                    Active customer since 2023. Current service level: Premium. 
                    Last payment: On time. Account status: Good standing.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Active Jobs: 2</div>
                    <div>Total Units: 26</div>
                    <div>Service Frequency: Weekly</div>
                    <div>Payment Terms: Net 30</div>
                  </div>
                </div>
              )}

              {activeTab === 'contacts' && (
                <div className="space-y-3">
                  <h5 className="font-medium text-foreground">Contact Information</h5>
                  {mockCustomerData.contacts.map((contact, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-background">
                      <div className="font-medium text-sm">{contact.name}</div>
                      <div className="text-xs text-muted-foreground">{contact.role}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {contact.phone} • {contact.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'locations' && (
                <div className="space-y-3">
                  <h5 className="font-medium text-foreground">Service Locations</h5>
                  {mockCustomerData.locations.map((location, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-background">
                      <div className="font-medium text-sm">{location.name}</div>
                      <div className="text-xs text-muted-foreground">{location.type}</div>
                      <div className="text-xs text-muted-foreground mt-1">{location.address}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'jobs' && (
                <div className="space-y-3">
                  <h5 className="font-medium text-foreground">Job Management</h5>
                  {mockCustomerData.jobs.map((job, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-background">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">{job.id}</div>
                          <div className="text-xs text-muted-foreground">{job.site}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {job.units} units • Started: {job.startDate}
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm ${
                          job.status === 'Active' ? 'bg-gradient-to-r from-green-600 to-green-700' :
                          job.status === 'Completed' ? 'bg-gradient-to-r from-gray-600 to-gray-700' :
                          'bg-gradient-to-r from-blue-600 to-blue-700'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-3">
                  <h5 className="font-medium text-foreground">Service Reports</h5>
                  <p className="text-sm text-muted-foreground">
                    View and manage service reports, compliance documentation, and maintenance records.
                  </p>
                </div>
              )}

              {activeTab === 'financial' && (
                <div className="space-y-3">
                  <h5 className="font-medium text-foreground">Financial Overview</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3 bg-background">
                      <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                      <div className="text-lg font-semibold">$3,240</div>
                    </div>
                    <div className="border rounded-lg p-3 bg-background">
                      <div className="text-xs text-muted-foreground">YTD Revenue</div>
                      <div className="text-lg font-semibold">$28,650</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Payment method: ACH • Autopay enabled</p>
                </div>
              )}

              {activeTab === 'communication' && (
                <div className="space-y-3">
                  <h5 className="font-medium text-foreground">Communication Log</h5>
                  <div className="space-y-2">
                    <div className="border rounded-lg p-3 bg-background">
                      <div className="text-xs text-muted-foreground">Yesterday 2:30 PM</div>
                      <div className="text-sm">Service confirmation call - spoke with John Smith</div>
                    </div>
                    <div className="border rounded-lg p-3 bg-background">
                      <div className="text-xs text-muted-foreground">3 days ago</div>
                      <div className="text-sm">Email: Invoice #INV-2024-0156 sent</div>
                    </div>
                    <div className="border rounded-lg p-3 bg-background">
                      <div className="text-xs text-muted-foreground">1 week ago</div>
                      <div className="text-sm">SMS: Service reminder sent to site contact</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

export default CustomerDashboardPortalShowcase;
