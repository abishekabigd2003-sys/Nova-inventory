import { useState, useEffect, useCallback } from 'react';
import api from '../../api/api';
import EditRequestModal from '../../Components/EditRequestModal/EditRequestModal';
import { useToast } from '../../hooks/useToast';
import { Eye, X } from 'lucide-react';
import './UserStockIn.css';

const Modal = ({ open, onClose, title, children, width = 560 }) => {
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

export default function UserStockIn() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [selectedStock, setSelectedStock] = useState(null); // stock to edit
  const [viewRecord, setViewRecord] = useState(null); // stock to view
  const { showToast, ToastContainer } = useToast();

  const fetchRecords = useCallback(async () => {
    try {
      const { data } = await api.get('/api/stock?type=IN&status=Approved');
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
      r.productId?.name?.toLowerCase().includes(q) ||
      r.productId?.sku?.toLowerCase().includes(q)  ||
      r.color?.toLowerCase().includes(q)            ||
      r.supplier?.toLowerCase().includes(q)
    );
  });

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
                  <th>Product</th>
                  <th>Item Type</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Colour</th>
                  <th>Bale</th>
                  <th>Weight (kg)</th>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r._id}>
                    <td className="cell-strong">{r.productId?.name || '—'}</td>
                    <td>{r.itemType || '—'}</td>
                    <td className="text-tertiary">{r.productId?.sku || '—'}</td>
                    <td>{r.quantity}</td>
                    <td>{r.color || '—'}</td>
                    <td>{r.bale || '—'}</td>
                    <td>{r.weight || '—'}</td>
                    <td>{r.supplier || '—'}</td>
                    <td className="text-tertiary">{new Date(r.date).toLocaleDateString()}</td>
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
                          onClick={() => setSelectedStock(r)}
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
                    <td colSpan="10">
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

      <Modal open={!!viewRecord} onClose={() => setViewRecord(null)} title="Stock In Details">
        {viewRecord && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <DetailRow label="Product Name" value={viewRecord.productId?.name} />
            <DetailRow label="SKU" value={viewRecord.productId?.sku} />
            <DetailRow label="Item Type" value={viewRecord.itemType} />
            <DetailRow label="Quantity" value={viewRecord.quantity} />
            <DetailRow label="Colour" value={viewRecord.color} />
            <DetailRow label="Bales" value={viewRecord.bale} />
            <DetailRow label="Weight (kg)" value={viewRecord.weight} />
            <DetailRow label="Supplier" value={viewRecord.supplier} />
            <DetailRow label="Invoice No" value={viewRecord.invoiceNumber} />
            <DetailRow label="Date" value={new Date(viewRecord.date).toLocaleDateString()} />
            <DetailRow label="Remarks" value={viewRecord.notes} />
          </div>
        )}
      </Modal>
    </div>
  );
}
