import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download } from "lucide-react";

interface SummaryReport {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  completed: number;
  cancelled: number;
  pending: number;
  newCustomers: number;
}

export default function Reports() {
  const { data: report, isLoading } = useQuery<SummaryReport>({
    queryKey: ["report-summary"],
    queryFn: () => api.get("/admin/api/reports/summary?days=30"),
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" /> Reports
        </h1>
        <Button variant="outline" onClick={() => window.print()}>
          <Download className="h-4 w-4 mr-2" /> Export
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : report ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Summary ({report.period})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{report.totalOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">Rs {report.totalRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold">Rs {report.averageOrderValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Customers</p>
                  <p className="text-2xl font-bold">{report.newCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{report.completed}</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{report.pending}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">{report.cancelled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-muted-foreground">Unable to load report data</p>
      )}
    </div>
  );
}
