import { useState } from "react";
import SuperAdminDashboard from "@/components/dashboard/super-admin-dashboard";
import FranchiseOwnerDashboard from "@/components/dashboard/franchise-owner-dashboard";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [role, setRole] = useState<"super-admin" | "franchise-owner">(
    "super-admin",
  );

  const renderDashboard = () => {
    if (role === "super-admin") return <SuperAdminDashboard />;
    if (role === "franchise-owner") return <FranchiseOwnerDashboard />;
    return <p>No dashboard available</p>; // fallback so it never 404s
  };

  return (
    <div className="space-y-6">
      {renderDashboard()}
    </div>
  );
}
