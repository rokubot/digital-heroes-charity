import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/global.scss';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', lineHeight: 1.2 }}>
        Play for Purpose.<br/>
        <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>
          Win for Charity.
        </span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
        Join the monthly draw based on your golf performance. A portion of every subscription goes directly to the charity of your choice.
      </p>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={() => navigate('/signup')}>
          Start Your Journey
        </button>
        <button className="btn-primary" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }} onClick={() => navigate('/login')}>
          Login
        </button>
      </div>

      <div style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="card">
          <h3>1. Enter Scores</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Submit your latest Stableford scores.</p>
        </div>
        <div className="card">
          <h3>2. Monthly Draw</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Match 3, 4, or 5 numbers to win.</p>
        </div>
        <div className="card">
          <h3>3. Support Charity</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>10% of your subscription goes to a cause.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
