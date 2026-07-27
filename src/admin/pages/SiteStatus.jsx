import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { FiToggleLeft, FiToggleRight, FiGlobe, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import '../Admin.css';

export default function SiteStatus() {
  const { siteSettings, updateSettings } = useAdmin();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'enable' or 'disable'
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Synchronize state with backend settings
  useEffect(() => {
    if (siteSettings?.global) {
      setMaintenanceMode(!!siteSettings.global.maintenanceMode);
    }
  }, [siteSettings]);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleToggleClick = () => {
    if (!maintenanceMode) {
      setModalType('enable');
    } else {
      setModalType('disable');
    }
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    setShowConfirmModal(false);
    setSaving(true);

    const targetMode = modalType === 'enable';
    
    // Construct request payload by merging with existing global settings to preserve other values
    const globalPayload = siteSettings?.global ? {
      ...siteSettings.global,
      maintenanceMode: targetMode,
      updatedAt: new Date().toISOString()
    } : {
      maintenanceMode: targetMode,
      updatedAt: new Date().toISOString()
    };

    const res = await updateSettings('global', globalPayload);
    setSaving(false);

    if (res.success) {
      setMaintenanceMode(targetMode);
      showToast(
        targetMode 
          ? 'Maintenance mode is now active. Public pages are blocked.' 
          : 'Your portfolio is now live and publicly accessible!', 
        'success'
      );
    } else {
      showToast(res.message || 'Failed to update site status settings.', 'error');
    }
  };

  if (!siteSettings?.global) {
    return (
      <div>
        <div className="admin-header">
          <div>
            <h1 className="admin-header-title">Site Status</h1>
            <p className="admin-header-subtitle">Manage public accessibility and maintenance status</p>
          </div>
        </div>
        <div className="admin-panel">
          <p style={{ color: 'var(--admin-text-muted)' }}>Loading site configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-header-title">Site Status</h1>
          <p className="admin-header-subtitle">Manage the public accessibility of your portfolio website</p>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="admin-panel" style={{ maxWidth: '640px' }}>
        <h3 className="admin-panel-title">Accessibility Settings</h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          margin: '20px 0'
        }}>
          
          {/* Status Alert Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '24px',
            borderRadius: '16px',
            background: maintenanceMode ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${maintenanceMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
            transition: 'all 0.3s ease'
          }}>
            {/* Status Dot */}
            <div style={{ position: 'relative', display: 'flex', width: '20px', height: '20px', flexShrink: 0 }}>
              <div style={{
                position: 'absolute',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: maintenanceMode ? '#f59e0b' : '#10b981',
                opacity: 0.4,
                transform: 'scale(1.8)',
                animation: 'admin-status-pulse 2s infinite'
              }} />
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: maintenanceMode ? '#f59e0b' : '#10b981',
                zIndex: 1
              }} />
            </div>

            {/* Status Info */}
            <div style={{ flex: 1 }}>
              <h4 style={{ 
                margin: '0 0 4px 0', 
                fontSize: '16px', 
                fontWeight: '700', 
                color: 'var(--admin-text-main)' 
              }}>
                {maintenanceMode ? 'Maintenance Mode' : 'Portfolio Live'}
              </h4>
              <p style={{ 
                margin: 0, 
                fontSize: '13.5px', 
                color: 'var(--admin-text-muted)',
                lineHeight: 1.4
              }}>
                {maintenanceMode 
                  ? 'Visitors currently see the maintenance page.' 
                  : 'Your portfolio is publicly available.'}
              </p>
            </div>
          </div>

          {/* Toggle Control Area */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 0',
            borderTop: '1px solid var(--admin-border)',
            borderBottom: '1px solid var(--admin-border)'
          }}>
            <div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '15px', color: 'var(--admin-text-main)' }}>
                Temporarily disable public website
              </h5>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--admin-text-muted)', maxWidth: '440px' }}>
                Toggle to maintenance mode when making updates. Authenticated admins will still have full access to this panel.
              </p>
            </div>

            {/* Custom Interactive Switch */}
            <button
              onClick={handleToggleClick}
              disabled={saving}
              style={{
                width: '64px',
                height: '34px',
                borderRadius: '100px',
                background: maintenanceMode ? '#f59e0b' : '#10b981',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                transition: 'background-color 300ms ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              aria-label="Toggle maintenance mode"
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: '#ffffff',
                transform: maintenanceMode ? 'translateX(30px)' : 'translateX(0px)',
                transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
              }}>
                {maintenanceMode ? (
                  <FiToggleLeft size={16} color="#f59e0b" />
                ) : (
                  <FiToggleRight size={16} color="#10b981" />
                )}
              </div>
            </button>
          </div>

          {/* Additional details */}
          <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', lineHeight: '1.6' }}>
            <span style={{ fontWeight: '600', color: 'var(--admin-text-main)' }}>Note:</span> Changing status will immediately hide/show all pages (Home, About, Projects, etc.) to the public. Database records and server configurations are preserved intact.
          </div>

        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          animation: 'fadeIn 0.25s ease'
        }}>
          <div style={{
            background: 'var(--admin-sidebar-bg)',
            border: '1px solid var(--admin-border)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '460px',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: modalType === 'enable' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: modalType === 'enable' ? '#f59e0b' : '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {modalType === 'enable' ? <FiAlertTriangle size={24} /> : <FiGlobe size={24} />}
              </div>
              <div>
                <h3 style={{
                  margin: '0 0 6px 0',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#0f172a',
                  letterSpacing: '-0.3px'
                }}>
                  {modalType === 'enable' ? 'Enable Maintenance Mode?' : 'Switch Portfolio to Live?'}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#334155'
                }}>
                  {modalType === 'enable' 
                    ? 'Your public portfolio will be temporarily hidden and visitors will see the maintenance page. Admin access will remain available.'
                    : 'Your portfolio will immediately become visible to the public. All pages, interactions, and contact forms will resume operations.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="admin-modal-cancel-btn"
                style={{ minWidth: '90px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="admin-btn"
                style={{
                  background: modalType === 'enable' ? '#f59e0b' : '#10b981',
                  color: '#ffffff',
                  minWidth: '150px',
                  borderRadius: '10px',
                  fontWeight: '600'
                }}
              >
                {modalType === 'enable' ? 'Enable Maintenance' : 'Switch to Live'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'success' ? 'var(--admin-success)' : 'var(--admin-error)',
          color: '#ffffff',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '600',
          fontSize: '14px',
          animation: 'slideIn 0.3s ease forwards'
        }}>
          <FiCheck size={18} />
          {toast.text}
        </div>
      )}

      {/* Global CSS Inject for simple custom animations */}
      <style>{`
        @keyframes admin-status-pulse {
          0% { transform: scale(1); opacity: 0.45; }
          70% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
