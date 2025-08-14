import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Camera, Eye, CheckCircle } from 'lucide-react';

export const AIPanelScanningShowcase: React.FC = () => {
  const kpis = [
    { title: 'Scans this month', value: 2341, icon: Camera },
    { title: 'Success rate', value: '98%', icon: Eye },
    { title: 'Time saved/scan', value: '45 sec', icon: CheckCircle },
  ];

  const reads = [
    { title: 'Tool Numbers', subtitle: '(T-20788-1A)' },
    { title: 'Vendor IDs', subtitle: '(ABC Manufacturing)' },
    { title: 'Serial numbers', subtitle: null },
    { title: 'Manufacture dates', subtitle: null },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="text-center space-y-3">
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Smart Panel Scanning</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Point, shoot, done. AI reads embossed plastic automatically.</p>
      </header>

      {/* KPIs */}
      <div className="grid sm:grid-cols-3 gap-6">
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

      {/* Before/After Visual */}
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        {/* Before - Photo of embossed plastic */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground text-center">1. Snap a photo</h3>
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/cc599aec-84ca-4b67-9575-06eb9d854204.png" 
              alt="Mobile phone camera view of ABC Manufacturing embossed plastic panel showing Tool # T-20788-1A, Vendor ID # 32123"
              className="w-3/4 h-auto rounded-lg"
            />
          </div>
        </div>

        {/* After - Clean extracted data */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground text-center">2. Get clean data</h3>
          <div className="aspect-square rounded-2xl border bg-card p-6 shadow-lg">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Manufacturer</span>
                  <span className="font-medium text-foreground">ABC Manufacturing Inc.</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Tool Number</span>
                  <span className="font-medium text-foreground">T-20788-1A</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Vendor ID</span>
                  <span className="font-medium text-foreground">32123</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Manufacture Date</span>
                  <span className="font-medium text-foreground">Jan 16, 2016</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Plastic Type</span>
                  <span className="font-medium text-foreground">HDPE</span>
                </div>
              </div>

              <div className="text-center pt-2">
                <span className="inline-flex items-center gap-2 text-xs text-primary">
                  <CheckCircle className="w-4 h-4" />
                  Linked to fleet automatically
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What it reads */}
      <div className="text-center space-y-6">
        <h3 className="text-xl font-semibold text-foreground">What it reads</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reads.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 rounded-xl border bg-card hover-scale">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="text-sm font-medium text-foreground">
                <div>{item.title}</div>
                {item.subtitle && <div className="text-xs text-muted-foreground">{item.subtitle}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
