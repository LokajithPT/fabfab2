import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package } from "lucide-react";

interface TrackedOrder {
  id: string;
  status: string;
  customerName: string;
  services: string[];
  total: number;
  estimatedDelivery: string;
}

export default function PublicOrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [searchId, setSearchId] = useState("");

  const { data: order, isLoading, error } = useQuery<TrackedOrder>({
    queryKey: ["public-track", searchId],
    queryFn: () => api.get(`/api/public/orders/${searchId}/tracking`),
    enabled: !!searchId,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) {
      setSearchId(orderNumber.trim());
    }
  };

  const statusSteps = [
    "At Store",
    "Processing",
    "Quality Check",
    "Ready for Delivery",
    "Out for Delivery",
    "Delivered",
  ];

  const currentStep = order ? statusSteps.indexOf(order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold">Track Your Order</h1>
        <p className="text-muted-foreground mt-2">Enter your order number to see the current status</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <Input
          placeholder="Enter order number (e.g., a1b2c3d4)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
        />
        <Button type="submit" disabled={isLoading}>
          <Search className="h-4 w-4 mr-2" /> Track
        </Button>
      </form>

      {isLoading && <p className="text-center text-muted-foreground">Looking up order...</p>}

      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6 text-center text-red-600">
            Order not found. Please check the order number and try again.
          </CardContent>
        </Card>
      )}

      {order && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Order #{order.id}
                <Badge>{order.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><span className="font-medium">Customer:</span> {order.customerName}</p>
              <p><span className="font-medium">Services:</span> {order.services?.join(", ")}</p>
              <p><span className="font-medium">Total:</span> Rs {order.total?.toFixed(2)}</p>
              <p><span className="font-medium">Estimated Delivery:</span> {order.estimatedDelivery || "Not set"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statusSteps.map((step, i) => {
                  const completed = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${completed ? "bg-green-500" : "bg-gray-200"} ${active ? "ring-2 ring-green-500 ring-offset-2" : ""}`} />
                      <span className={completed ? "font-medium" : "text-muted-foreground"}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
