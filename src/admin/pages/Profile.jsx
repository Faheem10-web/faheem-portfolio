import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { FiLock } from 'react-icons/fi';
import '../Admin.css';

export default function Profile() {
  const { user, updateAccount } = useAdmin();
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ success: null, message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.username) {
      setUsername(user.username);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ success: null, message: '' });

    if (!currentPassword) {
      setStatus({ success: false, message: 'Current password is required to verify identity.' });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setStatus({ success: false, message: 'New passwords do not match' });
      return;
    }

    setLoading(true);
    const res = await updateAccount(username, currentPassword, newPassword);
    setLoading(false);

    setStatus({ success: res.success, message: res.message });

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header-title">Security & Account Settings</h1>
          <p className="admin-header-subtitle">Update your administrative username and password credentials</p>
        </div>
      </div>

      <div className="admin-panel" style={{ maxWidth: '600px' }}>
        <h3 className="admin-panel-title">Update Credentials</h3>

        {status.message && (
          <div style={{
            background: status.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: status.success ? '#10b981' : '#ef4444',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '14px',
            marginBottom: '24px',
            border: '1px solid',
            borderColor: status.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
          }}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-label">Username</label>
            <input 
              type="text" 
              className="admin-input" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Current Password (Required for Verification)</label>
            <input 
              type="password" 
              className="admin-input" 
              value={currentPassword} 
              onChange={e => setCurrentPassword(e.target.value)} 
              required 
              placeholder="Verify your current password"
            />
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--admin-border)', paddingTop: '20px' }}>
            <h4 style={{ marginBottom: '16px', color: 'var(--admin-text-main)' }}>Change Password (Optional)</h4>
            
            <div className="admin-form-group">
              <label className="admin-label">New Password</label>
              <input 
                type="password" 
                className="admin-input" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Confirm New Password</label>
              <input 
                type="password" 
                className="admin-input" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>

          <button type="submit" className="admin-btn admin-btn-primary" disabled={loading} style={{ marginTop: '12px' }}>
            <FiLock /> {loading ? 'Updating...' : 'Update Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
