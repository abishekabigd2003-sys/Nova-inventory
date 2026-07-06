import { useState } from 'react';
import api from '../../api/api';
import SearchableDropdown from '../SearchableDropdown/SearchableDropdown';
import './EditRequestModal.css';

/**
 * EditRequestModal — opens when a user clicks "Edit Request" on a Stock IN record.
 * Collects requested changes and submits a POST /api/requests.
 */
export default function EditRequestModal({ stock, onClose, onSuccess }) {
  const [form, setForm] = useState({
    color:    stock.color    || '',
    bale:     stock.bale     || '',
    weight:   stock.weight   || '',
    supplier: stock.supplier || '',
    quantity: stock.quantity || '',
    notes:    stock.notes    || '',
    itemType: stock.itemType || '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Only include changed fields
    const requestedChanges = {};
    if (form.color    !== (stock.color    || '')) requestedChanges.color    = form.color;
    if (form.bale     !== (stock.bale     || '')) requestedChanges.bale     = form.bale;
    if (form.supplier !== (stock.supplier || '')) requestedChanges.supplier = form.supplier;
    if (form.notes    !== (stock.notes    || '')) requestedChanges.notes    = form.notes;
    if (form.itemType !== (stock.itemType || '')) requestedChanges.itemType = form.itemType;
    if (Number(form.weight)   !== (stock.weight   || 0)) requestedChanges.weight   = Number(form.weight);
    if (Number(form.quantity) !== stock.quantity)        requestedChanges.quantity = Number(form.quantity);

    if (Object.keys(requestedChanges).length === 0) {
      setError('No changes detected. Please modify at least one field.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/api/requests', {
        stockId: stock._id,
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel erm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Request Edit</h2>
            <p className="modal-subtitle">
              Stock #{stock._id.slice(-6).toUpperCase()} — {stock.productId?.name || 'Unknown Product'}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Original values banner */}
        <div className="erm-original-banner">
          <p className="erm-banner-label">📋 Current Record Values</p>
          <div className="erm-original-grid">
            <div><span>Item Type</span><strong>{stock.itemType || '—'}</strong></div>
            <div><span>Colour</span><strong>{stock.color || '—'}</strong></div>
            <div><span>Bale</span><strong>{stock.bale || '—'}</strong></div>
            <div><span>Weight (kg)</span><strong>{stock.weight || '—'}</strong></div>
            <div><span>Supplier</span><strong>{stock.supplier || '—'}</strong></div>
            <div><span>Quantity</span><strong>{stock.quantity}</strong></div>
          </div>
        </div>

        <form className="standard-form" onSubmit={handleSubmit}>
          <p className="erm-instruction">Modify the fields you want to request changes for. Only changed fields will be sent.</p>

          {error && <div className="alert-error">{error}</div>}

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
              <label htmlFor="erm-color">Colour</label>
              <input
                id="erm-color"
                type="text"
                placeholder="e.g. Red, Blue, Black"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="erm-bale">Number of Bales</label>
              <input
                id="erm-bale"
                type="text"
                placeholder="Bale number or description"
                value={form.bale}
                onChange={(e) => setForm({ ...form, bale: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="erm-weight">Weight (KG)</label>
              <input
                id="erm-weight"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 50.5"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="erm-quantity">Quantity</label>
              <input
                id="erm-quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="erm-supplier">Supplier</label>
            <input
              id="erm-supplier"
              type="text"
              placeholder="Supplier name"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="erm-notes">Notes / Reason for Change</label>
            <textarea
              id="erm-notes"
              rows="3"
              placeholder="Explain why this change is needed..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : '📤 Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
