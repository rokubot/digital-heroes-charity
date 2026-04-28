import React from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Trophy, Heart, LogOut, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import '../../styles/dashboard.scss';

const AdminLayout: React.FC = () => {
  const { session, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading admin panel...</div>;
  }

  // Ensure only admins can access this area
  if (!session || profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <NavLink to="/admin" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard /> Admin Overview
        </NavLink>
        <NavLink to="/admin/draws" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Trophy /> Draw Engine
        </NavLink>
        <NavLink to="/admin/charities" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Heart /> Manage Charities
        </NavLink>
        
        <div style={{ flex: 1 }}></div>
        
        <NavLink to="/dashboard" className="nav-link" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft /> Back to Dashboard
        </NavLink>
        
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

export default AdminLayout;
