import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FiGrid, FiFolder, FiSliders, FiMessageSquare, FiImage, 
  FiKey, FiLogOut, FiSun, FiMoon, FiMenu, FiX, FiActivity 
} from 'react-icons/fi';
import './Admin.css';

export default function AdminLayout() {
  const { user, logout } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { themeMode } = useTheme();
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('admin-theme') || 'light');
  
  // Mobile Sidebar Drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync with global themeMode settings
  useEffect(() => {
    if (themeMode === 'light') {
      setTheme('light');
    } else if (themeMode === 'dark') {
      setTheme('dark');
    } else if (themeMode === 'system') {
      const savedOverride = localStorage.getItem('admin-theme_override') || 'light';
      setTheme(savedOverride);
    }
  }, [themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('admin-dark-theme');
      root.classList.remove('admin-light-theme');
    } else {
      root.classList.add('admin-light-theme');
      root.classList.remove('admin-dark-theme');
    }
    localStorage.setItem('admin-theme', theme);
    if (themeMode === 'system') {
      localStorage.setItem('admin-theme_override', theme);
    }
  }, [theme, themeMode]);

  // Close sidebar drawer automatically on navigation/location change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Generate breadcrumb text dynamically from path
  const getBreadcrumbs = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 1) return 'CMS / Dashboard';
    
    return segments
      .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1))
      .join(' / ');
  };

  const navLinks = [
    { to: '/admin', label: 'Dashboard', icon: <FiGrid /> },
    { to: '/admin/projects', label: 'Projects', icon: <FiFolder /> },
    { to: '/admin/sections', label: 'Page Content', icon: <FiSliders /> },
    { to: '/admin/inbox', label: 'Inbox', icon: <FiMessageSquare /> },
    { to: '/admin/media', label: 'Media Library', icon: <FiImage /> },
    { to: '/admin/status', label: 'Site Status', icon: <FiActivity /> },
    { to: '/admin/profile', label: 'Account Settings', icon: <FiKey /> }
  ];

  return (
    <div className="admin-body">
      {/* Sidebar Backdrop Overlay on Mobile */}
      {isSidebarOpen && (
        <div 
          className="admin-sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="admin-layout">
        {/* Left Sidebar */}
        <aside className={`admin-sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="admin-sidebar-header-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '32px' }}>
            <Link to="/" className="admin-sidebar-header" style={{ marginBottom: 0, paddingLeft: 0 }}>
              <div className="admin-sidebar-logo-dot"></div>
              <span>PORTFOLIO CMS</span>
            </Link>
            
            {/* Close Button on Mobile Sidebar */}
            <button 
              className="admin-sidebar-close-btn"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close menu"
            >
              <FiX size={18} />
            </button>
          </div>

          <nav className="admin-sidebar-nav">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/admin'}
                className={({ isActive }) => 
                  `admin-sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <button className="admin-logout-btn" onClick={handleLogout}>
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="admin-main-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh' }}>
          
          {/* Universal Sticky Top Header Bar */}
          <header className="admin-top-header">
            {/* Left Header items */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Hamburger Button (visible only on mobile/tablet) */}
              <button 
                type="button"
                className="admin-hamburger-btn"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="Toggle menu"
              >
                <FiMenu size={20} />
              </button>
              
              {/* Dynamic Breadcrumbs */}
              <span className="admin-breadcrumbs">
                {getBreadcrumbs()}
              </span>
            </div>

            {/* Right Header items */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className="admin-user-info">
                <span>Hello, <strong style={{ color: 'var(--admin-text-main)' }}>{user?.username || 'Admin'}</strong></span>
              </div>
              
              {/* Theme Selector Toggle */}
              {(themeMode === 'system' || themeMode === 'user') && (
                <button 
                  type="button"
                  className="admin-theme-toggle-switch"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  <div className="switch-track">
                    <div className={`switch-knob ${theme === 'dark' ? 'dark' : ''}`}>
                      {theme === 'light' ? <FiSun className="sun-icon" /> : <FiMoon className="moon-icon" />}
                    </div>
                  </div>
                </button>
              )}
            </div>
          </header>

          <main className="admin-main">
            <Outlet />
          </main>
        </div>

      </div>
    </div>
  );
}
