import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { useUserRole } from './hooks/useUserRole';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ui/error-boundary';
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
import Marketing from './pages/Marketing';
import Analytics from "./pages/Analytics";
import MaintenanceHub from "./pages/MaintenanceHub";
import Settings from "./pages/Settings";
import FleetAnalyticsPage from './pages/FleetAnalyticsPage';
import FleetCapacityPage from './pages/FleetCapacityPage';
import FleetComplianceReportsPage from './pages/FleetComplianceReportsPage';
import { FleetFuelManagement } from './pages/FleetFuelManagement';
import FleetFiles from './pages/FleetFiles';
import { ScanFeedback } from "./pages/ScanFeedback";
import TestingPage from './pages/TestingPage';
import Consumables from './pages/Consumables';
import PurchaseOrders from './pages/PurchaseOrders';
import StorageSites from './pages/StorageSites';
import { ConsumableRequestPage } from './pages/ConsumableRequestPage';
import { DriverLayout } from './components/driver/DriverLayout';
import { DriverDashboardPage } from './pages/DriverDashboardPage';
import { DriverMapPage } from './pages/DriverMapPage';
import { DriverSchedulePage } from './pages/DriverSchedulePage';
import { DriverProfilePage } from './pages/DriverProfilePage';

const App = () => {
  console.log('App component rendering...');
  
  return (
    <ErrorBoundary>
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

          {/* Main authenticated routes */}
          <Route
            path="/*"
            element={
              <SignedIn>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/jobs/calendar" element={<Jobs />} />
                    <Route path="/jobs/dispatch" element={<Jobs />} />
                    <Route path="/jobs/map" element={<Jobs />} />
                    <Route path="/inventory" element={<Inventory />} />
        <Route path="/consumables" element={<Consumables />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
                    <Route path="/customer-hub" element={<CustomerHub />} />
                    <Route path="/customers/:id" element={<CustomerDetail />} />
                    <Route path="/quotes-invoices" element={<QuotesInvoices />} />
                    <Route path="/fleet-management" element={<FleetManagement />} />
                    <Route path="/fleet" element={<FleetManagement />} />
                    <Route path="/fleet/assignments" element={<FleetAssignmentsPage />} />
                    <Route path="/fleet/compliance" element={<FleetCompliancePage />} />
                    <Route path="/fleet/loads" element={<FleetLoadsPage />} />
                    <Route path="/fleet/analytics" element={<FleetAnalyticsPage />} />
                    <Route path="/fleet/capacity" element={<FleetCapacityPage />} />
                    <Route path="/fleet/compliance-reports" element={<FleetComplianceReportsPage />} />
                    <Route path="/fleet/fuel" element={<FleetFuelManagement />} />
                    <Route path="/fleet/files" element={<FleetFiles />} />
                    <Route path="/fleet/maintenance" element={<FleetMaintenancePage />} />
                    <Route path="/testing" element={<TestingPage />} />
                    <Route path="/maintenance-hub" element={<MaintenanceHub />} />
                    <Route path="/marketing" element={<Marketing />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/storage-sites" element={<StorageSites />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
              </SignedIn>
            }
          />
            
            {/* Public QR Scan Route - Outside authentication */}
            <Route path="/scan/:unitId" element={<ScanFeedback />} />
            <Route path="/consumable-request/:consumableId" element={<ConsumableRequestPage />} />
            
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
    </ErrorBoundary>
  );
}

export default App;
