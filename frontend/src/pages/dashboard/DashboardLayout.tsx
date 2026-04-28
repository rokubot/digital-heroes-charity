import React from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Target, Heart, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import '../../styles/dashboard.scss';

const DashboardLayout: React.FC = () => {
  const { session, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your dashboard...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <NavLink to="/dashboard" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard /> Overview
        </NavLink>
        <NavLink to="/dashboard/scores" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Target /> Enter Scores
        </NavLink>
        <NavLink to="/dashboard/charity" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Heart /> My Charity
        </NavLink>
        
        <div style={{ flex: 1 }}></div>
        
        {profile?.role === 'admin' && (
          <NavLink to="/admin" className="nav-link" style={{ color: 'var(--accent-secondary)' }}>
             Admin Panel
          </NavLink>
        )}
        
        <button 
          onClick={handleLogout} 
          className="nav-link" 
          style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', borderTop: '1px solid var(--glass-border)' }}
        >
          <LogOut /> Log Out
        </button>
      </aside>
      
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
