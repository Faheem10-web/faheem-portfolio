import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { FiMoon, FiSun, FiCheck } from 'react-icons/fi';

export default function CaseStudyThemeToggle({ compact = false }) {
  const { siteSettings, updateSettings } = useAdmin();
  const themeSettings = siteSettings?.theme || {};
  const isDarkMode = themeSettings.caseStudyDarkMode !== false; // Default is true (ON)
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleToggle = async () => {
    if (isUpdating) return;
    const nextVal = !isDarkMode;
    setIsUpdating(true);

    try {
      const res = await updateSettings('theme', {
        ...themeSettings,
        caseStudyDarkMode: nextVal
      });

      if (res.success) {
        setToastMsg(nextVal ? 'Case Study set to Dark Mode' : 'Case Study set to Light Mode');
        setTimeout(() => setToastMsg(''), 3000);
      } else {
        alert(res.message || 'Failed to update theme');
      }
    } catch (err) {
      alert('Error updating theme: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
      {toastMsg && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#111827',
          color: '#FFFFFF',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <FiCheck size={14} color="#10B981" /> {toastMsg}
        </div>
      )}

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? '8px' : '10px',
        background: isDarkMode ? 'rgba(17, 24, 39, 0.95)' : '#FFFFFF',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #E5E7EB',
        borderRadius: '999px',
        padding: compact ? '4px 10px 4px 12px' : '6px 14px 6px 16px',
        boxShadow: isDarkMode ? '0 4px 14px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Sun/Moon Icon + Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isDarkMode ? (
            <FiMoon size={14} style={{ color: '#A855F7', transition: 'all 0.3s ease' }} />
          ) : (
            <FiSun size={14} style={{ color: '#F59E0B', transition: 'all 0.3s ease' }} />
          )}
          <span style={{
            fontSize: compact ? '12px' : '12.5px',
            fontWeight: '700',
            color: isDarkMode ? '#F3F4F6' : '#1F2937',
            letterSpacing: '-0.01em',
            userSelect: 'none'
          }}>
            Case Study Dark Mode
          </span>
        </div>

        {/* Micro-animated SaaS Switch Button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isUpdating}
          title={`Click to switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
          style={{
            position: 'relative',
            width: '40px',
            height: '22px',
            borderRadius: '999px',
            background: isDarkMode ? '#8B5CF6' : '#D1D5DB',
            border: 'none',
            cursor: isUpdating ? 'wait' : 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            transition: 'background 0.3s ease',
            outline: 'none'
          }}
        >
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transform: isDarkMode ? 'translateX(18px)' : 'translateX(0px)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isDarkMode ? (
              <FiMoon size={9} style={{ color: '#8B5CF6' }} />
            ) : (
              <FiSun size={9} style={{ color: '#F59E0B' }} />
            )}
          </div>
        </button>

        {/* Status Badge */}
        <span style={{
          fontSize: '11px',
          fontWeight: '800',
          padding: '2px 8px',
          borderRadius: '999px',
          background: isDarkMode ? 'rgba(168, 85, 247, 0.2)' : 'rgba(245, 158, 11, 0.15)',
          color: isDarkMode ? '#C084FC' : '#D97706',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {isDarkMode ? 'ON' : 'OFF'}
        </span>
      </div>
    </div>
  );
}
