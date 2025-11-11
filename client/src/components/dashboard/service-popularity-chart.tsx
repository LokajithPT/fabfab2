import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

interface ServicePopularityChartProps {
  data?: Array<{ name: string; value: number; fill: string }>;
}

export default function ServicePopularityChart({ data }: ServicePopularityChartProps) {
  const [serviceData, setServiceData] = useState<Array<{ name: string; orders: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        setLoading(true);
        const response = await adminFetch('/api/analytics/services');
        setServiceData(response);
      } catch (err) {
        console.error('Failed to fetch service data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load service data');
      } finally {
        setLoading(false);
      }
    };

    if (!data) {
      fetchServiceData();
    }
  }, [data]);

  const chartData = data || serviceData.map((item: any) => ({ ...item, value: item.orders, fill: "hsl(var(--primary))" }));

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Popularity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div>Loading service data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Popularity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-red-500">
            <div>Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Popularity</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
