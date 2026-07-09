import { useState } from 'react';
import api from '../../api/api';

/**
 * FinalEditForm — displays the actual form for editing the stock record
 * after OTP has been verified successfully.
 * Handles both Stock and StockIn models.
 */
export default function FinalEditForm({ request, onCancel, onSuccess, showToast }) {
  const stock = request.stockId || {};
  const approvedChanges = request.requestedChanges || {};
  const isStockIn = request.stockModel === 'StockIn';

  const [form, setForm] = useState(
    isStockIn
      ? {
          poNumber:  approvedChanges.poNumber  !== undefined ? approvedChanges.poNumber  : (stock.poNumber || ''),
          poDate:    approvedChanges.poDate    !== undefined ? approvedChanges.poDate    : (stock.poDate ? stock.poDate.split('T')[0] : ''),
          partyName: approvedChanges.partyName !== undefined ? approvedChanges.partyName : (stock.partyName || ''),
          yarnCount: approvedChanges.yarnCount !== undefined ? approvedChanges.yarnCount : (stock.yarnCount || ''),
          itemName:  approvedChanges.itemName  !== undefined ? approvedChanges.itemName  : (stock.itemName || ''),
          color:     approvedChanges.color     !== undefined ? approvedChanges.color     : (stock.color || ''),
          baleCount: approvedChanges.baleCount !== undefined ? approvedChanges.baleCount : (stock.baleCount || ''),
          weight:    approvedChanges.weight    !== undefined ? approvedChanges.weight    : (stock.weight || ''),
        }
      : {
          color:    approvedChanges.color    !== undefined ? approvedChanges.color    : (stock.color || ''),
          bale:     approvedChanges.bale     !== undefined ? approvedChanges.bale     : (stock.bale || ''),
          weight:   approvedChanges.weight   !== undefined ? approvedChanges.weight   : (stock.weight || ''),
          supplier: approvedChanges.supplier !== undefined ? approvedChanges.supplier : (stock.supplier || ''),
          quantity: approvedChanges.quantity !== undefined ? approvedChanges.quantity : (stock.quantity || ''),
          notes:    approvedChanges.notes    !== undefined ? approvedChanges.notes    : (stock.notes || ''),
        }
  );

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/api/requests/${request._id}/complete`, { changes: form });
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update record.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="final-edit-form-wrapper">
      <form className="standard-form" onSubmit={handleSubmit}>
        <p className="text-secondary" style={{ fontSize: 13, marginBottom: 16 }}>
          Your OTP was verified! You may now finalize the approved changes below.
        </p>

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
              <div className="form-group">
                <label>Colour</label>
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Number of Bales</label>
                <input
                  type="text"
                  value={form.bale}
                  onChange={(e) => setForm({ ...form, bale: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Weight (KG)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Supplier</label>
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Notes / Reason for Change</label>
              <textarea
                rows="3"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </>
        )}

        <div className="form-actions" style={{ marginTop: 24 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Confirm Update'}
          </button>
        </div>
      </form>
    </div>
  );
}
