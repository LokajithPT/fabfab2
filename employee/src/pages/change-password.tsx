import React, { useState } from 'react';

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async () => {
    try {
      const token = localStorage.getItem('fab-employee-token');
      const response = await fetch('https://ahhhhhhhhhhhhhhhh.onrender.com/employee/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: newPassword }),
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
    <div>
      <h2>Change Password</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button onClick={handleChangePassword}>Change Password</button>
    </div>
  );
};

export default ChangePassword;
