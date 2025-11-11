import { useMemo, useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

interface SalesChartProps {
  data?: Array<{ month: string; revenue: number }>;
}

export default function SalesChart({ data }: SalesChartProps) {
  const [salesData, setSalesData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        const response = await adminFetch('/api/analytics/sales');
        setSalesData(response);
      } catch (err) {
        console.error('Failed to fetch sales data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sales data');
      } finally {
        setLoading(false);
      }
    };

    if (!data) {
      fetchSalesData();
    }
  }, [data]);

  const chartData = useMemo(() => data || salesData, [data, salesData]);

  if (loading && !data) {
    return (
      <div className="h-[350px] flex items-center justify-center">
        <div>Loading sales data...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="h-[350px] flex items-center justify-center text-red-500">
        <div>Error: {error}</div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center">
        <div>No sales data available.</div>
      </div>
    );
  }

  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 10,
            left: -10,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
          <XAxis
            dataKey="month"
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--card))",
              borderColor: "rgb(var(--border))",
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            strokeWidth={2}
            stroke="rgb(var(--primary))"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
