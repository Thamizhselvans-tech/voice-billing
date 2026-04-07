import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [selected, setSelected] = useState(null);

  const fetchInvoices = async (pg = 1, q = '') => {
    setLoading(true);
    try {
      const { data } = await api.get(`/invoice?page=${pg}&limit=15${q ? `&search=${q}` : ''}`);
      setInvoices(data.invoices);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(page, search); }, [page]);

  const handleSearch = e => {
    e.preventDefault();
    setPage(1); fetchInvoices(1, search);
  };

  const fmt = n => `₹${parseFloat(n||0).toLocaleString('en-IN', { minimumFractionDigits:2 })}`;

  return (
    <div style={{ padding:32 }} className="fade-up">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-head)', fontSize:24, fontWeight:800 }}>Invoices</h1>
          <p style={{ color:'var(--text3)', fontSize:13, marginTop:2 }}>{total} total confirmed invoices</p>
        </div>
        <form onSubmit={handleSearch} style={{ display:'flex', gap:8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice #…"
            style={{ padding:'9px 14px', borderRadius:8, background:'var(--card)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, width:200 }} />
          <button type="submit" style={{ padding:'9px 16px', borderRadius:8, background:'var(--accent)', color:'#fff', fontWeight:600, fontSize:13 }}>Search</button>
        </form>
      </div>

      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r2)', overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'var(--text3)' }}>Loading invoices…</div>
        ) : invoices.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:'var(--text3)' }}>No invoices found.</div>
        ) : (
          <>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg3)' }}>
                  {['Invoice #','Customer','Items','Amount','Payment','Date','PDF'].map(h => (
                    <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id} style={{ borderTop:'1px solid var(--border)', cursor:'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      onClick={() => setSelected(inv)}>
                    <td style={{ padding:'12px 20px', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--accent)' }}>{inv.invoiceNumber}</td>
                    <td style={{ padding:'12px 20px', fontSize:13 }}>{inv.customer?.name || 'Walk-in'}</td>
                    <td style={{ padding:'12px 20px', fontSize:13, color:'var(--text2)' }}>{inv.items?.length || 0} items</td>
                    <td style={{ padding:'12px 20px', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--success)' }}>{fmt(inv.grandTotal)}</td>
                    <td style={{ padding:'12px 20px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, textTransform:'uppercase',
                        background:'rgba(59,130,246,0.12)', color:'var(--accent)' }}>{inv.paymentMethod}</span>
                    </td>
                    <td style={{ padding:'12px 20px', fontSize:12, color:'var(--text3)' }}>{new Date(inv.confirmedAt).toLocaleString('en-IN')}</td>
                    <td style={{ padding:'12px 20px' }}>
                      {inv.pdfPath && (
                        <a href={`/invoices/${inv.pdfPath}`} target="_blank" rel="noreferrer"
                           onClick={e => e.stopPropagation()}
                           style={{ fontSize:18, textDecoration:'none' }}>📄</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid var(--border)' }}>
              <span style={{ fontSize:13, color:'var(--text3)' }}>Page {page} of {pages}</span>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                  style={{ padding:'6px 14px', borderRadius:6, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:13, cursor:page===1?'default':'pointer', opacity:page===1?0.4:1 }}>← Prev</button>
                <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages}
                  style={{ padding:'6px 14px', borderRadius:6, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:13, cursor:page===pages?'default':'pointer', opacity:page===pages?0.4:1 }}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}
             onClick={() => setSelected(null)}>
          <div style={{ background:'var(--card)', borderRadius:'var(--r2)', border:'1px solid var(--border)', width:'100%', maxWidth:560, maxHeight:'80vh', overflow:'auto' }}
               onClick={e => e.stopPropagation()}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:700 }}>{selected.invoiceNumber}</div>
              <button onClick={() => setSelected(null)} style={{ background:'none', color:'var(--text2)', fontSize:20 }}>✕</button>
            </div>
            <div style={{ padding:20 }}>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:12, color:'var(--text3)', marginBottom:4 }}>Customer</div>
                <div>{selected.customer?.name || 'Walk-in'} {selected.customer?.phone && `• ${selected.customer.phone}`}</div>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, marginBottom:12 }}>
                <thead><tr style={{ background:'var(--bg3)' }}>
                  {['Item','Qty','Rate','Total'].map(h => <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontSize:11, color:'var(--text3)' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {selected.items?.map((it, i) => (
                    <tr key={i} style={{ borderTop:'1px solid var(--border)' }}>
                      <td style={{ padding:'8px 10px' }}>{it.name}</td>
                      <td style={{ padding:'8px 10px' }}>{it.qty}</td>
                      <td style={{ padding:'8px 10px', fontFamily:'var(--font-mono)' }}>{fmt(it.unitPrice)}</td>
                      <td style={{ padding:'8px 10px', fontFamily:'var(--font-mono)', color:'var(--success)' }}>{fmt(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:10 }}>
                <Row label="Subtotal" value={fmt(selected.subtotal)} />
                {!selected.isInterState ? <><Row label="CGST" value={fmt(selected.cgst)} /><Row label="SGST" value={fmt(selected.sgst)} /></> : <Row label="IGST" value={fmt(selected.igst)} />}
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:16, marginTop:8, paddingTop:8, borderTop:'1px solid var(--border)' }}>
                  <span>Grand Total</span><span style={{ color:'var(--accent)', fontFamily:'var(--font-mono)' }}>{fmt(selected.grandTotal)}</span>
                </div>
              </div>
              {selected.pdfPath && (
                <a href={`/invoices/${selected.pdfPath}`} target="_blank" rel="noreferrer"
                   style={{ display:'block', marginTop:16, padding:'10px', borderRadius:8, background:'var(--accent)', color:'#fff', textAlign:'center', fontWeight:600 }}>
                  📄 Download PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text2)', padding:'3px 0' }}>
      <span>{label}</span><span style={{ fontFamily:'var(--font-mono)' }}>{value}</span>
    </div>
  );
}
