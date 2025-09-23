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
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Customer Portals</h2>
          <p className="text-lg text-muted-foreground font-medium text-center">
            From confusion to clarity — your customers get everything they need in one place.
          </p>
        </header>

        {/* Before & After Comparison */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Without Portal */}
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <Frown className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-red-800 mb-2">Without a Portal</h3>
              <p className="text-sm text-red-600">Chaos and frustration for your customers</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-red-200">
                <Phone className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700">Constant phone calls for updates</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-red-200">
                <FileText className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700">Paper invoices get lost</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700">No proof of service completion</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-red-200">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700">Billing disputes and confusion</span>
              </div>
            </div>
          </div>

          {/* With Portal */}
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Smile className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-2">With PortaPro Customer Portal</h3>
              <p className="text-sm text-green-600">Self-service clarity and confidence</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                <Monitor className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700">Real-time dashboard with all info</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700">Digital proof with photos & GPS</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                <CreditCard className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700">Instant online payments</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                <MessageSquare className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700">24/7 support ticket system</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid - 4 Themed Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Dashboard Card */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-3">Dashboard</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>• Units on site status</li>
              <li>• Upcoming services</li>
              <li>• Open requests & alerts</li>
              <li>• Balance due summary</li>
            </ul>
          </div>

          {/* Proof of Service Card */}
          <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-3">Proof of Service</h3>
            <ul className="space-y-2 text-sm text-green-100">
              <li>• Photos with GPS stamps</li>
              <li>• Time-stamped checklists</li>
              <li>• Dispute & re-clean options</li>
              <li>• PDF service reports</li>
            </ul>
          </div>

          {/* Requests & Units Card */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-3">Requests & Units</h3>
            <ul className="space-y-2 text-sm text-purple-100">
              <li>• Delivery/relocation requests</li>
              <li>• Extra service scheduling</li>
              <li>• Hazard notes & attachments</li>
              <li>• Quick action buttons</li>
            </ul>
          </div>

          {/* Billing & Support Card */}
          <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <FileSignature className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-3">Billing & Support</h3>
            <ul className="space-y-2 text-sm text-orange-100">
              <li>• Online invoice payments</li>
              <li>• Quote review & e-signing</li>
              <li>• Chat & ticketing system</li>
              <li>• Knowledge base access</li>
            </ul>
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
