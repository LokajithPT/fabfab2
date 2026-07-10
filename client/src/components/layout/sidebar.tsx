import { Link, useLocation } from "wouter";
import {
  Home,
  ShoppingCart,
  Users2,
  Package,
  Settings,
  Truck,
  Scissors,
  BarChart3,
  FileText,
  Printer,
  CalendarCheck,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NavLink = ({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: any;
  children: React.ReactNode;
}) => {
  const [location] = useLocation();
  const isActive = location === to || location.startsWith(to + "/");

  return (
    <Link
      href={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-muted text-primary",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
};

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 flex h-full w-60 flex-col border-r bg-background">
      <div className="flex h-16 items-center justify-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <img
            src="/assets/logo.webp"
            alt="FabzClean Logo"
            className="h-10 w-auto"
          />
        </Link>
      </div>
      <nav className="flex flex-col gap-2 p-4 font-medium flex-1 overflow-y-auto">
        <NavLink to="/dashboard" icon={Home}>Dashboard</NavLink>
        <NavLink to="/orders" icon={ShoppingCart}>Orders</NavLink>
        <NavLink to="/booking" icon={CalendarCheck}>Bookings</NavLink>
        <NavLink to="/customers" icon={Users2}>Customers</NavLink>
        <NavLink to="/employees" icon={Users2}>Employees</NavLink>
        <NavLink to="/services" icon={Scissors}>Services</NavLink>
        <NavLink to="/inventory" icon={Package}>Inventory</NavLink>
        <NavLink to="/analytics" icon={BarChart3}>Analytics</NavLink>
        <NavLink to="/reports" icon={FileText}>Reports</NavLink>
        <NavLink to="/print-queue" icon={Printer}>Print Queue</NavLink>
        <NavLink to="/logistics" icon={Truck}>Logistics</NavLink>
        <NavLink to="/transit-orders" icon={Truck}>Transit</NavLink>
      </nav>
      <nav className="mt-auto flex flex-col gap-2 p-4 border-t">
        <NavLink to="/profile" icon={UserCircle}>Profile</NavLink>
        <NavLink to="/settings" icon={Settings}>Settings</NavLink>
      </nav>
    </aside>
  );
}
