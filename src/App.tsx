import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { useUserRole } from './hooks/useUserRole';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Inventory from './pages/Inventory';
import CustomerHub from './pages/CustomerHub';
import CustomerDetail from './pages/CustomerDetail';
import QuotesInvoices from './pages/QuotesInvoices';
import FleetManagement from './pages/FleetManagement';
import FleetAssignmentsPage from './pages/FleetAssignmentsPage';
import FleetCompliancePage from './pages/FleetCompliancePage';
import FleetMaintenancePage from './pages/FleetMaintenancePage';
import FleetLoadsPage from './pages/FleetLoadsPage';
import MarketingHub from './pages/MarketingHub';
import Analytics from "./pages/Analytics";
import MaintenanceHub from "./pages/MaintenanceHub";
import Settings from "./pages/Settings";
import { ScanFeedback } from "./pages/ScanFeedback";

const App = () => {
  return (
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
              path="/fleet"
              element={
                <SignedIn>
                  <Layout>
                    <FleetManagement />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/assignments"
              element={
                <SignedIn>
                  <Layout>
                    <FleetAssignmentsPage />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/compliance"
              element={
                <SignedIn>
                  <Layout>
                    <FleetCompliancePage />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/loads"
              element={
                <SignedIn>
                  <Layout>
                    <FleetLoadsPage />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/maintenance"
              element={
                <SignedIn>
                  <Layout>
                    <FleetMaintenancePage />
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
              path="/settings"
              element={
                <SignedIn>
                  <Settings />
                </SignedIn>
              }
            />
            
            {/* Public QR Scan Route - Outside authentication */}
            <Route path="/scan/:unitId" element={<ScanFeedback />} />
            
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
  );
}

export default App;
