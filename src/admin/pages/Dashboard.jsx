import React, { useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Link } from 'react-router-dom';
import { 
  FiFolder, FiMessageSquare, FiTrendingUp, FiLayers, 
  FiHelpCircle, FiClock, FiPlus, FiArrowRight, FiDownload 
} from 'react-icons/fi';
import { API_BASE } from '../../config/api';
import '../Admin.css';

export default function Dashboard() {
  const { analytics, fetchAnalytics, token } = useAdmin();

  const handleExportDb = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/export-db`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Database export failed');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'seedData.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export CMS data: ' + error.message);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (!analytics) {
    return (
      <div>
        <h2 className="admin-header-title">Loading stats...</h2>
        <div style={{ marginTop: '20px', color: 'var(--admin-text-muted)' }}>
          Reading analytics metrics from database...
        </div>
      </div>
    );
  }

  const statItems = [
    { label: 'Total Projects', count: analytics.totalProjects, icon: <FiFolder />, color: '#8b5cf6', to: '/admin/projects' },
    { label: 'Total Messages', count: analytics.totalMessages, icon: <FiMessageSquare />, color: '#10b981', to: '/admin/inbox' },
    { label: 'Total Skills', count: analytics.totalSkills, icon: <FiTrendingUp />, color: '#fbbf24', to: '/admin/sections' },
    { label: 'Total Services', count: analytics.totalServices, icon: <FiLayers />, color: '#ec4899', to: '/admin/sections' },
    { label: 'Total FAQ Items', count: analytics.totalFAQ, icon: <FiHelpCircle />, color: '#3b82f6', to: '/admin/sections' },
    { label: 'Experience Logs', count: analytics.totalExperience, icon: <FiClock />, color: '#6366f1', to: '/admin/sections' }
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-header-title">Analytics Dashboard</h1>
          <p className="admin-header-subtitle">Real-time overview of your dynamic portfolio contents</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/" target="_blank" className="admin-btn admin-btn-secondary">
            View Live Site
          </Link>
          <Link to="/admin/projects" className="admin-btn admin-btn-primary">
            <FiPlus /> Add Project
          </Link>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="admin-grid">
        {statItems.map((item, idx) => (
          <Link to={item.to} key={idx} className="admin-stat-card" style={{ textDecoration: 'none' }}>
            <div className="admin-stat-icon" style={{ color: item.color }}>
              {item.icon}
            </div>
            <div>
              <div className="admin-stat-label">{item.label}</div>
              <div className="admin-stat-num">{item.count}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', marginTop: '32px' }}>
        
        {/* Recent Messages */}
        <div className="admin-panel">
          <div className="admin-panel-title">
            <span>Recent Messages</span>
            <Link to="/admin/inbox" style={{ fontSize: '13px', color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
              View All <FiArrowRight />
            </Link>
          </div>

          {analytics.recentMessages.length === 0 ? (
            <div style={{ color: 'var(--admin-text-muted)', fontSize: '14px', padding: '20px 0' }}>
              No messages received yet.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentMessages.map((msg) => (
                    <tr key={msg._id}>
                      <td style={{ fontWeight: '500' }}>{msg.name}</td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{msg.subject || 'No Subject'}</td>
                      <td>{new Date(msg.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: msg.isRead ? 'rgba(255, 255, 255, 0.05)' : 'rgba(139, 92, 246, 0.15)',
                          color: msg.isRead ? 'var(--admin-text-muted)' : 'var(--admin-primary)'
                        }}>
                          {msg.isRead ? 'Read' : 'New'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Links / Actions */}
        <div className="admin-panel">
          <div className="admin-panel-title">Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={handleExportDb} className="admin-btn admin-btn-primary" style={{ display: 'flex', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: 'none', width: '100%' }}>
              <FiDownload /> Export CMS Data (seedData.json)
            </button>
            <Link to="/admin/media" className="admin-btn admin-btn-secondary" style={{ display: 'flex', justifyContent: 'center' }}>
              Upload Files to Media Library
            </Link>
            <Link to="/admin/sections" className="admin-btn admin-btn-secondary" style={{ display: 'flex', justifyContent: 'center' }}>
              Edit SEO & Global Branding
            </Link>
            <Link to="/admin/profile" className="admin-btn admin-btn-secondary" style={{ display: 'flex', justifyContent: 'center' }}>
              Update Password
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
