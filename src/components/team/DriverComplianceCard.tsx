import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  Shield, 
  FileText, 
  Calendar,
  Send,
  CheckCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ProtectedField } from '@/components/shared/ProtectedComponent';
import { DataSecurity } from '@/utils/dataEncryption';
import { useUserRole } from '@/hooks/useUserRole';

interface DriverComplianceCardProps {
  driverId: string;
  driverName: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  medicalCardNumber?: string;
  medicalCardExpiryDate?: string;
  nextTrainingDue?: string;
  onSendReminder?: (driverId: string, reminderType: string) => void;
  className?: string;
}

export function DriverComplianceCard({
  driverId,
  driverName,
  licenseNumber,
  licenseExpiryDate,
  medicalCardNumber,
  medicalCardExpiryDate,
  nextTrainingDue,
  onSendReminder,
  className
}: DriverComplianceCardProps) {
  const { role } = useUserRole();
  const isOwnData = false; // Would need to check if current user is this driver
  
  const getExpiryStatus = (expiryDate: string | undefined) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntil = differenceInDays(expiry, today);
    
    if (daysUntil < 0) return { status: 'overdue', daysUntil: Math.abs(daysUntil), color: 'red' };
    if (daysUntil <= 7) return { status: 'critical', daysUntil, color: 'red' };
    if (daysUntil <= 30) return { status: 'warning', daysUntil, color: 'orange' };
    if (daysUntil <= 60) return { status: 'notice', daysUntil, color: 'yellow' };
    return { status: 'valid', daysUntil, color: 'green' };
  };

  const renderExpiryBadge = (expiryDate: string | undefined, label: string) => {
    if (!expiryDate) {
      return (
        <Badge variant="outline" className="text-gray-400">
          <FileText className="w-3 h-3 mr-1" />
          Not Set
        </Badge>
      );
    }
    
    const status = getExpiryStatus(expiryDate);
    if (!status) return null;
    
    const { status: statusType, daysUntil, color } = status;
    
    if (statusType === 'overdue') {
      return (
        <Badge className="bg-red-500 text-white font-medium">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Overdue {daysUntil}d
        </Badge>
      );
    }
    
    if (statusType === 'critical') {
      return (
        <Badge className="bg-red-500 text-white font-medium">
          <Clock className="w-3 h-3 mr-1" />
          {daysUntil}d left
        </Badge>
      );
    }
    
    if (statusType === 'warning') {
      return (
        <Badge className="bg-orange-500 text-white font-medium">
          <Clock className="w-3 h-3 mr-1" />
          {daysUntil}d left
        </Badge>
      );
    }
    
    if (statusType === 'notice') {
      return (
        <Badge className="bg-yellow-500 text-white font-medium">
          <Calendar className="w-3 h-3 mr-1" />
          {daysUntil}d left
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-green-600 border-green-600">
        <CheckCircle className="w-3 h-3 mr-1" />
        Valid
      </Badge>
    );
  };

  const licenseStatus = getExpiryStatus(licenseExpiryDate);
  const medicalStatus = getExpiryStatus(medicalCardExpiryDate);
  const trainingStatus = getExpiryStatus(nextTrainingDue);

  const hasAnyIssues = [licenseStatus, medicalStatus, trainingStatus].some(
    status => status && ['overdue', 'critical', 'warning'].includes(status.status)
  );

  const shouldMaskLicense = DataSecurity.shouldMaskData('license', role as any, isOwnData);
  const shouldMaskMedical = DataSecurity.shouldMaskData('medical_card', role as any, isOwnData);

  return (
    <Card className={`${className} ${hasAnyIssues ? 'border-l-4 border-l-red-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            {driverName} - Compliance Status
          </CardTitle>
          
          {hasAnyIssues && (
            <Badge variant="destructive" className="font-medium">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Attention Required
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* License Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Driver License</span>
              {renderExpiryBadge(licenseExpiryDate, 'License')}
            </div>
            
            <div className="space-y-1">
              <ProtectedField 
                requiredPermission="canViewSensitiveDocuments" 
                targetDriverId={driverId}
                placeholder="••••••••"
              >
                <p className="text-sm">
                  {shouldMaskLicense 
                    ? DataSecurity.maskLicenseNumber(licenseNumber)
                    : licenseNumber || 'Not provided'
                  }
                </p>
              </ProtectedField>
              
              {licenseExpiryDate && (
                <p className="text-xs text-muted-foreground">
                  Expires: {format(new Date(licenseExpiryDate), 'MMM dd, yyyy')}
                </p>
              )}
            </div>
          </div>

          {/* Medical Card Information */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Medical Card</span>
              {renderExpiryBadge(medicalCardExpiryDate, 'Medical Card')}
            </div>
            
            <div className="space-y-1">
              <ProtectedField 
                requiredPermission="canViewSensitiveDocuments" 
                targetDriverId={driverId}
                placeholder="••••••"
              >
                <p className="text-sm">
                  {shouldMaskMedical 
                    ? DataSecurity.maskMedicalCardNumber(medicalCardNumber)
                    : medicalCardNumber || 'Not provided'
                  }
                </p>
              </ProtectedField>
              
              {medicalCardExpiryDate && (
                <p className="text-xs text-muted-foreground">
                  Expires: {format(new Date(medicalCardExpiryDate), 'MMM dd, yyyy')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Training Information */}
        {nextTrainingDue && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Next Training Due</span>
              {renderExpiryBadge(nextTrainingDue, 'Training')}
            </div>
            
            <p className="text-xs text-muted-foreground">
              Due: {format(new Date(nextTrainingDue), 'MMM dd, yyyy')}
            </p>
          </div>
        )}

        {/* Actions */}
        {onSendReminder && hasAnyIssues && (
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSendReminder(driverId, 'license')}
              disabled={!licenseStatus || !['overdue', 'critical', 'warning'].includes(licenseStatus.status)}
            >
              <Send className="w-3 h-3 mr-1" />
              Send License Reminder
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSendReminder(driverId, 'medical')}
              disabled={!medicalStatus || !['overdue', 'critical', 'warning'].includes(medicalStatus.status)}
            >
              <Send className="w-3 h-3 mr-1" />
              Send Medical Reminder
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}