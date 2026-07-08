import { useState, useEffect, useCallback } from 'react';
import api from '../../api/api';
import { useToast } from '../../hooks/useToast';
import './Approval.css';

export default function Approval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'approve' | 'reject', request: obj }
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/requests');
      setRequests(data);
    } catch (_err) {
      showToast('Failed to load edit requests', 'error');
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

  const handleAction = async (e) => {
    e.preventDefault();
    setProcessing(true);
    const { type, request } = confirmModal;

    try {
      if (type === 'approve') {
        await api.put(`/api/requests/${request._id}/approve`);
        showToast('Request approved! OTP email sent to user.', 'success');
      } else {
        await api.put(`/api/requests/${request._id}/reject`, { reason: rejectReason });
        showToast('Request rejected successfully.', 'info');
      }
      setConfirmModal(null);
      setRejectReason('');
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || `Failed to ${type} request`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openConfirm = (type, req) => {
    setConfirmModal({ type, request: req });
    setRejectReason('');
  };

  return (
    <div className="page-container page-animate">
      <ToastContainer />
      <div className="page-header flex-between">
        <div className="page-header-left">
          <h1 className="page-title">Edit Approvals</h1>
          <p className="page-subtitle">Review, approve or reject inventory modification requests</p>
        </div>
      </div>

      <div className="card">
        <div className="req-tabs">
          {['Pending', 'Approved', 'Completed', 'Rejected', 'All'].map((tab) => (
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
            <p style={{ padding: '24px', color: 'var(--text-tertiary)' }}>Loading requests...</p>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="empty-state-title">No requests found</p>
              <p className="empty-state-desc">There are no {activeTab.toLowerCase()} edit requests at the moment.</p>
            </div>
          ) : (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Requested By</th>
                  <th>Product / Record</th>
                  <th>Changes Requested</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => {
                  const stock = req.stockId || {};
                  return (
                    <tr key={req._id}>
                      <td className="cell-strong">#{req._id.slice(-6).toUpperCase()}</td>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">{req.userId?.name?.charAt(0).toUpperCase() || 'U'}</div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.userId?.name || 'Unknown User'}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{req.userId?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stock.productId?.name || 'Unknown Product'}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Stock #{stock._id?.toString().slice(-6).toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="change-cell" style={{ maxWidth: 280 }}>
                        {req.requestedChanges && Object.keys(req.requestedChanges).length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {Object.entries(req.requestedChanges).map(([k, v]) => (
                              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                <span style={{ width: 60, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{k}:</span>
                                <span style={{ color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>{stock[k] || '—'}</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" style={{ color: 'var(--text-tertiary)' }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        ) : 'No changes'}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[req.status] || 'badge-neutral'}`}>{req.status}</span>
                      </td>
                      <td className="text-tertiary">{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td>
                        {req.status === 'Pending' ? (
                          <div className="approval-actions">
                            <button className="btn btn-sm btn-success" onClick={() => openConfirm('approve', req)} title="Approve Request">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M20 6L9 17l-5-5"/></svg>
                              Approve
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => openConfirm('reject', req)} title="Reject Request">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              Reject
                            </button>
                          </div>
                        ) : req.status === 'Approved' ? (
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Awaiting User OTP</span>
                        ) : req.status === 'Completed' ? (
                          <span style={{ fontSize: 12, color: 'var(--color-success)' }}>Changes Applied</span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Closed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="modal-overlay" onClick={() => !processing && setConfirmModal(null)}>
          <div className="modal-panel" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {confirmModal.type === 'approve' ? 'Approve Request' : 'Reject Request'}
              </h2>
              <button className="modal-close-btn" onClick={() => setConfirmModal(null)} disabled={processing}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form className="standard-form" style={{ padding: 24 }} onSubmit={handleAction}>
              {confirmModal.type === 'approve' ? (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                  Are you sure you want to approve this edit request? <br/><br/>
                  An OTP will be generated and emailed to <strong>{confirmModal.request.userId?.email}</strong>. 
                  The user will have 5 minutes to verify the OTP and apply the changes.
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Please provide a reason for rejecting this edit request.
                  </p>
                  <div className="form-group">
                    <label>Rejection Reason (Optional)</label>
                    <textarea 
                      rows="3" 
                      placeholder="Explain why this request is denied..."
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmModal(null)} disabled={processing}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`btn ${confirmModal.type === 'approve' ? 'btn-success' : 'btn-danger'}`} 
                  disabled={processing}
                >
                  {processing ? 'Processing...' : confirmModal.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
