import { useState } from "react";
import { PlusCircle, User, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [pickupDate, setPickupDate] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: () => authFetch("/api/services"),
  });

  const handleServiceChange = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const selectedServiceDetails = services?.filter(s => selectedServices.includes(s.id));

  const handleCreateOrder = async () => {
    if (!customerName || !customerPhone || selectedServices.length === 0 || !customerEmail) {
      toast({ title: "Validation Error", description: "Fill all required fields", variant: "destructive" });
      return;
    }

    const total = selectedServiceDetails
      ? selectedServiceDetails.reduce((acc, s) => acc + parseFloat(s.price), 0)
      : 0;

    // Payload matches the new backend
    const payload = {
      customerName,
      customerEmail,
      customerPhone,
      serviceIds: selectedServices,
      pickupDate,
      specialInstructions,
      total,
    };

    try {
      const newOrder = await authFetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
      setCreatedOrderId(newOrder.order.id);
      setIsModalOpen(true);
      queryClient.invalidateQueries(["/api/orders"]);

      // reset form
      setCustomerName("");
      setCustomerPhone("");
      setSelectedServices([]);
      setPickupDate("");
      setSpecialInstructions("");
    } catch (err: any) {
      toast({ title: "Error", description: err.error || "Failed to create order", variant: "destructive" });
    }
  };

  const total = selectedServiceDetails
    ? selectedServiceDetails.reduce((acc, s) => acc + parseFloat(s.price), 0)
    : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create New Order</h1>
        <Button onClick={handleCreateOrder}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Save Order
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center"><User className="h-5 w-5 mr-2"/>Customer Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Label>Name</Label>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full name"/>
              <Label>Email</Label>
              <Input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email address" required/>
              <Label>Phone</Label>
              <Input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone number"/>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center"><Truck className="h-5 w-5 mr-2"/>Service & Scheduling</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Label>Service</Label>
              <div className="space-y-2">
                {isLoading ? <p>Loading services...</p> : services?.map(s => (
                  <div key={s.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={s.id}
                      checked={selectedServices.includes(s.id)}
                      onCheckedChange={() => handleServiceChange(s.id)}
                    />
                    <label
                      htmlFor={s.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {s.name} - ₹{s.price}
                    </label>
                  </div>
                ))}
              </div>

              <Label>Pickup Date</Label>
              <Input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)}/>
              
              <Label>Instructions</Label>
              <Textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} placeholder="Notes or special instructions"/>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {selectedServiceDetails?.map(s => (
                <div key={s.id} className="flex justify-between">
                  <span>{s.name}</span>
                  <span>₹{parseFloat(s.price).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display font-bold text-3xl text-foreground text-center">Order Created Successfully!</DialogTitle></DialogHeader>
          <div className="py-4 text-center">
            <p className="text-muted-foreground mb-4">Your order has been placed and is being processed.</p>
            <Button onClick={() => setIsModalOpen(false)} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

