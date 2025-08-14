import React from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { StatCard } from '@/components/ui/StatCard';
import { 
  CheckCircle, 
  MapPin, 
  Route, 
  Navigation, 
  WifiOff, 
  ClipboardCheck, 
  Camera, 
  Clock,
  Phone
} from 'lucide-react';

export const DriverAppShowcase: React.FC = () => {
  const kpis = [
    { title: 'Avg. route time saved', value: '18%', icon: Route },
    { title: 'Offline sync success', value: '100%', icon: WifiOff },
  ];

  return (
    <section aria-label="Driver Mobile App" className="space-y-4 overflow-hidden">
      <header className="space-y-2 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Driver Mobile App — built for the field</h2>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Mobile-first routing, one-tap GPS navigation, satellite map pins for precise drop-offs, and full offline mode with service reports.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.2fr_1fr] lg:items-start">
        {/* Left: Mobile app image only */}
        <main className="order-2 lg:order-1">
          <div className="rounded-[2rem] overflow-hidden relative max-w-[75%] mx-auto">
            <img 
              src="/lovable-uploads/8e39f5c9-93de-444f-8e28-7d03da91b791.png" 
              alt="Mobile driver app interface showing optimized route, one-tap navigation, precise drop-off pin, and offline mode features"
              className="w-full h-auto object-cover"
            />
          </div>
        </main>

        {/* Right: Benefits & KPIs */}
        <aside className="space-y-6 order-1 lg:order-2">
          <div className="grid grid-cols-2 gap-3">
            {kpis.map((k, i) => (
              <StatCard
                key={i}
                title={k.title}
                value={k.value as any}
                icon={k.icon}
                gradientFrom="hsl(var(--primary))"
                gradientTo="hsl(var(--primary) / 0.7)"
                iconBg="hsl(var(--primary))"
                animateValue
              />
            ))}
          </div>

          <ul className="space-y-3" aria-label="Driver app highlights">
            {[
              'Turn-by-turn optimized routes with stop reordering',
              'Open Apple Maps, Google Maps, or Waze with one tap',
              'Job-specific satellite pins for exact drop-off and pickup',
              'Full offline mode: queue updates, photos, signatures',
              'Automatic sync and conflict-safe retries when online',
              'Service reports linked to jobs with photos and signatures',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
            <div className="text-sm font-semibold text-foreground">What drivers love</div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> In‑app tap‑to‑call customer contacts</li>
              <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Saved pins for repeat sites</li>
              <li className="flex items-center gap-2"><ClipboardCheck className="w-3.5 h-3.5" /> Clear checklists that prevent missed steps</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default DriverAppShowcase;
