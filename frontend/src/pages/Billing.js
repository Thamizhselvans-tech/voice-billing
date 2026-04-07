import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import useSpeech from '../hooks/useSpeech';

const STEPS = ['voice', 'preview', 'confirm', 'done'];

export default function Billing() {
  const [step, setStep]           = useState('voice');
  const [items, setItems]         = useState([]);
  const [bill, setBill]           = useState(null);
  const [customer, setCustomer]   = useState({ name:'', phone:'', gstin:'', email:'' });
  const [payMethod, setPayMethod] = useState('cash');
  const [isInterState, setInterState] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [invoice, setInvoice]     = useState(null);
  const [unrecognized, setUnrec]  = useState([]);
  const [manualCode, setManualCode] = useState('');
  const [manualQty,  setManualQty]  = useState(1);
  const [products, setProducts]   = useState([]);

  const speech = useSpeech();

  // Load products for manual add
  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data.products)).catch(() => {});
  }, []);

  // Auto-decode when speech finalizes
  useEffect(() => {
    if (speech.transcript) decodeVoice(speech.transcript);
  }, [speech.transcript]);

  const decodeVoice = async (transcript) => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/voice/decode', { transcript });
      if (data.order.length === 0) { setError('No items recognized. Try again.'); setLoading(false); return; }
      const merged = mergeItems([...items, ...data.order]);
      setItems(merged);
      setUnrec(data.unrecognized || []);
      await recalculate(merged);
      setStep('preview');
    } catch (err) {
      setError(err.response?.data?.message || 'Decode failed');
    } finally { setLoading(false); }
  };

  const mergeItems = (arr) => {
    const map = {};
    arr.forEach(it => {
      const key = it.productId?.toString() || it.shortcut;
      if (map[key]) { map[key].qty += it.qty; map[key].lineTotal = map[key].unitPrice * map[key].qty; }
      else map[key] = { ...it };
    });
    return Object.values(map);
  };

  const recalculate = async (itms = items) => {
    const { data } = await api.post('/bill/calculate', { items: itms, isInterState });
    setBill(data);
    return data;
  };

  const updateQty = async (idx, newQty) => {
    if (newQty < 1) return;
    const updated = items.map((it, i) => i === idx ? { ...it, qty: newQty, lineTotal: it.unitPrice * newQty } : it);
    setItems(updated);
    await recalculate(updated);
  };

  const removeItem = async (idx) => {
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    if (updated.length === 0) { setBill(null); return; }
    await recalculate(updated);
  };

  const addManual = async () => {
    if (!manualCode) return;
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/voice/decode', { transcript: `${manualCode} ${manualQty}` });
      if (data.order.length === 0) { setError(`Shortcut '${manualCode}' not found`); setLoading(false); return; }
      const merged = mergeItems([...items, ...data.order]);
      setItems(merged);
      await recalculate(merged);
      setManualCode(''); setManualQty(1);
    } catch (err) { setError('Item not found'); }
    finally { setLoading(false); }
  };

  const generateInvoice = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/invoice/generate', {
        ...bill, items, customer, paymentMethod: payMethod,
        voiceTranscript: speech.transcript,
        confirmed: true   // ← explicit confirmation flag
      });
      setInvoice(data.invoice);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Invoice generation failed');
    } finally { setLoading(false); }
  };

  const resetAll = () => {
    setStep('voice'); setItems([]); setBill(null); setInvoice(null);
    setError(''); setUnrec([]); speech.reset();
    setCustomer({ name:'', phone:'', gstin:'', email:'' });
  };

  const fmt = n => `₹${parseFloat(n||0).toFixed(2)}`;

  // ── STEP: VOICE ──────────────────────────────────────────────────
  if (step === 'voice') return (
    <div style={{ padding:32 }} className="fade-up">
      <PageHeader title="New Bill" sub="Speak item shortcuts or add manually" />

      {/* Voice capture card */}
      <div style={{ maxWidth:640, margin:'0 auto' }}>
        <div style={card}>
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            {/* Mic button */}
            <div style={{ position:'relative', display:'inline-block', marginBottom:24 }}>
              {speech.listening && (
                <div style={{
                  position:'absolute', inset:-8, borderRadius:'50%',
                  border:'2px solid var(--danger)', animation:'pulse-ring 1.2s ease-out infinite'
                }} />
              )}
              <button onClick={speech.listening ? speech.stop : speech.start} style={{
                width:90, height:90, borderRadius:'50%',
                background: speech.listening
                  ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                  : 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                color:'#fff', fontSize:32, display:'flex',
                alignItems:'center', justifyContent:'center', margin:'0 auto',
                boxShadow: speech.listening ? '0 0 30px rgba(239,68,68,0.4)' : '0 0 20px rgba(59,130,246,0.3)',
                transition:'all 0.2s'
              }}>
                {speech.listening ? '⏹' : '🎤'}
              </button>
            </div>

            {/* Status */}
            <div style={{ fontSize:15, fontWeight:600, color: speech.listening ? 'var(--danger)' : 'var(--text2)', marginBottom:8 }}>
              {speech.listening ? '● Recording…' : 'Tap to speak'}
            </div>

            {/* Live transcript */}
            {(speech.interim || speech.transcript) && (
              <div style={{ background:'var(--bg3)', borderRadius:8, padding:'10px 16px', margin:'12px 0', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--text2)', minHeight:40 }}>
                {speech.interim || speech.transcript}
                {speech.listening && <span style={{ animation:'blink 1s step-end infinite' }}>|</span>}
              </div>
            )}

            {speech.error && <div style={{ color:'var(--danger)', fontSize:13, marginTop:8 }}>{speech.error}</div>}

            {/* Example shortcuts */}
            <div style={{ marginTop:20, padding:'12px 16px', background:'var(--bg3)', borderRadius:8, textAlign:'left' }}>
              <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Example voice commands</div>
              {['"bn 2, ch 1, lsi 3"', '"vt 2 wtr 4"', '"pbm 1 roti 4 dal 2"'].map(ex => (
                <div key={ex} style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--accent)', marginBottom:4 }}>{ex}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Manual entry */}
        <div style={card}>
          <div style={{ fontSize:13, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:14, fontWeight:600 }}>Or add by shortcut</div>
          <div style={{ display:'flex', gap:8 }}>
            <input value={manualCode} onChange={e => setManualCode(e.target.value.toLowerCase())}
              onKeyDown={e => e.key === 'Enter' && addManual()}
              placeholder="shortcut (e.g. bn)" style={{ ...inputSt, flex:2 }} />
            <input type="number" value={manualQty} min={1}
              onChange={e => setManualQty(parseInt(e.target.value)||1)}
              style={{ ...inputSt, flex:1 }} />
            <button onClick={addManual} disabled={loading} style={btnPrimary}>
              {loading ? '…' : 'Add'}
            </button>
          </div>

          {/* Shortcut cheatsheet */}
          {products.length > 0 && (
            <div style={{ marginTop:14, display:'flex', flexWrap:'wrap', gap:6 }}>
              {products.map(p => (
                <button key={p._id} onClick={() => { setManualCode(p.shortcut); }}
                  style={{ padding:'4px 10px', borderRadius:6, background:'var(--bg3)', border:'1px solid var(--border)', fontSize:12, color:'var(--text2)', cursor:'pointer' }}>
                  <span style={{ color:'var(--accent)', fontFamily:'var(--font-mono)' }}>{p.shortcut}</span> — {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <div style={errorBox}>{error}</div>}

        {items.length > 0 && (
          <button onClick={() => { recalculate(); setStep('preview'); }} style={{ ...btnPrimary, width:'100%', padding:14, fontSize:15 }}>
            View Bill Preview ({items.length} item{items.length>1?'s':''}) →
          </button>
        )}
        {loading && <div style={{ textAlign:'center', color:'var(--text3)', marginTop:12 }}>Processing…</div>}
      </div>
    </div>
  );

  // ── STEP: PREVIEW ─────────────────────────────────────────────────
  if (step === 'preview') return (
    <div style={{ padding:32 }} className="fade-up">
      <PageHeader title="Bill Preview" sub="Review and edit before confirming" />

      <div style={{ maxWidth:720, margin:'0 auto' }}>
        {unrecognized.length > 0 && (
          <div style={{ ...errorBox, marginBottom:16 }}>
            Unrecognized shortcuts: <strong>{unrecognized.join(', ')}</strong> — skipped.
          </div>
        )}

        {/* Items table */}
        <div style={{ ...card, padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', fontFamily:'var(--font-head)', fontWeight:700, fontSize:15 }}>
            Order Items
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg3)' }}>
                {['Item','Shortcut','Qty','Rate','GST','Total',''].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} style={{ borderTop:'1px solid var(--border)' }} className="slide-in">
                  <td style={{ padding:'12px 16px', fontWeight:500 }}>{it.name}</td>
                  <td style={{ padding:'12px 16px', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--accent)' }}>{it.shortcut}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <button onClick={() => updateQty(i, it.qty-1)} style={qtyBtn}>−</button>
                      <span style={{ fontFamily:'var(--font-mono)', minWidth:20, textAlign:'center' }}>{it.qty}</span>
                      <button onClick={() => updateQty(i, it.qty+1)} style={qtyBtn}>+</button>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', fontFamily:'var(--font-mono)', fontSize:13 }}>{fmt(it.unitPrice)}</td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'var(--text3)' }}>{(it.gstRate*100).toFixed(0)}%</td>
                  <td style={{ padding:'12px 16px', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--success)' }}>{fmt(it.lineTotal)}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <button onClick={() => removeItem(i)} style={{ background:'none', color:'var(--danger)', fontSize:16, padding:4 }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* GST summary */}
        {bill && (
          <div style={{ ...card, marginTop:12 }}>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text2)', cursor:'pointer' }}>
                <input type="checkbox" checked={isInterState} onChange={e => { setInterState(e.target.checked); recalculate(); }} />
                Inter-state (IGST)
              </label>
            </div>
            <div style={{ marginTop:16, borderTop:'1px solid var(--border)', paddingTop:16 }}>
              <TaxRow label="Subtotal" value={fmt(bill.subtotal)} />
              {!bill.isInterState ? <>
                <TaxRow label="CGST" value={fmt(bill.cgst)} />
                <TaxRow label="SGST" value={fmt(bill.sgst)} />
              </> : <TaxRow label="IGST" value={fmt(bill.igst)} />}
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:10, marginTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:18 }}>Grand Total</span>
                <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:22, color:'var(--accent)' }}>{fmt(bill.grandTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {error && <div style={errorBox}>{error}</div>}

        <div style={{ display:'flex', gap:12, marginTop:16 }}>
          <button onClick={() => setStep('voice')} style={{ ...btnSecondary, flex:1 }}>← Edit</button>
          <button onClick={() => setStep('confirm')} style={{ ...btnPrimary, flex:2 }}>Proceed to Confirm →</button>
        </div>
      </div>
    </div>
  );

  // ── STEP: CONFIRM ─────────────────────────────────────────────────
  if (step === 'confirm') return (
    <div style={{ padding:32 }} className="fade-up">
      <PageHeader title="Confirm & Generate Invoice" sub="Final review — invoice will be created after this step" />

      <div style={{ maxWidth:640, margin:'0 auto' }}>
        {/* Customer details */}
        <div style={card}>
          <div style={{ fontSize:13, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:14, fontWeight:600 }}>Customer Details (optional)</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[['name','Customer Name'],['phone','Phone'],['gstin','GSTIN'],['email','Email']].map(([k,pl]) => (
              <input key={k} value={customer[k]} onChange={e => setCustomer(c => ({...c,[k]:e.target.value}))}
                placeholder={pl} style={inputSt} />
            ))}
          </div>
          <div style={{ marginTop:12 }}>
            <label style={{ fontSize:12, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:6 }}>Payment Method</label>
            <div style={{ display:'flex', gap:8 }}>
              {['cash','upi','card','credit'].map(m => (
                <button key={m} onClick={() => setPayMethod(m)} style={{
                  padding:'6px 16px', borderRadius:6, fontSize:13, fontWeight:500,
                  background: payMethod === m ? 'var(--accent)' : 'var(--bg3)',
                  color: payMethod === m ? '#fff' : 'var(--text2)',
                  border: `1px solid ${payMethod === m ? 'var(--accent)' : 'var(--border)'}`,
                  textTransform:'capitalize'
                }}>{m.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Final bill summary */}
        <div style={{ ...card, background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, marginBottom:14, color:'var(--accent)' }}>Final Bill Summary</div>
          {items.map((it, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'4px 0', borderBottom:'1px solid var(--border)' }}>
              <span>{it.name} × {it.qty}</span>
              <span style={{ fontFamily:'var(--font-mono)' }}>{fmt(it.lineTotal)}</span>
            </div>
          ))}
          <div style={{ marginTop:12 }}>
            <TaxRow label="Subtotal" value={fmt(bill?.subtotal)} />
            {!bill?.isInterState ? <>
              <TaxRow label="CGST" value={fmt(bill?.cgst)} />
              <TaxRow label="SGST" value={fmt(bill?.sgst)} />
            </> : <TaxRow label="IGST" value={fmt(bill?.igst)} />}
          </div>
          <div style={{ marginTop:12, paddingTop:12, borderTop:'2px solid var(--accent)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:20 }}>GRAND TOTAL</span>
            <span style={{ fontFamily:'var(--font-mono)', fontWeight:800, fontSize:26, color:'var(--accent)' }}>{fmt(bill?.grandTotal)}</span>
          </div>
        </div>

        {/* Warning banner */}
        <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'var(--r)', padding:'12px 16px', marginTop:12, fontSize:13, color:'var(--warning)' }}>
          ⚠️ Once confirmed, the invoice will be saved and a PDF will be generated. This cannot be undone.
        </div>

        {error && <div style={errorBox}>{error}</div>}

        <div style={{ display:'flex', gap:12, marginTop:16 }}>
          <button onClick={() => setStep('preview')} style={{ ...btnSecondary, flex:1 }}>← Back</button>
          <button onClick={generateInvoice} disabled={loading} style={{
            ...btnPrimary, flex:2,
            background: loading ? 'var(--border)' : 'linear-gradient(135deg,#10b981,#059669)',
            fontSize:15, fontWeight:700
          }}>
            {loading ? 'Generating…' : '✓ Confirm & Generate Invoice'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── STEP: DONE ────────────────────────────────────────────────────
  return (
    <div style={{ padding:32, display:'flex', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 80px)' }} className="fade-up">
      <div style={{ maxWidth:480, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:72, marginBottom:16 }}>✅</div>
        <h2 style={{ fontFamily:'var(--font-head)', fontSize:26, fontWeight:800, marginBottom:8 }}>Invoice Generated!</h2>
        <p style={{ color:'var(--text2)', marginBottom:24 }}>Invoice has been saved successfully.</p>

        <div style={{ ...card, textAlign:'left', marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ color:'var(--text3)' }}>Invoice Number</span>
            <span style={{ fontFamily:'var(--font-mono)', color:'var(--accent)' }}>{invoice?.invoiceNumber}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ color:'var(--text3)' }}>Grand Total</span>
            <span style={{ fontFamily:'var(--font-mono)', color:'var(--success)', fontWeight:700, fontSize:18 }}>{fmt(invoice?.grandTotal)}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'var(--text3)' }}>Confirmed At</span>
            <span style={{ fontSize:13, color:'var(--text2)' }}>{invoice?.confirmedAt ? new Date(invoice.confirmedAt).toLocaleString('en-IN') : '—'}</span>
          </div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          {invoice?.pdfUrl && (
            <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" style={{ ...btnPrimary, flex:1, textAlign:'center', padding:'12px', display:'block' }}>
              📄 Download PDF
            </a>
          )}
          <button onClick={resetAll} style={{ ...btnSecondary, flex:1, padding:12 }}>+ New Bill</button>
        </div>
      </div>
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────
function PageHeader({ title, sub }) {
  return (
    <div style={{ marginBottom:28 }}>
      <h1 style={{ fontFamily:'var(--font-head)', fontSize:24, fontWeight:800, letterSpacing:-0.5 }}>{title}</h1>
      {sub && <p style={{ color:'var(--text3)', fontSize:13, marginTop:4 }}>{sub}</p>}
    </div>
  );
}

function TaxRow({ label, value }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text2)', padding:'3px 0' }}>
      <span>{label}</span>
      <span style={{ fontFamily:'var(--font-mono)' }}>{value}</span>
    </div>
  );
}

// ── Shared styles ───────────────────────────────────────────────────
const card       = { background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:20, marginBottom:16 };
const inputSt    = { width:'100%', padding:'10px 14px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', fontSize:14, outline:'none' };
const btnPrimary = { padding:'10px 20px', borderRadius:10, background:'linear-gradient(135deg,#3b82f6,#06b6d4)', color:'#fff', fontWeight:600, fontSize:14, border:'none', cursor:'pointer' };
const btnSecondary={ padding:'10px 20px', borderRadius:10, background:'var(--card)', color:'var(--text2)', fontWeight:600, fontSize:14, border:'1px solid var(--border)', cursor:'pointer' };
const errorBox   = { background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', color:'var(--danger)', fontSize:13, marginBottom:12 };
const qtyBtn     = { width:26, height:26, borderRadius:6, background:'var(--bg3)', color:'var(--text)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border)' };
