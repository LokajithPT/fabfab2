import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Package,
  Plus,
  Search,
  X,
  Trash2,
  CheckCircle2,
  Clock,
  FileText,
  Store,
  Factory,
  User,
  Calendar,
  Eye,
  Check,
  ArrowLeftRight,
} from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransition } from '@/components/ui/page-transition';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- API Functions --- //
const apiFetch = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed: ${response.statusText}`);
    }
    return response.json();
};

const fetchTransitBatches = () => apiFetch('/admin/api/transit-batches');
const fetchOrders = () => apiFetch('/admin/api/orders');
const createTransitBatch = (batchData) => apiFetch('/admin/api/transit-batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchData),
});
const updateBatchStatus = (batchId, action) => apiFetch(`/admin/api/transit-batches/${batchId}/${action}`, { method: 'PUT' });


export default function TransitOrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentBatch, setCurrentBatch] = useState<any[]>(() => {
    const savedBatch = localStorage.getItem('currentTransitBatch');
    return savedBatch ? JSON.parse(savedBatch) : [];
  });
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [preppingForReturn, setPreppingForReturn] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    localStorage.setItem('currentTransitBatch', JSON.stringify(currentBatch));
  }, [currentBatch]);

  // --- React Query Data Fetching ---
  const { data: transitHistory = [], isLoading: isLoadingHistory } = useQuery({ queryKey: ['transitBatches'], queryFn: fetchTransitBatches });
  const { data: allOrders = [], isLoading: isLoadingOrders } = useQuery({ queryKey: ['orders'], queryFn: fetchOrders });

  // --- Memoized Filtered Lists ---
  const availableOrders = useMemo(() => {
    if (isLoadingOrders) return [];
    const batchOrderIds = new Set(currentBatch.map(o => o.id));
    return allOrders.filter(order => order.status === 'At Store' && !batchOrderIds.has(order.id));
  }, [allOrders, currentBatch, isLoadingOrders]);

  const filteredHistory = useMemo(() => transitHistory.filter(batch => 
    (batch.transitId.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (statusFilter === 'all' || batch.status.toLowerCase() === statusFilter) &&
    (typeFilter === 'all' || batch.type === typeFilter)
  ), [transitHistory, searchQuery, statusFilter, typeFilter]);

  // --- React Query Mutations ---
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transitBatches'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
        console.error("Mutation failed:", error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const createBatchMutation = useMutation({ ...mutationOptions, mutationFn: createTransitBatch, onSuccess: (...args) => { mutationOptions.onSuccess(...args); toast({ title: 'Success', description: 'Transit batch created successfully.' }); setCurrentBatch([]); localStorage.removeItem('currentTransitBatch'); } });
  const statusUpdateMutation = useMutation({ ...mutationOptions, mutationFn: ({ batchId, action }) => updateBatchStatus(batchId, action), onSuccess: (...args) => { mutationOptions.onSuccess(...args); toast({ title: 'Success', description: 'Batch status updated.' }); } });

  const handleAddOrderToBatch = (order: any) => setCurrentBatch(prev => [...prev, order]);
  const handleRemoveOrderFromBatch = (orderId: string) => setCurrentBatch(prev => prev.filter(o => o.id !== orderId));

  const handleCreateBatch = (type: 'STORE_TO_FACTORY' | 'FACTORY_TO_STORE', orders: any[]) => {
    if (orders.length === 0) {
      toast({ title: 'Error', description: 'Cannot create an empty batch.', variant: 'destructive' });
      return;
    }
    createBatchMutation.mutate({ order_ids: orders.map(o => o.id), type, created_by: 'Admin' });
  };

  const stats = {
    inTransit: transitHistory.filter(b => b.status === 'IN_TRANSIT').length,
    completed: transitHistory.filter(b => b.status === 'COMPLETED').length,
    pending: transitHistory.filter(b => b.status === 'PENDING').length,
    arrived: transitHistory.filter(b => b.status === 'ARRIVED').length,
  };

  const renderActionButtons = (batch) => {
    switch (batch.status) {
        case 'PENDING':
            return <Button size="sm" onClick={() => statusUpdateMutation.mutate({ batchId: batch.id, action: 'initiate' })} className="gap-1 bg-blue-600 hover:bg-blue-700"><Truck className="h-3 w-3" />Initiate</Button>;
        case 'IN_TRANSIT':
            return <Button size="sm" onClick={() => statusUpdateMutation.mutate({ batchId: batch.id, action: 'receive' })} className="gap-1 bg-green-600 hover:bg-green-700"><Check className="h-3 w-3" />Receive</Button>;
        case 'ARRIVED':
            if (batch.type === 'STORE_TO_FACTORY') {
                return <Button size="sm" onClick={() => statusUpdateMutation.mutate({ batchId: batch.id, action: 'complete' })} className="gap-1 bg-green-600 hover:bg-green-700"><CheckCircle2 className="h-3 w-3" />Complete</Button>;
            }
            if (batch.type === 'FACTORY_TO_STORE') {
                return <Button size="sm" onClick={() => statusUpdateMutation.mutate({ batchId: batch.id, action: 'complete' })} className="gap-1 bg-teal-600 hover:bg-teal-700"><CheckCircle2 className="h-3 w-3" />Complete</Button>;
            }
            return null;
        case 'COMPLETED':
            if (batch.type === 'STORE_TO_FACTORY') {
                const arrivedOrders = allOrders.filter(o => batch.orders.some(bo => bo.id === o.id));
                return <Button size="sm" onClick={() => {
                  setPreppingForReturn(prev => [...prev, batch.id]);
                  handleCreateBatch('FACTORY_TO_STORE', arrivedOrders);
                }}
                disabled={preppingForReturn.includes(batch.id)}
                className="gap-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                ><ArrowLeftRight className="h-3 w-3" />{preppingForReturn.includes(batch.id) ? 'Processing...' : 'Prep for Return'}</Button>;
            }
            return null;
        default:
            return null;
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background p-6 space-y-6">
        <header className="flex items-center justify-between">
            <div>
                <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3"><Truck className="h-10 w-10 text-primary" />Transit Management</h1>
                <p className="text-muted-foreground mt-2">Manage shipments between store and factory.</p>
            </div>
            <Button onClick={() => setShowRawData(!showRawData)} variant="outline">{showRawData ? 'Hide' : 'Show'} Raw Order Data</Button>
        </header>

        {showRawData && (
            <Card>
                <CardHeader><CardTitle>Raw Order Data</CardTitle></CardHeader>
                <CardContent>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-x-auto">{JSON.stringify(allOrders, null, 2)}</pre>
                </CardContent>
            </Card>
        )}

        <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-yellow-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">In Transit</CardTitle><Truck className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{stats.inTransit}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Arrived</CardTitle><Check className="h-4 w-4 text-indigo-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-indigo-600">{stats.arrived}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle2 className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.completed}</div></CardContent></Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Available Orders for Transit</CardTitle>
                <CardDescription>Click an order to add it to the current batch. Only orders with status "At Store" are shown.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                    {isLoadingOrders ? <p className='p-4'>Loading...</p> : availableOrders.length > 0 ? (
                        <Table>
                            <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Customer</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {availableOrders.map(order => (
                                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleAddOrderToBatch(order)}>
                                        <TableCell>{order.id}</TableCell>
                                        <TableCell>{order.customerName}</TableCell>
                                        <TableCell><Button variant="ghost" size="sm"><Plus className="h-4 w-4 mr-2" />Add</Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground"><CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No orders available for transit.</p></div>
                    )}
                </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Current Batch</CardTitle>
              <CardDescription>Orders to be included in the new transit batch.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentBatch.length > 0 ? (
                <div className="border rounded-lg"><Table><TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Customer</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader><TableBody><AnimatePresence>{currentBatch.map((order) => (<motion.tr key={order.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="border-b"><TableCell>{order.id}</TableCell><TableCell>{order.customerName}</TableCell><TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveOrderFromBatch(order.id)} className="h-8 w-8 text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button></TableCell></motion.tr>))}</AnimatePresence></TableBody></Table></div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground"><Package className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No orders in batch.</p></div>
              )}
              <div className="flex gap-2">
                <Button onClick={() => handleCreateBatch('STORE_TO_FACTORY', currentBatch)} disabled={currentBatch.length === 0} className="flex-1 gap-2"><Plus className="h-4 w-4" />Create Batch ({currentBatch.length})</Button>
                <Button variant="outline" onClick={() => setShowClearConfirm(true)} disabled={currentBatch.length === 0} className="gap-2"><Trash2 className="h-4 w-4" />Clear</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Transit History</CardTitle>
              <CardDescription>View and manage past and present transit batches.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Search by Transit ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="IN_TRANSIT">In Transit</SelectItem><SelectItem value="ARRIVED">Arrived</SelectItem><SelectItem value="COMPLETED">Completed</SelectItem></SelectContent></Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="STORE_TO_FACTORY">Store to Factory</SelectItem><SelectItem value="FACTORY_TO_STORE">Factory to Store</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {isLoadingHistory ? <p>Loading...</p> : filteredHistory.map(batch => (
                    <motion.div key={batch.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                                <h4 className="font-semibold">{batch.transitId}</h4>
                                <Badge>{batch.status}</Badge>
                                <div className="text-sm text-muted-foreground">{batch.type}</div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Button variant="outline" size="sm" onClick={() => { setSelectedBatch(batch); setShowViewDialog(true); }}><Eye className="h-3 w-3" /> View</Button>
                                {renderActionButtons(batch)}
                            </div>
                        </div>
                    </motion.div>
                ))}
              </div>
            </CardContent>
        </Card>

        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Clear Current Batch?</AlertDialogTitle><AlertDialogDescription>This will remove all orders from the current batch. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => setCurrentBatch([])} className="bg-destructive hover:bg-destructive/90">Yes, Clear</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Transit Batch Details</DialogTitle>
                    <DialogDescription>{selectedBatch?.transitId} - {selectedBatch?.type === 'STORE_TO_FACTORY' ? 'Store to Factory' : 'Factory to Store'}</DialogDescription>
                </DialogHeader>
                {selectedBatch && (
                    <Tabs defaultValue="orders" className="w-full">
                        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="orders">Orders ({selectedBatch.orders?.length || 0})</TabsTrigger><TabsTrigger value="details">Details</TabsTrigger></TabsList>
                        <TabsContent value="orders" className="mt-4">
                            <Table>
                                <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Customer</TableHead><TableHead>Services</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                <TableBody>{selectedBatch.orders?.map(o => (<TableRow key={o.id}><TableCell>{o.id}</TableCell><TableCell>{o.customerName}</TableCell><TableCell>{o.service.join(', ')}</TableCell><TableCell><Badge>{o.status}</Badge></TableCell></TableRow>))}</TableBody>
                            </Table>
                        </TabsContent>
                        <TabsContent value="details" className="mt-4"><p>More details here later...</p></TabsContent>
                    </Tabs>
                )}
                <DialogFooter><Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button></DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}