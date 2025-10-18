import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Package, Plus, X, Check, CheckCircle2, Clock, FileText, ArrowLeftRight, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransition } from '@/components/ui/page-transition';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- Backend BASE URL ---
const BASE_URL = 'http://localhost:5005'; // change if your backend is on another host

// --- API Functions ---
const apiFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed: ${response.statusText}`);
  }
  return response.json();
};

const fetchTransitBatches = () => apiFetch(`${BASE_URL}/employee/api/transit-batches`);
const fetchOrders = () => apiFetch(`${BASE_URL}/employee/api/orders`);
const createTransitBatch = (batchData: any) =>
  apiFetch(`${BASE_URL}/employee/api/transit-batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchData),
  });
const updateBatchStatus = (batchId: string, action: string) =>
  apiFetch(`${BASE_URL}/employee/api/transit-batches/${batchId}/${action}`, { method: 'PUT' });

export default function TransitOrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentBatch, setCurrentBatch] = useState<any[]>(() => {
    const saved = localStorage.getItem('currentTransitBatch');
    return saved ? JSON.parse(saved) : [];
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

  // --- Data ---
  const { data: transitHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['transitBatches'],
    queryFn: fetchTransitBatches,
  });

  const { data: allOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  });

  // --- Derived lists ---
  const availableOrders = useMemo(() => {
    if (isLoadingOrders) return [];
    const ids = new Set(currentBatch.map((o) => o.id));
    return allOrders.filter((o) => o.status === 'At Store' && !ids.has(o.id));
  }, [allOrders, currentBatch, isLoadingOrders]);

  const filteredHistory = useMemo(
    () =>
      transitHistory.filter((batch: any) => {
        const matchesSearch = batch.transitId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || batch.status.toLowerCase() === statusFilter.toLowerCase();
        const matchesType = typeFilter === 'all' || batch.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      }),
    [transitHistory, searchQuery, statusFilter, typeFilter]
  );

  // --- Mutations ---
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transitBatches'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  };

  const createBatchMutation = useMutation({
    ...mutationOptions,
    mutationFn: createTransitBatch,
    onSuccess: (...args) => {
      mutationOptions.onSuccess(...args);
      toast({ title: 'Success', description: 'Transit batch created successfully.' });
      setCurrentBatch([]);
      localStorage.removeItem('currentTransitBatch');
    },
  });

  const statusUpdateMutation = useMutation({
    ...mutationOptions,
    mutationFn: ({ batchId, action }: { batchId: string; action: string }) => updateBatchStatus(batchId, action),
    onSuccess: (...args) => {
      mutationOptions.onSuccess(...args);
      toast({ title: 'Success', description: 'Batch status updated.' });
    },
  });

  // --- Handlers ---
  const handleAddOrderToBatch = (order: any) => setCurrentBatch((prev) => [...prev, order]);
  const handleRemoveOrderFromBatch = (orderId: string) => setCurrentBatch((prev) => prev.filter((o) => o.id !== orderId));

  const handleCreateBatch = (type: 'STORE_TO_FACTORY' | 'FACTORY_TO_STORE', orders: any[]) => {
    if (!orders || orders.length === 0) {
      toast({ title: 'Error', description: 'Cannot create an empty batch.', variant: 'destructive' });
      return;
    }
    createBatchMutation.mutate({ order_ids: orders.map((o) => o.id), type, created_by: 'Admin' });
  };

  const stats = {
    inTransit: transitHistory.filter((b: any) => b.status === 'IN_TRANSIT').length,
    completed: transitHistory.filter((b: any) => b.status === 'COMPLETED').length,
    pending: transitHistory.filter((b: any) => b.status === 'PENDING').length,
    arrived: transitHistory.filter((b: any) => b.status === 'ARRIVED').length,
  };

  const baseBtnStyle = 'flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm';

  const renderActionButtons = (batch: any) => {
    switch (batch.status) {
      case 'PENDING':
        return (
          <Button onClick={() => statusUpdateMutation.mutate({ batchId: batch.id, action: 'initiate' })} className={`${baseBtnStyle} bg-blue-600 hover:bg-blue-700 text-white`}>
            <Truck className="h-4 w-4" /> Initiate
          </Button>
        );
      case 'IN_TRANSIT':
        return (
          <Button onClick={() => statusUpdateMutation.mutate({ batchId: batch.id, action: 'receive' })} className={`${baseBtnStyle} bg-green-600 hover:bg-green-700 text-white`}>
            <Check className="h-4 w-4" /> Receive
          </Button>
        );
      case 'ARRIVED':
        return (
          <Button onClick={() => statusUpdateMutation.mutate({ batchId: batch.id, action: 'complete' })} className={`${baseBtnStyle} bg-emerald-600 hover:bg-emerald-700 text-white`}>
            <CheckCircle2 className="h-4 w-4" /> Complete
          </Button>
        );
      case 'COMPLETED':
        if (batch.type === 'STORE_TO_FACTORY') {
          const arrivedOrders = allOrders.filter((o: any) => batch.orders.some((bo: any) => bo.id === o.id));
          return (
            <Button
              onClick={() => {
                setPreppingForReturn((prev) => [...prev, batch.id]);
                handleCreateBatch('FACTORY_TO_STORE', arrivedOrders);
              }}
              disabled={preppingForReturn.includes(batch.id)}
              className={`${baseBtnStyle} ${preppingForReturn.includes(batch.id) ? 'bg-purple-400 text-white opacity-70 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
            >
              <ArrowLeftRight className="h-4 w-4" />
              {preppingForReturn.includes(batch.id) ? 'Processing...' : 'Prep for Return'}
            </Button>
          );
        }
        return null;
      default:
        return null;
    }
  };

  // --- UI ---
  return (
    <PageTransition>
      <div className="min-h-screen bg-background p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3"><Truck className="h-10 w-10 text-primary" /> Transit Management</h1>
            <p className="text-muted-foreground mt-2">Manage shipments between store and factory.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowRawData(!showRawData)} variant="outline">{showRawData ? 'Hide' : 'Show'} Raw Order Data</Button>
          </div>
        </header>

        {/* Raw Data Toggle */}
        {showRawData && (
          <Card>
            <CardHeader><CardTitle>Raw Order Data</CardTitle></CardHeader>
            <CardContent><pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-x-auto">{JSON.stringify(allOrders, null, 2)}</pre></CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-yellow-600" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">In Transit</CardTitle><Truck className="h-4 w-4 text-blue-600" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600">{stats.inTransit}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Arrived</CardTitle><Check className="h-4 w-4 text-indigo-600" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-indigo-600">{stats.arrived}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle2 className="h-4 w-4 text-green-600" /></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{stats.completed}</div></CardContent>
          </Card>
        </div>

        {/* Orders + Current Batch */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Available Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Available Orders for Transit</CardTitle>
              <CardDescription>Click an order to add it to the current batch. Only orders with status "At Store" are shown.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                {isLoadingOrders ? <p className="p-4">Loading...</p> : availableOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableOrders.map((order: any) => (
                        <TableRow key={order.id} className="hover:bg-muted/50">
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>
                            <Button onClick={() => handleAddOrderToBatch(order)} className={`${baseBtnStyle} px-3 py-1 rounded-md bg-slate-50 hover:bg-slate-100 border`}>
                              <Plus className="h-4 w-4" /> Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <div className="text-center py-12 text-muted-foreground"><CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No orders available for transit.</p></div>}
              </div>
            </CardContent>
          </Card>

          {/* Current Batch */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Current Batch</CardTitle>
              <CardDescription>Orders to be included in the new transit batch.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentBatch.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="w-12"> </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {currentBatch.map((order) => (
                          <motion.tr key={order.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="border-b">
                            <TableCell>{order.id}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveOrderFromBatch(order.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              ) : <div className="border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground"><Package className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No orders in batch.</p></div>}

              <div className="flex gap-2">
                <Button onClick={() => handleCreateBatch('STORE_TO_FACTORY', currentBatch)} disabled={currentBatch.length === 0} className={`${baseBtnStyle} flex-1 bg-blue-600 hover:bg-blue-700 text-white`}>
                  <Plus className="h-4 w-4" /> Create Batch ({currentBatch.length})
                </Button>
                <Button variant="outline" onClick={() => setShowClearConfirm(true)} disabled={currentBatch.length === 0} className={`${baseBtnStyle} px-4 py-2 border bg-white hover:bg-muted`}>
                  <X className="h-4 w-4" /> Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transit History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Transit History</CardTitle>
            <CardDescription>View and manage past and present transit batches.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Search by Transit ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="ARRIVED">Arrived</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="STORE_TO_FACTORY">Store to Factory</SelectItem>
                  <SelectItem value="FACTORY_TO_STORE">Factory to Store</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {isLoadingHistory ? <p>Loading...</p> : filteredHistory.map((batch: any) => (
                <motion.div key={batch.id} className="border rounded-lg p-4 flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <h4 className="font-semibold">{batch.transitId}</h4>
                    <Badge>{batch.status}</Badge>
                    <div className="text-sm text-muted-foreground">{batch.type}</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" className={`${baseBtnStyle} border hover:bg-accent`} onClick={() => { setSelectedBatch(batch); setShowViewDialog(true); }}>
                      <Eye className="h-4 w-4" /> View
                    </Button>
                    {renderActionButtons(batch)}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Clear Dialog */}
        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Current Batch?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => setCurrentBatch([])} className="bg-destructive hover:bg-destructive/90">Yes, Clear</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Batch Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Transit Batch Details</DialogTitle>
            </DialogHeader>
            {selectedBatch && (
              <Tabs defaultValue="orders" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="orders">Orders ({selectedBatch.orders?.length || 0})</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBatch.orders?.map((o: any) => (
                        <TableRow key={o.id}>
                          <TableCell>{o.id}</TableCell>
                          <TableCell>{o.customerName}</TableCell>
                          <TableCell>{Array.isArray(o.service) ? o.service.join(', ') : o.service}</TableCell>
                          <TableCell><Badge>{o.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="details" className="mt-4">
                  <p>More details here later...</p>
                </TabsContent>
              </Tabs>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
