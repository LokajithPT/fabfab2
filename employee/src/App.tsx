import React, { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { queryClient } from "./lib/queryClient";
import FabCleanLogin from "@/pages/login";
import Employeedash from "@/pages/employeedash";
import Orders from "@/pages/orders";
import Services from "@/pages/services";
import CreateOrder from "@/pages/create-order";
import Tracking from "@/pages/tracking";
import Customers from "@/pages/customers";
import { MainLayout } from "@/components/layout/main-layout";
import Inventory from "@/pages/inventory";
import Logistics from "@/pages/logistics";
import SpeedInsights from "@/components/speed-insights";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    setIsLoggedIn(true);
    setLocation("/employeedash");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="fab-z-ui-theme">
        <TooltipProvider>
          <Toaster />
          {isLoggedIn ? (
            <MainLayout>
              <Switch>
                <Route path="/employeedash" component={Employeedash} />
                <Route path="/orders" component={Orders} />
                <Route path="/inventory" component={Inventory} />
                <Route path="/customers" component={Customers} />
                <Route path="/services" component={Services} />
                <Route path="/create-order" component={CreateOrder} />
                <Route path="/tracking" component={Tracking} />
                <Route path="/logistics" component={Logistics} />
                <Route component={Employeedash} />
              </Switch>
            </MainLayout>
          ) : (
            <FabCleanLogin onLogin={handleLogin} />
          )}
          <SpeedInsights />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;