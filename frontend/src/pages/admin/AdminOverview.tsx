import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalCharities: 0,
    totalWinnings: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Total users
    const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    // Active subs
    const { count: activeCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active');
    
    // Charities
    const { count: charityCount } = await supabase.from('charities').select('*', { count: 'exact', head: true });
    
    // Total payouts
    const { data: winningsData } = await supabase.from('winnings').select('amount');
    const totalPayouts = winningsData ? winningsData.reduce((acc, curr) => acc + Number(curr.amount), 0) : 0;

    setStats({
      totalUsers: usersCount || 0,
      activeSubscriptions: activeCount || 0,
      totalCharities: charityCount || 0,
      totalWinnings: totalPayouts
    });
  };

  return (
    <>
      <div className="page-header">
        <h2>Admin Overview</h2>
        <p>Platform wide statistics and high-level data.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Users</h4>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        <div className="stat-card">
          <h4>Active Subs</h4>
          <div className="stat-value" style={{ color: '#4ade80', WebkitTextFillColor: 'initial' }}>{stats.activeSubscriptions}</div>
        </div>
        <div className="stat-card">
          <h4>Charities Listed</h4>
          <div className="stat-value">{stats.totalCharities}</div>
        </div>
        <div className="stat-card">
          <h4>Total Prize Money</h4>
          <div className="stat-value">${stats.totalWinnings.toFixed(2)}</div>
        </div>
      </div>
    </>
  );
};

export default AdminOverview;
