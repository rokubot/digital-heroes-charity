import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Charity = {
  id: string;
  name: string;
  description: string;
  image_url: string;
};

const AdminCharities: React.FC = () => {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    const { data } = await supabase.from('charities').select('*');
    if (data) setCharities(data);
  };

  const handleAddCharity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('charities').insert({
      name,
      description,
      image_url: imageUrl || null
    });

    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      setName('');
      setDescription('');
      setImageUrl('');
      fetchCharities();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? This will remove the charity from all users who selected it.")) return;
    await supabase.from('charities').delete().eq('id', id);
    fetchCharities();
  };

  return (
    <>
      <div className="page-header">
        <h2>Manage Charities</h2>
        <p>Add or remove charities that users can donate to.</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Add New Charity</h3>
        <form className="auth-form" onSubmit={handleAddCharity}>
          <div className="form-group">
            <label>Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Charity Name" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              required 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', padding: '1rem', borderRadius: '12px', minHeight: '100px', fontFamily: 'inherit' }}
            />
          </div>
          <div className="form-group">
            <label>Image URL (Optional)</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'fit-content' }}>
            {loading ? 'Adding...' : 'Add Charity'}
          </button>
        </form>
      </div>

      <h3 style={{ marginBottom: '1.5rem' }}>Current Charities ({charities.length})</h3>
      <div className="charity-grid">
        {charities.map((c) => (
          <div key={c.id} className="charity-card">
            <div className="charity-image" style={{ height: '100px' }}>
              {c.image_url ? <img src={c.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'No Image'}
            </div>
            <div className="charity-info">
              <h3>{c.name}</h3>
              <button 
                onClick={() => handleDelete(c.id)}
                style={{ background: 'transparent', border: '1px solid #f87171', color: '#f87171', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.8rem' }}
              >
                Delete Charity
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default AdminCharities;
