import { useState, useEffect, useCallback } from 'react';
import api from '../../api/api';
import { useToast } from '../../hooks/useToast';
import OtpVerification from '../../Components/OtpVerification/OtpVerification';
import './UserRequests.css';

export default function UserRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [otpRequestId, setOtpRequestId] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // request to edit after OTP
  const { showToast, ToastContainer } = useToast();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/requests/mine');
      setRequests(data);
    } catch {
      showToast('Failed to load your requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filtered = requests.filter(r => activeTab === 'All' || r.status === activeTab);

  const STATUS_BADGE = {
    Pending:   'badge-warning',
    Approved:  'badge-success',
    Rejected:  'badge-danger',
    Completed: 'badge-neutral',
  };

  // When user clicks "Proceed" on an Approved request -> Open OTP modal
  const handleProceed = (request) => {
    setOtpRequestId(request._id);
  };

  // When OTP is successful -> Open final edit form
  const handleOtpSuccess = () => {
    const target = requests.find(r => r._id === otpRequestId);
    setOtpRequestId(null);
    setEditTarget(target);
  };

  return (
    <div className="page-container page-animate">
      <ToastContainer />
      <div className="page-header">
        <div>
          <h1 className="page-title">My Edit Requests</h1>
          <p className="page-subtitle">Track the status of your inventory edit requests.</p>
        </div>
      </div>

      {!editTarget ? (
        <div className="card">
          <div className="req-tabs">
            {['All', 'Pending', 'Approved', 'Completed', 'Rejected'].map((tab) => (
              <button
                key={tab}
                className={`req-tab ${activeTab === tab ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {tab !== 'All' && (
                  <span className="req-count">
                    {requests.filter(r => r.status === tab).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="table-wrap">
            {loading ? (
              <div style={{ padding: 24, color: 'var(--text-tertiary)' }}>Loading requests...</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                    <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <p className="empty-state-title">No requests found</p>
                <p className="empty-state-desc">You don't have any {activeTab.toLowerCase()} edit requests.</p>
              </div>
            ) : (
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Stock Record</th>
                    <th>Requested Changes</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r._id}>
                      <td className="cell-strong">#{r._id.slice(-6).toUpperCase()}</td>
                      <td className="text-tertiary">
                        Stock #{r.stockId?._id ? r.stockId._id.toString().slice(-6).toUpperCase() : '—'}
                      </td>
                      <td className="change-cell">
                        {Object.entries(r.requestedChanges || {}).map(([k, v]) => (
                          <div key={k}>
                            <span className="change-key">{k}:</span>{' '}
                            <span className="change-val">{v}</span>
                          </div>
                        ))}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          <span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span>
                          {r.status === 'Rejected' && r.rejectionReason && (
                            <span style={{ fontSize: 11, color: 'var(--color-danger)', maxWidth: 150, whiteSpace: 'normal' }}>
                              Reason: {r.rejectionReason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-tertiary">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>
                        {r.status === 'Approved' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleProceed(r)}
                          >
                            Enter OTP
                          </button>
                        )}
                        {r.status === 'Pending' && (
                          <span className="text-tertiary" style={{ fontSize: 12 }}>Awaiting Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <FinalEditForm
          request={editTarget}
          onCancel={() => setEditTarget(null)}
          onSuccess={() => {
            showToast('Stock record updated successfully!', 'success');
            setEditTarget(null);
            fetchRequests(); // reload table
          }}
          showToast={showToast}
        />
      )}

      {otpRequestId && (
        <OtpVerification
          requestId={otpRequestId}
          onClose={() => setOtpRequestId(null)}
          onSuccess={handleOtpSuccess}
        />
      )}
    </div>
  );
}

/**
 * FinalEditForm — displays the actual form for editing the stock record
 * after OTP has been verified successfully.
 */
function FinalEditForm({ request, onCancel, onSuccess, showToast }) {
  const stock = request.stockId || {};
  const approvedChanges = request.requestedChanges || {};

  const [form, setForm] = useState({
    color:    approvedChanges.color    !== undefined ? approvedChanges.color    : (stock.color || ''),
    bale:     approvedChanges.bale     !== undefined ? approvedChanges.bale     : (stock.bale || ''),
    weight:   approvedChanges.weight   !== undefined ? approvedChanges.weight   : (stock.weight || ''),
    supplier: approvedChanges.supplier !== undefined ? approvedChanges.supplier : (stock.supplier || ''),
    quantity: approvedChanges.quantity !== undefined ? approvedChanges.quantity : (stock.quantity || ''),
    notes:    approvedChanges.notes    !== undefined ? approvedChanges.notes    : (stock.notes || ''),
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/api/requests/${request._id}/complete`, { changes: form });
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to complete edit', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Finalize Stock Edit</h2>
        <span className="badge badge-success">OTP Verified</span>
      </div>
      
      <div className="erm-original-banner" style={{ border: 'none', borderRadius: 0, borderBottom: '1px solid var(--border-subtle)' }}>
        <p className="erm-banner-label">Original Values (Reference)</p>
        <div className="erm-original-grid">
          <div><span>Colour</span><strong>{stock.color || '—'}</strong></div>
          <div><span>Bale</span><strong>{stock.bale || '—'}</strong></div>
          <div><span>Weight (kg)</span><strong>{stock.weight || '—'}</strong></div>
          <div><span>Supplier</span><strong>{stock.supplier || '—'}</strong></div>
          <div><span>Quantity</span><strong>{stock.quantity}</strong></div>
        </div>
      </div>

      <form className="standard-form" style={{ padding: 24 }} onSubmit={handleSubmit}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          The fields below are pre-filled with your approved requested changes. Make any final adjustments and save to update the inventory.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label>Colour</label>
            <input type="text" value={form.color} onChange={e => setForm({...form, color: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Bale</label>
            <input type="text" value={form.bale} onChange={e => setForm({...form, bale: e.target.value})} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Weight (kg)</label>
            <input type="number" step="0.01" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" required value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
          </div>
        </div>
        <div className="form-group">
          <label>Supplier</label>
          <input type="text" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} />
        </div>
        <div className="form-group">
          <label>Final Notes</label>
          <textarea rows="2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : '✅ Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
