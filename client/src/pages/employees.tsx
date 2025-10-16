import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api"; // Assuming you have a similar apiFetch helper

import {
  Users,
  Mail,
  Phone,
  Edit,
  Trash2,
  RefreshCw,
  UserPlus,
  Search,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

export default function EmployeesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
  });

  // Fetch employees
  const { data: employees = [], isLoading, isError } = useQuery<Employee[]>({
    queryKey: ["/admin/api/employees"],
    queryFn: () => apiFetch("/admin/api/employees"),
  });

  // Create employee mutation
  const createMutation = useMutation({
    mutationFn: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'isLoggedIn' | 'lastLoginAt'>) => 
      apiFetch("/admin/api/employees", { method: "POST", body: JSON.stringify(employeeData) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/api/employees"] });
      toast({ title: "Success", description: "Employee created successfully." });
      setIsCreateDialogOpen(false);
      setNewEmployee({ employeeId: "", firstName: "", lastName: "", email: "", phone: "", position: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create employee.", variant: "destructive" });
    },
  });

  // Delete employee mutation
  const deleteMutation = useMutation({
    mutationFn: (employeeId: number) => 
      apiFetch(`/admin/api/employees/${employeeId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/api/employees"] });
      toast({ title: "Success", description: "Employee deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete employee.", variant: "destructive" });
    },
  });

  const handleCreateEmployee = () => {
    const { employeeId, firstName, lastName, email, position } = newEmployee;
    if (!employeeId || !firstName || !lastName || !email || !position) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    createMutation.mutate(newEmployee);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee Management</CardTitle>
              <CardDescription>Add, remove, and view employee details. Initial password is employee's first name.</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button><UserPlus className="mr-2 h-4 w-4" /> Add Employee</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input placeholder="Employee ID" value={newEmployee.employeeId} onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })} />
                  <Input placeholder="First Name" value={newEmployee.firstName} onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })} />
                  <Input placeholder="Last Name" value={newEmployee.lastName} onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })} />
                  <Input placeholder="Email" type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} />
                  <Input placeholder="Phone (Optional)" value={newEmployee.phone} onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })} />
                  <Input placeholder="Position" value={newEmployee.position} onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateEmployee} disabled={createMutation.isPending}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
              ) : isError ? (
                <TableRow><TableCell colSpan={6} className="text-center text-destructive">Failed to load employees.</TableCell></TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar><AvatarFallback>{getInitials(employee.firstName, employee.lastName)}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                          <p className="text-sm text-muted-foreground">{employee.employeeId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm"><Mail className="h-3 w-3" />{employee.email}</div>
                      {employee.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-3 w-3" />{employee.phone}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.isLoggedIn ? "default" : "secondary"} className={employee.isLoggedIn ? "bg-green-500" : ""}>
                        {employee.isLoggedIn ? "Logged In" : "Logged Out"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(employee.lastLoginAt)}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone. This will permanently delete the employee.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(employee.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>{employees.length}</strong> employees.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
