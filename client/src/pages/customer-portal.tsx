import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, ShoppingBag, Clock } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

interface Order {
  id: string;
  customerName: string;
  service: string[];
  status: string;
  total: number;
  createdAt: string;
}

export default function CustomerPortal() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["customer-orders", email],
    queryFn: () => api.get(`/api/orders?email=${encodeURIComponent(email)}`),
    enabled: !!email && submitted,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      "At Store": "bg-blue-100 text-blue-800",
      Processing: "bg-yellow-100 text-yellow-800",
      "Ready for Delivery": "bg-green-100 text-green-800",
      Delivered: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return <Badge className={colors[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <User className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold">Customer Portal</h1>
        <p className="text-muted-foreground mt-2">View your orders and track their status</p>
      </div>

      {!submitted ? (
        <Card>
          <CardHeader>
            <CardTitle>Find Your Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Enter your email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90"
              >
                View Orders
              </button>
            </form>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Your Orders ({orders.length})</h2>
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Link href={`/bill/${order.id}`} className="font-medium hover:underline">
                      Order #{order.id}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {statusBadge(order.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {order.service?.join(", ")}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-medium">Rs {order.total?.toFixed(2)}</p>
                  <Link
                    href={`/track/${order.id}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" /> Track
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <ShoppingBag className="h-8 w-8 mx-auto mb-2" />
            <p>No orders found for this email</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
