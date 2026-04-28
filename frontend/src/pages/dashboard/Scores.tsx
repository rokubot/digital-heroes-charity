import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type Score = {
  id: string;
  score: number;
  date: string;
};

const Scores: React.FC = () => {
  const { profile } = useAuth();
  const [scores, setScores] = useState<Score[]>([]);
  const [newScore, setNewScore] = useState('');
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchScores();
  }, [profile]);

  const fetchScores = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: false });

    if (data) setScores(data);
    if (error) console.error("Error fetching scores:", error);
  };

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError('');
    
    const scoreVal = parseInt(newScore);
    if (scoreVal < 1 || scoreVal > 45) {
      setError('Score must be between 1 and 45 (Stableford format).');
      return;
    }

    setLoading(true);

    try {
      // Logic: if user already has 5 scores, find the oldest and delete it
      if (scores.length >= 5) {
        const oldestScore = scores[scores.length - 1]; // sorted desc, so last is oldest
        await supabase.from('scores').delete().eq('id', oldestScore.id);
      }

      const { error: insertError } = await supabase
        .from('scores')
        .insert({ user_id: profile.id, score: scoreVal, date: newDate });

      if (insertError) {
        if (insertError.code === '23505') {
          setError('A score already exists for this date. You can only enter one score per date.');
        } else {
          setError(insertError.message);
        }
      } else {
        setNewScore('');
        setNewDate('');
        fetchScores();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('scores').delete().eq('id', id);
    fetchScores();
  };

  return (
    <>
      <div className="page-header">
        <h2>Enter Your Scores</h2>
        <p>Submit your latest Stableford scores. We keep a rolling record of your last 5 rounds.</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <form className="auth-form" style={{ flexDirection: 'row', alignItems: 'flex-end', gap: '1rem' }} onSubmit={handleAddScore}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Score (Stableford)</label>
            <input 
              type="number" 
              min="1" 
              max="45" 
              required 
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              placeholder="e.g. 36"
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Date</label>
            <input 
              type="date" 
              required 
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: 0 }} disabled={loading}>
            {loading ? 'Adding...' : 'Add Score'}
          </button>
        </form>
        {error && <div className="auth-error" style={{ marginTop: '1rem' }}>{error}</div>}
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>Your Latest Scores ({scores.length}/5)</h3>
        {scores.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No scores entered yet. Enter your first score above!</p>
        ) : (
          <div className="score-list">
            {scores.map((s) => (
              <div key={s.id} className="score-item">
                <div>
                  <div className="score-value">{s.score} pts</div>
                  <div className="score-date">{new Date(s.date).toLocaleDateString()}</div>
                </div>
                <button 
                  style={{ background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
                  onClick={() => handleDelete(s.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Scores;
