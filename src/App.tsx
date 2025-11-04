import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { RouterSelector } from './components/RouterSelector';
import { useUserRole } from './hooks/useUserRole';
import { usePWAStandalone } from './hooks/usePWAStandalone';
import { useCompanyTitle } from './hooks/useCompanyTitle';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ui/error-boundary';
import { TenantGuard } from './components/auth/TenantGuard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Landing } from './pages/Landing';
import PublicPayment from './pages/PublicPayment';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCanceled from './pages/PaymentCanceled';
import CustomerPortal from './pages/CustomerPortal';

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
import SpillKitInventoryPage from './pages/SpillKitInventoryPage';
import Marketing from './pages/Marketing';
import Analytics from "./pages/Analytics";
import AnalyticsReports from "./pages/AnalyticsReports";
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
import SpillKitStoragePage from './pages/SpillKitStoragePage';
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
import DriverVehiclesPage from './pages/DriverVehiclesPage';
import DriverDVIRPage from './pages/DriverDVIRPage';
import TeamManagement from './pages/TeamManagement';
import ProductItemDetail from './pages/ProductItemDetail';
import { ComingSoon } from './pages/ComingSoon';
import { Help } from './pages/Help';
import CustomerPortalPage from './pages/CustomerPortalPage';
import Unauthorized from './pages/Unauthorized';
import { TechnicianDashboard } from './pages/TechnicianDashboard';
import { TechnicianPhotoCapture } from './pages/TechnicianPhotoCapture';
import TechnicianWorkOrderDetail from './pages/TechnicianWorkOrderDetail';

import Features from './pages/Features';
import About from './pages/About';
import Blog from './pages/Blog';
import Community from './pages/Community';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Security from './pages/Security';

