import { useState } from "react";
import {
  PlusCircle,
  User,
  Truck,
  X,
  FileText,
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
import type { Service } from "@shared/schema";

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
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState(""); // New state for search term
  const [extraCharges, setExtraCharges] = useState<number>(0);
  const [extraChargesNote, setExtraChargesNote] = useState<string>("");
  const [discountType, setDiscountType] = useState<
    "percentage" | "amount" | "none"
  >("none");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string>("");
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [editablePrices, setEditablePrices] = useState<Record<string, number>>({});
  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: () => authFetch("/api/services"),
  });

  // Filter services based on search term
  const filteredServices = services?.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.category &&
        service.category.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleServiceChange = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const handlePriceChange = (serviceId: string, value: string) => {
    // Update the input value immediately
    setInputValues(prev => ({
      ...prev,
      [serviceId]: value
    }));
    
    // Update the saved price
    if (value === '' || value === null) {
      // If input is empty, set to 0
      setEditablePrices(prev => ({
        ...prev,
        [serviceId]: 0
      }));
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setEditablePrices(prev => ({
          ...prev,
          [serviceId]: numValue
        }));
      }
    }
  };



  const handleQuantityChange = (serviceId: string, newQuantity: number) => {
    if (newQuantity < 1) return; // Minimum quantity is 1
    setServiceQuantities(prev => ({
      ...prev,
      [serviceId]: Math.floor(newQuantity) // Ensure whole numbers
    }));
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(id => id !== serviceId));
    setEditablePrices(prev => {
      const newPrices = { ...prev };
      delete newPrices[serviceId];
      return newPrices;
    });
    setServiceQuantities(prev => {
      const newQuantities = { ...prev };
      delete newQuantities[serviceId];
      return newQuantities;
    });
  };

  const selectedServiceDetails = services?.filter((s) =>
    selectedServices.includes(s.id),
  ).map(service => {
    const quantity = serviceQuantities[service.id] || 1;
    const unitPrice = editablePrices[service.id] || parseFloat(service.price);
    return {
      ...service,
      currentPrice: unitPrice,
      quantity: quantity,
      totalPrice: unitPrice * quantity
    };
  });

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

    // Get service names and custom prices for comma-separated string
    const serviceNames =
      selectedServiceDetails?.map((s) => s.name).join(", ") || "";
    
    // Create service details with custom prices and quantities
    const serviceDetails = selectedServiceDetails?.map(s => ({
      id: s.id,
      name: s.name,
      price: s.currentPrice,
      quantity: s.quantity || 1,
      totalPrice: s.totalPrice || s.currentPrice,
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
      service: serviceNames, // Comma-separated service names
      serviceDetails, // Include custom prices
      pickupDate,
      specialInstructions,
      total: finalTotalDisplay, // Use the calculated finalTotalDisplay
      extraCharges,
      extraChargesNote,
      discountType,
      discountValue,
      couponCode,
      advancePayment,
    };

    try {
      const newOrder = await authFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setCreatedOrderId(newOrder.order.id);
      setIsModalOpen(true);

      queryClient.invalidateQueries({ queryKey: ["orders"] });

       // Reset form
       setCustomerName("");
       setCustomerEmail("");
       setCustomerPhone("");
       setCustomerAddress("");
       setSelectedServices([]);
       setPickupDate("");
       setSpecialInstructions("");

      toast({
        title: "Success",
        description: `Order created successfully! Services: ${serviceNames}`,
      });
    } catch (err: any) {
      // Removed error toast notification as per user request
      return;
    }
  };



  // Calculate subtotal for display
  const subtotalDisplay = selectedServiceDetails
    ? selectedServiceDetails.reduce((acc, s) => acc + (s.totalPrice || s.currentPrice), 0)
    : 0;

  // Apply discount for display
  let discountedTotalDisplay = subtotalDisplay;
  if (discountType === "percentage") {
    discountedTotalDisplay = subtotalDisplay * (1 - discountValue / 100);
  } else if (discountType === "amount") {
    discountedTotalDisplay = subtotalDisplay - discountValue;
  }

  // Add extra charges for display
  const finalTotalDisplay = discountedTotalDisplay + extraCharges;

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
                  placeholder="Enter customer's address"
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
                <Input
                  type="text"
                  placeholder="Search services by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4"
                />
                <div className="space-y-3 max-h-64 overflow-y-auto border rounded-md p-3">
                  {isLoading ? (
                    <p className="text-muted-foreground">Loading services...</p>
                  ) : filteredServices?.length === 0 ? (
                    <p className="text-muted-foreground">
                      No services available or matching your search
                    </p>
                  ) : (
                    filteredServices?.map((service) => (
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
                            <span>
                              {service.name}
                              {service.category ? ` / ${service.category}` : ""}
                            </span>
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
                           <div className="flex items-center gap-2">
                             <span className="text-sm font-medium">{service.name}</span>
                             <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                               ×{service.quantity || 1}
                             </span>
                           </div>
                           {service.currentPrice !== parseFloat(service.price) && (
                             <div className="text-xs text-gray-500">
                               Original: ₹{parseFloat(service.price).toFixed(2)} each
                             </div>
                           )}
                         </div>
                         <div className="flex items-center gap-2">
                           {/* Quantity Controls */}
                           <div className="flex items-center gap-1">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleQuantityChange(service.id, (service.quantity || 1) - 1)}
                               className="h-6 w-6 p-0"
                               disabled={(service.quantity || 1) <= 1}
                             >
                               -
                             </Button>
                             <span className="text-sm font-medium w-8 text-center">
                               {service.quantity || 1}
                             </span>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleQuantityChange(service.id, (service.quantity || 1) + 1)}
                               className="h-6 w-6 p-0"
                             >
                               +
                             </Button>
                           </div>
                           
                           {/* Price Input */}
                           <div className="flex items-center gap-1">
                             <span className="text-xs text-gray-600">₹</span>
                             <Input
                               type="number"
                               value={inputValues[service.id] !== undefined ? inputValues[service.id] : service.currentPrice}
                               onChange={(e) => handlePriceChange(service.id, e.target.value)}
                               className="w-16 h-8 text-sm text-right"
                               step="1"
                               min="0"
                             />
                           </div>
                           
                           {/* Total Price Display */}
                           <div className="text-sm font-bold text-green-600 w-16 text-right">
                             ₹{(service.totalPrice || service.currentPrice).toFixed(2)}
                           </div>
                           
                           {/* Remove Button */}
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
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">Subtotal</span>
                      <span className="text-sm font-medium">
                        ₹{subtotalDisplay.toFixed(2)}
                      </span>
                    </div>

                    {/* Extra Charges */}
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="extraCharges">Extra Charges</Label>
                      <Input
                        id="extraCharges"
                        type="number"
                        value={extraCharges}
                        onChange={(e) =>
                          setExtraCharges(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                      />
                      <Input
                        id="extraChargesNote"
                        value={extraChargesNote}
                        onChange={(e) => setExtraChargesNote(e.target.value)}
                        placeholder="Reason for extra charges (optional)"
                      />
                    </div>

                    {/* Discount */}
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="discountType">Discount</Label>
                      <select
                        id="discountType"
                        value={discountType}
                        onChange={(e) =>
                          setDiscountType(
                            e.target.value as "percentage" | "amount" | "none",
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="none">No Discount</option>
                        <option value="percentage">Percentage (%)</option>
                        <option value="amount">Fixed Amount</option>
                      </select>
                      {discountType !== "none" && (
                        <Input
                          type="number"
                          value={discountValue}
                          onChange={(e) =>
                            setDiscountValue(parseFloat(e.target.value) || 0)
                          }
                          placeholder={
                            discountType === "percentage"
                              ? "e.g., 10 for 10%"
                              : "e.g., 50 for ₹50"
                          }
                        />
                      )}
                    </div>

                    {/* Coupon */}
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="couponCode">Coupon Code</Label>
                      <Input
                        id="couponCode"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code (optional)"
                      />
                    </div>

                    {/* Advance Payment */}
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="advancePayment">Advance Payment</Label>
                      <Input
                        id="advancePayment"
                        type="number"
                        value={advancePayment}
                        onChange={(e) =>
                          setAdvancePayment(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex justify-between items-center font-bold text-lg mt-4">
                      <span>Total</span>
                      <span className="text-green-600">
                        ₹{finalTotalDisplay.toFixed(2)}
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

      {/* Success Modal */}
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
                         <span className="text-sm font-bold text-right max-w-xs">{customerAddress}</span>
                       </div>
                     )}
                     <div className="flex justify-between">
                       <span className="text-sm font-medium text-gray-600">Service:</span>
                       <span className="text-sm font-bold">
                         {selectedServiceDetails?.map((s) => 
                           `${s.name} ×${s.quantity || 1}`
                         ).join(", ")}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-sm font-medium text-gray-600">Total:</span>
                       <span className="text-sm font-bold text-green-600">
                         ₹{finalTotalDisplay.toFixed(2)}
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

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setIsBillModalOpen(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-lg shadow-lg"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Bill
                  </Button>
                </div>
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



      {/* Bill Modal */}
      <Dialog open={isBillModalOpen} onOpenChange={setIsBillModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:border-none">
          <div className="print:block">
            <DialogHeader className="print:hidden">
              <DialogTitle className="text-center">
                Order Bill - #{createdOrderId}
              </DialogTitle>
            </DialogHeader>

            <div data-bill-content className="py-6 space-y-6 print:py-8">
              {/* Header */}
              <div className="text-center border-b-2 border-gray-300 pb-4 print:border-b-2 print:border-gray-400">
                <h1 className="text-2xl font-bold text-gray-900 print:text-3xl">
                  FABZ CLEAN
                </h1>
                <p className="text-sm text-gray-600 print:text-base">
                  Laundry Services - Order Bill
                </p>
                <div className="mt-2 text-xs text-gray-500 print:text-sm">
                  <p>123 Main Street, Bangalore - 560001</p>
                  <p>Phone: +91 98765 43210 | Email: info@fabzclean.com</p>
                </div>
              </div>

              {/* Order Info */}
              <div className="border-b border-gray-200 pb-4 print:border-b print:border-gray-300">
                <h3 className="font-bold text-lg mb-3 print:text-xl">Order Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 print:text-sm">Order ID</p>
                    <p className="font-mono font-bold text-sm print:text-base">#{createdOrderId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 print:text-sm">Order Date</p>
                    <p className="text-sm print:text-base">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 print:text-sm">Order Time</p>
                    <p className="text-sm print:text-base">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 print:text-sm">Expected Delivery</p>
                    <p className="text-sm font-medium text-green-600 print:text-base">
                      {pickupDate ? new Date(pickupDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

               {/* Customer Info */}
               <div className="border-b border-gray-200 pb-4 print:border-b print:border-gray-300">
                 <h3 className="font-bold text-lg mb-3 print:text-xl">Customer Information</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-xs text-gray-500 print:text-sm">Full Name</p>
                     <p className="text-sm font-medium print:text-base">{customerName}</p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500 print:text-sm">Phone Number</p>
                     <p className="text-sm print:text-base">{customerPhone}</p>
                   </div>
                   <div className="col-span-2">
                     <p className="text-xs text-gray-500 print:text-sm">Email Address</p>
                     <p className="text-sm print:text-base">{customerEmail}</p>
                   </div>
                   {customerAddress && (
                     <div className="col-span-2">
                       <p className="text-xs text-gray-500 print:text-sm">Address</p>
                       <p className="text-sm print:text-base">{customerAddress}</p>
                     </div>
                   )}
                 </div>
               </div>

              {/* Services Table */}
              <div className="border-b border-gray-200 pb-4 print:border-b print:border-gray-300">
                <h3 className="font-bold text-lg mb-3 print:text-xl">Service Details</h3>
                 <table className="w-full text-sm print:text-base">
                   <thead>
                     <tr className="border-b border-gray-300 print:border-b print:border-gray-400">
                       <th className="text-left py-2">#</th>
                       <th className="text-left py-2">Service Name</th>
                       <th className="text-left py-2">Category</th>
                       <th className="text-center py-2">Qty</th>
                       <th className="text-right py-2">Unit Price</th>
                       <th className="text-right py-2">Total</th>
                     </tr>
                   </thead>
                   <tbody>
                     {selectedServiceDetails?.map((service, index) => (
                       <tr key={service.id} className="border-b border-gray-100 print:border-b print:border-gray-200">
                         <td className="py-2">{index + 1}</td>
                        <td className="py-2 font-medium">{service.name}</td>
                        <td className="py-2 text-gray-600">{service.category || 'General'}</td>
                        <td className="py-2 text-center font-medium">{service.quantity || 1}</td>
                        <td className="text-right py-2 font-medium">
                          ₹{service.currentPrice.toFixed(2)}
                          {service.currentPrice !== parseFloat(service.price) && (
                            <div className="text-xs text-gray-500 line-through">
                              ₹{parseFloat(service.price).toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="text-right py-2 font-bold text-green-600">
                          ₹{(service.totalPrice || service.currentPrice).toFixed(2)}
                        </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                <div className="mt-3 text-sm text-gray-600 print:text-base">
                  <p><strong>Total Services:</strong> {selectedServiceDetails?.length || 0} items</p>
                  <p><strong>Order Status:</strong> <span className="text-green-600 font-medium">Confirmed</span></p>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="space-y-2 border-b border-gray-200 pb-4 print:border-b print:border-gray-300">
                <h3 className="font-bold text-lg mb-3 print:text-xl">Pricing Summary</h3>
                <div className="space-y-1 text-sm print:text-base">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotalDisplay.toFixed(2)}</span>
                  </div>
                  {discountType !== "none" && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discountType === "percentage" ? `${discountValue}%` : `₹${discountValue}`}):</span>
                      <span>-₹{(subtotalDisplay - discountedTotalDisplay).toFixed(2)}</span>
                    </div>
                  )}
                  {extraCharges > 0 && (
                    <div className="flex justify-between">
                      <span>Extra Charges {extraChargesNote && `(${extraChargesNote})`}:</span>
                      <span>₹{extraCharges.toFixed(2)}</span>
                    </div>
                  )}
                  {advancePayment > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Advance Payment:</span>
                      <span>-₹{advancePayment.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 print:border-t print:border-gray-400">
                    <span>Total Amount:</span>
                    <span className="text-green-600">₹{finalTotalDisplay.toFixed(2)}</span>
                  </div>
                  {advancePayment > 0 && (
                    <div className="flex justify-between font-bold text-orange-600">
                      <span>Balance Due:</span>
                      <span>₹{(finalTotalDisplay - advancePayment).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Instructions */}
              {specialInstructions && (
                <div className="border-b border-gray-200 pb-4 print:border-b print:border-gray-300">
                  <h3 className="font-bold text-lg mb-2 print:text-xl">Special Instructions</h3>
                  <p className="text-sm text-gray-600 print:text-base">{specialInstructions}</p>
                </div>
              )}



              {/* Footer */}
              <div className="text-center text-xs text-gray-500 print:text-sm border-t border-gray-200 pt-4 print:border-t print:border-gray-300">
                <p>Thank you for choosing FabZ Clean!</p>
                <p>This is a computer-generated bill. No signature required.</p>
                <p>For any queries, please contact: +91 98765 43210</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center mt-6 print:hidden">
              <Button
                onClick={() => {
                  // Create a new window for printing
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    const billContent = document.querySelector('[data-bill-content]')?.innerHTML;
                    if (billContent) {
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>Order Bill - #${createdOrderId}</title>
                          <style>
                            body {
                              font-family: Arial, sans-serif;
                              margin: 20px;
                              line-height: 1.6;
                            }
                            .header {
                              text-align: center;
                              border-bottom: 2px solid #333;
                              padding-bottom: 20px;
                              margin-bottom: 20px;
                            }
                            .section {
                              margin-bottom: 20px;
                              border-bottom: 1px solid #ccc;
                              padding-bottom: 15px;
                            }
                            .section h3 {
                              margin-bottom: 10px;
                              color: #333;
                            }
                            table {
                              width: 100%;
                              border-collapse: collapse;
                              margin-bottom: 10px;
                            }
                            th, td {
                              border: 1px solid #ddd;
                              padding: 8px;
                              text-align: left;
                            }
                            th {
                              background-color: #f5f5f5;
                              font-weight: bold;
                            }
                            .text-right {
                              text-align: right;
                            }
                            .font-bold {
                              font-weight: bold;
                            }
                            .text-green {
                              color: #006600;
                            }
                            .footer {
                              text-align: center;
                              margin-top: 30px;
                              font-size: 12px;
                              color: #666;
                            }
                            @media print {
                              body { margin: 10px; }
                              .no-print { display: none; }
                            }
                          </style>
                        </head>
                        <body>
                          ${billContent}
                        </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                      }, 250);
                    }
                  }
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                Print Bill
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsBillModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style dangerouslySetInnerHTML={{
        __html: `
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
            dialog[open] {
              visibility: visible;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              border: none;
              box-shadow: none;
              background: white;
            }
            dialog[open] > div {
              visibility: visible;
              position: static;
              width: 100%;
              height: auto;
              overflow: visible;
            }
            dialog[open] > div > div:first-child {
              display: none;
            }
            dialog[open] > div > div:last-child > div:first-child {
              display: none;
            }
            dialog[open] > div > div:last-child > div:last-child {
              display: none;
            }
          }
        `
      }} />
    </div>
  );
}
