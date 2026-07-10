import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

const fetchEmployees = async () => {
  const response = await fetch('/admin/api/workers');
  if (!response.ok) {
    throw new Error('Failed to fetch employees');
  }
  return response.json();
};

const createEmployee = async (employeeData: Record<string, unknown>) => {
  const response = await fetch('/admin/api/workers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(employeeData),
  });
  if (!response.ok) {
    throw new Error('Failed to create employee');
  }
  return response.json();
};

const updateEmployee = async (employeeData: Record<string, unknown>) => {
  const response = await fetch(`/admin/api/workers/${employeeData.id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    }
  );
  if (!response.ok) {
    throw new Error('Failed to update employee');
  }
  return response.json();
};

const deleteEmployee = async (employeeId: string) => {
  const response = await fetch(`/admin/api/workers/${employeeId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete employee');
  }
  return response.json();
};

const Employees = () => {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const { data: employees, isLoading, isError } = useQuery({ queryKey: ['employees'], queryFn: fetchEmployees });

  const createMutation = useMutation({ mutationFn: createEmployee, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); setIsCreateDialogOpen(false); } });
  const updateMutation = useMutation({ mutationFn: updateEmployee, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); setIsEditDialogOpen(false); } });
  const deleteMutation = useMutation({ mutationFn: deleteEmployee, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); } });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    createMutation.mutate(data);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    updateMutation.mutate({ ...(selectedEmployee ?? {}), ...data });
  };

  const handleDelete = (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteMutation.mutate(employeeId);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching employees</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Manage Employees</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" />Add Employee</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <Input name="name" placeholder="Name" required />
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="password" type="password" placeholder="Password" required />
              </div>
              <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" />Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(employees as any[] || []).map((employee: any) => (
            <TableRow key={employee.id}>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>
                <Dialog open={isEditDialogOpen && selectedEmployee?.id === employee.id} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => setSelectedEmployee(employee)}><Edit className="h-4 w-4" /></Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Employee</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate}>
                      <div className="grid gap-4 py-4">
                        <Input name="name" defaultValue={selectedEmployee?.name} placeholder="Name" />
                        <Input name="email" type="email" defaultValue={selectedEmployee?.email} placeholder="Email" />
                        <Input name="password" type="password" placeholder="New Password (optional)" />
                      </div>
                      <Button type="submit"><Edit className="mr-2 h-4 w-4" />Save Changes</Button>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" size="icon" onClick={() => handleDelete(employee.id)} className="ml-2"><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Employees;
