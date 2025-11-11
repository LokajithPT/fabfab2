import {
  DollarSign,
  Landmark,
  CreditCard,
  Package,
  ClipboardList,
  Truck,
  UserPlus,
  PlusCircle,
  FileText,
  Building,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SalesChart from "@/components/dashboard/sales-chart";
import RecentOrders from "@/components/dashboard/recent-orders";
import KpiCard from "@/components/dashboard/kpi-card";
import OrderStatusChart from "@/components/dashboard/order-status-chart";
import FranchisePerformance from "@/components/dashboard/franchise-performance";
import ServicePopularityChart from "@/components/dashboard/service-popularity-chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

// Auth fetch helper (assuming it's available globally or imported)
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw await res.json();
  return res.json();
};

interface DashboardSummaryData {
  totalRevenue: number;
  totalOrders: number;
  newCustomersLastMonth: number;
  pendingPickups: number;
  totalServices: number;
  shipmentsInTransit: number;
}

// Import the dummy data
import {
  dummyOrders,
  dummySalesData,
  dummyOrderStatusData,
  dummyServicePopularityData,
  dummyCustomers,
} from "@/lib/dummy-data";

const revenueData = [
  { name: "Week 1", revenue: 4000 },
  { name: "Week 2", revenue: 3000 },
  { name: "Week 3", revenue: 2000 },
  { name: "Week 4", revenue: 2780 },
];

const franchiseDetailsData = [
  {
    name: "Downtown Central",
    revenue: "₹450,231.89",
    status: "Active",
    newCustomers: 120,
  },
  {
    name: "Northside Hub",
    revenue: "₹320,112.45",
    status: "Active",
    newCustomers: 95,
  },
  {
    name: "Eastwood Branch",
    revenue: "₹280,543.21",
    status: "Warning",
    newCustomers: 50,
  },
];

const recentOrdersData = [
  {
    orderId: "ORD001",
    customer: "Liam Johnson",
    amount: "₹250.00",
    status: "Fulfilled",
  },
  {
    orderId: "ORD002",
    customer: "Olivia Smith",
    amount: "₹150.00",
    status: "Pending",
  },
  {
    orderId: "ORD003",
    customer: "Noah Williams",
    amount: "₹350.00",
    status: "Fulfilled",
  },
];

const pendingPickupsData = [
  { customer: "Emma Brown", location: "123 Main St", time: "2:00 PM" },
  { customer: "Lucas Jones", location: "456 Oak Ave", time: "4:30 PM" },
];

const deliveryPerformanceData = [
  { month: "Jan", rate: 95.2 },
  { month: "Feb", rate: 96.5 },
  { month: "Mar", rate: 97.1 },
  { month: "Apr", rate: 98.2 },
];

const servicesDetailsData = [
  { name: "Dry Cleaning", monthlyOrders: 1200, revenue: "₹150,000" },
  { name: "Premium Laundry", monthlyOrders: 850, revenue: "₹120,000" },
  { name: "Steam Ironing", monthlyOrders: 700, revenue: "₹50,000" },
];

const shipmentsDetailsData = [
  {
    id: "SHP001",
    destination: "Northside Hub",
    status: "In Transit",
    eta: "2 hours",
  },
  {
    id: "SHP002",
    destination: "Downtown Central",
    status: "Delayed",
    eta: "5 hours",
  },
  {
    id: "SHP003",
    destination: "Eastwood Branch",
    status: "In Transit",
    eta: "1 hour",
  },
];

const activeStoresData = [
  { name: "Downtown Central", manager: "John Doe", monthlyRevenue: "₹120,000" },
  { name: "Northside Hub", manager: "Jane Smith", monthlyRevenue: "₹95,000" },
  {
    name: "Eastwood Branch",
    manager: "Peter Jones",
    monthlyRevenue: "₹80,000",
  },
];

