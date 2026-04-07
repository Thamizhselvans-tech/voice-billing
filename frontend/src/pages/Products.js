import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const empty = { name:'', shortcut:'', price:'', category:'', gstRate:'0.05', hsnCode:'', unit:'piece' };

export default function Products() {
  const { user }      = useAuth();
  const isAdmin       = user?.role === 'admin';
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(empty);
  const [editing, setEditing]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products);
    } catch (err) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    try {
      if (editing) {
        await api.put(`/products/${editing}`, form);
      } else {
        await api.post('/products', form);
      }
      setForm(empty); setEditing(null); setShowForm(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (p) => {
    setForm({ name:p.name, shortcut:p.shortcut, price:p.price, category:p.category, gstRate:p.gstRate, hsnCode:p.hsnCode||'', unit:p.unit||'piece' });
    setEditing(p._id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  const categories = [...new Set(products.map(p => p.category))].sort();
  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.shortcut.includes(search.toLowerCase())
  );

  return (
    <div style={{ padding:32 }} className="fade-up">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-head)', fontSize:24, fontWeight:800 }}>Products</h1>
          <p style={{ color:'var(--text3)', fontSize:13, marginTop:2 }}>{products.length} active products</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ padding:'9px 14px', borderRadius:8, background:'var(--card)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13, width:180 }} />
          {isAdmin && (
            <button onClick={() => { setForm(empty); setEditing(null); setShowForm(true); }}
              style={{ padding:'9px 18px', borderRadius:8, background:'linear-gradient(135deg,#3b82f6,#06b6d4)', color:'#fff', fontWeight:600, fontSize:14 }}>
              + Add Product
            </button>
          )}
        </div>
      </div>

      {/* Group by category */}
      {loading ? (
        <div style={{ textAlign:'center', color:'var(--text3)', padding:60 }}>Loading…</div>
      ) : (
        categories.map(cat => {
          const catItems = filtered.filter(p => p.category === cat);
          if (catItems.length === 0) return null;
          return (
            <div key={cat} style={{ marginBottom:24 }}>
              <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, fontWeight:600, marginBottom:8, paddingLeft:4 }}>{cat}</div>
              <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r2)', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr style={{ background:'var(--bg3)' }}>
                    {['Shortcut','Name','Price','GST','Unit', isAdmin?'Actions':''].filter(Boolean).map(h => (
                      <th key={h} style={{ padding:'9px 16px', textAlign:'left', fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {catItems.map(p => (
                      <tr key={p._id} style={{ borderTop:'1px solid var(--border)' }}>
                        <td style={{ padding:'10px 16px', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--accent)' }}>{p.shortcut}</td>
                        <td style={{ padding:'10px 16px', fontWeight:500 }}>{p.name}</td>
                        <td style={{ padding:'10px 16px', fontFamily:'var(--font-mono)', color:'var(--success)' }}>₹{p.price.toFixed(2)}</td>
                        <td style={{ padding:'10px 16px', fontSize:13, color:'var(--text2)' }}>{(p.gstRate*100).toFixed(0)}%</td>
                        <td style={{ padding:'10px 16px', fontSize:13, color:'var(--text2)' }}>{p.unit}</td>
                        {isAdmin && (
                          <td style={{ padding:'10px 16px' }}>
                            <button onClick={() => handleEdit(p)} style={{ marginRight:8, padding:'4px 12px', borderRadius:6, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:12 }}>Edit</button>
                            <button onClick={() => handleDelete(p._id)} style={{ padding:'4px 12px', borderRadius:6, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'var(--danger)', fontSize:12 }}>Del</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}
             onClick={() => setShowForm(false)}>
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r2)', width:'100%', maxWidth:480, padding:28 }}
               onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:18 }}>{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background:'none', color:'var(--text2)', fontSize:20 }}>✕</button>
            </div>
            {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'10px 14px', color:'var(--danger)', fontSize:13, marginBottom:14 }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                {[['name','Name','text',true],['shortcut','Shortcut Code','text',true],['price','Price (₹)','number',true],['category','Category','text',true],['hsnCode','HSN Code','text',false],['unit','Unit','text',false]].map(([k,pl,type,req]) => (
                  <div key={k}>
                    <label style={{ display:'block', fontSize:11, color:'var(--text3)', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 }}>{pl}</label>
                    <input type={type} required={req} value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))}
                      style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13 }} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={{ display:'block', fontSize:11, color:'var(--text3)', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 }}>GST Rate</label>
                <select value={form.gstRate} onChange={e => setForm(f => ({...f,gstRate:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', fontSize:13 }}>
                  <option value="0">0% (Exempt)</option>
                  <option value="0.05">5%</option>
                  <option value="0.12">12%</option>
                  <option value="0.18">18%</option>
                  <option value="0.28">28%</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex:1, padding:'10px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', fontWeight:600 }}>Cancel</button>
                <button type="submit" style={{ flex:2, padding:'10px', borderRadius:8, background:'linear-gradient(135deg,#3b82f6,#06b6d4)', color:'#fff', fontWeight:600 }}>
                  {editing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
