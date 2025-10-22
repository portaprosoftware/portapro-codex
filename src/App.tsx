import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

import { RouterSelector } from "./components/RouterSelector";
import { usePWAStandalone } from "./hooks/usePWAStandalone";
import { ErrorBoundary } from "./components/ui/error-boundary";

import { Landing } from "./pages/Landing";
import PublicPayment from "./pages/PublicPayment";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import CustomerPortal from "./pages/CustomerPortal";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Inventory from "./pages/Inventory";
import CustomerHub from "./pages/CustomerHub";
import CustomerDetail from "./pages/CustomerDetail";
import QuotesInvoices from "./pages/QuotesInvoices";
import FleetManagement from "./pages/FleetManagement";
import FleetAssignmentsPage from "./pages/FleetAssignmentsPage";
import FleetCompliancePage from "./pages/FleetCompliancePage";
import FleetMaintenancePage from "./pages/FleetMaintenancePage";
import FleetLoadsPage from "./pages/FleetLoadsPage";
import SpillKitInventoryPage from "./pages/SpillKitInventoryPage";
import Marketing from "./pages/Marketing";
import Analytics from "./pages/Analytics";
import AnalyticsReports from "./pages/AnalyticsReports";
import MaintenanceHub from "./pages/MaintenanceHub";
import MaintenancePage from "./pages/MaintenancePage";
import Settings from "./pages/Settings";
import FleetAnalyticsPage from "./pages/FleetAnalyticsPage";
import FleetCapacityPage from "./pages/FleetCapacityPage";
import FleetComplianceReportsPage from "./pages/FleetComplianceReportsPage";
import { FleetFuelManagement } from "./pages/FleetFuelManagement";
import FleetFiles from "./pages/FleetFiles";
import { ScanFeedback } from "./pages/ScanFeedback";
import TestingPage from "./pages/TestingPage";
import SpillKitStoragePage from "./pages/SpillKitStoragePage";
import Consumables from "./pages/Consumables";
import PurchaseOrders from "./pages/PurchaseOrders";
import StorageSites from "./pages/StorageSites";
import { ConsumableRequestPage } from "./pages/ConsumableRequestPage";
import FleetTruckStock from "./pages/FleetTruckStock";

import { DriverLayout } from "./components/driver/DriverLayout";
import { DriverDashboardPage } from "./pages/DriverDashboardPage";
import { DriverMapPage } from "./pages/DriverMapPage";
import { DriverSchedulePage } from "./pages/DriverSchedulePage";
import { DriverProfilePage } from "./pages/DriverProfilePage";
import { DriverReportsPage } from "./pages/DriverReportsPage";
import DriverVehiclesPage from "./pages/DriverVehiclesPage";
import DriverDVIRPage from "./pages/DriverDVIRPage";

import TeamManagement from "./pages/TeamManagement";
import ProductItemDetail from "./pages/ProductItemDetail";
import { ComingSoon } from "./pages/ComingSoon";
import { Help } from "./pages/Help";
import CustomerPortalPage from "./pages/CustomerPortalPage";

import Features from "./pages/Features";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Community from "./pages/Community";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Security from "./pages/Security";

/** 🔐 Wrappers to avoid repeating auth/org checks */
import { RequireTenantAuth } from "@/components/auth/RequireTenantAuth";
import { LayoutOutlet } from "@/components/layout/LayoutOutlet";

/** 🌐 domain gating for root vs subdomains */
const ROOT_DOMAINS = new Set(["portaprosoftware.com", "www.portaprosoftware.com"]);
const hostname = typeof window !== "undefined" ? window.location.hostname : "";
const isRootDomain = ROOT_DOMAINS.has(hostname);

