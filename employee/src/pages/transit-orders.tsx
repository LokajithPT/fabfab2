import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Package,
  Plus,
  Search,
  X,
  Trash2,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Navigation,
  Barcode,
  FileText,
  ArrowRight,
  Building2,
  Factory,
  Store,
  User,
  Calendar,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransition, FadeIn } from '@/components/ui/page-transition';
import { Separator } from '@/components/ui/separator';

// --- MOCK DATA AND TYPES --- //

interface OrderInBatch {
  orderNumber: string;
  customerId: string;
  customerName: string;
  itemCount: number;
  status: string;
  serviceType?: string;
  weight?: number;
}

interface StoreDetails {
  name: string;
  address: string;
  phone: string;
  managerName: string;
  storeCode: string;
}

interface FactoryDetails {
  name: string;
  address: string;
  phone: string;
  managerName: string;
  factoryCode: string;
}

interface VehicleDetails {
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  driverLicense: string;
}

interface EmployeeDetails {
  name: string;
  employeeId: string;
  designation: string;
  phone: string;
}

interface TransitBatch {
  id: string;
  transitId: string;
  type: 'store_to_factory' | 'factory_to_store';
  origin: string;
  destination: string;
  createdBy: string;
  createdAt: string;
  status: 'in_transit' | 'completed';
  orders: OrderInBatch[];
  itemCount: number;
  storeDetails?: StoreDetails;
  factoryDetails?: FactoryDetails;
  vehicleDetails?: VehicleDetails;
  employeeDetails?: EmployeeDetails;
}

const mockTransitHistory: TransitBatch[] = [
  {
    id: '1',
    transitId: 'TRN-123456',
    type: 'store_to_factory',
    origin: 'FabZ Clean - Store #1',
    destination: 'FabZ Clean - Central Factory',
    createdBy: 'John Doe',
    createdAt: new Date().toISOString(),
    status: 'in_transit',
    itemCount: 15,
    orders: [
      { orderNumber: 'ORD-001', customerId: 'CUST-001', customerName: 'Rajesh Kumar', itemCount: 5, status: 'in_store', serviceType: 'Dry Clean', weight: 2.5 },
      { orderNumber: 'ORD-002', customerId: 'CUST-002', customerName: 'Priya Sharma', itemCount: 10, status: 'in_store', serviceType: 'Wash & Fold', weight: 5.0 },
    ],
  },
  {
    id: '2',
    transitId: 'TRN-789012',
    type: 'factory_to_store',
    origin: 'FabZ Clean - Central Factory',
    destination: 'FabZ Clean - Store #2',
    createdBy: 'Jane Smith',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    status: 'completed',
    itemCount: 8,
    orders: [
      { orderNumber: 'ORD-003', customerId: 'CUST-003', customerName: 'Amit Patel', itemCount: 8, status: 'completed', serviceType: 'Premium Laundry', weight: 4.0 },
    ],
  },
];

const mockRecentOrders: any[] = [
    { orderNumber: 'ORD-101', customerName: 'Anjali Mehta', items: { length: 3 }, createdAt: new Date().toISOString(), status: 'pending' },
    { orderNumber: 'ORD-102', customerName: 'Vikram Singh', items: { length: 5 }, createdAt: new Date().toISOString(), status: 'in_store' },
];

// --- END MOCK DATA --- //