const App = () => {
  // Enable PWA standalone mode behaviors (zoom lock, gesture blocking)
  usePWAStandalone();
  
  // Set browser tab title to company name
  useCompanyTitle();

  return (
    <ErrorBoundary>
      <RouterSelector>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Routes>
            {/* Root route – works on all domains */}
            <Route
              path="/"
              element={
                <>
                  <SignedIn>
                    <Navigate to="/dashboard" replace />
                  </SignedIn>
                  <SignedOut>
                    <Landing />
                  </SignedOut>
                </>
              }
            />

            {/* Public QR Scan Routes */}
            <Route path="/scan/:unitId" element={<ScanFeedback />} />
            <Route path="/consumable-request/:consumableId" element={<ConsumableRequestPage />} />

            {/* Public Payment Routes */}
            <Route path="/payment/:invoiceId" element={<PublicPayment />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />
            <Route path="/portal/:token" element={<CustomerPortal />} />

            {/* Landing / Marketing Pages */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/help" element={<Help />} />
            <Route path="/features" element={<Features />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/community" element={<Community />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/security" element={<Security />} />

            {/* Authentication Routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Driver routes - protected with TenantGuard */}
            <Route
              path="/driver"
              element={
                <SignedIn>
                  <TenantGuard>
                    <DriverLayout />
                  </TenantGuard>
                </SignedIn>
              }
            >
              <Route index element={<DriverDashboardPage />} />
              <Route path="vehicles" element={<DriverVehiclesPage />} />
              <Route path="vehicles/:vehicleId/dvir" element={<DriverDVIRPage />} />
              <Route path="vehicles/:vehicleId/dvir/new" element={<DriverDVIRPage />} />
              <Route path="schedule" element={<DriverSchedulePage />} />
              <Route path="reports" element={<DriverReportsPage />} />
              <Route path="profile" element={<DriverProfilePage />} />
            </Route>

            {/* Dashboard route - protected */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* Testing route - outside authentication for easy access */}
            <Route path="/testing" element={<TestingPage />} />

            {/* Protected Routes - All require authentication + organization membership */}
            <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/jobs/calendar" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/jobs/dispatch" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/jobs/map" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/jobs/custom" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/jobs/drafts" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />

            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/inventory/products" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/inventory/location-map" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/inventory/code-categories" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/inventory/maintenance" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/inventory/items/:itemId" element={<ProtectedRoute><ProductItemDetail /></ProtectedRoute>} />

            <Route path="/consumables" element={<ProtectedRoute><Consumables /></ProtectedRoute>} />
            <Route path="/purchase-orders" element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />

            <Route path="/customer-hub" element={<ProtectedRoute><CustomerHub /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><CustomerHub /></ProtectedRoute>} />
            <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />

            <Route path="/quotes-invoices" element={<ProtectedRoute><QuotesInvoices /></ProtectedRoute>} />

            <Route path="/fleet-management" element={<ProtectedRoute><FleetManagement /></ProtectedRoute>} />
            <Route path="/fleet" element={<ProtectedRoute><FleetManagement /></ProtectedRoute>} />
            <Route path="/fleet/assignments" element={<ProtectedRoute><FleetAssignmentsPage /></ProtectedRoute>} />
            <Route path="/fleet/compliance" element={<ProtectedRoute><FleetCompliancePage /></ProtectedRoute>} />
            <Route path="/fleet/loads" element={<ProtectedRoute><FleetLoadsPage /></ProtectedRoute>} />
            <Route path="/fleet/analytics" element={<ProtectedRoute><FleetAnalyticsPage /></ProtectedRoute>} />
            <Route path="/fleet/capacity" element={<ProtectedRoute><FleetCapacityPage /></ProtectedRoute>} />
            <Route path="/fleet/compliance-reports" element={<ProtectedRoute><FleetComplianceReportsPage /></ProtectedRoute>} />
            <Route path="/fleet/fuel" element={<ProtectedRoute><FleetFuelManagement /></ProtectedRoute>} />
            <Route path="/fleet/files" element={<ProtectedRoute><FleetFiles /></ProtectedRoute>} />
            <Route path="/fleet/truck-stock" element={<ProtectedRoute><FleetTruckStock /></ProtectedRoute>} />
            <Route path="/fleet/maintenance" element={<ProtectedRoute><FleetMaintenancePage /></ProtectedRoute>} />
            <Route path="/fleet/spill-kit-inventory" element={<ProtectedRoute><SpillKitInventoryPage /></ProtectedRoute>} />
            <Route path="/fleet/spill-kit-storage" element={<ProtectedRoute><SpillKitStoragePage /></ProtectedRoute>} />

            <Route path="/maintenance-hub" element={<ProtectedRoute><MaintenanceHub /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />

            <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
            <Route path="/marketing/templates" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
            <Route path="/marketing/campaigns" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
            <Route path="/marketing/scheduled" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
            <Route path="/marketing/segments" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
            <Route path="/marketing/drafts" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />

            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/analytics/reports" element={<ProtectedRoute><AnalyticsReports /></ProtectedRoute>} />

            <Route path="/storage-sites" element={<ProtectedRoute><StorageSites /></ProtectedRoute>} />

            <Route path="/team-management" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
            <Route path="/team-management/:tab" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
            <Route path="/team-management/driver/:driverId" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
            <Route path="/team-management/bulk-operations" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
            <Route path="/team-management/compliance" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
            <Route path="/team-management/reports" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
            <Route path="/team-management/forecasting" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
            <Route path="/team-management/notifications" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />

            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* Technician Mobile Routes */}
            <Route path="/technician" element={<ProtectedRoute><TechnicianDashboard /></ProtectedRoute>} />
            <Route path="/technician/photos/:workOrderId" element={<ProtectedRoute><TechnicianPhotoCapture /></ProtectedRoute>} />
            <Route path="/technician/details/:id" element={<ProtectedRoute><TechnicianWorkOrderDetail /></ProtectedRoute>} />

            {/* Customer Portal Routes - Protected */}
            <Route path="/portal" element={<><SignedIn><TenantGuard><CustomerPortalPage /></TenantGuard></SignedIn><SignedOut><Auth /></SignedOut></>} />
            <Route path="/portal/:customerId" element={<><SignedIn><TenantGuard><CustomerPortalPage /></TenantGuard></SignedIn><SignedOut><Auth /></SignedOut></>} />

            {/* Catch all other routes */}
            <Route
              path="*"
              element={
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
              }
            />
            </Routes>
        </div>
      </RouterSelector>
    </ErrorBoundary>
  );
}

export default App;
