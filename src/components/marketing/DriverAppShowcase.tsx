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
    <section aria-label="Driver Mobile App" className="space-y-10">
      <header className="space-y-2 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Driver Mobile App — built for the field</h2>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Mobile-first routing, one-tap GPS navigation, satellite map pins for precise drop-offs, and full offline mode with service reports.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] items-start">
        {/* Left: Phone mock with stack of feature screens */}
        <main className="space-y-3">
          <AspectRatio ratio={9/16}>
            <div className="rounded-[2rem] border bg-card shadow-lg overflow-hidden relative animate-enter">
              {/* Phone top bar */}
              <div className="h-6 bg-muted/50" />

              {/* Screen content */}
              <div className="p-4 space-y-4">
                {/* Route optimization */}
                <div className="rounded-xl border bg-background p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                        <Route className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">Optimized Route</div>
                        <div className="text-xs text-muted-foreground">Stops reordered to cut drive time</div>
                      </div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-muted/60 text-foreground">+18% faster</div>
                  </div>

                  <ol className="space-y-2 text-sm">
                    {[ 
                      'ACME Construction — 1250 Market St',
                      'City Park North — 4400 E 23rd Ave',
                      'Riverside Site — 9800 S Platte Canyon Rd'
                    ].map((stop, i) => (
                      <li key={stop} className="flex items-center gap-2">
                        <div className="w-6 h-6 shrink-0 rounded-full bg-primary/10 text-foreground flex items-center justify-center text-[11px] font-semibold">
                          {i + 1}
                        </div>
                        <span className="text-foreground/90">{stop}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* One-tap navigation chooser */}
                <div className="rounded-xl border bg-background p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">One‑tap Navigation</div>
                      <div className="text-xs text-muted-foreground">Choose your preferred maps app</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {['Apple Maps', 'Google Maps', 'Waze'].map((app) => (
                      <div key={app} className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
                        {app}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Job-specific satellite pin */}
                <div className="rounded-xl border bg-background p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">Precise Drop‑off Pin</div>
                      <div className="text-xs text-muted-foreground">Satellite pin set by dispatcher</div>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 h-28 flex items-center justify-center text-xs text-muted-foreground">
                    Satellite preview placeholder
                  </div>
                </div>

                {/* Offline banner */}
                <div className="rounded-xl border bg-muted/40 p-3 flex items-center gap-3">
                  <WifiOff className="w-4 h-4 text-foreground" />
                  <div className="text-xs text-foreground">
                    Offline mode active — actions queued. Auto-syncs when back online.
                  </div>
                </div>
              </div>
            </div>
          </AspectRatio>

          {/* Service report preview */}
          <AspectRatio ratio={16/10}>
            <div className="rounded-2xl border bg-card shadow-md overflow-hidden animate-fade-in">
              <div className="border-b px-4 py-2 bg-muted/40 flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" /> Service Report — Job JB‑2984
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3">
                  <Camera className="w-3.5 h-3.5" /> Photos • <Clock className="w-3.5 h-3.5" /> 3 min
                </div>
              </div>
              <div className="p-4 grid sm:grid-cols-2 gap-3 text-sm">
                {[ 
                  ['Unit condition', 'Cleaned & stocked'],
                  ['Deodorizer added', '2 oz — Blue Ocean'],
                  ['Toilet paper', '2 rolls'],
                  ['Handwash', 'Filled'],
                  ['Signature', 'Captured on device'],
                  ['Notes', 'Gate code 4217']
                ].map(([k,v]) => (
                  <div key={k} className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center justify-between">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </AspectRatio>
        </main>

        {/* Right: Benefits & KPIs */}
        <aside className="space-y-6">
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
