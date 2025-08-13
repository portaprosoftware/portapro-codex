import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Truck, FileText, Download, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkline } from '@/components/ui/Sparkline';

export function CompanyAnalyticsShowcase() {
  // Mock data for visualizations
  const jobsSparklineData = [45, 52, 49, 61, 58, 67, 72];
  const revenueSparklineData = [28000, 31000, 29500, 35000, 33000, 38000, 42000];

  return (
    <section id="company-analytics" className="py-16 bg-white">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Company Analytics — Complete insights across your entire operation
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Six comprehensive tabs with persistent date controls, 24+ KPIs and one-click reports.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 items-start">
          {/* Left Column - Interactive Demonstrations */}
          <div className="space-y-8">
            {/* Navigation & Controls Demo */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Navigation & Controls
                </CardTitle>
                <CardDescription className="text-muted-foreground">Persistent date range and filtering across all tabs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mock Tab Navigation */}
                <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded-lg">
                  <Badge variant="outline" className="px-3 py-1">Overview</Badge>
                  <Badge variant="outline" className="px-3 py-1">Revenue</Badge>
                  <Badge variant="outline" className="px-3 py-1">Operations</Badge>
                  <Badge variant="outline" className="px-3 py-1">Customers</Badge>
                  <Badge variant="outline" className="px-3 py-1">Drivers</Badge>
                  <Badge variant="outline" className="px-3 py-1">Reports</Badge>
                </div>
                
                {/* Mock Date Range Picker */}
                <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                  <div className="text-sm text-muted-foreground">Date Range:</div>
                  <Badge variant="outline">Last 30 Days</Badge>
                  <Badge variant="outline">Compare to previous period</Badge>
                </div>

                {/* Mock Active Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  <Badge variant="outline">Service Type: Deliveries</Badge>
                  <Badge variant="outline">Route: Zone A</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Overview Dashboard Demo */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Overview Dashboard
                </CardTitle>
                <CardDescription className="text-muted-foreground">Real-time KPIs with sparklines and delta indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mock KPI Cards Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-card border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Jobs Completed</div>
                    <div className="text-lg font-bold text-foreground flex items-center gap-2">
                      247
                      <Sparkline data={jobsSparklineData} color="hsl(var(--muted-foreground))" height={16} />
                    </div>
                    <div className="text-xs text-muted-foreground">▲ 15.2%</div>
                  </div>
                  <div className="p-3 bg-card border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Collected Revenue</div>
                    <div className="text-lg font-bold text-foreground flex items-center gap-2">
                      $42.1k
                      <Sparkline data={revenueSparklineData} color="hsl(var(--muted-foreground))" height={16} />
                    </div>
                    <div className="text-xs text-muted-foreground">▲ 22.8%</div>
                  </div>
                  <div className="p-3 bg-card border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">On-time Service Rate</div>
                    <div className="text-lg font-bold text-foreground">94.2%</div>
                    <div className="text-xs text-muted-foreground">▲ 3.1%</div>
                  </div>
                  <div className="p-3 bg-card border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Active Customers</div>
                    <div className="text-lg font-bold text-foreground">156</div>
                    <div className="text-xs text-muted-foreground">▲ 8.7%</div>
                  </div>
                </div>

                {/* Mock Stacked Bar Chart (neutral screenshot style) */}
                <div className="p-3 bg-card border rounded-lg">
                  <div className="text-sm font-medium mb-2 text-foreground">Job Volume (7 days)</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-muted rounded"></div>
                      <span className="text-xs text-muted-foreground">Deliveries</span>
                    </div>
                    <div className="h-6 bg-muted/30 rounded overflow-hidden flex">
                      <div className="bg-muted w-[45%]"></div>
                      <div className="bg-muted/80 w-[25%]"></div>
                      <div className="bg-muted/60 w-[20%]"></div>
                      <div className="bg-muted/40 w-[10%]"></div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-muted rounded"></div>
                        <span>Pickups</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-muted rounded"></div>
                        <span>Services</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-muted rounded"></div>
                        <span>Returns</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Deep-dive */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Revenue Analytics
                </CardTitle>
                <CardDescription className="text-muted-foreground">Financial performance with A/R aging and collection rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-card border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Total Invoiced</div>
                    <div className="text-lg font-bold text-foreground">$48.7k</div>
                    <div className="text-xs text-muted-foreground">▲ 18.5%</div>
                  </div>
                  <div className="p-3 bg-card border rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Collection Rate</div>
                    <div className="text-lg font-bold text-foreground">86.4%</div>
                    <div className="text-xs text-muted-foreground">▲ 4.2%</div>
                  </div>
                </div>
                
                {/* A/R Aging Preview (neutral) */}
                <div className="p-3 bg-card border rounded-lg">
                  <div className="text-sm font-medium mb-2 text-foreground">A/R Aging Breakdown</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0-30 days</span>
                      <span className="font-medium text-foreground">$4.2k (64%)</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>31-60 days</span>
                      <span className="font-medium text-foreground">$1.8k (27%)</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>61-90 days</span>
                      <span className="font-medium text-foreground">$0.4k (6%)</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>90+ days</span>
                      <span className="font-medium text-foreground">$0.2k (3%)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports Hub */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  One-Click Reports
                </CardTitle>
                <CardDescription className="text-muted-foreground">Ready-to-use reports instead of blank builders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {[
                    { name: "Daily Ops Summary", desc: "Route/driver stops, on-time %, photos" },
                    { name: "Weekly Service KPI", desc: "Jobs by type, missed/late, top sites" },
                    { name: "Revenue & AR", desc: "Invoiced, collected, aging table" },
                    { name: "Customer Service Pack", desc: "Service logs & photos by customer/date" }
                  ].map((report, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-card border rounded">
                      <div>
                        <div className="text-sm font-medium text-foreground">{report.name}</div>
                        <div className="text-xs text-muted-foreground">{report.desc}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                          <Download className="w-3 h-3 mr-1" />
                          CSV
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs px-2 py-1">PDF</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs">Advanced Report Builder</Button>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              className="w-full"
              onClick={() => window.open('/analytics', '_self')}
            >
              Open Analytics Dashboard
              <BarChart3 className="w-4 h-4 ml-2" />
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/analytics?tab=reports', '_self')}
              >
                View Reports
                <FileText className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => alert('Demo CSV export triggered')}
              >
                Export Data
                <Download className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}