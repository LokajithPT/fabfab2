import { useState } from "react";
import {
  PlusCircle,
  User,
  Truck,
  X,
} from "lucide-react";
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
import { API_BASE_URL } from "../lib/config";

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
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [pickupDate, setPickupDate] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [editablePrices, setEditablePrices] = useState<Record<string, number>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: () => authFetch(`${API_BASE_URL}/api/services`),
  });

  const handleServiceChange = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
    // Initialize quantity if adding service
    if (!selectedServices.includes(serviceId)) {
      setQuantities(prev => ({ ...prev, [serviceId]: 1 }));
    }
  };

  const handleQuantityChange = (serviceId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[serviceId] || 1;
      const newQuantity = Math.max(1, current + delta);
      return { ...prev, [serviceId]: newQuantity };
    });
  };

  const handlePriceChange = (serviceId: string, newPrice: number) => {
    setEditablePrices(prev => ({
      ...prev,
      [serviceId]: newPrice
    }));
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(id => id !== serviceId));
    setEditablePrices(prev => {
      const newPrices = { ...prev };
      delete newPrices[serviceId];
      return newPrices;
    });
  };

  const selectedServiceDetails = services?.filter((s) =>
    selectedServices.includes(s.id),
  ).map(service => ({
    ...service,
    currentPrice: editablePrices[service.id] || parseFloat(service.price),
    quantity: quantities[service.id] || 1
  }));

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
      ? selectedServiceDetails.reduce((acc, s) => acc + s.currentPrice, 0)
      : 0;

    // Get service names and custom prices for comma-separated string
    const serviceNames = selectedServiceDetails?.map((s) => s.name) || [];
    const serviceNamesString = serviceNames.join(", ");
    
    // Create service details with custom prices
    const serviceDetails = selectedServiceDetails?.map(s => ({
      id: s.id,
      name: s.name,
      price: s.currentPrice,
      originalPrice: parseFloat(s.price)
    })) || [];

    // Payload with both serviceIds array and service names as comma-separated string
    const payload = {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      serviceIds: selectedServices, // Keep as array for backend processing
      serviceId: selectedServices.join(","), // Comma-separated IDs if needed
      service: serviceNamesString, // Comma-separated service names
      serviceDetails, // Include custom prices
      pickupDate,
      specialInstructions,
      total,
    };

    try {
      const newOrder = await authFetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setCreatedOrderId(newOrder.order.id);
      setIsModalOpen(true);

      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });

      // Reset form
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setCustomerAddress("");
      setSelectedServices([]);
      setPickupDate("");
      setSpecialInstructions("");
      setQuantities({});
      setEditablePrices({});

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

  const total = selectedServiceDetails
    ? selectedServiceDetails.reduce((acc, s) => acc + (s.currentPrice * s.quantity), 0)
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
              <div className="space-y-2">
                <Label htmlFor="customerAddress">Address</Label>
                <Textarea
                  id="customerAddress"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Customer address..."
                  rows={2}
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
                <Label htmlFor="pickupDate">Delivery Date</Label>
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
                        className="flex items-center justify-between py-2 p-2 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium">{service.name}</span>
                          {service.currentPrice !== parseFloat(service.price) && (
                            <div className="text-xs text-gray-500">
                              Original: ₹{parseFloat(service.price).toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleQuantityChange(service.id, -1)}
                            >
                              -
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">
                              {service.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleQuantityChange(service.id, 1)}
                            >
                              +
                            </Button>
                          </div>
                          <span className="text-xs text-gray-600">₹</span>
                          <Input
                            type="number"
                            value={service.currentPrice}
                            onChange={(e) => handlePriceChange(service.id, parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-sm text-right"
                            step="0.01"
                            min="0"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveService(service.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
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

      {/* Success Modal with Simple Client Info */}
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

            {/* Simple Client Info Display */}
            <div className="space-y-4">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <PlusCircle className="h-8 w-8 text-green-600" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Order Created Successfully!
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Order #{createdOrderId}
                  </p>
                </div>

                {/* Client Info Card */}
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Client:</span>
                      <span className="text-sm font-bold">{customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Phone:</span>
                      <span className="text-sm font-bold">{customerPhone}</span>
                    </div>
                    {customerAddress && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Address:</span>
                        <span className="text-sm font-bold text-right max-w-[150px] truncate">{customerAddress}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Service:</span>
                      <span className="text-sm font-bold">
                        {selectedServiceDetails?.map((s) => 
                          `${s.quantity}x ${s.name}`
                        ).join(", ")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Total:</span>
                      <span className="text-sm font-bold text-green-600">
                        ₹{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Individual Service Slips */}
                {selectedServiceDetails && selectedServiceDetails.length > 0 && (
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-3 text-center">SERVICE SLIPS</p>
                    <div className="space-y-2">
                      {selectedServiceDetails.map((service, index) => (
                        <div key={service.id} className="bg-gray-100 rounded p-2 text-center font-mono text-xs">
                          <div className="font-bold">
                            {customerName} {customerPhone}
                          </div>
                          <div className="text-gray-700">
                            {service.name} {index + 1}/{selectedServiceDetails.length}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

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
    </div>
  );
}