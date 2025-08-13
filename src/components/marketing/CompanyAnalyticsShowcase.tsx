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
            Six comprehensive tabs with persistent date controls, 24+ KPIs, one-click reports, and zero "coming soon" placeholders. 
            Every feature works today with consistent color coding and click-to-filter functionality.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Interactive Demonstrations */}
          <div className="space-y-8">
            {/* Navigation & Controls Demo */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Navigation & Controls
                </CardTitle>
                <CardDescription>Persistent date range and filtering across all tabs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mock Tab Navigation */}
                <div className="flex flex-wrap gap-1 p-2 bg-gray-100 rounded-lg">
                  <Badge variant="default" className="bg-blue-600 text-white px-3 py-1">Overview</Badge>
                  <Badge variant="outline" className="px-3 py-1">Revenue</Badge>
                  <Badge variant="outline" className="px-3 py-1">Operations</Badge>
                  <Badge variant="outline" className="px-3 py-1">Customers</Badge>
                  <Badge variant="outline" className="px-3 py-1">Drivers</Badge>
                  <Badge variant="outline" className="px-3 py-1">Reports</Badge>
                </div>
                
                {/* Mock Date Range Picker */}
                <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                  <div className="text-sm text-gray-600">Date Range:</div>
                  <Badge variant="outline">Last 30 Days</Badge>
                  <Badge variant="outline" className="text-blue-600">Compare to previous period</Badge>
                </div>

                {/* Mock Active Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Service Type: Deliveries</Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Route: Zone A</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Overview Dashboard Demo */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Overview Dashboard
                </CardTitle>
                <CardDescription>Real-time KPIs with sparklines and delta indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mock KPI Cards Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Jobs Completed</div>
                    <div className="text-lg font-bold text-blue-600 flex items-center gap-2">
                      247
                      <Sparkline data={jobsSparklineData} color="#3B82F6" height={16} />
                    </div>
                    <div className="text-xs text-green-600">▲ 15.2%</div>
                  </div>
                  <div className="p-3 bg-white border rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Collected Revenue</div>
                    <div className="text-lg font-bold text-green-600 flex items-center gap-2">
                      $42.1k
                      <Sparkline data={revenueSparklineData} color="#10B981" height={16} />
                    </div>
                    <div className="text-xs text-green-600">▲ 22.8%</div>
                  </div>
                  <div className="p-3 bg-white border rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">On-time Service Rate</div>
                    <div className="text-lg font-bold text-orange-600">94.2%</div>
                    <div className="text-xs text-green-600">▲ 3.1%</div>
                  </div>
                  <div className="p-3 bg-white border rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Active Customers</div>
                    <div className="text-lg font-bold text-purple-600">156</div>
                    <div className="text-xs text-green-600">▲ 8.7%</div>
                  </div>
                </div>

                {/* Mock Stacked Bar Chart */}
                <div className="p-3 bg-white border rounded-lg">
                  <div className="text-sm font-medium mb-2">Job Volume (7 days)</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded"></div>
                      <span className="text-xs">Deliveries (45%)</span>
                    </div>
                    <div className="h-6 bg-gray-100 rounded overflow-hidden flex">
                      <div className="bg-blue-500 w-[45%]"></div>
                      <div className="bg-green-500 w-[25%]"></div>
                      <div className="bg-orange-500 w-[20%]"></div>
                      <div className="bg-purple-500 w-[10%]"></div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded"></div>
                        <span>Pickups (25%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-500 rounded"></div>
                        <span>Services (20%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-500 rounded"></div>
                        <span>Returns (10%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Deep-dive */}
            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Revenue Analytics
                </CardTitle>
                <CardDescription>Financial performance with A/R aging and collection rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Total Invoiced</div>
                    <div className="text-lg font-bold text-blue-600">$48.7k</div>
                    <div className="text-xs text-green-600">▲ 18.5%</div>
                  </div>
                  <div className="p-3 bg-white border rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Collection Rate</div>
                    <div className="text-lg font-bold text-green-600">86.4%</div>
                    <div className="text-xs text-green-600">▲ 4.2%</div>
                  </div>
                </div>
                
                {/* A/R Aging Preview */}
                <div className="p-3 bg-white border rounded-lg">
                  <div className="text-sm font-medium mb-2">A/R Aging Breakdown</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>0-30 days</span>
                      <span className="font-medium">$4.2k (64%)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>31-60 days</span>
                      <span className="font-medium">$1.8k (27%)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>61-90 days</span>
                      <span className="font-medium">$0.4k (6%)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>90+ days</span>
                      <span className="font-medium text-red-600">$0.2k (3%)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports Hub */}
            <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-violet-800 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  One-Click Reports
                </CardTitle>
                <CardDescription>Ready-to-use reports instead of blank builders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {[
                    { name: "Daily Ops Summary", desc: "Route/driver stops, on-time %, photos" },
                    { name: "Weekly Service KPI", desc: "Jobs by type, missed/late, top sites" },
                    { name: "Revenue & AR", desc: "Invoiced, collected, aging table" },
                    { name: "Customer Service Pack", desc: "Service logs & photos by customer/date" }
                  ].map((report, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white border rounded">
                      <div>
                        <div className="text-sm font-medium">{report.name}</div>
                        <div className="text-xs text-gray-600">{report.desc}</div>
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

          {/* Right Column - KPIs and Highlights */}
          <div className="space-y-8">
            {/* KPIs Grid */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                title="Dashboard Tabs"
                value="6"
                icon={BarChart3}
                gradientFrom="from-blue-600"
                gradientTo="to-blue-800"
                iconBg="bg-blue-100"
                subtitle="Complete coverage"
              />
              <StatCard
                title="KPI Metrics"
                value="24+"
                icon={TrendingUp}
                gradientFrom="from-green-600"
                gradientTo="to-green-800"
                iconBg="bg-green-100"
                subtitle="Real-time tracking"
              />
              <StatCard
                title="One-Click Reports"
                value="4"
                icon={FileText}
                gradientFrom="from-purple-600"
                gradientTo="to-purple-800"
                iconBg="bg-purple-100"
                subtitle="Ready to export"
              />
              <StatCard
                title="Export Formats"
                value="CSV/PDF"
                icon={Download}
                gradientFrom="from-orange-600"
                gradientTo="to-orange-800"
                iconBg="bg-orange-100"
                subtitle="Instant downloads"
              />
            </div>

            {/* Features Highlights */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Complete Analytics Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "6 comprehensive tabs: Overview, Revenue, Operations, Customers, Drivers, Reports",
                    "Persistent date range controls with period comparisons",
                    "Real-time KPIs with sparklines and delta indicators (▲▼)",
                    "Consistent color coding: Deliveries=blue, Pickups=green, Services=orange, Returns=purple",
                    "Click-to-filter: any chart element creates filter chips",
                    "4 ready-to-use reports (Daily Ops, Weekly KPI, Revenue & AR, Customer Service)",
                    "CSV/PDF export for all data and reports",
                    "Zero \"coming soon\" placeholders—every feature works today"
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Testimonial Box */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-800">What operations teams love</h3>
                  <div className="space-y-3">
                    <blockquote className="text-sm italic text-blue-700">
                      "Finally, analytics that make sense for our business"
                    </blockquote>
                    <blockquote className="text-sm italic text-blue-700">
                      "One-click reports save hours every week"
                    </blockquote>
                    <blockquote className="text-sm italic text-blue-700">
                      "Date range controls work across every tab"
                    </blockquote>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium hover:from-blue-700 hover:to-blue-900"
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
      </div>
    </section>
  );
}