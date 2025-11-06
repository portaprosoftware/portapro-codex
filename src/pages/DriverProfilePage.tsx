
import React from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Phone, Mail } from 'lucide-react';
import { TimeOffSection } from '@/components/driver/TimeOffSection';
import { SettingsSection } from '@/components/driver/SettingsSection';

export const DriverProfilePage: React.FC = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  return (
    <div className="p-4 space-y-5 max-w-3xl mx-auto">
      {/* Profile Info Card - rounded-2xl, p-4 */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base">
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

      {/* Time Off Section */}
      <TimeOffSection />

      {/* Settings & Help Section */}
      <SettingsSection />

      {/* Sign Out */}
      <Button 
        variant="outline" 
        className="w-full"
        onClick={async () => {
          try {
            // Clear all app state FIRST
            sessionStorage.clear();
            
            // Remove Supabase and Clerk localStorage keys
            Object.keys(localStorage).forEach((key) => {
              if (key.startsWith('sb-') || key.startsWith('__clerk')) {
                localStorage.removeItem(key);
              }
            });
            
            queryClient.clear();
            
            // Sign out from Clerk with full cleanup
            await signOut({ redirectUrl: 'https://www.portaprosoftware.com' });
          } catch (error) {
            console.error('Sign out error:', error);
            // Ensure redirect even if sign-out fails
            window.location.href = 'https://www.portaprosoftware.com';
          }
        }}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
};
