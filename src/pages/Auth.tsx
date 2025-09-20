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

  // Redirect to external authentication subdomain
  React.useEffect(() => {
    window.location.href = 'https://accounts.portaprosoftware.com/sign-in';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default Auth;