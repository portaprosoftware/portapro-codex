import React, { useState } from 'react';
import { SignIn, SignUp, useAuth, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Auth = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('signin');

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if already signed in
  if (isSignedIn && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            PortaPro
          </h1>
          <p className="text-gray-600">
            Sign in to access your portable toilet management platform
          </p>
        </div>

        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-6">
              <div className="flex justify-center">
                <SignIn 
                  fallbackRedirectUrl="/"
                  forceRedirectUrl="/"
                  appearance={{
                    elements: {
                      card: "shadow-none border-0",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
                      formButtonPrimary: "bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700",
                    }
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <div className="flex justify-center">
                <SignUp 
                  fallbackRedirectUrl="/"
                  forceRedirectUrl="/"
                  appearance={{
                    elements: {
                      card: "shadow-none border-0",
                      headerTitle: "hidden", 
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
                      formButtonPrimary: "bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700",
                    }
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="text-center text-sm text-gray-500">
          Manage your fleet, track inventory, and serve customers with PortaPro
        </div>
      </div>
    </div>
  );
};

export default Auth;