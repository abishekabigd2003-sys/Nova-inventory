import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import './Sidebar.css';

/* Navigation structure */
const ADMIN_NAV = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard',        label: 'Dashboard',   icon: 'grid' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { to: '/admin/dashboard/stock-in',    label: 'Stock In',    icon: 'arrow-down-circle' },
      { to: '/admin/dashboard/stock-out',   label: 'Stock Out',   icon: 'arrow-up-circle' },
      { to: '/admin/dashboard/products',    label: 'Products',    icon: 'box' },
      { to: '/admin/dashboard/categories',  label: 'Categories',  icon: 'tag' },
    ],
  },
  {
    label: 'Management',
    items: [
      {
        label: 'Reports',
        icon: 'bar-chart',
        subItems: [
          { to: '/admin/dashboard/reports/stock-in',  label: 'Stock In Report' },
          { to: '/admin/dashboard/reports/stock-out', label: 'Stock Out Report' },
        ],
        matchPath: '/admin/dashboard/reports',
      },
      { to: '/admin/dashboard/approval',    label: 'Approvals',   icon: 'check-circle' },
    ],
  },
];

const USER_NAV = [
  {
    label: 'Overview',
    items: [
      { to: '/user/dashboard', label: 'Dashboard', icon: 'grid' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { to: '/user/dashboard/stock-out',  label: 'Stock Out',   icon: 'arrow-up-circle' },
      { to: '/user/dashboard/products',   label: 'Products',    icon: 'box' },
    ],
  },
  {
    label: 'Requests & Reports',
    items: [
      { to: '/user/dashboard/stock-in',   label: 'Stock In Records', icon: 'arrow-down-circle' },
      { to: '/user/dashboard/my-requests', label: 'My Requests',   icon: 'file-text' },
      {
        label: 'Reports',
        icon: 'bar-chart',
        subItems: [
          { to: '/user/dashboard/reports/stock-in',  label: 'Stock In Report' },
          { to: '/user/dashboard/reports/stock-out', label: 'Stock Out Report' },
        ],
        matchPath: '/user/dashboard/reports',
      },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/user/dashboard/profile', label: 'Profile', icon: 'user' },
    ],
  },
];

const ICONS = {
  grid:             'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  'arrow-down-circle': 'M12 8v8m0 0l-3.5-3.5M12 16l3.5-3.5M12 21a9 9 0 100-18 9 9 0 000 18z',
  'arrow-up-circle':   'M12 16V8m0 0l-3.5 3.5M12 8l3.5 3.5M12 3a9 9 0 100 18 9 9 0 000-18z',
  box:              'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8',
  tag:              'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
  'bar-chart':      'M5 21V10M12 21V3M19 21v-7',
  'check-circle':   'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
  bell:             'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0',
  settings:         'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  'log-out':        'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  user:             'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  'chevron-left':   'M15 6l-6 6 6 6',
  'file-text':      'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
};

function NavIcon({ name }) {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name] || ICONS.grid} />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export default function Sidebar({ collapsed, onToggle, drawerOpen, onCloseDrawer }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [expandedMenus, setExpandedMenus] = useState({});

  // Auto-expand Reports submenu if on a reports path
  useEffect(() => {
    if (pathname.includes('/reports')) {
      setExpandedMenus((prev) => ({ ...prev, Reports: true }));
    }
  }, [pathname]);

  const toggleMenu = (label) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const nav = user?.role === 'Admin' || user?.role === 'Manager' ? ADMIN_NAV : USER_NAV;

  return (
    <aside
      className={[
        'sidebar',
        collapsed   ? 'is-collapsed' : '',
        drawerOpen  ? 'is-open'      : '',
      ].join(' ')}
      aria-label="Main navigation"
    >
      {/* ── Header / Logo ── */}
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <div className="logo-mark" aria-hidden="true">N</div>
          <span className="logo-text">Nova<strong>Stock</strong></span>
        </div>

        <button
          className="sidebar-collapse-btn"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <NavIcon name="chevron-left" />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav" aria-label="App navigation">
        {nav.map((section) => (
          <div className="nav-section" key={section.label}>
            <p className="nav-section-label">{section.label}</p>
            {section.items.map((item) => {
              // Item with sub-items (e.g. Reports)
              if (item.subItems) {
                const isActiveParent = pathname.includes(item.matchPath || '');
                const isExpanded = expandedMenus[item.label];
                return (
                  <div key={item.label} className="nav-item-group">
                    <button
                      className={['nav-item', 'nav-item-parent', isActiveParent ? 'is-active-parent' : '', isExpanded ? 'is-expanded' : ''].join(' ')}
                      onClick={() => toggleMenu(item.label)}
                    >
                      <NavIcon name={item.icon} />
                      <span className="nav-item-label">{item.label}</span>
                      <ChevronIcon />
                    </button>
                    <div className={['nav-submenu', isExpanded ? 'is-expanded' : ''].join(' ')}>
                      {item.subItems.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          className={({ isActive }) => ['nav-item', 'nav-sub-item', isActive ? 'is-active' : ''].join(' ')}
                          onClick={onCloseDrawer}
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && <span className="nav-item-glow" aria-hidden="true" />}
                              <span className="nav-item-label">{sub.label}</span>
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              }

              // Regular nav item
              const isEnd = item.to === '/admin/dashboard' || item.to === '/user/dashboard';
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={isEnd}
                  className={({ isActive }) =>
                    ['nav-item', isActive ? 'is-active' : ''].join(' ')
                  }
                  data-tooltip={item.label}
                  onClick={onCloseDrawer}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="nav-item-glow" aria-hidden="true" />}
                      <NavIcon name={item.icon} />
                      <span className="nav-item-label">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer / Logout ── */}
      <div className="sidebar-footer">
        <button className="nav-item sidebar-logout" onClick={handleLogout} aria-label="Sign out">
          <NavIcon name="log-out" />
          <span className="nav-item-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
