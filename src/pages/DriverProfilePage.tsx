
import React from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Phone, Mail } from 'lucide-react';

export const DriverProfilePage: React.FC = () => {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-semibold">
                {user?.firstName?.charAt(0) || 'D'}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {user?.fullName || 'Driver'}
              </h3>
              <p className="text-sm text-gray-600">Driver</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {user?.primaryEmailAddress?.emailAddress || 'No email'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {user?.primaryPhoneNumber?.phoneNumber || 'No phone'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => signOut()}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
};
