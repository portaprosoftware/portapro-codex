import React from "react";
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
} from "lucide-react";

export const CustomerDashboardPortalShowcase: React.FC = () => {
  return (
    <section id="customer-portal" className="py-8 bg-white">
      <div className="container mx-auto max-w-6xl px-6">
        <header className="mb-8 space-y-2">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Customer Accounts & Portals
          </h2>
          <p className="text-muted-foreground">
            Comprehensive internal account management and customer-facing portals for complete relationship oversight and self-service capabilities.
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

            {/* Account Overview Dashboard */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-foreground">Account Overview Dashboard</h4>
                <Home className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Card className="border bg-background">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Units on site</div>
                    <div className="text-xl font-semibold text-foreground">38</div>
                    <div className="text-xs text-muted-foreground">Next service: Thu</div>
                  </CardContent>
                </Card>
                <Card className="border bg-background">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Open requests</div>
                    <div className="text-xl font-semibold text-foreground">7</div>
                    <div className="text-xs text-muted-foreground">2 urgent</div>
                  </CardContent>
                </Card>
                <Card className="border bg-background">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Balance due</div>
                    <div className="text-xl font-semibold text-foreground">$2,184.00</div>
                    <div className="text-xs text-muted-foreground">3 invoices</div>
                  </CardContent>
                </Card>
                <Card className="border bg-background">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Account health</div>
                    <div className="text-xl font-semibold text-green-600">Good</div>
                    <div className="text-xs text-muted-foreground">Payment history</div>
                  </CardContent>
                </Card>
              </div>
            </article>

            {/* Account Management Tools */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-foreground">Account Management</h4>
                <Settings className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 text-foreground"><UserPlus className="w-4 h-4" /> Customer Onboarding</div>
                  <div className="text-xs text-muted-foreground">Setup wizard • Contract templates</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 text-foreground"><Users className="w-4 h-4" /> Contact Management</div>
                  <div className="text-xs text-muted-foreground">Billing • On-site • AP contacts</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 text-foreground"><Bell className="w-4 h-4" /> Account Alerts</div>
                  <div className="text-xs text-muted-foreground">Payment • Service • Compliance</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 text-foreground"><History className="w-4 h-4" /> Account Timeline</div>
                  <div className="text-xs text-muted-foreground">Jobs • Calls • Notes • Changes</div>
                </div>
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

            {/* Portal Customization */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-foreground">Portal Customization</h4>
                <Palette className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 text-foreground"><Palette className="w-4 h-4" /> White Label Branding</div>
                  <div className="text-xs text-muted-foreground">Logo • Colors • Domain</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 text-foreground"><Settings className="w-4 h-4" /> Custom Features</div>
                  <div className="text-xs text-muted-foreground">Toggle modules • Permissions</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 text-foreground"><Smartphone className="w-4 h-4" /> Mobile App</div>
                  <div className="text-xs text-muted-foreground">iOS • Android • PWA</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 text-foreground"><BarChart3 className="w-4 h-4" /> Portal Analytics</div>
                  <div className="text-xs text-muted-foreground">Usage • Engagement • Support</div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerDashboardPortalShowcase;
