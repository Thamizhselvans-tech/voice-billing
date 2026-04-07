import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '◈', label: 'Dashboard' },
  { to: '/billing',   icon: '◎', label: 'New Bill'  },
  { to: '/invoices',  icon: '◧', label: 'Invoices'  },
  { to: '/products',  icon: '◫', label: 'Products'  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 220,
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0, zIndex: 10
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 0' : '20px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#3b82f6,#06b6d4)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, fontWeight:800, flexShrink:0
          }}>V</div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:16, color:'var(--text)', letterSpacing:-0.5 }}>VoiceBill</div>
              <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:1 }}>SMART BILLING</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 8px' }}>
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 8, marginBottom: 4,
              color: isActive ? 'var(--accent)' : 'var(--text2)',
              background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
              fontWeight: isActive ? 600 : 400, fontSize: 14,
              transition: 'all 0.15s'
            })}>
              <span style={{ fontSize:18 }}>{icon}</span>
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* User + collapse */}
        <div style={{ padding:'12px 8px', borderTop:'1px solid var(--border)' }}>
          {!collapsed && (
            <div style={{ padding:'8px 12px', marginBottom:8, borderRadius:8, background:'var(--bg3)' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{user?.name}</div>
              <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5 }}>{user?.role}</div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{
            width:'100%', padding:'8px', borderRadius:8,
            background:'transparent', color:'var(--text3)', fontSize:18,
            marginBottom:4, transition:'color 0.15s'
          }}>{collapsed ? '▶' : '◀'}</button>
          <button onClick={handleLogout} style={{
            width:'100%', padding: collapsed ? '8px' : '8px 12px',
            borderRadius:8, background:'transparent',
            color:'var(--danger)', fontSize: collapsed ? 18 : 13,
            display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap:8, transition:'background 0.15s'
          }}>
            <span>⏻</span>{!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, overflow:'auto', background:'var(--bg)' }}>
        <Outlet />
      </main>
    </div>
  );
}
