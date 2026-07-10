import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface Invoice {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  services: string[];
  total: number;
  status: string;
  createdAt: string;
  pickupDate: string;
  specialInstructions: string;
}

export default function BillView() {
  const { orderNumber } = useParams();

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ["public-invoice", orderNumber],
    queryFn: () => api.get(`/api/public/invoice/${orderNumber}`),
    enabled: !!orderNumber,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return <div className="max-w-2xl mx-auto py-8 px-4 text-muted-foreground">Invoice not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invoice #{invoice.invoiceNumber}</h1>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      <Card className="print:shadow-none">
        <CardContent className="pt-6 space-y-6">
          <div className="text-center border-b pb-4">
            <h2 className="text-xl font-bold">FabZ Clean</h2>
            <p className="text-sm text-muted-foreground">Professional Laundry Services</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Bill To:</p>
              <p>{invoice.customerName}</p>
              <p>{invoice.customerEmail}</p>
              <p>{invoice.customerPhone}</p>
              {invoice.customerAddress && <p>{invoice.customerAddress}</p>}
            </div>
            <div className="text-right">
              <p className="font-medium">Invoice Details:</p>
              <p>Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
              <p>Status: {invoice.status}</p>
              {invoice.pickupDate && <p>Pickup: {invoice.pickupDate}</p>}
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Service</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.services.map((s, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">{s}</td>
                  <td className="text-right py-2">-</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="py-2 font-bold">Total</td>
                <td className="text-right py-2 font-bold">Rs {invoice.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {invoice.specialInstructions && (
            <div className="text-sm">
              <p className="font-medium">Notes:</p>
              <p className="text-muted-foreground">{invoice.specialInstructions}</p>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>Thank you for choosing FabZ Clean!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
