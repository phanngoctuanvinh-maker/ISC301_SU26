import React from 'react';
import { Navigate } from 'react-router-dom';

function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userString);
    if (user.role !== 'admin') {
      // Not an admin, redirect to normal user profile page
      return <Navigate to="/profile" replace />;
    }
  } catch (e) {
    console.error(e);
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default AdminRoute;