const consolidatedSalaryData = [
  {
    id: "EMP001",
    name: "David Miller",
    franchise: "Downtown Central",
    salary: "₹28,000",
  },
  {
    id: "EMP005",
    name: "Helen Clark",
    franchise: "Northside Hub",
    salary: "₹29,500",
  },
  {
    id: "EMP009",
    name: "Ivy Green",
    franchise: "Eastwood Branch",
    salary: "₹27,000",
  },
];

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const [isFranchiseDialogOpen, setIsFranchiseDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  // Fetch real dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => authFetch("/admin/api/dashboard-summary"),
  });

  const { data: realOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => authFetch("/admin/api/orders"),
  });

  const { data: realCustomers, isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => authFetch("/admin/api/customers"),
  });

  const { data: realServices, isLoading: servicesLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => authFetch("/admin/api/services"),
  });

  // Use real data or fallback to dummy
  const totalRevenue = dashboardData?.totalRevenue || dummySalesData.reduce(
    (acc, item) => acc + item.revenue,
    0,
  );
  const totalOrders = realOrders?.length || dummyOrders.length;
  const newCustomers = realCustomers?.filter((customer: any) => {
    const joinDate = new Date(customer.joinDate || customer.created_at);
    const currentDate = new Date();
    const oneMonthAgo = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      currentDate.getDate(),
    );
    return joinDate >= oneMonthAgo;
  }).length || dummyCustomers.filter((customer) => {
    const joinDate = new Date(customer.joinDate);
    const currentDate = new Date();
    const oneMonthAgo = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      currentDate.getDate(),
    );
    return joinDate >= oneMonthAgo;
  }).length;

  const handleSaveFranchise = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd use a mutation to send this to the server.
    // Here, we'll just simulate it.
    console.log("Saving franchise...");
    toast({
      title: "Success!",
      description: "New franchise has been onboarded.",
    });
    setIsFranchiseDialogOpen(false);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving service...");
    toast({
      title: "Success!",
      description: "New service has been created.",
    });
    setIsServiceDialogOpen(false);
  };

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Generating report...");
    toast({
      title: "Generating Report...",
      description:
        "Your report is being prepared and will be available shortly.",
    });
    setIsReportDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          change="+20.1% from last month"
          changeType="positive"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          animationDelay={0}
          details={
            <div className="py-4">
              <h4 className="font-semibold mb-2 text-center">
                Monthly Revenue Trend
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dummySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          }
        />
        <KpiCard
          title="New Customers"
          value={newCustomers.toString()}
          change="+20.1% from last month"
          changeType="positive"
          icon={<UserPlus className="h-4 w-4 text-muted-foreground" />}
          animationDelay={100}
          details={
            <div className="py-4">
              <h4 className="font-semibold mb-2 text-center">Recent Customer Growth</h4>
              <div className="text-center text-2xl font-bold text-primary">
                {newCustomers} new customers this month
              </div>
            </div>
          }
        />
        <KpiCard
          title="Total Orders"
          value={totalOrders.toString()}
          change="+19% from last month"
          changeType="positive"
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          animationDelay={200}
          details={
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                 <TableBody>
                   {(realOrders?.slice(0, 5) || dummyOrders.slice(0, 5)).map((order: any) => (
                     <TableRow key={order.id}>
                       <TableCell className="font-medium">{order.id}</TableCell>
                       <TableCell>{order.customer_name || order.customerName}</TableCell>
                       <TableCell>{order.status}</TableCell>
                       <TableCell className="text-right">
                         ₹{(order.total || order.amount || 0).toLocaleString()}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
              </Table>
            </div>
          }
        />
        <KpiCard
          title="Pending Pickups"
          value={dashboardData?.pendingPickups?.toString() || "0"}
          change="Ready for processing"
          changeType="positive"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          animationDelay={300}
          details={
            <div className="py-4">
              <h4 className="font-semibold mb-2 text-center">Orders Awaiting Pickup</h4>
              <div className="text-center text-2xl font-bold text-orange-600">
                {dashboardData?.pendingPickups || 0} orders ready
              </div>
            </div>
          }
        />
        <KpiCard
          title="Total Services"
          value={dashboardData?.totalServices?.toString() || "0"}
          change="Active services"
          changeType="positive"
          icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
          animationDelay={400}
          details={
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead className="text-right">Popularity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dashboardData?.servicePopularityData || dummyServicePopularityData).slice(0, 5).map((service: any) => (
                    <TableRow key={service.name}>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell>{service.orders || service.value}</TableCell>
                      <TableCell className="text-right">
                        {((service.orders || service.value) / totalOrders * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          }
        />
        <KpiCard
          title="Shipments in Transit"
          value={dashboardData?.shipmentsInTransit?.toString() || "0"}
          change="Currently active"
          changeType="positive"
          icon={<Truck className="h-4 w-4 text-muted-foreground" />}
          animationDelay={500}
          details={
            <div className="py-4">
              <h4 className="font-semibold mb-2 text-center">Active Shipments</h4>
              <div className="text-center text-2xl font-bold text-blue-600">
                {dashboardData?.shipmentsInTransit || 0} in transit
              </div>
            </div>
          }
        />
        <KpiCard
          title="Active Stores"
          value="12"
          change="+1 this quarter"
          changeType="positive"
          icon={<Landmark className="h-4 w-4 text-muted-foreground" />}
          animationDelay={600}
          details={
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead className="text-right">
                      Monthly Revenue
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeStoresData.map((store) => (
                    <TableRow key={store.name}>
                      <TableCell className="font-medium">
                        {store.name}
                      </TableCell>
                      <TableCell>{store.manager}</TableCell>
                      <TableCell className="text-right">
                        {store.monthlyRevenue}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          }
        />
        <KpiCard
          title="Washing Capacity"
          value="85%"
          change="Approaching peak"
          changeType="negative"
          icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
          animationDelay={700}
          details={
            <div className="py-4 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Current Utilization</h4>
                <Progress value={85} />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Insights</h4>
                <p>
                  Capacity is currently high. Consider optimizing schedules or
                  expanding to meet demand.
                </p>
              </div>
            </div>
          }
        />
        <KpiCard
          title="On-Time Delivery"
          value="98.2%"
          change="+1.5% this month"
          changeType="positive"
          icon={<Truck className="h-4 w-4 text-muted-foreground" />}
          animationDelay={800}
          details={
            <div className="py-4">
              <h4 className="font-semibold mb-2 text-center">
                Monthly Delivery Performance
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deliveryPerformanceData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card
          className="lg:col-span-4 animate-fade-in"
          style={{ animationDelay: "600ms" }}
        >
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesChart data={dashboardData?.salesData || dummySalesData} />
          </CardContent>
        </Card>
        <Card
          className="lg:col-span-3 animate-fade-in"
          style={{ animationDelay: "700ms" }}
        >
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentOrders orders={(realOrders?.slice(0, 5) || dummyOrders.slice(0, 5))} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <OrderStatusChart data={dashboardData?.orderStatusData || dummyOrderStatusData} />
        <FranchisePerformance />
        <ServicePopularityChart data={dashboardData?.servicePopularityData || dummyServicePopularityData} />
        <Card>
          <CardHeader>
            <CardTitle>Consolidated Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Franchise</TableHead>
                  <TableHead className="text-right">Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consolidatedSalaryData.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {employee.id}
                      </div>
                    </TableCell>
                    <TableCell>{employee.franchise}</TableCell>
                    <TableCell className="text-right">
                      {employee.salary}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
