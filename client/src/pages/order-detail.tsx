import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer, Phone, FileText } from "lucide-react";

const statusColors: Record<string, string> = {
  "At Store": "bg-blue-100 text-blue-800",
  Processing: "bg-yellow-100 text-yellow-800",
  "Quality Check": "bg-purple-100 text-purple-800",
  "Ready for Delivery": "bg-green-100 text-green-800",
  "Out for Delivery": "bg-cyan-100 text-cyan-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  serviceId: string[];
  service: string[];
  pickupDate: string;
  specialInstructions: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function OrderDetail() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["order", id],
    queryFn: () => api.get(`/api/orders/${id}`),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.put(`/api/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order", id] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return <div className="p-6 text-muted-foreground">Order not found</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Order #{order.id}</h1>
        <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-medium">Name:</span> {order.customerName}</p>
            <p><span className="font-medium">Email:</span> {order.customerEmail}</p>
            <p><span className="font-medium">Phone:</span> {order.customerPhone}</p>
            {order.customerAddress && (
              <p><span className="font-medium">Address:</span> {order.customerAddress}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {order.service.map((s, i) => (
                <li key={i} className="text-sm">{s}</li>
              ))}
            </ul>
            <p className="text-lg font-bold mt-4">Total: Rs {order.total.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-medium">Created:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
            {order.pickupDate && (
              <p><span className="font-medium">Pickup:</span> {order.pickupDate}</p>
            )}
          </CardContent>
        </Card>

        {order.specialInstructions && (
          <Card>
            <CardHeader>
              <CardTitle>Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{order.specialInstructions}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => window.print()} variant="outline">
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          {order.status === "At Store" && (
            <Button onClick={() => statusMutation.mutate("Processing")}>
              Start Processing
            </Button>
          )}
          {order.status === "Processing" && (
            <Button onClick={() => statusMutation.mutate("Quality Check")}>
              Send to Quality Check
            </Button>
          )}
          {order.status === "Quality Check" && (
            <Button onClick={() => statusMutation.mutate("Ready for Delivery")}>
              Mark Ready for Delivery
            </Button>
          )}
          {order.status === "Ready for Delivery" && (
            <Button onClick={() => statusMutation.mutate("Out for Delivery")}>
              Mark Out for Delivery
            </Button>
          )}
          {order.status === "Out for Delivery" && (
            <Button onClick={() => statusMutation.mutate("Delivered")}>
              Mark Delivered
            </Button>
          )}
          {!["Delivered", "Cancelled"].includes(order.status) && (
            <Button variant="destructive" onClick={() => statusMutation.mutate("Cancelled")}>
              Cancel Order
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
