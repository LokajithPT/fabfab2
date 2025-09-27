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
      <div className="flex items-center gap-4">
        <Button
          variant={role === "super-admin" ? "default" : "outline"}
          onClick={() => setRole("super-admin")}
        ></Button>
        <Button
          variant={role === "franchise-owner" ? "default" : "outline"}
          onClick={() => setRole("franchise-owner")}
        >
          Welcome To FabZ
        </Button>
      </div>
      {renderDashboard()}
    </div>
  );
}
