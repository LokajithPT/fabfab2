import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Barcode } from "lucide-react";
import { useState } from "react";

interface Order {
  id: string;
  customerName: string;
  service: string[];
  status: string;
  total: number;
}

export default function PrintQueue() {
  const { data: orders } = useQuery<Order[]>({
    queryKey: ["print-queue-orders"],
    queryFn: () => api.get("/admin/api/orders"),
  });

  const [printing, setPrinting] = useState<string | null>(null);

  const printTag = async (orderId: string) => {
    setPrinting(orderId);
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const order = orders?.find((o) => o.id === orderId);
      if (!order) return;

      printWindow.document.write(`
        <html><head><title>Tag - ${orderId}</title>
        <style>
          body { font-family: monospace; padding: 20px; width: 80mm; }
          .tag { border: 1px dashed #333; padding: 16px; text-align: center; }
          h2 { margin: 0 0 8px; font-size: 16px; }
          .id { font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 8px 0; }
          .label { font-size: 12px; color: #666; }
          .service { font-size: 14px; margin: 4px 0; }
          hr { border: none; border-top: 1px dashed #333; margin: 12px 0; }
        </style></head><body>
        <div class="tag">
          <h2>FABZ CLEAN</h2>
          <div class="id">#${orderId}</div>
          <hr>
          <div class="label">Customer</div>
          <div class="service">${order.customerName}</div>
          <hr>
          <div class="label">Services</div>
          ${order.service.map((s) => `<div class="service">${s}</div>`).join("")}
          <hr>
          <div class="label">Rs ${order.total.toFixed(2)}</div>
        </div>
        <script>window.print(); window.close();</script>
        </body></html>
      `);
      printWindow.document.close();
    } finally {
      setPrinting(null);
    }
  };

  const ordersToPrint = orders?.filter((o) =>
    ["At Store", "Processing", "Quality Check", "Ready for Delivery"].includes(o.status)
  );

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Printer className="h-6 w-6" /> Print Queue
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Orders Ready for Tag Printing</CardTitle>
        </CardHeader>
        <CardContent>
          {!ordersToPrint || ordersToPrint.length === 0 ? (
            <p className="text-muted-foreground">No orders pending tag printing</p>
          ) : (
            <div className="space-y-3">
              {ordersToPrint.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">#{order.id}</p>
                    <p className="text-xs text-muted-foreground">{order.service.join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{order.status}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => printTag(order.id)}
                      disabled={printing === order.id}
                    >
                      <Barcode className="h-4 w-4 mr-1" />
                      {printing === order.id ? "Printing..." : "Print Tag"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
