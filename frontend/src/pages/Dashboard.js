import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r2)',
      padding:'20px 24px', position:'relative', overflow:'hidden'
    }}>
      <div style={{ position:'absolute', top:0, left:0, width:3, height:'100%', background: color }} />
      <div style={{ fontSize:12, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:800, color:'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = n => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div style={{ padding:32 }} className="fade-up">
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontFamily:'var(--font-head)', fontSize:26, fontWeight:800, letterSpacing:-0.5 }}>
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color:'var(--text2)', marginTop:4, fontSize:14 }}>
          {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {loading ? (
        <div style={{ color:'var(--text3)', textAlign:'center', padding:60 }}>Loading stats…</div>
      ) : (
        <>
          {/* Stat grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:32 }}>
            <StatCard label="Today's Revenue"  value={fmt(stats?.todayRevenue)}  sub={`${stats?.todayInvoices || 0} invoices today`}   color="var(--accent)" />
            <StatCard label="Month Revenue"    value={fmt(stats?.monthRevenue)}  sub={`${stats?.monthInvoices || 0} invoices this month`} color="var(--accent2)" />
            <StatCard label="Total Invoices"   value={stats?.totalInvoices || 0} sub="All time"  color="var(--success)" />
          </div>

          {/* Recent invoices */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r2)', overflow:'hidden' }}>
            <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <h2 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:16 }}>Recent Invoices</h2>
            </div>
            {stats?.recentInvoices?.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>No invoices yet. Create your first bill!</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'var(--bg3)' }}>
                    {['Invoice #','Customer','Amount','Date'].map(h => (
                      <th key={h} style={{ padding:'10px 24px', textAlign:'left', fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, fontWeight:600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentInvoices?.map((inv, i) => (
                    <tr key={inv._id} style={{ borderTop:'1px solid var(--border)', transition:'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'12px 24px', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--accent)' }}>{inv.invoiceNumber}</td>
                      <td style={{ padding:'12px 24px', fontSize:13 }}>{inv.customer?.name || 'Walk-in'}</td>
                      <td style={{ padding:'12px 24px', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--success)' }}>{fmt(inv.grandTotal)}</td>
                      <td style={{ padding:'12px 24px', fontSize:12, color:'var(--text3)' }}>{new Date(inv.confirmedAt).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
