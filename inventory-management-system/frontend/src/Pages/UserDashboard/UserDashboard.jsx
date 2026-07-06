import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ pending: 0, approved: 0, completed: 0, products: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqRes, prodRes] = await Promise.all([
          api.get('/api/requests/mine'),
          api.get('/api/products'),
        ]);
        const requests = reqRes.data || [];
        const products = prodRes.data || [];

        setStats({
          pending:   requests.filter((r) => r.status === 'Pending').length,
          approved:  requests.filter((r) => r.status === 'Approved').length,
          completed: requests.filter((r) => r.status === 'Completed').length,
          products:  products.length,
        });
        setRecentRequests(requests.slice(0, 5));
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const STATUS_BADGE = {
    Pending:   'badge-warning',
    Approved:  'badge-success',
    Rejected:  'badge-danger',
    Completed: 'badge-neutral',
  };

  return (
    <div className="page-container page-animate">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋</h1>
          <p className="page-subtitle">Here is your inventory overview for today.</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="ud-metrics">
        <div className="ud-metric-card" onClick={() => navigate('my-requests')} style={{ cursor: 'pointer' }}>
          <div className="ud-metric-icon" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#f59e0b' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <div className="ud-metric-info">
            <p className="ud-metric-label">Pending Requests</p>
            <h3 className="ud-metric-value">{loading ? '—' : stats.pending}</h3>
          </div>
        </div>

        <div className="ud-metric-card" onClick={() => navigate('my-requests')} style={{ cursor: 'pointer' }}>
          <div className="ud-metric-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3"/></svg>
          </div>
          <div className="ud-metric-info">
            <p className="ud-metric-label">Approved (OTP Ready)</p>
            <h3 className="ud-metric-value">{loading ? '—' : stats.approved}</h3>
          </div>
        </div>

        <div className="ud-metric-card">
          <div className="ud-metric-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <div className="ud-metric-info">
            <p className="ud-metric-label">Completed Edits</p>
            <h3 className="ud-metric-value">{loading ? '—' : stats.completed}</h3>
          </div>
        </div>

        <div className="ud-metric-card" onClick={() => navigate('products')} style={{ cursor: 'pointer' }}>
          <div className="ud-metric-icon" style={{ background: 'var(--primary-subtle)', color: 'var(--color-primary)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/></svg>
          </div>
          <div className="ud-metric-info">
            <p className="ud-metric-label">Total Products</p>
            <h3 className="ud-metric-value">{loading ? '—' : stats.products}</h3>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="ud-quick-actions">
        <h3 className="ud-section-title">Quick Actions</h3>
        <div className="ud-actions-grid">
          <button className="ud-action-card" onClick={() => navigate('stock-out')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V8m0 0l-3.5 3.5M12 8l3.5 3.5M12 3a9 9 0 100 18 9 9 0 000-18z"/></svg>
            <span>Record Stock Out</span>
          </button>
          <button className="ud-action-card" onClick={() => navigate('stock-in')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
            <span>View Stock In Records</span>
          </button>
          <button className="ud-action-card" onClick={() => navigate('my-requests')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            <span>My Edit Requests</span>
          </button>
          <button className="ud-action-card" onClick={() => navigate('reports/stock-in')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 21V10M12 21V3M19 21v-7"/></svg>
            <span>View Reports</span>
          </button>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Edit Requests</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('my-requests')}>View All</button>
        </div>
        <div className="table-wrap">
          {loading ? (
            <p style={{ padding: '20px', color: 'var(--text-tertiary)' }}>Loading...</p>
          ) : recentRequests.length === 0 ? (
            <div className="ud-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40"><path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z"/></svg>
              <p>No edit requests yet. Browse Stock In records and click <strong>Edit Request</strong> to get started.</p>
            </div>
          ) : (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Stock Record</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((r) => (
                  <tr key={r._id}>
                    <td className="cell-strong">#{r._id.slice(-6).toUpperCase()}</td>
                    <td className="text-tertiary">#{r.stockId?._id?.toString().slice(-6).toUpperCase() || r.stockId?.toString().slice(-6).toUpperCase()}</td>
                    <td><span className={`badge ${STATUS_BADGE[r.status] || 'badge-neutral'}`}>{r.status}</span></td>
                    <td className="text-tertiary">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