export default function App() {
  // Enable PWA standalone mode behaviors (zoom lock, gesture blocking)
  usePWAStandalone();

  return (
    <ErrorBoundary>
      <RouterSelector>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Routes>
            {/* 🏠 Root route – show Landing on main domain, force login on customer subdomains */}
            <Route
              path="/"
              element={
                isRootDomain ? (
                  <Landing />
                ) : (
                  <>
                    <SignedIn>
                      <Navigate to="/dashboard" replace />
                    </SignedIn>
                    <SignedOut>
                      <RedirectToSignIn redirectUrl="/dashboard" />
                    </SignedOut>
                  </>
                )
              }
            />

            {/* 🌐 Public / marketing */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/help" element={<Help />} />
            <Route path="/features" element={<Features />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/community" element={<Community />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/security" element={<Security />} />
            <Route path="/auth" element={<Auth />} />

            {/* 🔓 Public QR / payment / tokens */}
            <Route path="/scan/:unitId" element={<ScanFeedback />} />
            <Route path="/consumable-request/:consumableId" element={<ConsumableRequestPage />} />
            <Route path="/payment/:invoiceId" element={<PublicPayment />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />
            <Route path="/portal/:token" element={<CustomerPortal />} />
            <Route path="/testing" element={<TestingPage />} />

            {/* 🔐 ONE parent: auth + OrgGate + App layout for ALL protected routes */}
            <Route
              element={
                <RequireTenantAuth>
                  <LayoutOutlet />
                </RequireTenantAuth>
              }
            >
              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Jobs */}
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/calendar" element={<Jobs />} />
              <Route path="/jobs/dispatch" element={<Jobs />} />
              <Route path="/jobs/map" element={<Jobs />} />
              <Route path="/jobs/custom" element={<Jobs />} />
              <Route path="/jobs/drafts" element={<Jobs />} />

              {/* Inventory */}
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/inventory/products" element={<Inventory />} />
              <Route path="/inventory/location-map" element={<Inventory />} />
              <Route path="/inventory/code-categories" element={<Inventory />} />
              <Route path="/inventory/maintenance" element={<Inventory />} />
              <Route path="/inventory/items/:itemId" element={<ProductItemDetail />} />

              {/* Consumables / Purchasing */}
              <Route path="/consumables" element={<Consumables />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />

              {/* Customers */}
              <Route path="/customer-hub" element={<CustomerHub />} />
              <Route path="/customers" element={<CustomerHub />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />

              {/* Quotes / Invoices */}
              <Route path="/quotes-invoices" element={<QuotesInvoices />} />

              {/* Fleet */}
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
              <Route path="/fleet/truck-stock" element={<FleetTruckStock />} />
              <Route path="/fleet/maintenance" element={<FleetMaintenancePage />} />
              <Route path="/fleet/spill-kit-inventory" element={<SpillKitInventoryPage />} />
              <Route path="/fleet/spill-kit-storage" element={<SpillKitStoragePage />} />

              {/* Maintenance */}
              <Route path="/maintenance-hub" element={<MaintenanceHub />} />
              <Route path="/maintenance" element={<MaintenancePage />} />

              {/* Marketing */}
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/marketing/templates" element={<Marketing />} />
              <Route path="/marketing/campaigns" element={<Marketing />} />
              <Route path="/marketing/scheduled" element={<Marketing />} />
              <Route path="/marketing/segments" element={<Marketing />} />
              <Route path="/marketing/drafts" element={<Marketing />} />

              {/* Analytics */}
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/analytics/reports" element={<AnalyticsReports />} />

              {/* Storage sites */}
              <Route path="/storage-sites" element={<StorageSites />} />

              {/* Team management */}
              <Route path="/team-management" element={<TeamManagement />} />
              <Route path="/team-management/:tab" element={<TeamManagement />} />
              <Route path="/team-management/driver/:driverId" element={<TeamManagement />} />
              <Route path="/team-management/bulk-operations" element={<TeamManagement />} />
              <Route path="/team-management/compliance" element={<TeamManagement />} />
              <Route path="/team-management/reports" element={<TeamManagement />} />
              <Route path="/team-management/forecasting" element={<TeamManagement />} />
              <Route path="/team-management/notifications" element={<TeamManagement />} />

              {/* Settings */}
              <Route path="/settings" element={<Settings />} />

              {/* Customer portal (authed version) */}
              <Route path="/portal" element={<CustomerPortalPage />} />
              <Route path="/portal/:customerId" element={<CustomerPortalPage />} />

              {/* Driver area (still protected by RequireTenantAuth) */}
              <Route path="/driver" element={<DriverLayout />}>
                <Route index element={<DriverDashboardPage />} />
                <Route path="vehicles" element={<DriverVehiclesPage />} />
                <Route path="vehicles/:vehicleId/dvir" element={<DriverDVIRPage />} />
                <Route path="vehicles/:vehicleId/dvir/new" element={<DriverDVIRPage />} />
                <Route path="schedule" element={<DriverSchedulePage />} />
                <Route path="reports" element={<DriverReportsPage />} />
                <Route path="profile" element={<DriverProfilePage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route
              path="*"
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
          </Routes>
        </div>
      </RouterSelector>
    </ErrorBoundary>
  );
}
