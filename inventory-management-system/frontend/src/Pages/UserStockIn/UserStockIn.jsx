import { useState, useEffect, useCallback } from 'react';
import api from '../../api/api';
import EditRequestModal from '../../Components/EditRequestModal/EditRequestModal';
import OtpVerification from '../../Components/OtpVerification/OtpVerification';
import FinalEditForm from '../../Components/FinalEditForm/FinalEditForm';
import { useToast } from '../../hooks/useToast';
import { Eye, X } from 'lucide-react';
import './UserStockIn.css';

const Modal = ({ open, onClose, title, children, width = 560 }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="detail-row">
    <span className="detail-label">{label}</span>
    <span className="detail-value">{value || '—'}</span>
  </div>
);

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export default function UserStockIn() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  
  const [selectedStock, setSelectedStock] = useState(null); // stock to edit (EditRequestModal)
  const [viewRecord, setViewRecord] = useState(null); // stock to view
  
  // State for OTP workflow
  const [otpRequestId, setOtpRequestId] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // request object for FinalEditForm

  const { showToast, ToastContainer } = useToast();

  const fetchRecords = useCallback(async () => {
    try {
      const { data } = await api.get('/api/stockin?status=Approved');
      setRecords(data);
    } catch {
      showToast('Failed to load stock records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.poNumber?.toLowerCase().includes(q) ||
      r.partyName?.toLowerCase().includes(q) ||
      r.itemName?.toLowerCase().includes(q) ||
      r.color?.toLowerCase().includes(q)
    );
  });

  const handleEditClick = async (stockRecord) => {
    try {
      // Fetch user's active requests to see if one already exists for this record
      const { data: activeRequests } = await api.get('/api/requests/mine');
      const existing = activeRequests.find(req => 
        req.stockId?._id === stockRecord._id && 
        ['Pending', 'Approved'].includes(req.status)
      );

      if (existing) {
        if (existing.status === 'Approved') {
          // Instead of redirecting, just open the OTP dialog here
          setOtpRequestId(existing._id);
        } else {
          showToast('You already have a pending edit request for this record.', 'warning');
        }
      } else {
        // Open form to create a new request
        setSelectedStock(stockRecord);
      }
    } catch (err) {
      showToast('Error checking active requests.', 'error');
      // Fallback: just open the request modal
      setSelectedStock(stockRecord);
    }
  };

  const handleOtpSuccess = async () => {
    showToast('OTP Verified! You can now apply your changes.', 'success');
    // Fetch the request to pass to FinalEditForm
    try {
      const { data: requests } = await api.get('/api/requests/mine');
      const request = requests.find(r => r._id === otpRequestId);
      if (request) {
        setEditTarget(request);
      }
    } catch (err) {
      showToast('Error loading edit form.', 'error');
    }
    setOtpRequestId(null);
  };

  return (
    <div className="page-container">
      <ToastContainer />

      <div className="page-header flex-between">
        <div className="page-header-left">
          <h1 className="page-title">Stock In Records</h1>
          <p className="page-subtitle">
            View all incoming inventory records. To request a change, click{' '}
            <strong>Edit Request</strong>.
          </p>
        </div>
      </div>

      <div className="usi-info-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>You cannot directly edit Stock In records. Submit an <strong>Edit Request</strong> — admin will review and approve it. You will then receive an OTP to confirm the changes.</span>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
            <input
              placeholder="Search by product, SKU, colour, supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="usi-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="usi-loading">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 48, borderRadius: 6, margin: '8px 16px' }} />
              ))}
            </div>
          ) : (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>PO Date</th>
                  <th>PO Number</th>
                  <th>Party Name</th>
                  <th>Item Details</th>
                  <th>Bales</th>
                  <th>Weight (kg)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r._id}>
                    <td>{new Date(r.poDate || r.date).toLocaleDateString()}</td>
                    <td className="cell-strong">{r.poNumber || '—'}</td>
                    <td>{r.partyName || r.supplier || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{r.itemName || r.productId?.name || '—'}</span>
                        <span className="text-tertiary" style={{ fontSize: '11px' }}>{r.yarnCount || r.itemType} {r.color && `• ${r.color}`}</span>
                      </div>
                    </td>
                    <td>{r.baleCount || r.bale || '—'}</td>
                    <td>{r.weight || '—'}</td>
                    <td>
                      <span className={`badge badge-${r.status === 'Approved' ? 'success' : r.status === 'Pending' ? 'warning' : 'neutral'}`}>
                        {r.status || 'Approved'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => setViewRecord(r)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleEditClick(r)}
                          title="Request Edit"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                            <path d="M12 8v8m0 0l-3.5-3.5M12 16l3.5-3.5M12 21a9 9 0 100-18 9 9 0 000 18z"/>
                          </svg>
                        </div>
                        <p className="empty-state-title">No stock in records found</p>
                        <p className="empty-state-desc">
                          {search ? 'Try adjusting your search.' : 'No approved stock in records exist yet.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedStock && (
        <EditRequestModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
          onSuccess={(msg) => {
            showToast(msg, 'success');
            setSelectedStock(null);
          }}
        />
      )}

      {otpRequestId && (
        <OtpVerification
          requestId={otpRequestId}
          onClose={() => setOtpRequestId(null)}
          onSuccess={handleOtpSuccess}
        />
      )}

      {editTarget && (
        <Modal open={true} onClose={() => setEditTarget(null)} title="Finalize Approved Changes" width={600}>
          <FinalEditForm
            request={editTarget}
            onCancel={() => setEditTarget(null)}
            onSuccess={() => {
              showToast('Stock record updated successfully!', 'success');
              setEditTarget(null);
              fetchRecords();
            }}
            showToast={showToast}
          />
        </Modal>
      )}

      <Modal open={!!viewRecord} onClose={() => setViewRecord(null)} title="Stock In Details">
        {viewRecord && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <DetailRow label="PO Number" value={viewRecord.poNumber || viewRecord.invoiceNumber || '—'} />
            <DetailRow label="PO Date" value={formatDateTime(viewRecord.poDate || viewRecord.date)} />
            <DetailRow label="Party Name" value={viewRecord.partyName || viewRecord.supplier || '—'} />
            <DetailRow label="Item Name" value={viewRecord.itemName || viewRecord.productId?.name || '—'} />
            <DetailRow label="Yarn Count" value={viewRecord.yarnCount || viewRecord.itemType || '—'} />
            <DetailRow label="Colour" value={viewRecord.color || '—'} />
            <DetailRow label="Number of Bales" value={viewRecord.baleCount || viewRecord.bale || '—'} />
            <DetailRow label="Weight (KG)" value={viewRecord.weight || '—'} />
            <DetailRow label="Created By" value={viewRecord.createdBy?.name || '—'} />
            <DetailRow label="Created Date" value={formatDateTime(viewRecord.createdAt || viewRecord.date)} />
            <DetailRow label="Last Updated By" value={viewRecord.updatedBy?.name || '—'} />
            <DetailRow label="Last Updated Date" value={formatDateTime(viewRecord.updatedAt)} />
            <DetailRow label="Current Status" value={
              <span className={`badge badge-${viewRecord.status === 'Approved' ? 'success' : viewRecord.status === 'Pending' ? 'warning' : viewRecord.status === 'Rejected' ? 'danger' : 'neutral'}`}>
                {viewRecord.status || 'Approved'}
              </span>
            } />
          </div>
        )}
      </Modal>
    </div>
  );
}
