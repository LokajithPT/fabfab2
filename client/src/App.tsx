import { useEffect, lazy, Suspense } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { MainLayout } from "@/components/layout/main-layout";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { SettingsProvider } from "@/contexts/settings-context";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import Services from "@/pages/services";
import CreateOrder from "@/pages/create-order";
import Tracking from "@/pages/tracking";
import Customers from "@/pages/customers";
import Inventory from "@/pages/inventory";
import Logistics from "@/pages/logistics";
import TransitOrders from "@/pages/transit-orders";
import Employees from "@/pages/employees";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Profile from "@/pages/profile";
import ChangePassword from "@/pages/change-password";

const OrderDetail = lazy(() => import("@/pages/order-detail"));
const Booking = lazy(() => import("@/pages/booking"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Reports = lazy(() => import("@/pages/reports"));
const Settings = lazy(() => import("@/pages/settings"));
const PrintQueue = lazy(() => import("@/pages/print-queue"));
const BillView = lazy(() => import("@/pages/bill-view"));
const PublicOrderTracking = lazy(() => import("@/pages/public-order-tracking"));
const CustomerPortal = lazy(() => import("@/pages/customer-portal"));
const Terms = lazy(() => import("@/pages/terms"));
const Privacy = lazy(() => import("@/pages/privacy"));
const RefundPolicy = lazy(() => import("@/pages/refund"));
const CookiesPolicy = lazy(() => import("@/pages/cookies"));
const Unauthorized = lazy(() => import("@/pages/unauthorized"));
const AccountInactive = lazy(() => import("@/pages/account-inactive"));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Login />;
  }
  return <>{children}</>;
}

function HomeRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/dashboard"); }, [setLocation]);
  return null;
}

function Router() {
  const [, setLocation] = useLocation();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/profile" component={Profile} />
      <Route path="/change-password" component={ChangePassword} />

      <Route path="/track/:orderNumber">
        {(params) => (
          <Suspense fallback={<Loading />}>
            <PublicOrderTracking />
          </Suspense>
        )}
      </Route>
      <Route path="/bill/:orderNumber">
        {(params) => (
          <Suspense fallback={<Loading />}>
            <BillView />
          </Suspense>
        )}
      </Route>
      <Route path="/portal" component={CustomerPortal} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/refund" component={RefundPolicy} />
      <Route path="/cookies" component={CookiesPolicy} />
      <Route path="/unauthorized" component={Unauthorized} />
      <Route path="/account-inactive" component={AccountInactive} />

      <Route>
        <ProtectedRoute>
          <MainLayout>
            <div className="p-4">
              <Button onClick={() => setLocation("/create-order")}>
                Create New Order
              </Button>
            </div>
            <Suspense fallback={<Loading />}>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/orders" component={Orders} />
                <Route path="/orders/:id">
                  {(params) => <OrderDetail />}
                </Route>
                <Route path="/inventory" component={Inventory} />
                <Route path="/customers" component={Customers} />
                <Route path="/services" component={Services} />
                <Route path="/employees" component={Employees} />
                <Route path="/create-order" component={CreateOrder} />
                <Route path="/tracking" component={Tracking} />
                <Route path="/logistics" component={Logistics} />
                <Route path="/transit-orders" component={TransitOrders} />
                <Route path="/booking" component={Booking} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/reports" component={Reports} />
                <Route path="/settings" component={Settings} />
                <Route path="/print-queue" component={PrintQueue} />
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </MainLayout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="fab-z-ui-theme">
        <TooltipProvider>
          <AuthProvider>
            <SettingsProvider>
              <Toaster />
              <Router />
            </SettingsProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
