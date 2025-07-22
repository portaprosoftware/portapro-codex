
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Toaster />
        <Sonner />
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
                <ComingSoon title="Fleet Management" description="Vehicle and equipment management features are coming soon." />
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
                <ComingSoon title="Quotes & Invoices" description="Quote and invoice management features are coming soon." />
              </Layout>
            </SignedIn>
          } />
          <Route path="/marketing" element={
            <SignedIn>
              <Layout>
                <ComingSoon title="Marketing" description="Marketing and communication features are coming soon." />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
