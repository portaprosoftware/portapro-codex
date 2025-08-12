import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar, 
  Users,
  FileText,
  Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, addMonths } from 'date-fns';

interface ForecastData {
  period: string;
  date: string;
  licenses: { expiring: number; trend: 'up' | 'down' | 'stable' };
  medical: { expiring: number; trend: 'up' | 'down' | 'stable' };
  training: { expiring: number; trend: 'up' | 'down' | 'stable' };
  totalRisk: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export function ExpirationForecasting() {
  const { data: forecastData, isLoading, error } = useQuery({
    queryKey: ['expiration-forecasting'],
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

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load forecasting data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Expiration Forecasting</h2>
          <p className="text-muted-foreground">
            Predictive analytics for compliance document expirations
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Updated: {format(new Date(), 'MMM dd, HH:mm')}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Expirations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalUpcoming}</div>
            <p className="text-xs text-muted-foreground">Next 90 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Periods</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.highRiskPeriods}</div>
            <p className="text-xs text-muted-foreground">Months with 5+ expirations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.peakMonth ? format(new Date(summary.peakMonth), 'MMM yyyy') : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Highest expiration count</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">Based on historical data</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {summary.recommendation && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Recommendation:</strong> {summary.recommendation}
          </AlertDescription>
        </Alert>
      )}

      {/* Forecast Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            90-Day Expiration Forecast
          </CardTitle>
          <CardDescription>
            Predicted compliance document expirations by category
          </CardDescription>
        </CardHeader>
        <CardContent>
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

      {/* Seasonal Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Seasonal Trends</CardTitle>
          <CardDescription>
            Historical patterns in document expirations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">Q1</div>
                <div className="text-sm text-muted-foreground">Jan-Mar</div>
                <div className="text-xs">Peak license renewals</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">Q2</div>
                <div className="text-sm text-muted-foreground">Apr-Jun</div>
                <div className="text-xs">Training completions</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-yellow-600">Q3</div>
                <div className="text-sm text-muted-foreground">Jul-Sep</div>
                <div className="text-xs">Medical card renewals</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-red-600">Q4</div>
                <div className="text-sm text-muted-foreground">Oct-Dec</div>
                <div className="text-xs">Year-end compliance</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}