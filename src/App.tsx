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
import FleetAnalyticsPage from './pages/FleetAnalyticsPage';
import FleetCapacityPage from './pages/FleetCapacityPage';
import FleetComplianceReportsPage from './pages/FleetComplianceReportsPage';
import FleetFuel from './pages/FleetFuel';
import FleetFiles from './pages/FleetFiles';
import { ScanFeedback } from "./pages/ScanFeedback";
import { DriverLayout } from './components/driver/DriverLayout';
import { DriverDashboardPage } from './pages/DriverDashboardPage';
import { DriverMapPage } from './pages/DriverMapPage';
import { DriverSchedulePage } from './pages/DriverSchedulePage';
import { DriverProfilePage } from './pages/DriverProfilePage';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Routes>
          {/* Driver routes */}
          <Route
            path="/driver"
            element={
              <SignedIn>
                <DriverLayout />
              </SignedIn>
            }
          >
            <Route index element={<DriverDashboardPage />} />
            <Route path="map" element={<DriverMapPage />} />
            <Route path="schedule" element={<DriverSchedulePage />} />
            <Route path="profile" element={<DriverProfilePage />} />
          </Route>

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
              path="/fleet/analytics"
              element={
                <SignedIn>
                  <Layout>
                    <FleetAnalyticsPage />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/capacity"
              element={
                <SignedIn>
                  <Layout>
                    <FleetCapacityPage />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/compliance-reports"
              element={
                <SignedIn>
                  <Layout>
                    <FleetComplianceReportsPage />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/fuel"
              element={
                <SignedIn>
                  <Layout>
                    <FleetFuel />
                  </Layout>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/files"
              element={
                <SignedIn>
                  <Layout>
                    <FleetFiles />
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
