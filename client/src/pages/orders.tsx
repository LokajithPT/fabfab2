import { useState, useEffect } from "react";
import {
  Eye,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Calendar,
  Phone,
  IndianRupee,
  Package,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Truck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";

// Enhanced admin fetch with better error handling
const adminFetch = async (url: string, options: RequestInit = {}) => {
  try {
    const token = localStorage.getItem("token"); // grab the auth token
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Network error. Please check your connection.");
    }
    throw error;
  }
};

interface Service {
  id: string;
  name: string;
  price: string;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  service: string[];
  serviceId: string[];
  specialInstructions: string;
  pickupDate: string;
  total: number;
  status?: "Pending" | "Processing" | "Completed" | "Cancelled";
  createdAt?: string;
}

type SortField = keyof Order;

export default function OrdersTable() {
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Order>>({});
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Fetch services
  const fetchServices = async () => {
    try {
      const data: Service[] = await adminFetch("/api/services");
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services:", err);
      toast({
        title: "Error",
        description: "Failed to fetch services",
        variant: "destructive",
      });
    }
  };

  // Fetch orders with loading state
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data: Order[] = await adminFetch("/admin/api/orders");
      setOrders(data);
      setFilteredOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchServices();
  }, []);

  // Enhanced filtering and sorting
  useEffect(() => {
    let tempOrders = [...orders];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      tempOrders = tempOrders.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.customerPhone.includes(query) ||
          order.service.join(", ").toLowerCase().includes(query) ||
          (order.specialInstructions &&
            order.specialInstructions.toLowerCase().includes(query)),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      tempOrders = tempOrders.filter((order) => order.status === statusFilter);
    }

    // Apply sorting
    if (sortField) {
      tempOrders.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (aVal === undefined || bVal === undefined) return 0;
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }

    setFilteredOrders(tempOrders);
  }, [orders, searchQuery, statusFilter, sortField, sortDirection]);

  // Enhanced sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Service selection handlers for edit modal
  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  // Calculate total for selected services
  const calculateTotal = () => {
    const selectedServices = services.filter((s) =>
      selectedServiceIds.includes(s.id),
    );
    return selectedServices.reduce((acc, s) => acc + parseFloat(s.price), 0);
  };

  // Export functions
  const exportToCSV = () => {
    setExportLoading(true);
    try {
      const headers = [
        "Order ID",
        "Customer Name",
        "Phone",
        "Service",
        "Pickup Date",
        "Total Amount",
        "Status",
        "Special Instructions",
        "Created At",
      ];
      const csvContent = [
        headers.join(","),
        ...filteredOrders.map((order) =>
          [
            `"${order.id}"`,
            `"${order.customerName}"`,
            `"${order.customerPhone}"`,
            `"${order.service.join(", ")}"`,
            `"${formatDate(order.pickupDate)}"`,
            `"${order.total}"`,
            `"${order.status || "Pending"}"`,
            `"${(order.specialInstructions || "").replace(/"/g, '""')}"`,
            `"${order.createdAt ? formatDate(order.createdAt) : "N/A"}"`,
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `orders_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `Exported ${filteredOrders.length} orders to CSV`,
      });
      setShowExportDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export CSV",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const exportToPDF = () => {
    setExportLoading(true);
    try {
      // Create a simple HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Orders Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .summary { margin-bottom: 20px; background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .status { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
            .status-pending { background-color: #fef3c7; color: #92400e; }
            .status-processing { background-color: #dbeafe; color: #1e40af; }
            .status-completed { background-color: #d1fae5; color: #065f46; }
            .status-cancelled { background-color: #fee2e2; color: #991b1b; }
            .amount { font-weight: bold; color: #059669; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Orders Report</h1>
            <p>Generated on ${new Date().toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Orders:</strong> ${filteredOrders.length}</p>
            <p><strong>Total Revenue:</strong> ₹${filteredOrders.reduce((sum, order) => sum + order.total, 0).toLocaleString("en-IN")}</p>
            <p><strong>Status Breakdown:</strong></p>
            <ul>
              <li>Pending: ${filteredOrders.filter((o) => (o.status || "Pending") === "Pending").length}</li>
              <li>Processing: ${filteredOrders.filter((o) => o.status === "Processing").length}</li>
              <li>Completed: ${filteredOrders.filter((o) => o.status === "Completed").length}</li>
              <li>Cancelled: ${filteredOrders.filter((o) => o.status === "Cancelled").length}</li>
            </ul>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Service</th>
                <th>Pickup Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders
                .map(
                  (order) => `
                <tr>
                  <td>#${order.id}</td>
                  <td>${order.customerName}</td>
                  <td>${order.customerPhone}</td>
                  <td>${order.service.join(", ")}</td>
                  <td>${formatDate(order.pickupDate)}</td>
                  <td class="amount">₹${order.total.toLocaleString("en-IN")}</td>
                  <td>
                    <span class="status status-${(order.status || "Pending").toLowerCase()}">
                      ${order.status || "Pending"}
                    </span>
                  </td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Create a new window and print
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        // Wait for content to load, then print
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);

        toast({
          title: "Success",
          description: `Generated PDF report with ${filteredOrders.length} orders`,
        });
        setShowExportDialog(true);
      } else {
        throw new Error("Unable to open print window");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "Failed to export PDF. Please allow pop-ups and try again.",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Action handlers
  const handleRefresh = async () => {
    await fetchOrders();
    toast({
      title: "Success",
      description: "Orders refreshed successfully",
    });
  };

  const handleView = (order: Order) => {
    setViewOrder(order);
  };

  const handleEdit = (order: Order) => {
    setOrderToEdit(order);
    setEditFormData({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      specialInstructions: order.specialInstructions,
      pickupDate: order.pickupDate ? order.pickupDate.split("T")[0] : "",
      status: order.status || "Pending",
    });
    // Set selected service IDs based on the order's serviceId array
    setSelectedServiceIds(order.serviceId || []);
  };

  const handleDelete = (order: Order) => {
    setOrderToDelete(order);
  };

  const confirmEdit = async () => {
    if (!orderToEdit) return;

    setLoading(true);
    try {
      // Get selected service details
      const selectedServices = services.filter((s) =>
        selectedServiceIds.includes(s.id),
      );

      const payload = {
        ...editFormData,
        serviceIds: selectedServiceIds, // Array of service IDs
        serviceId: selectedServiceIds.join(","), // Comma-separated IDs if needed
        service: selectedServices.map((s) => s.name).join(", "), // Service names
        total: calculateTotal(),
      };

      await adminFetch(`/admin/api/orders/${orderToEdit.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const updatedOrder = {
        ...orderToEdit,
        ...editFormData,
        serviceId: selectedServiceIds,
        service: selectedServices.map((s) => s.name),
        total: calculateTotal(),
      } as Order;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderToEdit.id ? updatedOrder : o)),
      );

      toast({
        title: "Success",
        description: `Order ${orderToEdit.id} updated successfully`,
      });
      setOrderToEdit(null);
      setEditFormData({});
      setSelectedServiceIds([]);
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;

    setLoading(true);
    try {
      await adminFetch(`/admin/api/orders/${orderToDelete.id}`, {
        method: "DELETE",
      });
      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      toast({
        title: "Success",
        description: `Order ${orderToDelete.id} deleted successfully`,
      });
      setOrderToDelete(null);
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Order["status"]) => {
    const variants = {
      Pending: "bg-amber-100 text-amber-800 border-amber-200",
      Processing: "bg-blue-100 text-blue-800 border-blue-200",
      Completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
      Cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      <Badge className={`${variants[status || "Pending"]} font-medium`}>
        {status || "Pending"}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Orders Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and track all customer orders ({filteredOrders.length} total)
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={exportLoading || filteredOrders.length === 0}
              >
                {exportLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToCSV} disabled={exportLoading}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} disabled={exportLoading}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <Button onClick={() => setLocation("/create-order")} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders, customers, services..."
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
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {[
                    { key: "id", label: "Order ID", icon: Package },
                    { key: "customerName", label: "Customer", icon: null },
                    { key: "service", label: "Service", icon: null },
                    { key: "pickupDate", label: "Pickup Date", icon: Calendar },
                    { key: "total", label: "Total", icon: IndianRupee },
                  ].map(({ key, label, icon: Icon }) => (
                    <TableHead
                      key={key}
                      className="cursor-pointer hover:bg-gray-100 transition-colors font-semibold"
                      onClick={() => handleSort(key as SortField)}
                    >
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4" />}
                        {label}
                        {sortField === key &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3 text-blue-600" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-blue-600" />
                          ))}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">Loading orders...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        No orders found
                      </p>
                      <p className="text-gray-400 text-sm">
                        {searchQuery || statusFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Create your first order to get started"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-mono text-sm font-medium text-blue-600">
                        #{order.id}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {order.customerPhone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.service.join(", ")}
                      </TableCell>
                      <TableCell>{formatDate(order.pickupDate)}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleView(order)}
                            className="h-8 w-8 p-0 hover:bg-blue-100"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(order)}
                            className="h-8 w-8 p-0 hover:bg-green-100"
                          >
                            <Edit className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(order)}
                            className="h-8 w-8 p-0 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Export Success Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Download className="h-5 w-5" />
              Export Successful
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Your orders data has been exported successfully! The file should
              be downloading or have opened in a new window.
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Exported:</strong> {filteredOrders.length} orders
              </p>
              <p className="text-sm text-blue-600 mt-1">
                If the download didn't start automatically, please check your
                browser's download folder or allow pop-ups for this site.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowExportDialog(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Modal */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details - #{viewOrder?.id}
            </DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Customer
                  </label>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(viewOrder.total)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <div className="mt-1">{getStatusBadge(viewOrder.status)}</div>
                </div>
              </div>
              {viewOrder.specialInstructions && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">
                    Special Instructions
                  </label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                    {viewOrder.specialInstructions}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Modal */}
      <Dialog open={!!orderToEdit} onOpenChange={() => setOrderToEdit(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Order - #{orderToEdit?.id}
            </DialogTitle>
          </DialogHeader>
          {orderToEdit && (
            <div className="space-y-6 py-4">
              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-customer-name">Customer Name</Label>
                    <Input
                      id="edit-customer-name"
                      value={editFormData.customerName || ""}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          customerName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-customer-phone">Phone</Label>
                    <Input
                      id="edit-customer-phone"
                      value={editFormData.customerPhone || ""}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          customerPhone: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-pickup-date">Pickup Date</Label>
                    <Input
                      id="edit-pickup-date"
                      type="date"
                      value={editFormData.pickupDate || ""}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          pickupDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editFormData.status || "Pending"}
                      onValueChange={(value) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          status: value as Order["status"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Truck className="h-4 w-4" />
                  Select Services *
                </Label>
                <div className="space-y-3 max-h-64 overflow-y-auto border rounded-md p-4 bg-gray-50">
                  {services.length === 0 ? (
                    <p className="text-gray-500">Loading services...</p>
                  ) : (
                    services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center space-x-3 p-3 hover:bg-white rounded-md transition-colors"
                      >
                        <Checkbox
                          id={`edit-service-${service.id}`}
                          checked={selectedServiceIds.includes(service.id)}
                          onCheckedChange={() =>
                            handleServiceChange(service.id)
                          }
                        />
                        <label
                          htmlFor={`edit-service-${service.id}`}
                          className="flex-1 text-sm font-medium leading-none cursor-pointer"
                        >
                          <div className="flex justify-between items-center">
                            <span>{service.name}</span>
                            <span className="text-green-600 font-semibold">
                              ₹{parseFloat(service.price).toFixed(2)}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {selectedServiceIds.length > 0 && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>{selectedServiceIds.length}</strong> service
                      {selectedServiceIds.length !== 1 ? "s" : ""} selected
                    </p>
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      Total: ₹{calculateTotal().toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Special Instructions */}
              <div>
                <Label htmlFor="edit-special-instructions">
                  Special Instructions
                </Label>
                <Textarea
                  id="edit-special-instructions"
                  placeholder="Enter any special instructions..."
                  value={editFormData.specialInstructions || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      specialInstructions: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOrderToEdit(null);
                setSelectedServiceIds([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmEdit}
              disabled={loading || selectedServiceIds.length === 0}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!orderToDelete}
        onOpenChange={() => setOrderToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete order{" "}
              <strong>#{orderToDelete?.id}</strong>?
            </p>
            <p className="text-sm text-red-600 mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
