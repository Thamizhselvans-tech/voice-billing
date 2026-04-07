import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email:'', password:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg)',
      backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.06) 0%, transparent 50%)'
    }}>
      <div style={{ width:'100%', maxWidth:400, padding:'0 20px' }} className="fade-up">
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{
            width:60, height:60, borderRadius:16, margin:'0 auto 16px',
            background:'linear-gradient(135deg,#3b82f6,#06b6d4)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:28, fontWeight:800, color:'#fff'
          }}>V</div>
          <h1 style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:-1 }}>VoiceBill</h1>
          <p style={{ color:'var(--text2)', fontSize:14, marginTop:4 }}>Smart Billing System</p>
        </div>

        {/* Card */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:var_r2(), padding:'32px' }}>
          <h2 style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, marginBottom:24 }}>Sign in</h2>

          {error && (
            <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', marginBottom:16, color:'var(--danger)', fontSize:13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:12, color:'var(--text3)', marginBottom:6, letterSpacing:0.5, textTransform:'uppercase' }}>Email</label>
              <input
                type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@billing.com"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:12, color:'var(--text3)', marginBottom:6, letterSpacing:0.5, textTransform:'uppercase' }}>Password</label>
              <input
                type="password" required value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'13px', borderRadius:10,
              background: loading ? 'var(--border)' : 'linear-gradient(135deg,#3b82f6,#06b6d4)',
              color:'#fff', fontWeight:700, fontSize:15,
              transition:'opacity 0.2s', opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <div style={{ marginTop:20, padding:'12px', background:'var(--bg3)', borderRadius:8, fontSize:12, color:'var(--text3)' }}>
            <div style={{ fontWeight:600, color:'var(--text2)', marginBottom:6 }}>Demo credentials</div>
            <div>Admin: admin@billing.com / admin123</div>
            <div>Operator: operator@billing.com / operator123</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function var_r2() { return 'var(--r2)'; }

const inputStyle = {
  width:'100%', padding:'11px 14px', borderRadius:8,
  background:'var(--bg3)', border:'1px solid var(--border)',
  color:'var(--text)', fontSize:14, outline:'none',
  transition:'border-color 0.15s'
};
