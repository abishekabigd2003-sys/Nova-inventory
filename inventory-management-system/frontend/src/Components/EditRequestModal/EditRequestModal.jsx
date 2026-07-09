import { useState, useEffect } from 'react';
import api from '../../api/api';
import SearchableDropdown from '../SearchableDropdown/SearchableDropdown';
import './EditRequestModal.css';

/**
 * EditRequestModal — opens when a user clicks "Edit Request" on a Stock or Stock IN record.
 * Collects requested changes and submits a POST /api/requests.
 */
export default function EditRequestModal({ stock, onClose, onSuccess }) {
  // Determine if this is a StockIn record by checking for StockIn specific fields
  const isStockIn = stock.poNumber !== undefined || stock.baleCount !== undefined || stock.poDate !== undefined;

  const [form, setForm] = useState({
    // Generic Stock fields
    color:    stock.color    || '',
    bale:     stock.bale     || '',
    weight:   stock.weight   || '',
    supplier: stock.supplier || '',
    quantity: stock.quantity || '',
    notes:    stock.notes    || '',
    itemType: stock.itemType || '',
    // StockIn fields
    poNumber: stock.poNumber || '',
    poDate:   stock.poDate ? stock.poDate.split('T')[0] : '',
    partyName: stock.partyName || '',
    yarnCount: stock.yarnCount || '',
    itemName: stock.itemName || '',
    baleCount: stock.baleCount || '',
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // Compute if form changed
  const getRequestedChanges = () => {
    const requestedChanges = {};
    if (isStockIn) {
      if (form.poNumber !== (stock.poNumber || '')) requestedChanges.poNumber = form.poNumber;
      if (form.poDate !== (stock.poDate ? stock.poDate.split('T')[0] : '')) requestedChanges.poDate = form.poDate;
      if (form.partyName !== (stock.partyName || '')) requestedChanges.partyName = form.partyName;
      if (form.yarnCount !== (stock.yarnCount || '')) requestedChanges.yarnCount = form.yarnCount;
      if (form.itemName !== (stock.itemName || '')) requestedChanges.itemName = form.itemName;
      if (form.color !== (stock.color || '')) requestedChanges.color = form.color;
      if (form.baleCount !== '' && Number(form.baleCount) !== (stock.baleCount || 0)) requestedChanges.baleCount = Number(form.baleCount);
      if (form.weight !== '' && Number(form.weight) !== (stock.weight || 0)) requestedChanges.weight = Number(form.weight);
    } else {
      if (form.color !== (stock.color || '')) requestedChanges.color = form.color;
      if (form.bale !== (stock.bale || '')) requestedChanges.bale = form.bale;
      if (form.supplier !== (stock.supplier || '')) requestedChanges.supplier = form.supplier;
      if (form.notes !== (stock.notes || '')) requestedChanges.notes = form.notes;
      if (form.itemType !== (stock.itemType || '')) requestedChanges.itemType = form.itemType;
      if (form.weight !== '' && Number(form.weight) !== (stock.weight || 0)) requestedChanges.weight = Number(form.weight);
      if (form.quantity !== '' && Number(form.quantity) !== stock.quantity) requestedChanges.quantity = Number(form.quantity);
    }
    return requestedChanges;
  };

  const requestedChanges = getRequestedChanges();
  const isFormChanged = Object.keys(requestedChanges).length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isFormChanged) {
      setError('No changes detected. Please modify at least one field.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/api/requests', {
        stockId: stock._id,
        stockModel: isStockIn ? 'StockIn' : 'Stock',
        requestedChanges,
      });
      onSuccess('Edit request submitted! Admin will review it shortly.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-panel erm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Request Edit</h2>
            <p className="modal-subtitle">
              Record #{stock._id.slice(-6).toUpperCase()} — {stock.productId?.name || stock.itemName || 'Unknown Item'}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Original values banner */}
          <div className="erm-original-banner">
            <p className="erm-banner-label">📋 Current Record Values</p>
            <div className="erm-original-grid">
              {isStockIn ? (
                <>
                  <div><span>PO Number</span><strong>{stock.poNumber || '—'}</strong></div>
                  <div><span>Party Name</span><strong>{stock.partyName || '—'}</strong></div>
                  <div><span>Item Name</span><strong>{stock.itemName || '—'}</strong></div>
                  <div><span>Yarn Count</span><strong>{stock.yarnCount || '—'}</strong></div>
                  <div><span>Bales</span><strong>{stock.baleCount || '—'}</strong></div>
                  <div><span>Weight (kg)</span><strong>{stock.weight || '—'}</strong></div>
                </>
              ) : (
                <>
                  <div><span>Item Type</span><strong>{stock.itemType || '—'}</strong></div>
                  <div><span>Colour</span><strong>{stock.color || '—'}</strong></div>
                  <div><span>Bale</span><strong>{stock.bale || '—'}</strong></div>
                  <div><span>Weight (kg)</span><strong>{stock.weight || '—'}</strong></div>
                  <div><span>Supplier</span><strong>{stock.supplier || '—'}</strong></div>
                  <div><span>Quantity</span><strong>{stock.quantity}</strong></div>
                </>
              )}
            </div>
          </div>

          <form className="standard-form" onSubmit={handleSubmit}>
            <p className="erm-instruction">Modify the fields you want to request changes for. Only changed fields will be sent.</p>

            {error && <div className="alert-error">{error}</div>}

            {isStockIn ? (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>PO Number</label>
                    <input type="text" required value={form.poNumber} onChange={(e) => setForm({ ...form, poNumber: e.target.value })} />
                  </div>
                <div className="form-group">
                  <label>PO Date</label>
                  <input type="date" required value={form.poDate} onChange={(e) => setForm({ ...form, poDate: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Party Name</label>
                  <input type="text" required value={form.partyName} onChange={(e) => setForm({ ...form, partyName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Item Name</label>
                  <input type="text" required value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Yarn Count</label>
                  <input type="text" value={form.yarnCount} onChange={(e) => setForm({ ...form, yarnCount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Colour</label>
                  <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Bales</label>
                  <input type="number" min="1" value={form.baleCount} onChange={(e) => setForm({ ...form, baleCount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Weight (KG)</label>
                  <input type="number" step="0.01" min="0" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group" style={{ zIndex: 10 }}>
                  <label>Item Type</label>
                  <SearchableDropdown
                    options={['Cotton', 'Polyester', 'Sliver', 'FS', 'Drash', 'Powder', 'Cotton Rags']}
                    value={form.itemType}
                    onChange={(val) => setForm({ ...form, itemType: val })}
                    placeholder="Select item type..."
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Colour</label>
                  <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Number of Bales</label>
                  <input type="text" value={form.bale} onChange={(e) => setForm({ ...form, bale: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Weight (KG)</label>
                  <input type="number" min="0" step="0.01" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Supplier</label>
                <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Notes / Reason for Change</label>
                <textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </>
          )}

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || !isFormChanged}>
                {loading ? 'Submitting...' : '📤 Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
