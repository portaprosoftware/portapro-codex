import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  Send, 
  ArrowLeft, 
  Save, 
  Mail,
  Users,
  Target,
  Clock
} from 'lucide-react';

export const CampaignConfirmationDemo: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header with Grey Background */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
        <h3 className="text-xl font-bold text-foreground mb-4">Create New Campaign</h3>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3, 4].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 4 
                  ? 'bg-blue-600 text-white' 
                  : step < 4 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {step}
              </div>
              {index < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step < 4 ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">

        <div className="space-y-6">
          {/* Schedule & Review Section */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4">Schedule & Review</h4>
            
            {/* Scheduling Options and Date Selection - Same Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-foreground mb-2">Scheduling</h5>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    Send Now
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                    Schedule
                  </Button>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-foreground mb-2">Select Date</h5>
                <Button variant="outline" className="w-full justify-start text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  Pick a date
                </Button>
              </div>
            </div>
          </div>

          {/* Campaign Summary - Full Width */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Campaign Name:</span>
                  <span className="text-sm font-medium">Summer Service Promotions</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <div className="flex gap-1">
                    <Badge className="bg-blue-100 text-blue-800 border-0">
                      <Mail className="w-3 h-3 mr-1" />
                      email
                    </Badge>
                    <Badge className="bg-green-100 text-green-800 border-0">
                      SMS
                    </Badge>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Recipients:</span>
                  <span className="text-sm font-bold">340</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Segments:</span>
                  <span className="text-sm font-medium">3 active</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Customer Types:</span>
                  <span className="text-sm font-medium">All types</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex gap-2 pt-6 justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4 mr-1" />
              Save as Draft
            </Button>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Send className="w-4 h-4 mr-1" />
            Send Campaign
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CampaignConfirmationDemo;