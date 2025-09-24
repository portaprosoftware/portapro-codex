import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Truck, FileText, Download, Filter, Plus, Settings, Calendar, PieChart, BarChart, LineChart } from 'lucide-react';
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
    <section id="company-analytics" className="py-12 bg-white">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-4 md:mb-6">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
            Company Analytics — Complete insights across your entire operation
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
            Six comprehensive tabs with persistent date controls, 24+ KPIs and one-click reports.
          </p>
        </div>

        {/* Two-column layout: Image and One-Click Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Dashboard Cards Image */}
          <div className="flex justify-center lg:justify-start">
            <img 
              src="/lovable-uploads/75b97a9e-a16a-4dbf-b7d1-3b65d35fb9cb.png" 
              alt="Dashboard analytics cards showing job summary and revenue metrics"
              className="w-full h-auto rounded-lg object-contain"
            />
          </div>

          {/* One-Click Reports Card */}
          <Card className="border border-border bg-card h-fit">
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
            </CardContent>
          </Card>
        </div>

        {/* Remaining Analytics Cards */}
        <div className="space-y-4">
          {/* Custom Report Builder */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Custom Report Builder
              </CardTitle>
              <CardDescription className="text-muted-foreground">Build custom reports with drag-and-drop fields and filters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Report Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fields Section */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground">Available Fields</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "Revenue", type: "currency" },
                      { name: "Job Count", type: "number" },
                      { name: "Customer", type: "text" },
                      { name: "Service Date", type: "date" },
                      { name: "Unit Type", type: "category" },
                      { name: "Driver", type: "text" }
                    ].map((field, idx) => (
                      <div key={idx} className="p-2 bg-muted/30 border rounded cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="text-xs font-medium text-foreground">{field.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{field.type}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filters Section */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground">Active Filters</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                      <div className="text-xs">
                        <span className="font-medium text-blue-900">Date Range:</span>
                        <span className="text-blue-700 ml-1">Last 30 days</span>
                      </div>
                      <Calendar className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                      <div className="text-xs">
                        <span className="font-medium text-green-900">Service Type:</span>
                        <span className="text-green-700 ml-1">Delivery + Service</span>
                      </div>
                      <Filter className="w-3 h-3 text-green-600" />
                    </div>
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Filter
                    </Button>
                  </div>
                </div>
              </div>

              {/* Chart Type Selection and Actions */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">Visualization Type</div>
                <div className="flex flex-wrap gap-2 items-center">
                  {[
                    { name: "Bar Chart", icon: BarChart, active: true },
                    { name: "Line Chart", icon: LineChart, active: false },
                    { name: "Pie Chart", icon: PieChart, active: false }
                  ].map((chart, idx) => {
                    const IconComponent = chart.icon;
                    return (
                      <button
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded border text-xs font-bold transition-colors ${
                          chart.active 
                            ? 'bg-blue-500 text-white border-blue-500' 
                            : 'bg-background text-muted-foreground border-border hover:bg-muted/50'
                        }`}
                      >
                        <IconComponent className="w-3 h-3" />
                        {chart.name}
                      </button>
                    );
                  })}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-auto">
                    <Button size="sm" className="text-xs">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Generate Preview
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      Export CSV
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Save Template
                    </Button>
                  </div>
                </div>
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
                  <div className="text-lg font-bold text-foreground">
                    247
                  </div>
                  <div className="text-xs text-green-600 font-medium">+15.2%</div>
                </div>
                <div className="p-3 bg-card border rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Collected Revenue</div>
                  <div className="text-lg font-bold text-foreground">
                    $42.1k
                  </div>
                  <div className="text-xs text-green-600 font-medium">+22.8%</div>
                </div>
                <div className="p-3 bg-card border rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">On-time Service Rate</div>
                  <div className="text-lg font-bold text-foreground">94.2%</div>
                  <div className="text-xs text-green-600 font-medium">+3.1%</div>
                </div>
                <div className="p-3 bg-card border rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Active Customers</div>
                  <div className="text-lg font-bold text-foreground">156</div>
                  <div className="text-xs text-green-600 font-medium">+8.7%</div>
                </div>
              </div>

              {/* Mock Horizontal Bar Charts */}
              <div className="p-3 bg-card border rounded-lg">
                <div className="text-sm font-medium mb-3 text-foreground">Job Volume (7 days)</div>
                <div className="space-y-3">
                  {/* Deliveries Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-muted-foreground">Deliveries</span>
                      <span className="text-xs font-medium text-foreground">132</span>
                    </div>
                    <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 w-[80%] rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Services Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-muted-foreground">Services</span>
                      <span className="text-xs font-medium text-foreground">71</span>
                    </div>
                    <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-800 to-red-900 w-[60%] rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Pickups Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-muted-foreground">Pickups</span>
                      <span className="text-xs font-medium text-foreground">44</span>
                    </div>
                    <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 w-[40%] rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}