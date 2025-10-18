import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound } from 'lucide-react';

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const workerData = localStorage.getItem('fab-employee-worker');
    if (workerData) {
      const worker = JSON.parse(workerData);
      setEmail(worker.email);
    }
  }, []);

  const handleChangePassword = async () => {
    try {
      const response = await fetch('http://localhost:5005/employee/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, new_password: newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setError('');
      } else {
        setError(data.error || 'Failed to change password');
        setMessage('');
      }
    } catch (err) {
      setError('Failed to connect to the server');
      setMessage('');
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password here. Make sure it is a strong one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <p className="text-green-500">{message}</p>}
          {error && <p className="text-red-500">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Email" value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleChangePassword} className="w-full">
            <KeyRound className="mr-2 h-4 w-4" />
            Change Password
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChangePassword;
