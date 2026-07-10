import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <ShieldOff className="h-16 w-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground">You do not have permission to view this page.</p>
      <Button asChild>
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
