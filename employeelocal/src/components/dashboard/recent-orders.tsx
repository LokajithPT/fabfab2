import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

// Enhanced admin fetch with better error handling
const adminFetch = async (url: string, options: RequestInit = {}) => {
  try {
    const token = localStorage.getItem("token");
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

interface Order {
  id: string;
  customerName: string;
  date: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  total: number;
  service: string;
}

interface RecentOrdersProps {
  orders?: Order[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        setLoading(true);
        const response = await adminFetch('/api/orders/recent');
        setRecentOrders(response);
      } catch (err) {
        console.error('Failed to fetch recent orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recent orders');
      } finally {
        setLoading(false);
      }
    };

    if (!orders) {
      fetchRecentOrders();
    }
  }, [orders]);

  const displayOrders = orders || recentOrders;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && !orders) {
    return <div className="space-y-8">Loading recent orders...</div>;
  }

  if (error && !orders) {
    return <div className="space-y-8 text-red-500">Error: {error}</div>;
  }

  if (!displayOrders || displayOrders.length === 0) {
    return <div className="space-y-8">No recent orders found.</div>;
  }

  return (
    <div className="space-y-8">
      {displayOrders.map((order, i) => (
        <div key={order.id || i} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{order.customerName.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">{order.service}</p>
          </div>
          <div className="ml-auto font-medium">{formatCurrency(order.total)}</div>
        </div>
      ))}
    </div>
  );
}
