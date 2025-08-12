import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  FileText,
  Calendar,
  BarChart3,
  TrendingDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ForecastData {
  period: string;
  date: string;
  licenses: { expiring: number; trend: 'up' | 'down' | 'stable' };
  medical: { expiring: number; trend: 'up' | 'down' | 'stable' };
  training: { expiring: number; trend: 'up' | 'down' | 'stable' };
  totalRisk: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export function ComplianceDashboard() {
  const { data: complianceStats, error: complianceError } = useQuery({
    queryKey: ['compliance-dashboard'],
    queryFn: async () => {
      // Fetch compliance statistics
      const { data, error } = await supabase.functions.invoke('get-compliance-stats');
      if (error) throw error;
      return data;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const { data: forecastData, error: forecastError } = useQuery({
    queryKey: ['expiration-forecasting-compliance'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-expiration-forecast');
      if (error) throw error;
      return data;
    },
    refetchInterval: 3600000, // Refresh every hour
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1800000 // 30 minutes
  });

  const stats = complianceStats || {
    totalDrivers: 0,
    compliantDrivers: 0,
    expiringSoon: 0,
    expired: 0,
    complianceRate: 0,
    documentTypes: []
  };

  const forecasts = forecastData?.forecasts || [];
  const summary = forecastData?.summary || {
    totalUpcoming: 0,
    highRiskPeriods: 0,
    peakMonth: null,
    recommendation: ''
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'default';
      default: return 'secondary';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (complianceError || forecastError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load compliance data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Compliance Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time compliance monitoring and 90-day expiration forecast
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Last updated: {new Date().toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDrivers}</div>
            <p className="text-xs text-muted-foreground">
              Active drivers in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complianceRate}%</div>
            <Progress value={stats.complianceRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">
              Within 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">
              Immediate action required
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Document Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Compliance by Type
          </CardTitle>
          <CardDescription>
            Compliance status breakdown by document category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(stats.documentTypes || []).map((doc: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{doc.type}</span>
                  <span className="text-sm text-muted-foreground">
                    {doc.compliant}/{doc.total} compliant
                  </span>
                </div>
                <Progress value={(doc.compliant / doc.total) * 100} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 90-Day Expiration Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            90-Day Expiration Forecast
          </CardTitle>
          <CardDescription>
            Predicted compliance document expirations by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Forecast Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <div className="text-sm font-medium">Upcoming Expirations</div>
              <div className="text-2xl font-bold">{summary.totalUpcoming}</div>
              <div className="text-xs text-muted-foreground">Next 90 days</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">High Risk Periods</div>
              <div className="text-2xl font-bold text-red-600">{summary.highRiskPeriods}</div>
              <div className="text-xs text-muted-foreground">Months with 5+ expirations</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Peak Month</div>
              <div className="text-2xl font-bold">
                {summary.peakMonth ? format(new Date(summary.peakMonth), 'MMM yyyy') : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Highest expiration count</div>
            </div>
          </div>

          {/* Recommendations */}
          {summary.recommendation && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Recommendation:</strong> {summary.recommendation}
              </AlertDescription>
            </Alert>
          )}

          {/* Forecast Timeline */}
          <div className="space-y-6">
            {forecasts.map((forecast: ForecastData, index: number) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{forecast.period}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(forecast.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRiskColor(forecast.riskLevel)}>
                      {forecast.riskLevel} risk
                    </Badge>
                    <span className="text-sm font-medium">
                      {forecast.totalRisk} total
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Driver Licenses */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Driver Licenses</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(forecast.licenses.trend)}
                        <span className="text-sm">{forecast.licenses.expiring}</span>
                      </div>
                    </div>
                    <Progress 
                      value={(forecast.licenses.expiring / Math.max(forecast.totalRisk, 1)) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Medical Cards */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Medical Cards</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(forecast.medical.trend)}
                        <span className="text-sm">{forecast.medical.expiring}</span>
                      </div>
                    </div>
                    <Progress 
                      value={(forecast.medical.expiring / Math.max(forecast.totalRisk, 1)) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Training Records */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Training</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(forecast.training.trend)}
                        <span className="text-sm">{forecast.training.expiring}</span>
                      </div>
                    </div>
                    <Progress 
                      value={(forecast.training.expiring / Math.max(forecast.totalRisk, 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>

                {forecast.riskLevel === 'high' && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      High risk period: Consider scheduling renewals in advance or distributing 
                      workload to prevent compliance gaps.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}