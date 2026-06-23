import React from 'react';
import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: 'var(--bg-primary)',
      backgroundImage: `
        radial-gradient(at 0% 0%, hsla(217, 91%, 60%, 0.08) 0px, transparent 50%),
        radial-gradient(at 100% 100%, hsla(190, 90%, 50%, 0.08) 0px, transparent 50%)
      `
    }}>
      <Outlet />
    </div>
  );
}

export default AuthLayout;
