import { useState, useEffect } from "react";
import {
  Eye,
  Edit,
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
  ChevronRight,
  Truck,
  Printer,
  X,
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
import { API_BASE_URL } from "../lib/config";
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
import { Card, CardContent } from "@/components/ui/card";
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
  const [editFormData, setEditFormData] = useState<Partial<Order>>({
    customerName: "",
    customerPhone: "",
    specialInstructions: "",
    pickupDate: "",
    status: "Pending",
  });
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [orderItemBarcodes, setOrderItemBarcodes] = useState<any[]>([]);
  const [showDetailedBarcodes, setShowDetailedBarcodes] = useState(false);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<number | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isPrintQRModalOpen, setIsPrintQRModalOpen] = useState(false);

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch services
  const fetchServices = async () => {
    try {
      const data: Service[] = await adminFetch(`${API_BASE_URL}/api/services`);
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
      const data: Order[] = await adminFetch(`${API_BASE_URL}/admin/api/orders`);
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

  // QR Code functions
  const handlePrintQR = () => {
    setIsPrintQRModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
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

  const handleView = async (order: Order) => {
    console.log("=== HANDLE VIEW CALLED ===");
    console.log("Order:", order);
    console.log("Order.serviceId:", order.serviceId);
    console.log("Order.service:", order.service);
    
    setViewOrder(order);
    // Generate individual item barcodes for this order
    try {
      console.log("Calling barcode API...");
      // Call backend to generate barcodes for existing order
      const response = await adminFetch(`${API_BASE_URL}/api/orders/${order.id}/barcodes`, {
        method: "POST",
      });
      
      console.log("API Response:", response);
      
      if (response.success) {
        console.log("✅ Success! Setting barcodes:", response.barcodes.items);
        console.log("🔍 Barcode URLs:", response.barcodes.items.map((item: any) => item.barcode_url));
        // Fix barcode URLs to include absolute path for standalone app
        const fixedBarcodes = response.barcodes.items.map((item: any) => ({
          ...item,
          barcode_url: item.barcode_url.startsWith('http') 
            ? item.barcode_url 
            : `${API_BASE_URL}${item.barcode_url}`
        }));
        console.log("🔧 Fixed URLs:", fixedBarcodes.map((item: any) => item.barcode_url));
        setOrderItemBarcodes(fixedBarcodes);
      } else {
        console.log("❌ API failed, using fallback...");
        // Fallback: Generate item barcodes on the fly
        const serviceIds = order.serviceId || [];
        const itemBarcodes = serviceIds.map((_, index) => ({
          item_number: index + 1,
          total_items: serviceIds.length,
service_name: order.service[index] || `Service ${index + 1}`,
          barcode_url: `${API_BASE_URL}/qr/${order.id}_item_${index + 1}.png`,
          item_data: `ORDER:${order.id}|ITEM:${index + 1}/${serviceIds.length}|CUSTOMER:${order.customerName}|SERVICE:${order.service[index] || `Service ${index + 1}`}`,
          display_data: `Order ${order.id} • Item ${index + 1}/${serviceIds.length} • ${order.service[index] || `Service ${index + 1}`}`
        }));
        console.log("🔄 Fallback barcodes:", itemBarcodes);
        setOrderItemBarcodes(itemBarcodes);
      }
    } catch (err) {
      console.error("💥 Error in barcode generation:", err);
      // Fallback: Generate item barcodes on the fly
      const serviceIds = order.serviceId || [];
      const itemBarcodes = serviceIds.map((_, index) => ({
        item_number: index + 1,
        total_items: serviceIds.length,
        service_name: order.service[index] || `Service ${index + 1}`,
          barcode_url: `${API_BASE_URL}/qr/${order.id}_item_${index + 1}.png`,
        item_data: `ORDER:${order.id}|ITEM:${index + 1}/${serviceIds.length}|CUSTOMER:${order.customerName}|SERVICE:${order.service[index] || `Service ${index + 1}`}`,
        display_data: `Order ${order.id} • Item ${index + 1}/${serviceIds.length} • ${order.service[index] || `Service ${index + 1}`}`
      }));
      console.log("🔄 Error fallback barcodes:", itemBarcodes);
      setOrderItemBarcodes(itemBarcodes);
    }
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

      await adminFetch(`${API_BASE_URL}/admin/api/orders/${orderToEdit.id}`, {
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

      {/* View Order Modal with QR Code */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details - #{viewOrder?.id}
            </DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-6 py-4">
              {/* Order Information Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Phone
                    </label>
                    <p>{viewOrder.customerPhone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Services ({viewOrder.service.length} items)
                    </label>
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                      {viewOrder.service.map((service, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedServiceIndex(index)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-xs font-semibold">{index + 1}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{service}</p>
                          </div>
                           <div className="flex items-center gap-1">
                             {orderItemBarcodes[index] && (
                               <div className="w-8 h-8 border border-gray-300 rounded p-1 bg-white">
                                 <img
                                   src={orderItemBarcodes[index].barcode_url}
                                   alt={`Item ${index + 1}`}
                                   className="w-full h-full object-contain"
                                   onError={(e) => {
                                     e.currentTarget.style.display = "none";
                                   }}
                                 />
                               </div>
                             )}
                             <ChevronRight className="h-4 w-4 text-gray-400" />
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Pickup Date
                    </label>
                    <p>{formatDate(viewOrder.pickupDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Total Items
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{viewOrder.service.length}</span>
                      </div>
                      <p className="font-semibold text-gray-900">{viewOrder.service.length} Services</p>
                    </div>
                  </div>
                </div>

                {/* Sexy Barcode Section */}
                <div className="flex flex-col items-center space-y-4">
                  {!showDetailedBarcodes ? (
                    /* Compact Summary View */
                    <div className="text-center space-y-4">
                      <div className="relative inline-block">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white text-2xl font-bold">{orderItemBarcodes.length}</span>
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {orderItemBarcodes.length} Items
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Order #{viewOrder.id} • Individual barcodes
                        </p>
                      </div>

                      <div className="flex justify-center mb-4">
                        <div
                          className="w-24 h-24 border-2 border-gray-200 rounded-xl p-2 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all bg-white"
                          onClick={handlePrintQR}
                        >
                          <img
src={`${API_BASE_URL}/qr/${viewOrder.id}.png`}
                            alt={`Order ${viewOrder.id}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              console.error("QR Code failed to load");
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <Button
                          onClick={() => setShowDetailedBarcodes(true)}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold"
                        >
                          <Eye className="h-5 w-5 mr-2" />
                          View All Barcodes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Detailed Grid View */
                    <div className="space-y-4 w-full">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">All Item Barcodes</h3>
                          <p className="text-sm text-gray-600">Order #{viewOrder.id}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDetailedBarcodes(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Sexy Grid Layout */}
                      <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
                        {orderItemBarcodes.map((item, index) => (
                          <div
                            key={index}
                            className="group relative bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-3 hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = item.barcode_url;
                              link.download = `order-${viewOrder.id}-item-${item.item_number}.png`;
                              link.click();
                            }}
                          >
                            {/* Item Number Badge */}
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                              {item.item_number}
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                              <div className="w-12 h-12 mx-auto border-2 border-white rounded-lg p-1 bg-white shadow-sm">
                                <img
                                  src={item.barcode_url}
                                  alt={`Item ${item.item_number}`}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              </div>
                              
                              <div className="text-center">
                                <p className="text-xs font-medium text-gray-900 truncate">
                                  {item.service_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.item_number}/{item.total_items}
                                </p>
                              </div>
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-xl transition-all" />
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-3 justify-center pt-4 border-t border-gray-200 px-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            orderItemBarcodes.forEach((item, index) => {
                              setTimeout(() => {
                                const link = document.createElement('a');
                                link.href = item.barcode_url;
                                link.download = `order-${viewOrder.id}-item-${item.item_number}.png`;
                                link.click();
                              }, index * 100);
                            });
                          }}
                          className="px-6 py-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download All
                        </Button>
                        <Button 
                          onClick={handlePrintQR} 
                          className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print All
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Total Amount
                  </label>
                  <p className="font-semibold text-green-600 text-lg">
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
                <div>
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

      {/* Individual Service Detail Modal */}
      <Dialog open={selectedServiceIndex !== null} onOpenChange={() => setSelectedServiceIndex(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Service Details - Item #{selectedServiceIndex !== null ? selectedServiceIndex + 1 : ''}
            </DialogTitle>
          </DialogHeader>
          {selectedServiceIndex !== null && viewOrder && (
            <div className="space-y-4 py-4">
              {/* Service Info */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Service Name</label>
                  <p className="font-semibold text-gray-900">{viewOrder.service[selectedServiceIndex]}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Item Number</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{selectedServiceIndex + 1}</span>
                    </div>
                    <p className="font-medium">Item {selectedServiceIndex + 1} of {viewOrder.service.length}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Order ID</label>
                  <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{viewOrder.id}</p>
                </div>
              </div>

                {/* Barcode Display */}
              <div className="flex flex-col items-center space-y-4">
                <label className="text-sm font-medium text-gray-500">Item Barcode</label>
                {orderItemBarcodes[selectedServiceIndex] ? (
                  <div className="space-y-3">
                    <div className="w-32 h-32 border-2 border-gray-300 rounded-xl p-3 bg-white shadow-lg">
                      <img
                        src={orderItemBarcodes[selectedServiceIndex].barcode_url}
                        alt={`Item ${selectedServiceIndex + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error("Barcode failed to load");
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-2">
                        {orderItemBarcodes[selectedServiceIndex].display_data || 
                         `Order ${viewOrder.id} • Item ${selectedServiceIndex + 1}/${viewOrder.service.length}`}
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = orderItemBarcodes[selectedServiceIndex].barcode_url;
                          link.download = `order-${viewOrder.id}-item-${orderItemBarcodes[selectedServiceIndex].item_number}.png`;
                          link.click();
                        }}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.print()}
                        className="flex-1"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">Barcode not available</p>
                    <p className="text-gray-400 text-xs mt-1">Generate barcodes to view item details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print QR Modal */}
      <Dialog open={isPrintQRModalOpen} onOpenChange={setIsPrintQRModalOpen}>
        <DialogContent className="max-w-lg print:shadow-none print:border-none">
          <div className="print:block">
            <DialogHeader className="print:hidden">
              <DialogTitle className="text-center">
                Print QR Code - Order #{viewOrder?.id}
              </DialogTitle>
            </DialogHeader>

            <div className="py-6 text-center space-y-4 print:py-8">
              <div className="print:mb-6">
                <h2 className="text-xl font-bold print:text-2xl">
                  FabClean Laundry
                </h2>
                <p className="text-sm text-gray-600 print:text-base">
                  Order Tracking QR Code
                </p>
              </div>

              {viewOrder && (
                <>
                  <div className="mx-auto w-64 h-64 print:w-80 print:h-80">
                    <img
                      src={`${API_BASE_URL}/qr/${viewOrder.id}.png`}
                      alt={`QR Code for Order ${viewOrder.id}`}
                      className="w-full h-full object-contain border border-gray-300"
                    />
                  </div>

                  <div className="space-y-2 print:space-y-3">
                    <p className="font-mono text-lg print:text-xl">
                      Order #{viewOrder.id}
                    </p>
                    <p className="text-sm print:text-base">
                      Customer: {viewOrder.customerName}
                    </p>
                    <p className="text-sm print:text-base">
                      Phone: {viewOrder.customerPhone}
                    </p>
                    {viewOrder.pickupDate && (
                      <p className="text-sm print:text-base">
                        Pickup: {formatDate(viewOrder.pickupDate)}
                      </p>
                    )}
                    <p className="text-sm print:text-base font-semibold">
                      Total: {formatCurrency(viewOrder.total)}
                    </p>
                    <div className="flex justify-center">
                      {getStatusBadge(viewOrder.status)}
                    </div>
                  </div>
                </>
              )}

              <div className="text-xs text-gray-500 print:text-sm print:mt-8">
                <p>Scan this QR code to track your order</p>
                <p>Keep this receipt safe</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center mt-6 print:hidden">
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Now
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsPrintQRModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
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



      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:block,
            .print\\:block * {
              visibility: visible;
            }
            .print\\:block {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `
      }} />
    </div>
  );
}
