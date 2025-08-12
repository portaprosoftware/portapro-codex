import React from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { StatCard } from '@/components/ui/StatCard';
import { Camera, Eye, Database, CheckCircle, AlertTriangle, Shield, Link, CalendarClock, Truck, FileText, Scan, Smartphone } from 'lucide-react';

export const AIPanelScanningShowcase: React.FC = () => {
  const kpis = [
    { title: 'Scans this month', value: 2341, icon: Camera },
    { title: 'Avg OCR confidence', value: '98.4%', icon: Eye },
    { title: 'Panels auto-detected', value: '92%', icon: Scan },
    { title: 'Exceptions resolved', value: 1218, icon: Shield },
    { title: 'False-positive rate', value: '0.7%', icon: AlertTriangle },
  ];

  const reads = [
    'Tool/Unit numbers',
    'Vendor IDs (e.g., Satellite)',
    'Plastic type codes (HDPE-3)',
    'Manufacture dates (YYYY-MM)',
    'Serial/Batch numbers',
    'Panel model names',
  ];

  const edgeCases = [
    'Low light + blur alert → Retake suggested',
    'Glare detection + auto-contrast pass',
    'Skew/angle correction',
    'Offline queue → auto-upload when online',
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-2">
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Smart AI Panel Scanning (Google Vision)</h2>
        <p className="text-muted-foreground text-lg">Snap a photo — we extract, normalize, and link to your fleet automatically.</p>
      </header>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k, i) => (
          <StatCard
            key={i}
            title={k.title}
            value={k.value as any}
            icon={k.icon}
            gradientFrom="hsl(var(--primary))"
            gradientTo="hsl(var(--primary) / 0.7)"
            iconBg="hsl(var(--primary))"
            animateValue={typeof k.value === 'number'}
          />
        ))}
      </div>

      {/* Main layout: content + screenshots */}
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1.6fr] items-start">
        {/* Left: What it reads + Edge cases + Connections */}
        <aside className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-xl font-semibold text-foreground">What it reads</h3>
            <ul className="space-y-2">
              {reads.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-semibold text-foreground">Edge cases handled</h3>
            <ul className="space-y-2">
              {edgeCases.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-muted text-foreground/80 flex items-center justify-center mt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-semibold text-foreground">How it connects</h3>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Link className="w-4 h-4 text-primary" />
                  Saved to unit <span className="font-medium text-foreground">PT-34219</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="w-4 h-4 text-primary" />
                  Linked to <span className="font-medium text-foreground">Job #11284</span> (multi-day)
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4 text-primary" />
                  Service report created <span className="text-xs">(photo-verified)</span>
                </li>
              </ul>
            </div>
          </section>
        </aside>

        {/* Right: Screenshot stack */}
        <main className="space-y-6">
          {/* Screenshot A: Mobile capture */}
          <AspectRatio ratio={9/16}>
            <div className="rounded-2xl border bg-card shadow-lg overflow-hidden relative isolate animate-enter">
              {/* Top bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
                <div className="text-xs font-medium text-muted-foreground">Capture: Panel Scan — Google Vision AI</div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-xs">Auto</span>
                </div>
              </div>

              {/* Mock photo area */}
              <div className="relative h-full bg-muted/30">
                <div className="absolute inset-0 rounded-xl m-4 bg-gradient-to-br from-primary/20 to-primary/5" aria-hidden />

                {/* Bounding boxes */}
                <div className="absolute left-8 top-8 w-40 h-8 border-2 border-primary/50 rounded-md"></div>
                <div className="absolute left-8 top-20 w-52 h-10 border-2 border-primary/50 rounded-md"></div>
                <div className="absolute left-8 top-36 w-32 h-8 border-2 border-primary/50 rounded-md"></div>

                {/* Scanning line */}
                <div className="absolute left-6 right-6 top-24 h-0.5 bg-primary/60 shadow-[0_0_12px_hsl(var(--primary)/0.5)] animate-[fade-in_1.2s_ease-in-out_infinite_alternate]" aria-hidden></div>

                {/* Guidance */}
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded-full border">Center molded text — avoid glare</span>
                </div>
              </div>

              {/* Shutter */}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-background border-2 border-foreground/20 shadow hover-scale" aria-hidden />
              </div>
            </div>
          </AspectRatio>

          {/* Screenshot B: OCR extraction + normalization */}
          <AspectRatio ratio={4/3}>
            <div className="rounded-2xl border bg-card shadow-md overflow-hidden animate-fade-in">
              <div className="grid grid-cols-2 divide-x">
                {/* Vision OCR */}
                <div className="p-4">
                  <div className="text-sm font-semibold text-foreground mb-2">Vision OCR</div>
                  <ul className="space-y-2 text-sm">
                    {[
                      { label: 'Unit ID', value: 'PT 34219', conf: 0.99 },
                      { label: 'Vendor', value: 'SATELLITE IND', conf: 0.98 },
                      { label: 'Mold', value: 'HDPE-3', conf: 0.96 },
                      { label: 'Manufacture', value: '2021-04', conf: 0.97 },
                      { label: 'Serial', value: '0012457', conf: 0.95 },
                    ].map((row) => (
                      <li key={row.label} className="flex items-center justify-between">
                        <div className="text-muted-foreground">{row.label}</div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-foreground">{row.value}</span>
                          <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${Math.round(row.conf * 100)}%` }} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Normalized */}
                <div className="p-4 bg-muted/30">
                  <div className="text-sm font-semibold text-foreground mb-2">Normalized to fleet schema</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {['Asset #PT-34219', 'Vendor: Satellite', 'HDPE-3', '2021-04', 'Serial 0012457'].map((pill) => (
                      <span key={pill} className="px-2 py-1 rounded-full bg-primary text-primary-foreground">{pill}</span>
                    ))}
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>Auto-link to unit record: PT-34219 • Duplicate check passed • 3s</span>
                  </div>
                </div>
              </div>
            </div>
          </AspectRatio>

          {/* Screenshot C: Quality dashboard mini-view */}
          <AspectRatio ratio={4/3}>
            <div className="rounded-2xl border bg-card shadow-md overflow-hidden animate-fade-in">
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border bg-background">
                    <div className="text-[11px] text-muted-foreground">Scans today</div>
                    <div className="text-lg font-semibold text-foreground">128</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-background">
                    <div className="text-[11px] text-muted-foreground">Avg confidence</div>
                    <div className="text-lg font-semibold text-foreground">98.8%</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-background">
                    <div className="text-[11px] text-muted-foreground">Exceptions</div>
                    <div className="text-lg font-semibold text-foreground">14</div>
                  </div>
                </div>

                {/* Tiny bar chart (static) */}
                <div className="mt-2">
                  <div className="h-16 grid grid-cols-5 gap-1 items-end">
                    {[80, 40, 60, 90, 100].map((h, i) => (
                      <div key={i} className="bg-primary/60 rounded-sm" style={{ height: `${h}%` }} aria-hidden />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    {['90–92', '92–94', '94–96', '96–98', '98–100'].map((b) => (
                      <span key={b}>{b}</span>
                    ))}
                  </div>
                </div>

                {/* Top exceptions */}
                <div className="mt-2">
                  <div className="text-xs font-semibold text-foreground mb-1">Top exceptions</div>
                  <ul className="space-y-1 text-xs">
                    {[
                      { label: 'Glare on panel', count: 6 },
                      { label: 'Partial frame', count: 4 },
                      { label: 'Low light', count: 3 },
                    ].map((e) => (
                      <li key={e.label} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{e.label}</span>
                        <span className="px-2 py-0.5 rounded-full bg-muted text-foreground/80">{e.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </AspectRatio>
        </main>
      </div>
    </div>
  );
};
