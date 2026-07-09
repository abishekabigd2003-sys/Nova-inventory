import { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { exportToExcel } from '../../utils/excelExport';
import { Search, Eye, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

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
  <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '12px 0' }}>
    <span style={{ width: '140px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
    <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 600 }}>{value || '—'}</span>
  </div>
);

export default function UserStockOut() {
  const { fetchStockRecords } = useInventory();
  const { showToast, ToastContainer } = useToast();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewRecord, setViewRecord] = useState(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await fetchStockRecords('OUT');
      setRecords(data);
    } catch (err) {
      showToast('Failed to load stock out records.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRecords = records.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.productId?.name?.toLowerCase().includes(q) ||
      r.itemType?.toLowerCase().includes(q) ||
      r.customerName?.toLowerCase().includes(q) ||
      r.destination?.toLowerCase().includes(q)
    );
  });

  const handleExportExcel = async () => {
    await exportToExcel(filteredRecords, 'stock-out');
  };

  return (
    <div className="page-container">
      <ToastContainer />
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Stock Out Records</h1>
          <p className="page-subtitle">View outgoing inventory and dispatch events</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            🖨️ Print Excel
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search />
            <input 
              type="text" 
              placeholder="Search by product, item, customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading records...</div>
          ) : (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Item Type</th>
                  <th>Qty</th>
                  <th>Color</th>
                  <th>Bale</th>
                  <th>Weight (kg)</th>
                  <th>Customer/Dest.</th>
                  <th>Date</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => (
                  <tr key={r._id}>
                    <td><strong>{r.productId?.name || '—'}</strong></td>
                    <td>{r.itemType || '—'}</td>
                    <td>{r.quantity}</td>
                    <td>{r.color || '—'}</td>
                    <td>{r.bale || '—'}</td>
                    <td>{r.weight || '—'}</td>
                    <td>{r.customerName || r.destination || '—'}</td>
                    <td className="text-tertiary">{new Date(r.date).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => setViewRecord(r)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                      No stock out records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={!!viewRecord} onClose={() => setViewRecord(null)} title="Stock Out Details">
        {viewRecord && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <DetailRow label="Product Name" value={viewRecord.productId?.name} />
            <DetailRow label="SKU" value={viewRecord.productId?.sku} />
            <DetailRow label="Item Type" value={viewRecord.itemType} />
            <DetailRow label="Quantity" value={viewRecord.quantity} />
            <DetailRow label="Colour" value={viewRecord.color} />
            <DetailRow label="Bales" value={viewRecord.bale} />
            <DetailRow label="Weight (kg)" value={viewRecord.weight} />
            <DetailRow label="Customer" value={viewRecord.customerName || viewRecord.destination} />
            <DetailRow label="Invoice No" value={viewRecord.invoiceNumber} />
            <DetailRow label="Date" value={new Date(viewRecord.date).toLocaleDateString()} />
            <DetailRow label="Remarks" value={viewRecord.notes} />
          </div>
        )}
      </Modal>
    </div>
  );
}
