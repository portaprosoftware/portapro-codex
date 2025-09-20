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
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      {/* Header with Grey Background */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
        <h3 className="text-lg font-bold text-foreground mb-3">Create New Campaign</h3>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-3">
          {[1, 2, 3, 4].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                step === 4 
                  ? 'bg-blue-600 text-white' 
                  : step < 4 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {step}
              </div>
              {index < 3 && (
                <div className={`w-10 h-0.5 mx-2 ${
                  step < 4 ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4">

        <div className="space-y-4">
          {/* Scheduling Options and Date Selection - Same Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h5 className="text-xs font-medium text-foreground mb-2">Scheduling</h5>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs px-3 py-1">
                  Send Now
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1">
                  Schedule
                </Button>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-medium text-foreground mb-2">Select Date</h5>
              <Button variant="outline" className="w-full justify-start text-gray-500 text-xs h-8">
                <Calendar className="w-3 h-3 mr-2" />
                Pick a date
              </Button>
            </div>
          </div>

          {/* Campaign Summary - Full Width */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Campaign Name:</span>
                  <span className="text-xs font-medium">Summer Service Promotions</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Type:</span>
                  <div className="flex gap-1">
                    <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 text-xs">
                      <Mail className="w-2 h-2 mr-1" />
                      email
                    </Badge>
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 text-xs">
                      SMS
                    </Badge>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total Recipients:</span>
                  <span className="text-xs font-bold">340</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Segments:</span>
                  <span className="text-xs font-medium">3 active</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Customer Types:</span>
                  <span className="text-xs font-medium">All types</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex gap-2 pt-4 justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs px-3 py-1">
              <ArrowLeft className="w-3 h-3 mr-1" />
              Back
            </Button>
            <Button variant="outline" size="sm" className="text-xs px-3 py-1">
              <Save className="w-3 h-3 mr-1" />
              Save as Draft
            </Button>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1">
            <Send className="w-3 h-3 mr-1" />
            Send Campaign
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CampaignConfirmationDemo;