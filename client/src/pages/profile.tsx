import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Key,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  LogOut,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";

interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  isLoggedIn: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface LoginAttempt {
  id: number;
  employeeId: number;
  timestamp: string;
  success: boolean;
  ipAddress?: string;
}

export default function EmployeeProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const { data: employee, isLoading: isEmployeeLoading, isError: isEmployeeError } = useQuery<Employee>({
    queryKey: ["/api/employee/me"],
    queryFn: () => apiFetch("/api/employee/me", { headers: { Authorization: `Bearer ${localStorage.getItem('employee_token')}` } }),
  });

  const { data: loginAttempts = [], isLoading: isAttemptsLoading } = useQuery<LoginAttempt[]>({
    queryKey: ["/api/employee/login-attempts"],
    queryFn: () => apiFetch("/api/employee/login-attempts", { headers: { Authorization: `Bearer ${localStorage.getItem('employee_token')}` } }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (passwords: { currentPassword: string; newPassword: string }) =>
      apiFetch("/api/employee/change-password", {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem('employee_token')}` },
        body: JSON.stringify(passwords),
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to change password.", variant: "destructive" });
    },
  });

  const handlePasswordChange = () => {
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (!currentPassword || !newPassword) {
      toast({ title: "Error", description: "Please fill all password fields.", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleLogout = () => {
    localStorage.removeItem('employee_token');
    // Optionally, call a logout API endpoint if needed
    // apiFetch("/api/employee/logout", { method: "POST" });
    window.location.href = "/employee/login"; // Redirect to login page
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  if (isEmployeeLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  if (isEmployeeError || !employee) {
    return (
      <div className="flex items-center justify-center h-screen text-destructive">
        Error loading employee profile. Please ensure you are logged in.
        <Link href="/employee/login"><Button className="ml-4">Go to Login</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Employee Profile</CardTitle>
          <CardDescription>View and manage your personal and login information.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Employee ID</Label>
            <p className="font-medium">{employee.employeeId}</p>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <p className="font-medium">{employee.firstName} {employee.lastName}</p>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <p className="font-medium">{employee.email}</p>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <p className="font-medium">{employee.phone || "N/A"}</p>
          </div>
          <div className="space-y-2">
            <Label>Position</Label>
            <p className="font-medium">{employee.position}</p>
          </div>
          <div className="space-y-2">
            <Label>Account Created</Label>
            <p className="font-medium">{formatDate(employee.createdAt)}</p>
          </div>
          <div className="space-y-2">
            <Label>Last Login</Label>
            <p className="font-medium">{formatDate(employee.lastLoginAt)}</p>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Badge variant={employee.isLoggedIn ? "default" : "secondary"} className={employee.isLoggedIn ? "bg-green-500" : ""}>
              {employee.isLoggedIn ? "Logged In" : "Logged Out"}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
            <Input id="confirmNewPassword" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handlePasswordChange} disabled={changePasswordMutation.isPending}>Change Password</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Login History</CardTitle>
          <CardDescription>Review your recent login attempts.</CardDescription>
        </CardHeader>
        <CardContent>
          {isAttemptsLoading ? (
            <div className="text-center text-muted-foreground">Loading login history...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginAttempts.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No login attempts found.</TableCell></TableRow>
                ) : (
                  loginAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>{formatDate(attempt.timestamp)}</TableCell>
                      <TableCell>
                        <Badge variant={attempt.success ? "default" : "destructive"} className={attempt.success ? "bg-green-500" : ""}>
                          {attempt.success ? "Success" : "Failed"}
                        </Badge>
                      </TableCell>
                      <TableCell>{attempt.ipAddress || "N/A"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
