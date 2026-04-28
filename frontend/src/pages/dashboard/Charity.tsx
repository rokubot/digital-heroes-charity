import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type Charity = {
  id: string;
  name: string;
  description: string;
  image_url: string;
};

const CharityPage: React.FC = () => {
  const { profile } = useAuth();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [selectedCharityId, setSelectedCharityId] = useState<string | null>(null);
  const [percentage, setPercentage] = useState<number>(10);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch all charities
    supabase.from('charities').select('*').then(({ data }) => {
      if (data) setCharities(data);
    });

    if (profile) {
      setSelectedCharityId(profile.charity_id);
      setPercentage(profile.charity_percentage || 10);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('users')
      .update({ charity_id: selectedCharityId, charity_percentage: percentage })
      .eq('id', profile.id);

    setSaving(false);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Charity preferences saved successfully!');
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Support a Cause</h2>
        <p>A portion of your subscription goes directly to a charity of your choice. Minimum is 10%.</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Contribution Settings</h3>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Percentage of Subscription ({percentage}%)
            </label>
            <input 
              type="range" 
              min="10" 
              max="100" 
              value={percentage} 
              onChange={(e) => setPercentage(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
            />
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
        {message && <div style={{ marginTop: '1rem', color: message.includes('Error') ? 'var(--accent-primary)' : '#4ade80' }}>{message}</div>}
      </div>

      <h3 style={{ marginBottom: '1.5rem' }}>Select a Charity</h3>
      <div className="charity-grid">
        {charities.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No charities listed yet. Admins must add charities.</p>
        ) : (
          charities.map((c) => (
            <div 
              key={c.id} 
              className={`charity-card ${selectedCharityId === c.id ? 'selected' : ''}`}
              onClick={() => setSelectedCharityId(c.id)}
            >
              <div className="charity-image">
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>No Image</span>
                )}
              </div>
              <div className="charity-info">
                <h3>{c.name}</h3>
                <p>{c.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default CharityPage;
