import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { SidebarProvider } from "@/components/ui/sidebar";
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
                <SidebarProvider>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </SidebarProvider>
              </SignedIn>
            }
          />
            <Route
              path="/jobs"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <Jobs />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/jobs/calendar"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <Jobs />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/jobs/map"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <Jobs />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/inventory"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <Inventory />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/customer-hub"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <CustomerHub />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/customers/:id"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <CustomerDetail />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/quotes-invoices"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <QuotesInvoices />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/fleet-management"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <FleetManagement />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/fleet"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <FleetManagement />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/assignments"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <FleetAssignmentsPage />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/compliance"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <FleetCompliancePage />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/loads"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <FleetLoadsPage />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/analytics"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <FleetAnalyticsPage />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/capacity"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <FleetCapacityPage />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/compliance-reports"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <FleetComplianceReportsPage />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/fuel"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <FleetFuel />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/files"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <FleetFiles />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/fleet/maintenance"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <FleetMaintenancePage />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/maintenance-hub"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <MaintenanceHub />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route
              path="/marketing-hub"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <MarketingHub />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              }
            />
            <Route 
              path="/analytics" 
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <Analytics />
                    </Layout>
                  </SidebarProvider>
                </SignedIn>
              } 
            />
            <Route
              path="/settings"
              element={
                <SignedIn>
                  <SidebarProvider>
                    <Layout>
                      <Settings />
                    </Layout>
                  </SidebarProvider>
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
