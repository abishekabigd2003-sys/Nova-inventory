import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../Components/Sidebar/Sidebar';
import Navbar  from '../../Components/Navbar/Navbar';
import './DashboardLayout.css';

/**
 * DashboardLayout — the persistent shell wrapping every authenticated page.
 * Manages: sidebar collapse, mobile drawer open, theme toggle.
 */
const DashboardLayout = () => {
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem('nova-sidebar') === 'collapsed'
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('nova-theme') || 'light'
  );

  // Persist & apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nova-theme', theme);
  }, [theme]);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('nova-sidebar', collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Close mobile drawer on wider viewport
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 993px)');
    const handle = (e) => { if (e.matches) setDrawerOpen(false); };
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={`layout-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile scrim */}
      {drawerOpen && (
        <div
          className="layout-scrim"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
      />

      <div className="layout-main">
        <Navbar
          theme={theme}
          onThemeToggle={toggleTheme}
          onMenuClick={() => setDrawerOpen(true)}
        />

        <main className="layout-content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
