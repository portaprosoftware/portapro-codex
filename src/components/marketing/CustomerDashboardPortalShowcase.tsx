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
} from "lucide-react";

export const CustomerDashboardPortalShowcase: React.FC = () => {
  return (
    <section id="customer-portal" className="py-8 bg-white">
      <div className="container mx-auto max-w-6xl px-6">
        <header className="mb-8 space-y-2">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Customer Dashboard & Portal
          </h2>
          <p className="text-muted-foreground">
            A functioning home base for customer data storage, historical view, unique contacts (billing, on-site, AP), and everything your customers' navigation offers.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: Internal Customer Dashboard (Home base) */}
          <div className="space-y-6">
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Internal Customer Dashboard</h3>
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
                    <div className="text-xs text-muted-foreground">Alerts</div>
                    <div className="text-xl font-semibold text-foreground">4</div>
                    <div className="text-xs text-muted-foreground">Missed/overdue, weather, events</div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4 grid sm:grid-cols-3 gap-3">
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-xs text-muted-foreground">Primary Contacts</div>
                  <div className="text-sm text-foreground">Billing • On‑site • AP</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-xs text-muted-foreground">History</div>
                  <div className="text-sm text-foreground">Jobs • Services • Invoices</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-xs text-muted-foreground">Shortcuts</div>
                  <div className="text-sm text-foreground">New request • Pay invoice</div>
                </div>
              </div>
            </article>

            {/* Evidence & Compliance snapshots */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Service history (proof)</h3>
                <History className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 text-foreground"><Image className="w-4 h-4" /> Photo / GPS / Time‑stamped</div>
                  <div className="text-xs text-muted-foreground">Tech name • Checklist</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 text-foreground"><CalendarClock className="w-4 h-4" /> Filter by date, site, unit</div>
                  <div className="text-xs text-muted-foreground">Download PDF</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 text-foreground"><ClipboardList className="w-4 h-4" /> Request re‑clean / Dispute</div>
                  <div className="text-xs text-muted-foreground">One‑click actions</div>
                </div>
              </div>
            </article>
          </div>

          {/* Right: Customer Portal (what your customer sees) */}
          <aside className="space-y-6">
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Customer Portal — your customer's view</h3>
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

            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="text-base font-semibold mb-2 text-foreground">Nice touches</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Helpful empty states with CTAs (e.g., “No service yet — schedule a delivery”)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Site-level gate/lock codes & special instructions</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> “Next due” badges (green/amber/red) on unit cards</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Mobile‑first design</li>
              </ul>

              <div className="mt-4 text-sm text-muted-foreground">
                Nav: Dashboard • Services • Units/Map • Requests • Billing • Quotes & Docs • Compliance • Users
              </div>

              <div className="pt-3 flex flex-wrap gap-2">
                <Button size="sm" className="bg-gradient-blue text-white inline-flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Explore Customer Portal
                </Button>
                <Button size="sm" variant="outline" className="inline-flex items-center gap-2">
                  <Users className="w-4 h-4" /> Manage Contacts
                </Button>
                <Button size="sm" variant="outline" className="inline-flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Billing Center
                </Button>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default CustomerDashboardPortalShowcase;
