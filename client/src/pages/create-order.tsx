import { useState } from "react";
import { PlusCircle, User, Truck, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Service = {
  id: string;
  name: string;
  price: string;
};

// Auth fetch helper
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw await res.json();
  return res.json();
};

export default function CreateOrder() {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [pickupDate, setPickupDate] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: () => authFetch("/api/services"),
  });

  const handleServiceChange = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const selectedServiceDetails = services?.filter((s) =>
    selectedServices.includes(s.id),
  );

  const handleCreateOrder = async () => {
    if (
      !customerName ||
      !customerPhone ||
      selectedServices.length === 0 ||
      !customerEmail
    ) {
      toast({
        title: "Validation Error",
        description: "Fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const total = selectedServiceDetails
      ? selectedServiceDetails.reduce((acc, s) => acc + parseFloat(s.price), 0)
      : 0;

    // Get service names for comma-separated string
    const serviceNames = selectedServiceDetails?.map((s) => s.name) || [];
    const serviceNamesString = serviceNames.join(", ");

    // Payload with both serviceIds array and service names as comma-separated string
    const payload = {
      customerName,
      customerEmail,
      customerPhone,
      serviceIds: selectedServices, // Keep as array for backend processing
      serviceId: selectedServices.join(","), // Comma-separated IDs if needed
      service: serviceNamesString, // Comma-separated service names
      pickupDate,
      specialInstructions,
      total,
    };

    try {
      const newOrder = await authFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setCreatedOrderId(newOrder.order.id);
      // Set QR code URL - this will be served by your Flask backend
      setQrCodeUrl(`/qr/${newOrder.order.id}.png`);
      setIsModalOpen(true);

      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });

      // Reset form
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setSelectedServices([]);
      setPickupDate("");
      setSpecialInstructions("");

      toast({
        title: "Success",
        description: `Order created successfully! Services: ${serviceNamesString}`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.error || "Failed to create order",
        variant: "destructive",
      });
    }
  };

  const handlePrintQR = () => {
    setIsPrintModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl && createdOrderId) {
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = `order-${createdOrderId}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const total = selectedServiceDetails
    ? selectedServiceDetails.reduce((acc, s) => acc + parseFloat(s.price), 0)
    : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create New Order
          </h1>
          <p className="text-muted-foreground mt-1">
            Select multiple services for your customer
          </p>
        </div>
        <Button onClick={handleCreateOrder}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Save Order
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer's full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email Address *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </CardContent>
          </Card>

          {/* Service Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Service Selection & Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Select Services *</Label>
                <div className="space-y-3 max-h-64 overflow-y-auto border rounded-md p-3">
                  {isLoading ? (
                    <p className="text-muted-foreground">Loading services...</p>
                  ) : services?.length === 0 ? (
                    <p className="text-muted-foreground">
                      No services available
                    </p>
                  ) : (
                    services?.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md"
                      >
                        <Checkbox
                          id={service.id}
                          checked={selectedServices.includes(service.id)}
                          onCheckedChange={() =>
                            handleServiceChange(service.id)
                          }
                        />
                        <label
                          htmlFor={service.id}
                          className="flex-1 text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          <div className="flex justify-between items-center">
                            <span>{service.name}</span>
                            <span className="text-green-600 font-semibold">
                              ₹{parseFloat(service.price).toFixed(2)}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {selectedServices.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedServices.length} service
                    {selectedServices.length !== 1 ? "s" : ""} selected
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupDate">Pickup Date</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialInstructions">
                  Special Instructions
                </Label>
                <Textarea
                  id="specialInstructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special notes or instructions for this order..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedServiceDetails && selectedServiceDetails.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {selectedServiceDetails.map((service) => (
                      <div
                        key={service.id}
                        className="flex justify-between items-center py-1"
                      >
                        <span className="text-sm">{service.name}</span>
                        <span className="text-sm font-medium">
                          ₹{parseFloat(service.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total</span>
                      <span className="text-green-600">
                        ₹{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No services selected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Modal with QR Code */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              Order Created Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <PlusCircle className="h-8 w-8 text-green-600" />
            </div>

            {/* QR Code Display */}
            {qrCodeUrl && (
              <div className="space-y-3">
                <div
                  className="mx-auto w-48 h-48 border-2 border-gray-200 rounded-lg p-2 cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={handlePrintQR}
                  title="Click to open print view"
                >
                  <img
                    src={qrCodeUrl}
                    alt={`QR Code for Order ${createdOrderId}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error("QR Code failed to load");
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Click QR code to print or use buttons below
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadQR}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline" onClick={handlePrintQR}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            )}

            <div>
              <p className="text-muted-foreground mb-2">
                Your order has been placed and is being processed.
              </p>
              {createdOrderId && (
                <p className="text-sm font-medium">
                  Order ID:{" "}
                  <span className="font-mono text-blue-600">
                    #{createdOrderId}
                  </span>
                </p>
              )}
              {selectedServiceDetails && selectedServiceDetails.length > 0 && (
                <div className="mt-3 text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Selected Services:</p>
                  <p>{selectedServiceDetails.map((s) => s.name).join(", ")}</p>
                </div>
              )}
            </div>
            <Button onClick={() => setIsModalOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Modal */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-lg print:shadow-none print:border-none">
          <div className="print:block">
            <DialogHeader className="print:hidden">
              <DialogTitle className="text-center">
                Print QR Code - Order #{createdOrderId}
              </DialogTitle>
            </DialogHeader>

            <div className="py-6 text-center space-y-4 print:py-8">
              <div className="print:mb-6">
                <h2 className="text-xl font-bold print:text-2xl">
                  FabClean Laundry
                </h2>
                <p className="text-sm text-gray-600 print:text-base">
                  Order Tracking QR Code
                </p>
              </div>

              {qrCodeUrl && (
                <div className="mx-auto w-64 h-64 print:w-80 print:h-80">
                  <img
                    src={qrCodeUrl}
                    alt={`QR Code for Order ${createdOrderId}`}
                    className="w-full h-full object-contain border border-gray-300"
                  />
                </div>
              )}

              <div className="space-y-2 print:space-y-3">
                <p className="font-mono text-lg print:text-xl">
                  Order #{createdOrderId}
                </p>
                <p className="text-sm print:text-base">
                  Customer: {customerName}
                </p>
                <p className="text-sm print:text-base">
                  Phone: {customerPhone}
                </p>
                {pickupDate && (
                  <p className="text-sm print:text-base">
                    Pickup: {new Date(pickupDate).toLocaleDateString()}
                  </p>
                )}
                <p className="text-sm print:text-base font-semibold">
                  Total: ₹{total.toFixed(2)}
                </p>
              </div>

              <div className="text-xs text-gray-500 print:text-sm print:mt-8">
                <p>Scan this QR code to track your order</p>
                <p>Keep this receipt safe</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center mt-6 print:hidden">
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Now
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsPrintModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
