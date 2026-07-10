import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarCheck, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useState } from "react";

interface Booking {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceIds: string[];
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: string;
  createdAt: string;
  convertedOrderId: string | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

export default function Booking() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["bookings"],
    queryFn: () => api.get("/api/bookings"),
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: () => api.get("/api/services"),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/api/bookings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      setOpen(false);
    },
  });

  const convertMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/bookings/${id}/convert`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/bookings/${id}/status`, { status: "cancelled" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });

  const pending = bookings?.filter((b) => b.status === "pending") || [];
  const confirmed = bookings?.filter((b) => b.status === "confirmed") || [];
  const converted = bookings?.filter((b) => b.status === "converted") || [];

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
      converted: "bg-green-100 text-green-800",
    };
    return <Badge className={colors[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarCheck className="h-6 w-6" /> Bookings
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New Booking</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Booking</DialogTitle>
            </DialogHeader>
            <BookingForm services={services || []} onSubmit={(data) => createMutation.mutate(data)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">Pending ({pending.length})</CardTitle></CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending bookings</p>
            ) : (
              <div className="space-y-2">
                {pending.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onConvert={() => convertMutation.mutate(b.id)}
                    onCancel={() => cancelMutation.mutate(b.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Confirmed ({confirmed.length})</CardTitle></CardHeader>
          <CardContent>
            {confirmed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No confirmed bookings</p>
            ) : (
              <div className="space-y-2">
                {confirmed.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onConvert={() => convertMutation.mutate(b.id)}
                    onCancel={() => cancelMutation.mutate(b.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Converted ({converted.length})</CardTitle></CardHeader>
          <CardContent>
            {converted.length === 0 ? (
              <p className="text-sm text-muted-foreground">No converted bookings</p>
            ) : (
              <div className="space-y-2">
                {converted.map((b) => (
                  <div key={b.id} className="p-2 border rounded text-sm">
                    <p className="font-medium">{b.customerName}</p>
                    <p className="text-xs text-muted-foreground">Order: #{b.convertedOrderId}</p>
                    {statusBadge(b.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  onConvert,
  onCancel,
}: {
  booking: Booking;
  onConvert: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="p-3 border rounded-lg space-y-1">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">{booking.customerName}</p>
        {booking.status === "pending" ? (
          <Badge variant="outline" className="bg-yellow-50">Pending</Badge>
        ) : (
          <Badge variant="outline" className="bg-blue-50">Confirmed</Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{booking.customerPhone}</p>
      {booking.preferredDate && (
        <p className="text-xs text-muted-foreground">{booking.preferredDate} {booking.preferredTime}</p>
      )}
      <div className="flex gap-1 pt-1">
        <Button size="sm" variant="ghost" onClick={onConvert} className="h-7 text-xs">
          <ArrowRight className="h-3 w-3 mr-1" /> Convert
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs text-red-500">
          <XCircle className="h-3 w-3 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );
}

function BookingForm({
  services,
  onSubmit,
}: {
  services: Service[];
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [serviceId, setServiceId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      serviceIds: serviceId ? [serviceId] : [],
      preferredDate: date,
      preferredTime: time,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input required value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Service</Label>
        <Select value={serviceId} onValueChange={setServiceId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name} - Rs {s.price}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Preferred Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Preferred Time</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <Button type="submit" className="w-full">Create Booking</Button>
    </form>
  );
}
