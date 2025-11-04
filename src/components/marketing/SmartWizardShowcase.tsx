import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { CalendarClock, CheckCircle, ClipboardList, Truck, Zap } from 'lucide-react';
import wizardUnitsStep from '@/assets/wizard-units-step.png';
import wizardScheduleAssign from '@/assets/wizard-schedule-assign.png';
import wizardReviewInvoice from '@/assets/wizard-review-invoice.png';

export const SmartWizardShowcase: React.FC = () => {
  // Static, believable KPIs for a thriving operation
  const kpis = [
    { title: 'Jobs booked this month', value: 148, icon: ClipboardList },
    { title: 'On-time delivery rate', value: '99%', icon: Truck },
  ];

  const steps = ['Customer', 'Dates', 'Units', 'Assign', 'Review'];

  return (
    <div className="space-y-6 sm:space-y-10">
      <header className="space-y-2 text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Smart Job Wizard</h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-3xl text-left">
          AI capacity planning, real-time availability, crew & vehicle assignment, and instant invoice — all in one flow.
        </p>
      </header>

      <div className="grid gap-6 sm:gap-8 lg:gap-10 lg:grid-cols-[1fr_1.4fr] items-start">
        {/* Left: Static KPIs, video, and highlights */}
        <aside className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-3">
            {kpis.map((k, i) => (
              <StatCard
                key={i}
                title={k.title}
                value={k.value as number}
                icon={k.icon}
                gradientFrom="hsl(var(--primary))"
                gradientTo="hsl(var(--primary) / 0.7)"
                iconBg="hsl(var(--primary))"
                animateValue
              />
            ))}
          </div>

          <div className="aspect-video rounded-xl overflow-hidden">
            <img 
              src="/jobs-wizard-interface.png" 
              alt="Smart Job Wizard interface showing job management with priority controls, schedule details, and action buttons"
              className="w-full h-full object-cover"
            />
          </div>

          <ul className="space-y-3" aria-label="Wizard highlights">
            {[
              'Date-range availability with conflict detection',
              'Auto-assign best-fit crew and vehicle',
              'One-click review and invoice generation',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Right: Software interface screenshots */}
        <main className="space-y-4 sm:space-y-6">
          {/* Main wizard interface */}
          <AspectRatio ratio={16/10}>
            <div className="rounded-2xl overflow-hidden shadow-lg animate-fade-in">
              <img 
                src={wizardUnitsStep} 
                alt="Job creation wizard showing Units & Services step with product selection and pricing"
                className="w-full h-full object-cover"
              />
            </div>
          </AspectRatio>

          {/* Supporting interface screenshots */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Schedule & Assign */}
            <AspectRatio ratio={4/3}>
              <div className="rounded-2xl overflow-hidden shadow-md animate-enter">
                <img 
                  src={wizardScheduleAssign} 
                  alt="Schedule and assign interface showing driver, vehicle, route selection and calendar"
                  className="w-full h-full object-cover"
                />
              </div>
            </AspectRatio>

            {/* Review & Invoice */}
            <AspectRatio ratio={4/3}>
              <div className="rounded-2xl overflow-hidden shadow-md animate-enter">
                <img 
                  src={wizardReviewInvoice} 
                  alt="Review and invoice interface showing line items, totals, and create job button"
                  className="w-full h-full object-cover"
                />
              </div>
            </AspectRatio>
          </div>
        </main>
      </div>
    </div>
  );
};
