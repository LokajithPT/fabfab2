import React, { useState } from 'react';

const FabCleanLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('https://ahhhhhhhhhhhhhhhh.onrender.com/employee/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('fab-employee-token', data.token);
        onLogin();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    }
  };

  const styles = {
    container: {
      display: 'flex',
      height: '100vh', // Full viewport height
      fontFamily: 'Arial, sans-serif', // Using a common sans-serif font
      color: '#424242', // Dark grey for text
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
    },
    leftPanel: {
      flex: 1,
      backgroundColor: '#C8E6C9', // Light green
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      position: 'relative', // For absolute positioning of drops/hexagons
      overflow: 'hidden', // Hide overflow of background elements
    },
    // Background elements for left panel
    drop: {
      position: 'absolute',
      backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white
      borderRadius: '50%',
    },
    drop1: { top: '10%', left: '15%', width: '20px', height: '20px' },
    drop2: { top: '25%', left: '80%', width: '15px', height: '15px' },
    drop3: { bottom: '10%', right: '20%', width: '25px', height: '25px' },
    drop4: { bottom: '30%', left: '10%', width: '18px', height: '18px' },
    
    hexagon: {
        position: 'absolute',
        width: '60px', /* width of the hexagon */
        height: '34.64px', /* height calculation: width * 0.57735 */
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent white
        transform: 'rotate(90deg)', // To make points vertical
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
    },
    hex1: { top: '5%', left: '40%', transform: 'scale(0.8) rotate(90deg)' },
    hex2: { top: '30%', left: '5%', transform: 'scale(0.7) rotate(90deg)' },
    hex3: { bottom: '15%', right: '5%', transform: 'scale(0.9) rotate(90deg)' },
    hex4: { top: '60%', left: '30%', transform: 'scale(0.6) rotate(90deg)' },


    washerIcon: {
      width: '150px', // Adjust size as needed
      height: '150px',
      marginBottom: '20px',
      // This is a placeholder for an SVG or image.
      // For this example, I'll use a simple div with a background or replace with actual SVG later.
      backgroundColor: 'transparent', // Will be replaced by SVG
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fabCleanText: {
      fontSize: '2.5em',
      fontWeight: 'bold',
      color: '#424242',
      marginBottom: '5px',
    },
    
    rightPanel: {
      flex: 1,
      backgroundColor: '#F5F5F5', // Off-white/light grey
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
    },
    loginForm: {
      width: '70%', // Adjust form width within the panel
      maxWidth: '400px', // Max width for larger screens
    },
    heading: {
      fontSize: '2em',
      marginBottom: '30px',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    inputGroup: {
      marginBottom: '20px',
      position: 'relative',
    },
    inputField: {
      width: '100%',
      padding: '12px 15px 12px 45px', // Adjust padding for icon
      fontSize: '1em',
      border: '1px solid #C8E6C9', // Light green border
      borderRadius: '5px',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'border-color 0.2s ease-in-out',
    },
    inputFieldFocus: {
        borderColor: '#FFCCBC', // Mild orange on focus
    },
    inputIcon: {
      position: 'absolute',
      left: '15px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#A0A0A0', // Light grey for icons
    },
    forgotPassword: {
      textAlign: 'right',
      marginBottom: '30px',
    },
    forgotPasswordLink: {
      color: '#FFCCBC', // Mild orange
      textDecoration: 'none',
      fontSize: '0.9em',
    },
    loginButton: {
      width: '100%',
      padding: '15px',
      fontSize: '1.1em',
      fontWeight: 'bold',
      backgroundColor: '#8BC34A', // A slightly darker, more prominent green for the button
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease-in-out',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    },
    loginButtonHover: {
      backgroundColor: '#9CCC65', // Lighter green on hover
    },
    error: {
      color: 'red',
      textAlign: 'center',
      marginBottom: '10px',
    }
  };

  // Helper for SVG icons (for demonstration)
  const UserIcon = () => (
    <svg style={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.52 19c.75-2.85 2.6-5 4.48-5h.5c.67 0 1.25.13 1.8.45M16 7a4 4 0 11-8 0 4 4 0 018 0zM19 14v6M22 17h-6" />
    </svg>
  );

  const LockIcon = () => (
    <svg style={styles.inputIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );

  // Simple Washer Icon Placeholder (replace with actual SVG if desired)
  const WasherIcon = () => (
    <svg width="150" height="150" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer machine body */}
      <rect x="20" y="20" width="160" height="160" rx="15" ry="15" stroke="#424242" strokeWidth="5"/>
      {/* Door */}
      <circle cx="100" cy="90" r="50" fill="transparent" stroke="#424242" strokeWidth="5"/>
      {/* Inner drum detail / shirt */}
      <path d="M90 75 L110 75 L115 85 L100 100 L85 85 L90 75 Z" fill="#C8E6C9" stroke="#424242" strokeWidth="2"/>
      {/* Control panel buttons */}
      <circle cx="50" cy="50" r="7" fill="#424242"/>
      <circle cx="70" cy="50" r="7" fill="#424242"/>
      <circle cx="90" cy="50" r="7" fill="#424242"/>
      {/* Selector knob */}
      <circle cx="120" cy="50" r="10" fill="#424242"/>
      <line x1="120" y1="45" x2="120" y2="40" stroke="#424242" strokeWidth="2"/>
    </svg>
  );


  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        {/* Background Decorative Elements */}
        <div style={{ ...styles.drop, ...styles.drop1 }}></div>
        <div style={{ ...styles.drop, ...styles.drop2 }}></div>
        <div style={{ ...styles.drop, ...styles.drop3 }}></div>
        <div style={{ ...styles.drop, ...styles.drop4 }}></div>

        <div style={{ ...styles.hexagon, ...styles.hex1 }}></div>
        <div style={{ ...styles.hexagon, ...styles.hex2 }}></div>
        <div style={{ ...styles.hexagon, ...styles.hex3 }}></div>
        <div style={{ ...styles.hexagon, ...styles.hex4 }}></div>

        <div style={styles.washerIcon}>
          <WasherIcon />
        </div>
        <div style={styles.fabCleanText}>FabClean Employee</div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.loginForm}>
          <h2 style={styles.heading}>Employee Login</h2>
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.inputGroup}>
            <UserIcon />
            <input
              type="email"
              placeholder="Email"
              style={styles.inputField}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={styles.inputGroup}>
            <LockIcon />
            <input
              type="password"
              placeholder="Password"
              style={styles.inputField}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={styles.forgotPassword}>
            <a href="#" style={styles.forgotPasswordLink}>
              Forgot Password / Reset
            </a>
          </div>

          <button style={styles.loginButton} onClick={handleLogin}>
            Login to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default FabCleanLogin;