// PDF Generation with Comprehensive Details - A4 Format
const generateTransitPDF = (
  transitId: string,
  orders: OrderInBatch[],
  batchType: 'store_to_factory' | 'factory_to_store',
  createdBy: string = 'Current User',
  storeDetails?: StoreDetails,
  factoryDetails?: FactoryDetails,
  vehicleDetails?: VehicleDetails,
  employeeDetails?: EmployeeDetails
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  let currentY = margin;

  const store: StoreDetails = storeDetails || { name: 'FabZ Clean - Store #1', address: '123 Main Street, Bangalore - 560001', phone: '+91 98765 43210', managerName: 'Rajesh Kumar', storeCode: 'STR001' };
  const factory: FactoryDetails = factoryDetails || { name: 'FabZ Clean - Central Factory', address: '456 Industrial Area, Bangalore - 560099', phone: '+91 98765 43211', managerName: 'Suresh Patel', factoryCode: 'FAC001' };
  const vehicle: VehicleDetails = vehicleDetails || { vehicleNumber: 'KA-01-AB-1234', vehicleType: 'Tempo Traveller', driverName: 'Vijay Singh', driverPhone: '+91 98765 43212', driverLicense: 'KA0120230012345' };
  const employee: EmployeeDetails = employeeDetails || { name: createdBy, employeeId: 'EMP' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'), designation: 'Store Executive', phone: '+91 98765 43213' };

  doc.text(`Transit ID: ${transitId}`, margin, currentY);
  currentY += 10;
  doc.text(`Type: ${batchType}`, margin, currentY);
  currentY += 10;

  const tableData = orders.map((order, index) => [
    (index + 1).toString(),
    order.orderNumber,
    order.customerName,
    order.itemCount.toString(),
  ]);

  autoTable(doc, {
    startY: currentY + 2,
    head: [['#', 'Order ID', 'Customer Name', 'Items']],
    body: tableData,
  });

  doc.save(`Transit_${transitId}.pdf`);
};

export default function TransitOrdersPage() {
  const { toast } = useToast();
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [currentBatch, setCurrentBatch] = useState<OrderInBatch[]>([]);
  const [batchType, setBatchType] = useState<'store_to_factory' | 'factory_to_store'>('store_to_factory');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [orderToRemove, setOrderToRemove] = useState<string | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<TransitBatch | null>(null);
  const [showTransitDetailsDialog, setShowTransitDetailsDialog] = useState(false);

  const [transitDetails, setTransitDetails] = useState({ vehicleNumber: 'KA-01-AB-1234', vehicleType: 'Tempo Traveller', driverName: 'Vijay Singh', driverPhone: '+91 98765 43212', driverLicense: 'KA0120230012345', employeeName: 'Current User', employeeId: 'EMP001', designation: 'Store Executive', phone: '+91 98765 43213' });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const transitHistory = mockTransitHistory;
  const recentOrders = mockRecentOrders;

  const handleStartNewBatch = () => {
    if (currentBatch.length > 0) {
      setShowClearConfirm(true);
    } else {
      startNewBatch();
    }
  };

  const startNewBatch = () => {
    setCurrentBatch([]);
    setBarcodeInput('');
    setIsScanning(true);
    setShowClearConfirm(false);
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  const handleAddOrder = () => {
    if (!barcodeInput.trim()) return;
    const orderId = barcodeInput.trim();
    if (currentBatch.some((order) => order.orderNumber === orderId)) {
      toast({ title: 'Error', description: 'Order already in batch', variant: 'destructive' });
      setBarcodeInput('');
      return;
    }
    const newOrder: OrderInBatch = { orderNumber: orderId, customerId: 'CUST-NEW', customerName: 'New Customer', itemCount: 5, status: 'in_store' };
    setCurrentBatch([...currentBatch, newOrder]);
    setBarcodeInput('');
    toast({ title: 'Order Added', description: `Order ${orderId} added to batch.` });
  };

  const handleRemoveOrder = (orderNumber: string) => {
    setOrderToRemove(orderNumber);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveOrder = () => {
    if (orderToRemove) {
      setCurrentBatch(currentBatch.filter((order) => order.orderNumber !== orderToRemove));
      toast({ title: 'Order Removed', description: `Order ${orderToRemove} removed from batch` });
    }
    setShowRemoveConfirm(false);
    setOrderToRemove(null);
  };

  const handleGenerateTransitCopy = () => {
    if (currentBatch.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one order to the batch', variant: 'destructive' });
      return;
    }
    setShowTransitDetailsDialog(true);
  };

  const confirmGenerateTransitCopy = () => {
    const transitId = `TRN-${Date.now().toString().slice(-6)}`;
    generateTransitPDF(transitId, currentBatch, batchType, transitDetails.employeeName);
    toast({ title: 'Transit Order Created', description: `Transit ID: ${transitId} - PDF downloaded.` });
    setCurrentBatch([]);
    setIsScanning(false);
    setBarcodeInput('');
    setShowTransitDetailsDialog(false);
  };

  const totalItems = currentBatch.reduce((sum, order) => sum + order.itemCount, 0);

  const filteredHistory = transitHistory.filter((batch) => {
    const matchesSearch = batch.transitId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    inTransit: transitHistory.filter((b) => b.status === 'in_transit').length,
    completed: transitHistory.filter((b) => b.status === 'completed').length,
    storeToFactory: transitHistory.filter((b) => b.type === 'store_to_factory').length,
    factoryToStore: transitHistory.filter((b) => b.type === 'factory_to_store').length,
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3"><Truck className="h-10 w-10 text-primary" />Transit Order Management</h1>
            <p className="text-muted-foreground mt-2">Create transit batches for store-to-factory and factory-to-store shipments</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={batchType} onValueChange={(value: any) => setBatchType(value)}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="store_to_factory"><div className="flex items-center gap-2"><Store className="h-4 w-4" />Store → Factory</div></SelectItem>
                <SelectItem value="factory_to_store"><div className="flex items-center gap-2"><Factory className="h-4 w-4" />Factory → Store</div></SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleStartNewBatch} size="lg" className="gap-2"><Plus className="h-5 w-5" />Start New Transit Batch</Button>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">In Transit</CardTitle><Clock className="h-4 w-4 text-yellow-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{stats.inTransit}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle2 className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.completed}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Store → Factory</CardTitle><Store className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{stats.storeToFactory}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Factory → Store</CardTitle><Factory className="h-4 w-4 text-purple-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{stats.factoryToStore}</div></CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Barcode className="h-5 w-5" />Current Batch{currentBatch.length > 0 && (<Badge variant="secondary" className="ml-auto">{currentBatch.length} orders • {totalItems} items</Badge>)}</CardTitle>
              <CardDescription>Scan order barcodes to add them to the current transit batch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="barcode-input">Scan or Enter Order ID</Label>
                <div className="flex gap-2">
                  <Input id="barcode-input" ref={barcodeInputRef} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { handleAddOrder(); } }} placeholder="Scan barcode or type Order ID..." disabled={!isScanning} className="flex-1" autoFocus />
                  <Button onClick={handleAddOrder} disabled={!isScanning || !barcodeInput.trim()}>Add</Button>
                </div>
              </div>

              {currentBatch.length > 0 ? (
                <div className="border rounded-lg"><Table><TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Order ID</TableHead><TableHead>Customer</TableHead><TableHead className="text-center">Items</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader><TableBody><AnimatePresence>{currentBatch.map((order, index) => (<motion.tr key={order.orderNumber} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="border-b"><TableCell className="font-medium">{index + 1}</TableCell><TableCell>{order.orderNumber}</TableCell><TableCell>{order.customerName}</TableCell><TableCell className="text-center">{order.itemCount} pcs</TableCell><TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveOrder(order.orderNumber)} className="h-8 w-8 text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button></TableCell></motion.tr>))}</AnimatePresence></TableBody></Table></div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground"><Package className="h-12 w-12 mx-auto mb-4 opacity-50" /><p className="font-medium">No orders in batch</p><p className="text-sm">{isScanning ? 'Scan order barcodes to add them to this batch' : 'Click "Start New Transit Batch" to begin'}</p></div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleGenerateTransitCopy} disabled={currentBatch.length === 0} className="flex-1 gap-2"><Printer className="h-4 w-4" />Generate Transit Copy</Button>
                <Button variant="outline" onClick={() => setShowClearConfirm(true)} disabled={currentBatch.length === 0} className="gap-2"><Trash2 className="h-4 w-4" />Clear Batch</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Transit History</CardTitle>
              <CardDescription>View and reprint past transit batches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by Transit ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="in_transit">In Transit</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredHistory.length > 0 ? (filteredHistory.map((batch) => (<motion.div key={batch.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border rounded-lg p-4 hover:shadow-md transition-shadow"><div className="flex items-start justify-between"><div className="space-y-2 flex-1"><div className="flex items-center gap-2"><h4 className="font-semibold">{batch.transitId}</h4><Badge variant={batch.status === 'completed' ? 'default' : 'secondary'} className={batch.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{batch.status === 'completed' ? 'Completed' : 'In Transit'}</Badge></div><div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground"><div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(batch.createdAt).toLocaleDateString()}</div><div className="flex items-center gap-1"><User className="h-3 w-3" />{batch.createdBy}</div><div className="flex items-center gap-1"><Package className="h-3 w-3" />{batch.itemCount} items</div><div className="flex items-center gap-1">{batch.type === 'store_to_factory' ? (<><Store className="h-3 w-3" />Store → Factory</>) : (<><Factory className="h-3 w-3" />Factory → Store</>)}</div></div></div><div className="flex flex-col gap-1"><Button variant="outline" size="sm" onClick={() => { setSelectedBatch(batch); setShowViewDialog(true); }} className="gap-1"><Eye className="h-3 w-3" />View</Button><Button variant="outline" size="sm" className="gap-1" onClick={() => { generateTransitPDF(batch.transitId, batch.orders, batch.type, batch.createdBy); toast({ title: 'Transit Copy Printed', description: `PDF for ${batch.transitId} downloaded successfully` }); }}><Printer className="h-3 w-3" />Print</Button></div></div></motion.div>))) : (<div className="text-center py-12 text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-4 opacity-50" /><p className="font-medium">No transit batches found</p><p className="text-sm">Create your first transit batch to get started</p></div>)}
              </div>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Clear Current Batch?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to discard the current batch? All {currentBatch.length} scanned order(s) will be removed. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={startNewBatch} className="bg-destructive hover:bg-destructive/90">Yes, Clear Batch</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove Order from Batch?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to remove Order ID <strong>{orderToRemove}</strong> from this batch?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setOrderToRemove(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmRemoveOrder} className="bg-destructive hover:bg-destructive/90">Yes, Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}><DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Transit Batch Details</DialogTitle><DialogDescription>{selectedBatch?.transitId} - {selectedBatch?.type === 'store_to_factory' ? 'Store to Factory' : 'Factory to Store'}</DialogDescription></DialogHeader>{selectedBatch && (<Tabs defaultValue="details" className="w-full"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="orders">Orders</TabsTrigger><TabsTrigger value="history">Status History</TabsTrigger></TabsList><TabsContent value="details" className="space-y-4 mt-4"></TabsContent><TabsContent value="orders" className="mt-4"></TabsContent><TabsContent value="history" className="mt-4"><p>Status history will be implemented later.</p></TabsContent></Tabs>)}<DialogFooter><Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button></DialogFooter></DialogContent></Dialog>

        <Dialog open={showTransitDetailsDialog} onOpenChange={setShowTransitDetailsDialog}><DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Transit Order Details</DialogTitle><DialogDescription>Please provide vehicle and employee details for this transit order</DialogDescription></DialogHeader><div className="space-y-6"></div><DialogFooter><Button variant="outline" onClick={() => setShowTransitDetailsDialog(false)}>Cancel</Button><Button onClick={confirmGenerateTransitCopy} className="gap-2" disabled={!transitDetails.vehicleNumber || !transitDetails.driverName || !transitDetails.employeeName}><Printer className="h-4 w-4" />Generate & Print Transit Copy</Button></DialogFooter></DialogContent></Dialog>
      </div>
    </PageTransition>
  );
}