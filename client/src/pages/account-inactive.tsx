import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AccountInactive() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Ban className="h-16 w-16 text-amber-500" />
      <h1 className="text-2xl font-bold">Account Inactive</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Your account has been deactivated. Please contact your administrator to regain access.
      </p>
      <Button asChild variant="outline">
        <Link href="/login">Back to Login</Link>
      </Button>
    </div>
  );
}
