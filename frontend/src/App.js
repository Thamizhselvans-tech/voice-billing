import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import Billing     from './pages/Billing';
import Invoices    from './pages/Invoices';
import Products    from './pages/Products';
import Layout      from './components/Layout';

function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#94a3b8'}}>Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Private><Layout /></Private>}>
            <Route index         element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="billing"   element={<Billing />} />
            <Route path="invoices"  element={<Invoices />} />
            <Route path="products"  element={<Products />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
