import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/contexts/settings-context";
import { useState } from "react";
import { Save } from "lucide-react";

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Store Name</Label>
            <Input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Store Address</Label>
            <Input value={form.storeAddress} onChange={(e) => setForm({ ...form, storeAddress: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.storePhone} onChange={(e) => setForm({ ...form, storePhone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.storeEmail} onChange={(e) => setForm({ ...form, storeEmail: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable GST</Label>
            <Switch checked={form.gstEnabled} onCheckedChange={(v) => setForm({ ...form, gstEnabled: v })} />
          </div>
          {form.gstEnabled && (
            <div className="space-y-2">
              <Label>GSTIN</Label>
              <Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Invoice Note</Label>
            <Input value={form.defaultInvoiceNote} onChange={(e) => setForm({ ...form, defaultInvoiceNote: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave}>
        <Save className="h-4 w-4 mr-2" />
        {saved ? "Saved!" : "Save Settings"}
      </Button>
    </div>
  );
}
