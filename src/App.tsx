import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { useUserRole } from './hooks/useUserRole';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Inventory from './pages/Inventory';
import CustomerHub from './pages/CustomerHub';
import CustomerDetail from './pages/CustomerDetail';
import QuotesInvoices from './pages/QuotesInvoices';
import FleetManagement from './pages/FleetManagement';
import MarketingHub from './pages/MarketingHub';
import Analytics from "./pages/Analytics";
import MaintenanceHub from "./pages/MaintenanceHub";

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("REACT_APP_CLERK_PUBLISHABLE_KEY is not defined in the environment variables.");
}

const App = () => {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Routes>
            <Route
              path="/"
              element={
                <SignedIn>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/jobs"
              element={
                <SignedIn>
                  <Layout>
                    <Jobs />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/inventory"
              element={
                <SignedIn>
                  <Layout>
                    <Inventory />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/customer-hub"
              element={
                <SignedIn>
                  <Layout>
                    <CustomerHub />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/customers/:id"
              element={
                <SignedIn>
                  <Layout>
                    <CustomerDetail />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/quotes-invoices"
              element={
                <SignedIn>
                  <Layout>
                    <QuotesInvoices />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/fleet-management"
              element={
                <SignedIn>
                  <Layout>
                    <FleetManagement />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/maintenance-hub"
              element={
                <SignedIn>
                  <Layout>
                    <MaintenanceHub />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/marketing-hub"
              element={
                <SignedIn>
                  <Layout>
                    <MarketingHub />
                  </Layout>
                </SignedIn>
              }
            />
            <Route 
              path="/analytics" 
              element={
                <SignedIn>
                  <Layout>
                    <Analytics />
                  </Layout>
                </SignedIn>
              } 
            />
            <Route
              path="*"
              element={
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              }
            />
          </Routes>
        </div>
      </Router>
    </ClerkProvider>
  );
}

export default App;
