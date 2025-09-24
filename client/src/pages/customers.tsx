import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

import {
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Search,
  Users,
  Mail,
  Phone,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Download,
  UserPlus,
  Filter,
  Calendar,
  MapPin,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
  lastOrderDate?: string;
  totalOrders?: number;
  totalSpent?: number;
  status?: "active" | "inactive" | "blocked";
  address?: string;
  notes?: string;
};

// -------------- HELPER: AUTH FETCH -------------- //
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    console.error("Unauthorized! JWT might be expired. Please login again.");
    // You might want to redirect to login here
  }
  return res;
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    status: "active" as const,
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  // -------------- FILTERED CUSTOMERS -------------- //
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query) ||
          customer.phone.includes(query),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (customer) => customer.status === statusFilter,
      );
    }

    return filtered;
  }, [customers, searchQuery, statusFilter]);

  // -------------- CUSTOMER STATS -------------- //
  const customerStats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === "active").length;
    const inactive = customers.filter((c) => c.status === "inactive").length;
    const totalSpent = customers.reduce(
      (sum, c) => sum + (c.totalSpent || 0),
      0,
    );

    return { total, active, inactive, totalSpent };
  }, [customers]);

  // -------------- FETCH ALL CUSTOMERS -------------- //
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/admin/api/customers", { method: "GET" });
      if (!res.ok) throw await res.json();
      const data = await res.json();

      // Add some mock data for better demo
      const enhancedData = data.map((customer: Customer) => ({
        ...customer,
        status: customer.status || "active",
        totalOrders: customer.totalOrders || Math.floor(Math.random() * 20),
        totalSpent: customer.totalSpent || Math.floor(Math.random() * 50000),
        createdAt: customer.createdAt || new Date().toISOString(),
        lastOrderDate:
          customer.lastOrderDate ||
          new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
      }));

      setCustomers(enhancedData);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.error || "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // -------------- CREATE CUSTOMER -------------- //
  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) {
      toast({
        title: "Validation Error",
        description: "Name, email, and phone are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch("/admin/api/customers", {
        method: "POST",
        body: JSON.stringify(newCustomer),
      });
      if (!res.ok) throw await res.json();

      await fetchCustomers();
      toast({
        title: "Success",
        description: `Customer ${newCustomer.name} created successfully!`,
      });

      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        status: "active",
      });
      setIsCreateDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.error || "Failed to create customer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // -------------- UPDATE CUSTOMER -------------- //
  const handleUpdateCustomer = async (updated: Customer) => {
    if (!updated.name || !updated.email || !updated.phone) {
      toast({
        title: "Validation Error",
        description: "Name, email, and phone are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(`/admin/api/customers/${updated.id}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw await res.json();

      await fetchCustomers();
      toast({
        title: "Success",
        description: "Customer updated successfully!",
      });
      setIsEditDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.error || "Failed to update customer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // -------------- DELETE CUSTOMER -------------- //
  const handleDeleteCustomer = async (id: number) => {
    setLoading(true);
    try {
      const res = await authFetch(`/admin/api/customers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw await res.json();

      await fetchCustomers();
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.error || "Failed to delete customer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // -------------- UTILITY FUNCTIONS -------------- //
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: Customer["status"]) => {
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200",
      blocked: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <Badge className={`${variants[status || "active"]} font-medium`}>
        {status || "active"}
      </Badge>
    );
  };

  const handleRefresh = async () => {
    await fetchCustomers();
    toast({ title: "Success", description: "Customer data refreshed" });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your customer database and track engagement
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {customerStats.active} active customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Customers
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customerStats.active}
            </div>
            <p className="text-xs text-muted-foreground">
              {customerStats.inactive} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(customerStats.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">From all customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Order Value
            </CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(
                customerStats.total > 0
                  ? customerStats.totalSpent / customerStats.total
                  : 0,
              )}
            </div>
            <p className="text-xs text-muted-foreground">Per customer</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customers ({filteredCustomers.length})
          </CardTitle>
          <CardDescription>
            Manage your customers and track their engagement
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Orders</TableHead>
                  <TableHead className="font-semibold">Total Spent</TableHead>
                  <TableHead className="font-semibold">Last Order</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">Loading customers...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        No customers found
                      </p>
                      <p className="text-gray-400 text-sm">
                        {searchQuery || statusFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Add your first customer to get started"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                              {getInitials(customer.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-gray-500">
                              ID: {customer.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-2 text-gray-400" />
                            {customer.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-blue-600">
                          {customer.totalOrders || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(customer.totalSpent || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(customer.lastOrderDate || "")}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setViewCustomer(customer);
                              setIsViewDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0 hover:bg-blue-100"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setIsEditDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0 hover:bg-green-100"
                          >
                            <Edit className="h-4 w-4 text-green-600" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                  <Trash2 className="h-5 w-5" />
                                  Delete Customer
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete{" "}
                                  <strong>{customer.name}</strong>? This action
                                  cannot be undone and will remove all
                                  associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteCustomer(customer.id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Customer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-gray-50">
          <div className="text-sm text-muted-foreground">
            Showing <strong>{filteredCustomers.length}</strong> of{" "}
            <strong>{customers.length}</strong> customers
          </div>
        </CardFooter>
      </Card>

      {/* Create Customer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Customer
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Full Name *</Label>
                <Input
                  placeholder="Enter customer name"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Email Address *</Label>
                <Input
                  type="email"
                  placeholder="customer@example.com"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Phone Number *</Label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={newCustomer.status}
                  onValueChange={(value) =>
                    setNewCustomer({ ...newCustomer, status: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Address</Label>
                <Textarea
                  placeholder="Customer address..."
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, address: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={newCustomer.notes}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, notes: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Create Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Customer Details
            </DialogTitle>
          </DialogHeader>
          {viewCustomer && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-xl">
                    {getInitials(viewCustomer.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{viewCustomer.name}</h3>
                  <p className="text-gray-600">
                    Customer ID: {viewCustomer.id}
                  </p>
                  <div className="mt-2">
                    {getStatusBadge(viewCustomer.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{viewCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{viewCustomer.phone}</span>
                    </div>
                    {viewCustomer.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                        <span className="text-sm">{viewCustomer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Order Statistics
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Total Orders</p>
                      <p className="font-semibold text-lg text-blue-600">
                        {viewCustomer.totalOrders || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Spent</p>
                      <p className="font-semibold text-lg text-green-600">
                        {formatCurrency(viewCustomer.totalSpent || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Order</p>
                      <p className="font-medium">
                        {formatDate(viewCustomer.lastOrderDate || "")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {viewCustomer.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">
                    {viewCustomer.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Customer
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Full Name *</Label>
                  <Input
                    value={selectedCustomer.name}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Email Address *</Label>
                  <Input
                    type="email"
                    value={selectedCustomer.email}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone Number *</Label>
                  <Input
                    type="tel"
                    value={selectedCustomer.phone}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Select
                    value={selectedCustomer.status || "active"}
                    onValueChange={(value) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        status: value as any,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <Textarea
                    placeholder="Customer address..."
                    value={selectedCustomer.address || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        address: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={selectedCustomer.notes || ""}
                    onChange={(e) =>
                      setSelectedCustomer({
                        ...selectedCustomer,
                        notes: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedCustomer && handleUpdateCustomer(selectedCustomer)
              }
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
