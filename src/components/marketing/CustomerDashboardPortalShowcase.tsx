import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home,
  History,
  Image,
  MapPin,
  CalendarClock,
  FileText,
  CreditCard,
  Users,
  ShieldCheck,
  MessageSquare,
  HelpCircle,
  ClipboardList,
  CheckCircle,
  UserPlus,
  Settings,
  Bell,
  Phone,
  Mail,
  Eye,
  Edit,
  BarChart3,
  Palette,
  Monitor,
  Smartphone,
  Calendar,
  DollarSign,
  Truck,
  Clock,
  Briefcase,
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
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Accounts & Portals
          </h2>
          <p className="text-muted-foreground">
            <strong>Accounts:</strong> Internal customer account management for your team. <strong>Portals:</strong> Self-service portals for your customers.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Customer Accounts (Internal) */}
          <div className="space-y-6">
            <div className="space-y-2 mb-4">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Customer Accounts
              </h3>
              <p className="text-sm text-muted-foreground">Internal account management for your rental company</p>
            </div>

            {/* Interactive Customer Account Management */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-foreground">{mockCustomerData.name}</h4>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* Customer Stats Cards - Matching uploaded image style */}
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

          {/* Right Column: Customer Portals (Customer-Facing) */}
          <div className="space-y-6">
            <div className="space-y-2 mb-4">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Monitor className="w-5 h-5 text-green-600" />
                Customer Portals
              </h3>
              <p className="text-sm text-muted-foreground">Self-service portals for your customers</p>
            </div>

            {/* Customer Portal Features - Keep as requested */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-foreground">Customer Portal — your customer's view</h4>
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2"><Home className="w-4 h-4 text-primary mt-0.5" /> Home dashboard: Units on site • Next service • Open requests • Balance due • Alerts</li>
                <li className="flex items-start gap-2"><History className="w-4 h-4 text-primary mt-0.5" /> Service history (proof): photo/GPS/time‑stamp, tech, checklist, PDF; filters + re‑clean/dispute</li>
                <li className="flex items-start gap-2"><ClipboardList className="w-4 h-4 text-primary mt-0.5" /> Requests: delivery/pickup/relocation/extra service; dates, contacts, gate/lock, attachments</li>
                <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-primary mt-0.5" /> Units (grid + map): last cleaned, next due, location, frequency, notes/hazards; quick actions</li>
                <li className="flex items-start gap-2"><CreditCard className="w-4 h-4 text-primary mt-0.5" /> Billing & payments: invoices, card/ACH, partial/over‑pay, save methods, Autopay; CSV/PDF</li>
                <li className="flex items-start gap-2"><FileText className="w-4 h-4 text-primary mt-0.5" /> Quotes & agreements: review/accept, e‑sign, convert to order</li>
                <li className="flex items-start gap-2"><Users className="w-4 h-4 text-primary mt-0.5" /> Users & roles: Admin • Requester • Site Contact • AP; per‑user email/SMS preferences</li>
                <li className="flex items-start gap-2"><HelpCircle className="w-4 h-4 text-primary mt-0.5" /> Support: open ticket/chat, view status, knowledge base</li>
              </ul>
            </article>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerDashboardPortalShowcase;
