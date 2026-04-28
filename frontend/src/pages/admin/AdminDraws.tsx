import React, { useState } from 'react';

type DrawResult = {
  winning_numbers: number[];
  prize_pool: number;
  winners_count: {
    "5-match": number;
    "4-match": number;
    "3-match": number;
  };
  payouts_per_winner: {
    "5-match": number;
    "4-match": number;
    "3-match": number;
  };
  message?: string;
  error?: string;
};

const AdminDraws: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [error, setError] = useState('');

  // NOTE: This assumes the Python backend is running locally on port 8080
  const API_URL = 'http://localhost:8080/api/draw';

  const handleSimulate = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/simulate`, { method: 'POST' });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm("Are you sure you want to PUBLISH this draw? This will permanently write the winnings to the database and notify users.")) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/publish`, { method: 'POST' });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      alert(data.message || "Draw published successfully!");
      setResult(null); // Clear simulation after publish
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Draw Engine</h2>
        <p>Simulate and execute the monthly draws. Uses the Python backend for heavy lifting.</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Controls</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={handleSimulate} disabled={loading}>
            {loading ? 'Processing...' : 'Simulate Draw'}
          </button>
          <button 
            className="btn-primary" 
            style={{ background: 'var(--bg-primary)', border: '1px solid #f87171', color: '#f87171' }} 
            onClick={handlePublish} 
            disabled={loading}
          >
            Publish Live Draw
          </button>
        </div>
        {error && <div className="auth-error" style={{ marginTop: '1rem' }}>{error}</div>}
      </div>

      {result && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>Simulation Results</h3>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            {result.winning_numbers.map((n, i) => (
              <div key={i} style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {n}
              </div>
            ))}
          </div>
          
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
             <div className="stat-card">
              <h4>Total Prize Pool</h4>
              <div className="stat-value" style={{ WebkitTextFillColor: 'initial', color: 'white' }}>${result.prize_pool.toFixed(2)}</div>
            </div>
          </div>

          <h4 style={{ marginBottom: '1rem' }}>Payout Distribution</h4>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.5rem 0' }}>Match Type</th>
                <th>Winners</th>
                <th>Payout Per Winner</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '0.75rem 0' }}>5-Match (40%)</td>
                <td>{result.winners_count["5-match"]}</td>
                <td style={{ color: '#4ade80' }}>${result.payouts_per_winner["5-match"].toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem 0' }}>4-Match (35%)</td>
                <td>{result.winners_count["4-match"]}</td>
                <td style={{ color: '#4ade80' }}>${result.payouts_per_winner["4-match"].toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem 0' }}>3-Match (25%)</td>
                <td>{result.winners_count["3-match"]}</td>
                <td style={{ color: '#4ade80' }}>${result.payouts_per_winner["3-match"].toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default AdminDraws;
