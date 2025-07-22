
import React from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Landing } from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import { ComingSoon } from "./pages/ComingSoon";
import JobsPage from "./pages/Jobs";
import CustomerHub from "./pages/CustomerHub";
import Inventory from "./pages/Inventory";
import FleetManagement from "./pages/FleetManagement";
import FleetCompliancePage from "./pages/FleetCompliancePage";
import FleetAssignmentsPage from "./pages/FleetAssignmentsPage";
import FleetMaintenancePage from "./pages/FleetMaintenancePage";
import FleetFuel from "./pages/FleetFuel";
import FleetFiles from "./pages/FleetFiles";
import MarketingHub from "./pages/MarketingHub";
import QuotesInvoices from "./pages/QuotesInvoices";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <>
              <SignedOut>
                <Landing />
              </SignedOut>
              <SignedIn>
                <Layout>
                  <Dashboard />
                </Layout>
              </SignedIn>
            </>
          } />
          <Route path="/dashboard" element={
            <SignedIn>
              <Layout>
                <Dashboard />
              </Layout>
            </SignedIn>
          } />
          <Route path="/jobs" element={
            <SignedIn>
              <Layout>
                <JobsPage />
              </Layout>
            </SignedIn>
          } />
          <Route path="/jobs/calendar" element={
            <SignedIn>
              <Layout>
                <JobsPage />
              </Layout>
            </SignedIn>
          } />
          <Route path="/jobs/map" element={
            <SignedIn>
              <Layout>
                <JobsPage />
              </Layout>
            </SignedIn>
          } />
          <Route path="/fleet" element={
            <SignedIn>
              <Layout>
                <FleetManagement />
              </Layout>
            </SignedIn>
          } />
          <Route path="/fleet/compliance" element={
            <SignedIn>
              <Layout>
                <FleetCompliancePage />
              </Layout>
            </SignedIn>
          } />
          <Route path="/fleet/assignments" element={
            <SignedIn>
              <Layout>
                <FleetAssignmentsPage />
              </Layout>
            </SignedIn>
          } />
          <Route path="/fleet/maintenance" element={
            <SignedIn>
              <Layout>
                <FleetMaintenancePage />
              </Layout>
            </SignedIn>
          } />
          <Route path="/fleet/fuel" element={
            <SignedIn>
              <Layout>
                <FleetFuel />
              </Layout>
            </SignedIn>
          } />
          <Route path="/fleet/files" element={
            <SignedIn>
              <Layout>
                <FleetFiles />
              </Layout>
            </SignedIn>
          } />
          <Route path="/customers" element={
            <SignedIn>
              <Layout>
                <CustomerHub />
              </Layout>
            </SignedIn>
          } />
          <Route path="/inventory" element={
            <SignedIn>
              <Layout>
                <Inventory />
              </Layout>
            </SignedIn>
          } />
          <Route path="/quotes" element={
            <SignedIn>
              <Layout>
                <QuotesInvoices />
              </Layout>
            </SignedIn>
          } />
          <Route path="/marketing" element={
            <SignedIn>
              <Layout>
                <MarketingHub />
              </Layout>
            </SignedIn>
          } />
          <Route path="/analytics" element={
            <SignedIn>
              <Layout>
                <ComingSoon title="Analytics" description="Business analytics and reporting features are coming soon." />
              </Layout>
            </SignedIn>
          } />
          <Route path="/settings" element={
            <SignedIn>
              <Layout>
                <ComingSoon title="Settings" description="Application settings and configuration are coming soon." />
              </Layout>
            </SignedIn>
          } />
        </Routes>
        <Toaster />
        <Sonner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
