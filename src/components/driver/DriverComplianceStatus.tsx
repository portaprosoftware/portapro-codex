import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, CheckCircle, AlertTriangle, Clock, 
  XCircle, Calendar, FileText, GraduationCap,
  TrendingUp, Activity
} from 'lucide-react';

interface DriverComplianceStatusProps {
  driverId: string;
}

export function DriverComplianceStatus({ driverId }: DriverComplianceStatusProps) {
  const { data: complianceData, isLoading } = useQuery({
    queryKey: ['driver-compliance', driverId],
    queryFn: async () => {
      // Fetch all compliance-related data
      const [credentialsResult, trainingResult, profileResult] = await Promise.all([
        supabase
          .from('driver_credentials')
          .select('*')
          .eq('driver_id', driverId)
          .maybeSingle(),
        supabase
          .from('driver_training_records')
          .select('*')
          .eq('driver_id', driverId),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', driverId)
          .single()
      ]);

      if (credentialsResult.error) throw credentialsResult.error;
      if (trainingResult.error) throw trainingResult.error;
      if (profileResult.error) throw profileResult.error;

      return {
        credentials: credentialsResult.data,
        training: trainingResult.data || [],
        profile: profileResult.data
      };
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!complianceData) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Unable to load compliance data</p>
      </div>
    );
  }

  const { credentials, training, profile } = complianceData;

  // Calculate compliance items
  const complianceItems = [
    {
      name: 'Profile Complete',
      status: profile.first_name && profile.last_name && profile.email ? 'compliant' : 'non_compliant',
      dueDate: null,
      description: 'Basic profile information'
    },
    {
      name: 'Driver License',
      status: credentials?.license_number && credentials?.license_expiry_date ? 
        new Date(credentials.license_expiry_date) > new Date() ? 'compliant' : 'expired' : 'missing',
      dueDate: credentials?.license_expiry_date,
      description: 'Valid driver license on file'
    },
    {
      name: 'Medical Certificate',
      status: credentials?.medical_card_expiry_date ? 
        new Date(credentials.medical_card_expiry_date) > new Date() ? 'compliant' : 'expired' : 'missing',
      dueDate: credentials?.medical_card_expiry_date,
      description: 'DOT medical certificate'
    }
  ];

  // Add training-based compliance items
  const requiredTraining = ['Safety Training', 'DOT Compliance'];
  requiredTraining.forEach(trainingType => {
    const record = training.find(t => t.training_type === trainingType);
    complianceItems.push({
      name: trainingType,
      status: record?.last_completed ? 
        (record.next_due ? 
          (new Date(record.next_due) > new Date() ? 'compliant' : 'expired') : 'compliant') : 'missing',
      dueDate: record?.next_due,
      description: `${trainingType} certification`
    });
  });

  // Calculate overall compliance score
  const compliantItems = complianceItems.filter(item => item.status === 'compliant').length;
  const complianceScore = Math.round((compliantItems / complianceItems.length) * 100);

  // Get items needing attention
  const itemsNeedingAttention = complianceItems.filter(item => 
    item.status === 'expired' || item.status === 'missing' || 
    (item.dueDate && new Date(item.dueDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'missing':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Compliant</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'missing':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">Missing</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Compliance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
                  complianceScore >= 80 ? 'bg-gradient-to-br from-green-600 to-emerald-600' :
                  complianceScore >= 60 ? 'bg-gradient-to-br from-orange-600 to-amber-600' :
                  'bg-gradient-to-br from-red-600 to-rose-600'
                }`}>
                  {complianceScore}%
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">Overall Compliance</h3>
              <p className="text-sm text-gray-600">{compliantItems} of {complianceItems.length} items</p>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Status Breakdown</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Compliant</span>
                  </span>
                  <span className="font-medium">{complianceItems.filter(i => i.status === 'compliant').length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Expired</span>
                  </span>
                  <span className="font-medium">{complianceItems.filter(i => i.status === 'expired').length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span>Missing</span>
                  </span>
                  <span className="font-medium">{complianceItems.filter(i => i.status === 'missing').length}</span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Progress Indicator</h4>
              <Progress value={complianceScore} className="h-3" />
              <p className="text-xs text-gray-600">
                {complianceScore >= 80 ? 'Excellent compliance status' :
                 complianceScore >= 60 ? 'Good, but needs attention' :
                 'Requires immediate action'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Needing Attention */}
      {itemsNeedingAttention.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{itemsNeedingAttention.length} item(s) need immediate attention:</strong>
            <ul className="mt-2 space-y-1">
              {itemsNeedingAttention.map((item, index) => (
                <li key={index} className="text-sm">
                  • {item.name} - {item.status === 'missing' ? 'Not provided' : 
                    item.status === 'expired' ? 'Expired' : 'Expiring soon'}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Compliance Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Compliance Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(item.status)}
                  <div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    {item.dueDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.status === 'expired' ? 'Expired:' : 'Due:'} {new Date(item.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Training Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5" />
            <span>Training Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Completed Training</h4>
              <div className="space-y-2">
                {training.length > 0 ? (
                  training.map((record, index) => (
                    <div key={index} className="text-sm flex justify-between">
                      <span>{record.training_type}</span>
                      <span className="text-gray-600">
                        {record.last_completed ? new Date(record.last_completed).toLocaleDateString() : 'No date'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No training records</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Upcoming Requirements</h4>
              <div className="space-y-2">
                {training
                  .filter(record => record.next_due && new Date(record.next_due) > new Date())
                  .sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime())
                  .map((record, index) => (
                    <div key={index} className="text-sm flex justify-between">
                      <span>{record.training_type}</span>
                      <span className="text-gray-600">
                        {new Date(record.next_due).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                {training.filter(record => record.next_due && new Date(record.next_due) > new Date()).length === 0 && (
                  <p className="text-sm text-gray-600">No upcoming requirements</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}