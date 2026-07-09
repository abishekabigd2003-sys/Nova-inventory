import { useState, useEffect, useRef, Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import api from '../../api/api';
import { io } from 'socket.io-client';
import './Navbar.css';

/** Build breadcrumb from current pathname */
function useBreadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  const labelMap = {
    dashboard:     'Dashboard',
    products:      'Products',
    categories:    'Categories',
    'stock-in':    'Stock In',
    'stock-out':   'Stock Out',
    reports:       'Reports',
    profile:       'Profile',
    approval:      'Approvals',
    notifications: 'Notifications',
    settings:      'Settings',
  };

  const crumbs = segments.map((seg) => ({
    label: labelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    seg,
  }));

  return crumbs;
}

export default function Navbar({ theme, onThemeToggle, onMenuClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [langOpen,     setLangOpen]     = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [lang,         setLang]         = useState('EN');
  const [notifCount,   setNotifCount]   = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    const fetchNotifCount = async () => {
      try {
        const { data } = await api.get('/api/notifications');
        const unread = Array.isArray(data) ? data.filter((n) => !n.read).length : 0;
        setNotifCount(unread);
      } catch {
        // silently fail
      }
    };
    fetchNotifCount();
    
    // Socket.io Real-Time Notifications
    const socket = io(import.meta.env.VITE_API_URL || '', {
      withCredentials: true
    });
    socket.on('NEW_EDIT_REQUEST', (data) => {
      if (user?.role === 'Admin') {
        showToast(data.message, 'info');
        setNotifCount(prev => prev + 1);
      }
    });

    socket.on('REQUEST_APPROVED', (data) => {
      if (user?._id === data.recipientId) {
        showToast(data.message, 'success');
        setNotifCount(prev => prev + 1);
      }
    });

    socket.on('REQUEST_REJECTED', (data) => {
      if (user?._id === data.recipientId) {
        showToast(data.message, 'error');
        setNotifCount(prev => prev + 1);
      }
    });

    return () => socket.disconnect();
  }, [user, showToast]);

  const handleNotificationClick = async () => {
    try {
      const { data } = await api.get('/api/notifications');
      const unread = Array.isArray(data) ? data.filter(n => !n.read) : [];
      if (unread.length > 0) {
        await Promise.all(unread.map(n => api.put(`/api/notifications/${n._id}/read`)));
        setNotifCount(0);
      }
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
    }
    
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      navigate('/admin/dashboard/approval');
    } else {
      navigate('/user/dashboard/my-requests');
    }
  };

  const langRef    = useRef(null);
  const profileRef = useRef(null);

  const breadcrumbs = useBreadcrumb();

  /* Close dropdowns on outside click */
  useEffect(() => {
    function onDown(e) {
      if (langRef.current    && !langRef.current.contains(e.target))    setLangOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  /* Close on Escape */
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { setLangOpen(false); setProfileOpen(false); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const LANGS = [
    { code: 'EN', label: 'English' },
    { code: 'FR', label: 'Français' },
    { code: 'DE', label: 'Deutsch' },
    { code: 'JA', label: '日本語' },
  ];

  return (
    <header className="navbar" role="banner">
      {/* ── Left ── */}
      <div className="navbar-left">
        <button
          className="navbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h10M4 18h16" />
          </svg>
        </button>

        <nav className="breadcrumb" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <Fragment key={crumb.seg}>
              {i > 0 && <span className="breadcrumb-sep" aria-hidden="true">/</span>}
              <span className={`breadcrumb-item ${i === breadcrumbs.length - 1 ? 'is-current' : ''}`}>
                {crumb.label}
              </span>
            </Fragment>
          ))}
        </nav>
      </div>

      {/* ── Search ── */}
      <div className="navbar-search" role="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="search"
          placeholder="Search products, orders, suppliers…"
          aria-label="Global search"
        />
        <kbd className="search-kbd" aria-label="Keyboard shortcut">⌘K</kbd>
      </div>

      {/* ── Right cluster ── */}
      <div className="navbar-right">
        {/* Notifications */}
        <button 
          className="icon-btn tooltip" 
          data-tooltip="Notifications" 
          aria-label={`${notifCount} notifications`}
          style={{ cursor: 'pointer' }}
          onClick={handleNotificationClick}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {notifCount > 0 && (
            <span className="icon-dot" aria-hidden="true">{notifCount}</span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          className="icon-btn tooltip theme-toggle"
          onClick={onThemeToggle}
          data-tooltip={theme === 'light' ? 'Dark mode' : 'Light mode'}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
            </svg>
          )}
        </button>

        {/* Language selector */}
        <div className="navbar-dropdown" ref={langRef}>
          <button
            className="lang-btn"
            onClick={() => setLangOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={langOpen}
            aria-label={`Language: ${lang}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{width:15, height:15}}>
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
            </svg>
            {lang}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={`chev ${langOpen ? 'is-open' : ''}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {langOpen && (
            <div className="dropdown-menu" role="listbox">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  className={`dropdown-item ${lang === l.code ? 'is-selected' : ''}`}
                  role="option"
                  aria-selected={lang === l.code}
                  onClick={() => { setLang(l.code); setLangOpen(false); }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="navbar-divider" aria-hidden="true" />

        {/* Profile menu */}
        <div className="navbar-dropdown" ref={profileRef}>
          <div className="profile-btn" style={{ padding: 0, display: 'flex', alignItems: 'center' }}>
            <div 
              onClick={() => navigate('profile')} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
              title="View Profile"
            >
              <span className="avatar" aria-hidden="true">
                {user?.name?.[0]?.toUpperCase() || 'A'}
                <span className="online-dot" aria-label="Online" />
              </span>
              <span className="profile-meta">
                <span className="profile-name">{user?.name || 'Admin User'}</span>
                <span className="profile-role">{user?.role || 'User'}</span>
              </span>
            </div>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label="User menu"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center' }}
            >
              <svg
                className={`chev ${profileOpen ? 'is-open' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>

          {profileOpen && (
            <div className="dropdown-menu profile-menu" role="menu">
              <div 
                className="profile-menu-header" 
                onClick={() => { navigate('profile'); setProfileOpen(false); }} 
                style={{ cursor: 'pointer' }}
                role="menuitem"
              >
                <span className="avatar avatar-lg" aria-hidden="true">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </span>
                <div className="profile-menu-meta">
                  <span className="profile-menu-name">{user?.name || 'Admin User'}</span>
                  <span className="profile-menu-email">{user?.email || 'admin@novastock.com'}</span>
                </div>
              </div>
              <div className="dropdown-sep" role="separator" />
              <button 
                className="dropdown-item" 
                role="menuitem" 
                onClick={() => { navigate('profile'); setProfileOpen(false); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/><path d="M12 14c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6z"/></svg>
                My Profile
              </button>
              <button 
                className="dropdown-item" 
                role="menuitem" 
                onClick={() => { navigate('settings'); setProfileOpen(false); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
