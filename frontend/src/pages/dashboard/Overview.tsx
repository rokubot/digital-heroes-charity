import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const Overview: React.FC = () => {
  const { profile } = useAuth();
  const [totalWon, setTotalWon] = useState(0);
  const [scoresCount, setScoresCount] = useState(0);
  const [loadingSub, setLoadingSub] = useState(false);

  useEffect(() => {
    if (profile) {
      // Fetch total winnings
      supabase
        .from('winnings')
        .select('amount')
        .eq('user_id', profile.id)
        .then(({ data }) => {
          if (data) {
            const sum = data.reduce((acc, curr) => acc + Number(curr.amount), 0);
            setTotalWon(sum);
          }
        });

      // Fetch scores count
      supabase
        .from('scores')
        .select('id', { count: 'exact' })
        .eq('user_id', profile.id)
        .then(({ count }) => {
          setScoresCount(count || 0);
        });
    }
  }, [profile]);

  const handleToggleSubscription = async (newStatus: string) => {
    if (!profile) return;
    setLoadingSub(true);
    try {
      // Hit the Python Backend to securely toggle the subscription (Mocking a Stripe webhook response)
      const response = await fetch('https://digital-heroes-charity.vercel.app/api/subscription/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: profile.id, status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update subscription');
      
      // Force a reload to get the new AuthContext profile state
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Error updating subscription. Make sure the Python backend is running!');
    } finally {
      setLoadingSub(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p>Welcome back! Here's a summary of your participation.</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Subscription Status</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Current Plan: <strong style={{ color: profile?.subscription_status === 'active' ? '#4ade80' : '#f87171' }}>
                {profile?.subscription_status ? profile.subscription_status.toUpperCase() : 'INACTIVE'}
              </strong>
            </p>
          </div>
          {profile?.subscription_status !== 'active' ? (
            <button 
              className="btn-primary" 
              onClick={() => handleToggleSubscription('active')}
              disabled={loadingSub}
            >
              {loadingSub ? 'Processing...' : 'Subscribe (Mock Stripe)'}
            </button>
          ) : (
             <button 
              className="btn-primary" 
              style={{ background: 'transparent', border: '1px solid #f87171', color: '#f87171' }}
              onClick={() => handleToggleSubscription('inactive')}
              disabled={loadingSub}
            >
              {loadingSub ? 'Processing...' : 'Cancel Subscription'}
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Winnings</h4>
          <div className="stat-value">${totalWon.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <h4>Scores Entered</h4>
          <div className="stat-value">{scoresCount} / 5</div>
        </div>
        <div className="stat-card">
          <h4>Charity Contribution</h4>
          <div className="stat-value">{profile?.charity_percentage || 10}%</div>
        </div>
      </div>
    </>
  );
};

export default Overview;
