import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { useUserRole } from './hooks/useUserRole';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ui/error-boundary';
import { Landing } from './pages/Landing';
import Auth from './pages/Auth';
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
import MaintenancePage from "./pages/MaintenancePage";
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
import FleetTruckStock from './pages/FleetTruckStock';
import { DriverLayout } from './components/driver/DriverLayout';
import { DriverDashboardPage } from './pages/DriverDashboardPage';
import { DriverMapPage } from './pages/DriverMapPage';
import { DriverSchedulePage } from './pages/DriverSchedulePage';
import { DriverProfilePage } from './pages/DriverProfilePage';
import { DriverReportsPage } from './pages/DriverReportsPage';
import TeamManagement from './pages/TeamManagement';
import ProductItemDetail from './pages/ProductItemDetail';
import { ComingSoon } from './pages/ComingSoon';
import { Help } from './pages/Help';


import Features from './pages/Features';

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-background font-sans antialiased">
        
        <Routes>
          {/* Public QR Scan Routes */}
          <Route path="/scan/:unitId" element={<ScanFeedback />} />
          <Route path="/consumable-request/:consumableId" element={<ConsumableRequestPage />} />
          
          {/* Landing Page Route - should be accessible without auth */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/help" element={<Help />} />
          <Route path="/features" element={<Features />} />
          {/* Authentication Route */}
          <Route path="/auth" element={<Auth />} />
          
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
            <Route path="reports" element={<DriverReportsPage />} />
            <Route path="profile" element={<DriverProfilePage />} />
          </Route>

          {/* Root route - show landing page for everyone, dashboard for authenticated users */}
          <Route path="/" element={
            <>
              <SignedIn>
                <Layout>
                  <Dashboard />
                </Layout>
              </SignedIn>
              <SignedOut>
                <Landing />
              </SignedOut>
            </>
          } />

          {/* Testing route - outside authentication for easy access */}
          <Route path="/testing" element={<TestingPage />} />

          {/* Direct authenticated routes */}
          <Route path="/jobs" element={
            <>
              <SignedIn><Layout><Jobs /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/jobs/calendar" element={
            <>
              <SignedIn><Layout><Jobs /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/jobs/dispatch" element={
            <>
              <SignedIn><Layout><Jobs /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/jobs/map" element={
            <>
              <SignedIn><Layout><Jobs /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/jobs/custom" element={
            <>
              <SignedIn><Layout><Jobs /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/jobs/drafts" element={
            <>
              <SignedIn><Layout><Jobs /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/inventory" element={
            <>
              <SignedIn><Layout><Inventory /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/inventory/products" element={
            <>
              <SignedIn><Layout><Inventory /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/inventory/location-map" element={
            <>
              <SignedIn><Layout><Inventory /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/inventory/code-categories" element={
            <>
              <SignedIn><Layout><Inventory /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/inventory/maintenance" element={
            <>
              <SignedIn><Layout><MaintenancePage /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/inventory/items/:itemId" element={
            <>
              <SignedIn><Layout><ProductItemDetail /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/consumables" element={
            <>
              <SignedIn><Layout><Consumables /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/purchase-orders" element={
            <>
              <SignedIn><Layout><PurchaseOrders /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/customer-hub" element={
            <>
              <SignedIn><Layout><CustomerHub /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/customers" element={
            <>
              <SignedIn><Layout><CustomerHub /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/customers/:id" element={
            <>
              <SignedIn><Layout><CustomerDetail /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/quotes-invoices" element={
            <>
              <SignedIn><Layout><QuotesInvoices /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/fleet-management" element={
            <>
              <SignedIn><Layout><FleetManagement /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/fleet" element={
            <>
              <SignedIn><Layout><FleetManagement /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/fleet/assignments" element={
            <>
              <SignedIn><Layout><FleetAssignmentsPage /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/fleet/compliance" element={
            <>
              <SignedIn><Layout><FleetCompliancePage /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/fleet/loads" element={
            <>
              <SignedIn><Layout><FleetLoadsPage /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/fleet/analytics" element={
            <>
              <SignedIn><Layout><FleetAnalyticsPage /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/fleet/capacity" element={
            <>
              <SignedIn><Layout><FleetCapacityPage /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/fleet/compliance-reports" element={
            <>
              <SignedIn><Layout><FleetComplianceReportsPage /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/fleet/fuel" element={
            <>
              <SignedIn><Layout><FleetFuelManagement /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/fleet/files" element={
            <>
              <SignedIn><Layout><FleetFiles /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/fleet/truck-stock" element={
            <>
              <SignedIn><Layout><FleetTruckStock /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/fleet/maintenance" element={
            <>
              <SignedIn><Layout><FleetMaintenancePage /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/maintenance-hub" element={
            <>
              <SignedIn><Layout><MaintenanceHub /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/maintenance" element={
            <>
              <SignedIn><Layout><MaintenancePage /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/marketing" element={
            <>
              <SignedIn><Layout><Marketing /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/marketing/templates" element={
            <>
              <SignedIn><Layout><Marketing /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/marketing/campaigns" element={
            <>
              <SignedIn><Layout><Marketing /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/marketing/scheduled" element={
            <>
              <SignedIn><Layout><Marketing /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/marketing/segments" element={
            <>
              <SignedIn><Layout><Marketing /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/marketing/drafts" element={
            <>
              <SignedIn><Layout><Marketing /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/analytics" element={
            <>
              <SignedIn><Layout><Analytics /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/storage-sites" element={
            <>
              <SignedIn><Layout><StorageSites /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/team-management" element={
            <>
              <SignedIn><Layout><TeamManagement /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/team-management/:tab" element={
            <>
              <SignedIn><Layout><TeamManagement /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/team-management/driver/:driverId" element={
            <>
              <SignedIn><Layout><TeamManagement /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/team-management/bulk-operations" element={
            <>
              <SignedIn><Layout><TeamManagement /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/team-management/compliance" element={
            <>
              <SignedIn><Layout><TeamManagement /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/team-management/reports" element={
            <>
              <SignedIn><Layout><TeamManagement /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/team-management/forecasting" element={
            <>
              <SignedIn><Layout><TeamManagement /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/team-management/notifications" element={
            <>
              <SignedIn><Layout><TeamManagement /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />
          <Route path="/settings" element={
            <>
              <SignedIn><Layout><Settings /></Layout></SignedIn>
              <SignedOut><Auth /></SignedOut>
            </>
          } />

          {/* Catch all other routes - redirect to landing for unauthenticated, dashboard for authenticated */}
          <Route path="*" element={
            <>
              <SignedIn>
                <Layout>
                  <Dashboard />
                </Layout>
              </SignedIn>
              <SignedOut>
                <Landing />
              </SignedOut>
            </>
          } />
        </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
