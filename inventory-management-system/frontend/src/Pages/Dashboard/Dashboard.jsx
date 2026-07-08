import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import './Dashboard.css';

const COLORS = ['#c9a86a', '#e3c98f', '#8a7350', '#f0e2bf', '#a38d66', '#d1b98a'];

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon, path, highlightColor = 'primary', navigate }) => (
  <div 
    className="stat-card card clickable-card" 
    onClick={() => navigate(path)}
    style={{ cursor: 'pointer', transition: 'all 0.2s', borderBottom: `3px solid var(--color-${highlightColor})` }}
  >
    <div className="stat-card-top" style={{ marginBottom: '8px' }}>
      <span className="stat-icon-wrap" style={{ background: `var(--color-${highlightColor}-bg)`, color: `var(--color-${highlightColor})` }}>
        {icon}
      </span>
    </div>
    <p className="stat-value" style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{value}</p>
    <p className="stat-label text-secondary" style={{ fontSize: '13px', fontWeight: '600' }}>{title}</p>
    {subtitle && <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{subtitle}</p>}
  </div>
);

export default function Dashboard() {
  const { user: _user } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/dashboard');
      setData(res.data);
      setError(null);
    } catch (_err) {
      setError('Failed to load dashboard data. Please try again.');
      showToast('Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading && !data) {
    return (
      <div className="dashboard page-container">
        <section className="welcome-card card skeleton" style={{ height: 120 }} />
        <section className="stat-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="stat-card card skeleton" key={i} style={{ height: 110 }} />
          ))}
        </section>
        <div className="dashboard-grid">
          <section className="card panel skeleton" style={{ height: 350 }} />
          <section className="card panel skeleton" style={{ height: 350 }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard page-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <ToastContainer />
        <div className="empty-state">
          <div className="empty-state-icon" style={{ color: 'var(--color-danger)', background: 'var(--color-danger-bg)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h2 className="empty-state-title">Error Loading Dashboard</h2>
          <p className="empty-state-desc">{error}</p>
          <button className="btn btn-primary mt-4" onClick={fetchDashboardData}>Try Again</button>
        </div>
      </div>
    );
  }

  const { kpis, alerts, charts, recentActivity } = data;

  return (
    <div className="dashboard page-container fade-in">
      <ToastContainer />
      
      {/* Welcome Header */}
      <div className="page-header flex-between">
        <div className="page-header-left">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Real-time inventory overview and KPIs</p>
        </div>
        <div className="welcome-actions">
          <button className="btn btn-secondary" onClick={fetchDashboardData}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ marginRight: 6 }}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/dashboard/stock-in')}>+ New Stock In</button>
        </div>
      </div>

      {/* KPI Grid */}
      <section className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard 
          title="Total Products" value={kpis.totalProducts.toLocaleString()} 
          subtitle={`${alerts.outOfStock.length} out of stock`}
          path="/admin/dashboard/products" highlightColor="primary" navigate={navigate}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/></svg>} 
        />
        <StatCard 
          title="Categories" value={kpis.totalCategories.toLocaleString()} 
          path="/admin/dashboard/categories" highlightColor="info" navigate={navigate}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>} 
        />
        <StatCard 
          title="Current Inventory" value={kpis.currentInventory.toLocaleString()} 
          subtitle="Total items in stock"
          path="/admin/dashboard/products" highlightColor="success" navigate={navigate}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 17l6-6-6-6"/></svg>} 
        />
        <StatCard 
          title="Low/Out of Stock" value={alerts.lowStock.length + alerts.outOfStock.length} 
          subtitle="Needs attention"
          path="/admin/dashboard/products" highlightColor="danger" navigate={navigate}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>} 
        />
        
        <StatCard 
          title="Total Stock In" value={kpis.totalStockIn.toLocaleString()} 
          subtitle={`Today: +${kpis.todayStockIn}`}
          path="/admin/dashboard/reports/stock-in" highlightColor="success" navigate={navigate}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>} 
        />
        <StatCard 
          title="Total Stock Out" value={kpis.totalStockOut.toLocaleString()} 
          subtitle={`Today: -${kpis.todayStockOut}`}
          path="/admin/dashboard/reports/stock-out" highlightColor="warning" navigate={navigate}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>} 
        />
        <StatCard 
          title="Pending Edits" value={kpis.pendingRequests.toLocaleString()} 
          path="/admin/dashboard/approval" highlightColor="warning" navigate={navigate}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>} 
        />
        <StatCard 
          title="Unread Alerts" value={kpis.unreadNotifications.toLocaleString()} 
          path="/admin/dashboard/notifications" highlightColor="danger" navigate={navigate}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>} 
        />
        <StatCard 
          title="System Users" value={kpis.totalUsers.toLocaleString()} 
          path="/admin/dashboard" highlightColor="info" navigate={navigate}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>} 
        />
      </section>

      {/* Low Stock Alerts Banner */}
      {(alerts.lowStock.length > 0 || alerts.outOfStock.length > 0) && (
        <div className="alert-warning" style={{ margin: '16px 0', border: '1px solid var(--color-warning)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
          <div style={{ flex: 1 }}>
            <strong>Inventory Alert:</strong> {alerts.outOfStock.length} items out of stock, {alerts.lowStock.length} items low on stock. 
            <a style={{ marginLeft: 8, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/admin/dashboard/products')}>View Products</a>
          </div>
        </div>
      )}

      {/* Main Charts */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
        
        {/* Monthly Stock Flow */}
        <section className="card panel">
          <div className="panel-header">
            <h3>Monthly Stock Flow</h3>
            <p className="text-secondary" style={{ fontSize: 12 }}>Stock In vs Stock Out over time</p>
          </div>
          <div style={{ height: 300, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="Stock In" fill="var(--color-success)" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="Stock Out" fill="var(--color-warning)" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Category Breakdown */}
        <section className="card panel">
          <div className="panel-header">
            <h3>Stock by Category</h3>
          </div>
          <div style={{ height: 300, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {charts.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Legend iconType="circle" layout="vertical" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Top Selling Products */}
        <section className="card panel">
          <div className="panel-header" style={{ marginBottom: 16 }}>
            <h3>Top Selling Products</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/dashboard/reports/stock-out')}>View all</button>
          </div>
          <div className="table-wrap">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th style={{ textAlign: 'right' }}>Total Sold</th>
                </tr>
              </thead>
              <tbody>
                {charts.topProducts.map((p) => (
                  <tr key={p._id} onClick={() => navigate('/admin/dashboard/products')} style={{ cursor: 'pointer' }}>
                    <td className="cell-strong">{p.name}</td>
                    <td className="text-tertiary">{p.sku}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>{p.totalSold}</td>
                  </tr>
                ))}
                {charts.topProducts.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: 20 }}>No sales data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="card panel">
          <div className="panel-header" style={{ marginBottom: 16 }}>
            <h3>Recent Activity</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/dashboard/reports/stock-in')}>View all</button>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentActivity.stock.map((act) => (
              <li key={act._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: act.type === 'IN' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)', color: act.type === 'IN' ? 'var(--color-success)' : 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {act.type === 'IN' ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>
                    <strong>{act.type === 'IN' ? 'Stock In' : 'Stock Out'}</strong>: {act.quantity} units of {act.itemType || act.productId?.name || 'Raw Material'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
                    {new Date(act.date || act.createdAt).toLocaleString()} • By {act.createdBy?.name || 'System'}
                  </p>
                </div>
              </li>
            ))}
            {recentActivity.requests.slice(0, 3).map((req) => (
              <li key={req._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-info-bg)', color: 'var(--color-info)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>
                    <strong>Edit Request</strong> {req.status} for Stock #{req.stockId?._id?.toString().slice(-6).toUpperCase() || '...'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>
                    {new Date(req.createdAt).toLocaleString()} • By {req.userId?.name || 'User'}
                  </p>
                </div>
              </li>
            ))}
            {recentActivity.stock.length === 0 && recentActivity.requests.length === 0 && (
               <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>No recent activity.</p>
            )}
          </ul>
        </section>
      </div>

    </div>
  );
}
