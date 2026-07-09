import { useState, useEffect, useMemo, useCallback } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  Search, Plus, Eye, Edit2, Trash2, ArrowUp, ArrowDown,
  ArrowUpDown, ChevronLeft, ChevronRight, Package, X,
  FileSpreadsheet, RefreshCw, AlertTriangle
} from 'lucide-react';
import { exportToExcel } from '../../utils/excelExport';
import { validateEntityName, validateOptionalPositiveNumber } from '../../utils/validation';
import './Stockout.css';

/* ─────────────────────────────────────────────
   Helper: format date string safely
───────────────────────────────────────────── */
const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

/* ─────────────────────────────────────────────
   MODAL SHELL (reusable within this page)
───────────────────────────────────────────── */
const Modal = ({ open, onClose, title, children, width = 560 }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ maxWidth: width, width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   SORT ICON
───────────────────────────────────────────── */
const SortIcon = ({ col, sortConfig }) => {
  if (sortConfig.key !== col) return <ArrowUpDown size={13} className="so-sort-icon inactive" />;
  return sortConfig.direction === 'asc'
    ? <ArrowUp size={13} className="so-sort-icon active" />
    : <ArrowDown size={13} className="so-sort-icon active" />;
};

/* ─────────────────────────────────────────────
   CONFIRMATION DIALOG
───────────────────────────────────────────── */
const ConfirmDialog = ({ open, onClose, onConfirm, title, message, loading }) => (
  <Modal open={open} onClose={onClose} title={title} width={420}>
    <div className="so-confirm-body">
      <div className="so-confirm-icon">
        <AlertTriangle size={28} />
      </div>
      <p className="so-confirm-msg">{message}</p>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting…' : 'Yes, Delete'}
        </button>
      </div>
    </div>
  </Modal>
);

/* ─────────────────────────────────────────────
   VIEW DETAIL ROW
───────────────────────────────────────────── */
const DetailRow = ({ label, value }) => (
  <div className="so-detail-row">
    <span className="so-detail-label">{label}</span>
    <span className="so-detail-value">{value || '—'}</span>
  </div>
);

/* ─────────────────────────────────────────────
   COLUMNS CONFIG
───────────────────────────────────────────── */
const COLS = [
  { key: 'itemType',      label: 'Item Type' },
  { key: 'color',         label: 'Colour' },
  { key: 'quantity',      label: 'Qty' },
  { key: 'bale',          label: 'Bales' },
  { key: 'weight',        label: 'Weight (kg)' },
  { key: 'customerName',  label: 'Customer' },
  { key: 'date',          label: 'Date' },
  { key: 'createdBy',     label: 'Created By' },
  { key: 'status',        label: 'Status' },
];

const RECORDS_PER_PAGE = 10;

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
═══════════════════════════════════════════════════════════════════ */
const Stockout = () => {
  const {
    getAvailableStock, recordStockOut,
    fetchStockRecords, updateStock, deleteStock
  } = useInventory();

  /* ── state ── */
  const [records,        setRecords]        = useState([]);
  const [availableStock, setAvailableStock]  = useState([]);
  const [loading,        setLoading]         = useState(true);
  const [actionLoading,  setActionLoading]   = useState(false);
  const [toast,          setToast]           = useState(null); // { msg, type }

  /* search / sort / page */
  const [search,      setSearch]      = useState('');
  const [sortConfig,  setSortConfig]  = useState({ key: 'date', direction: 'desc' });
  const [page,        setPage]        = useState(1);

  /* modals */
  const [viewRecord,   setViewRecord]   = useState(null);
  const [editRecord,   setEditRecord]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createOpen,   setCreateOpen]   = useState(false);

  /* create form */
  const [invSearch,      setInvSearch]      = useState('');
  const [selectedInv,    setSelectedInv]    = useState(null);
  const [createForm,     setCreateForm]     = useState({
    quantity: '', weight: '', bale: '', customerName: '',
    invoiceNumber: '', date: new Date().toISOString().split('T')[0], notes: ''
  });
  const [createLoading,  setCreateLoading]  = useState(false);

  /* ── helpers ── */
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── data fetching ── */
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStockRecords('OUT');
      setRecords(data || []);
    } catch {
      showToast('Failed to load records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchStockRecords]);

  const loadAvailableStock = useCallback(async () => {
    try {
      const data = await getAvailableStock();
      setAvailableStock(data || []);
    } catch { /* silent */ }
  }, [getAvailableStock]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    if (createOpen) loadAvailableStock();
  }, [createOpen, loadAvailableStock]);

  /* ── filtered stock for create modal ── */
  const filteredInv = useMemo(() => {
    const q = invSearch.toLowerCase();
    return availableStock.filter(s =>
      (s.itemType?.toLowerCase().includes(q)) ||
      (s.productName?.toLowerCase().includes(q)) ||
      (s.color?.toLowerCase().includes(q))
    );
  }, [availableStock, invSearch]);

  /* ── filtered + sorted + paginated records ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(r =>
      r.itemType?.toLowerCase().includes(q) ||
      r.color?.toLowerCase().includes(q) ||
      (r.customerName || r.destination || '').toLowerCase().includes(q) ||
      r.productId?.name?.toLowerCase().includes(q) ||
      r.createdBy?.name?.toLowerCase().includes(q)
    );
  }, [records, search]);

  const sorted = useMemo(() => {
    const items = [...filtered];
    items.sort((a, b) => {
      let av = a[sortConfig.key], bv = b[sortConfig.key];
      if (sortConfig.key === 'customerName') {
        av = (a.customerName || a.destination || '').toLowerCase();
        bv = (b.customerName || b.destination || '').toLowerCase();
      } else if (sortConfig.key === 'createdBy') {
        av = a.createdBy?.name?.toLowerCase() || '';
        bv = b.createdBy?.name?.toLowerCase() || '';
      } else if (typeof av === 'string') {
        av = av.toLowerCase(); bv = (bv || '').toLowerCase();
      }
      if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / RECORDS_PER_PAGE));
  const paginated  = sorted.slice((page - 1) * RECORDS_PER_PAGE, page * RECORDS_PER_PAGE);

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setPage(1);
  };

  /* ── CREATE ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedInv) return;

    if (createForm.customerName) {
      const nameError = validateEntityName(createForm.customerName);
      if (nameError) { showToast("Invalid customer name. " + nameError, 'error'); return; }
    }
    
    if (createForm.weight) {
      const weightError = validateOptionalPositiveNumber(createForm.weight, 'Weight');
      if (weightError) { showToast(weightError, 'error'); return; }
    }
    
    if (createForm.bale) {
      const baleError = validateOptionalPositiveNumber(createForm.bale, 'Number of Bales');
      if (baleError) { showToast(baleError, 'error'); return; }
    }

    if (Number(createForm.quantity) > selectedInv.netQuantity) {
      showToast(`Max available: ${selectedInv.netQuantity} units`, 'error'); return;
    }
    setCreateLoading(true);
    try {
      await recordStockOut(selectedInv.productId, createForm.quantity, {
        itemType:      selectedInv.itemType,
        color:         selectedInv.color,
        bale:          createForm.bale,
        weight:        createForm.weight,
        customerName:  createForm.customerName,
        invoiceNumber: createForm.invoiceNumber,
        date:          createForm.date,
        notes:         createForm.notes,
      });
      showToast('Stock out record created successfully.');
      setCreateOpen(false);
      setSelectedInv(null);
      setInvSearch('');
      setCreateForm({ quantity: '', weight: '', bale: '', customerName: '', invoiceNumber: '', date: new Date().toISOString().split('T')[0], notes: '' });
      await loadRecords();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create record.', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  /* ── EDIT ── */
  const handleEditSave = async (e) => {
    e.preventDefault();

    if (editRecord.customerName) {
      const nameError = validateEntityName(editRecord.customerName);
      if (nameError) { showToast("Invalid customer name. " + nameError, 'error'); return; }
    }
    
    if (editRecord.weight) {
      const weightError = validateOptionalPositiveNumber(editRecord.weight, 'Weight');
      if (weightError) { showToast(weightError, 'error'); return; }
    }
    
    if (editRecord.bale) {
      const baleError = validateOptionalPositiveNumber(editRecord.bale, 'Number of Bales');
      if (baleError) { showToast(baleError, 'error'); return; }
    }

    setActionLoading(true);
    try {
      await updateStock(editRecord._id, editRecord, 'OUT');
      showToast('Record updated successfully.');
      setEditRecord(null);
      await loadRecords();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update record.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── DELETE ── */
  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteStock(deleteTarget._id, 'OUT');
      showToast('Record deleted and inventory restored.');
      setDeleteTarget(null);
      await loadRecords();
    } catch {
      showToast('Failed to delete record.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── EXPORT ── */
  const handleExport = () => exportToExcel(filtered, 'stock-out');

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="page-container so-page">

      {/* ── TOAST ── */}
      {toast && (
        <div className={`so-toast so-toast--${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="so-page-header">
        <div>
          <h1 className="page-title">Stock Out Management</h1>
          <p className="page-subtitle">
            {loading ? 'Loading…' : `${records.length} total record${records.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="so-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={loadRecords} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'so-spin' : ''} />
            Refresh
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <FileSpreadsheet size={14} />
            Export Excel
          </button>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            New Stock Out
          </button>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="so-stats-row">
        <div className="so-stat-card">
          <span className="so-stat-label">Total Records</span>
          <span className="so-stat-value">{records.length}</span>
        </div>
        <div className="so-stat-card">
          <span className="so-stat-label">Total Qty Out</span>
          <span className="so-stat-value">{records.reduce((s, r) => s + (r.quantity || 0), 0).toLocaleString()}</span>
        </div>
        <div className="so-stat-card">
          <span className="so-stat-label">Total Weight (kg)</span>
          <span className="so-stat-value">{records.reduce((s, r) => s + (Number(r.weight) || 0), 0).toLocaleString()}</span>
        </div>
        <div className="so-stat-card">
          <span className="so-stat-label">Filtered Results</span>
          <span className="so-stat-value">{filtered.length}</span>
        </div>
      </div>

      {/* ── TABLE CARD ── */}
      <div className="card so-table-card">
        {/* toolbar */}
        <div className="so-toolbar">
          <div className="table-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by item type, colour, customer…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button className="so-clear-search" onClick={() => { setSearch(''); setPage(1); }}>
                <X size={14} />
              </button>
            )}
          </div>
          <span className="so-record-count">
            Showing {paginated.length} of {sorted.length}
          </span>
        </div>

        {/* table */}
        <div className="so-table-wrap">
          {loading ? (
            <div className="so-empty-state">
              <div className="so-spinner" />
              <p>Loading stock out records…</p>
            </div>
          ) : (
            <table className="so-table">
              <thead>
                <tr>
                  <th className="so-col-index">#</th>
                  {COLS.map(c => (
                    <th
                      key={c.key}
                      className={`so-th-sortable ${sortConfig.key === c.key ? 'so-th-active' : ''}`}
                      onClick={() => requestSort(c.key)}
                    >
                      <span className="so-th-inner">
                        {c.label}
                        <SortIcon col={c.key} sortConfig={sortConfig} />
                      </span>
                    </th>
                  ))}
                  <th className="so-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={COLS.length + 2} className="so-no-data">
                      <Package size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                      <p>No stock out records found.</p>
                    </td>
                  </tr>
                ) : paginated.map((r, i) => (
                  <tr key={r._id} className="so-tr">
                    <td className="so-td-index text-tertiary">
                      {(page - 1) * RECORDS_PER_PAGE + i + 1}
                    </td>
                    <td className="so-td-bold">{r.itemType || '—'}</td>
                    <td>
                      {r.color
                        ? <span className="so-colour-pill">{r.color}</span>
                        : '—'}
                    </td>
                    <td className="so-td-num">{r.quantity?.toLocaleString() ?? '—'}</td>
                    <td>{r.bale || '—'}</td>
                    <td>{r.weight ? `${Number(r.weight).toLocaleString()} kg` : '—'}</td>
                    <td className="so-td-bold">{r.customerName || r.destination || '—'}</td>
                    <td className="text-tertiary so-td-date">{fmtDate(r.date)}</td>
                    <td>
                      <span className="so-created-by">
                        <span className="so-avatar">
                          {(r.createdBy?.name || 'A').charAt(0).toUpperCase()}
                        </span>
                        {r.createdBy?.name || 'Admin'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.status === 'Approved' ? 'badge-success' : 'badge-neutral'}`}>
                        {r.status || 'Approved'}
                      </span>
                    </td>
                    <td>
                      <div className="inline-actions">
                        <button
                          className="action-btn view-btn"
                          title="View Details"
                          onClick={() => setViewRecord(r)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="action-btn edit-btn"
                          title="Edit Record"
                          onClick={() => setEditRecord({ ...r, date: r.date?.split('T')[0] || '' })}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          title="Delete Record"
                          onClick={() => setDeleteTarget(r)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* pagination */}
        {!loading && totalPages > 1 && (
          <div className="so-pagination">
            <span className="so-page-info">
              Page {page} of {totalPages}
            </span>
            <div className="so-page-btns">
              <button
                className="btn btn-secondary btn-sm so-page-btn"
                disabled={page === 1}
                onClick={() => setPage(1)}
              >«</button>
              <button
                className="btn btn-secondary btn-sm so-page-btn"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.min(Math.max(page - 2 + i, 1), totalPages - Math.min(4, totalPages - 1) + i);
                return p;
              }).filter((v, i, a) => a.indexOf(v) === i).map(p => (
                <button
                  key={p}
                  className={`btn btn-sm so-page-btn ${page === p ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPage(p)}
                >{p}</button>
              ))}
              <button
                className="btn btn-secondary btn-sm so-page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
              <button
                className="btn btn-secondary btn-sm so-page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
              >»</button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          MODAL: VIEW
      ══════════════════════════════════════ */}
      <Modal
        open={!!viewRecord}
        onClose={() => setViewRecord(null)}
        title="Stock Out Details"
        width={520}
      >
        {viewRecord && (
          <div className="so-detail-grid">
            <DetailRow label="Item Type"    value={viewRecord.itemType} />
            <DetailRow label="Colour"       value={viewRecord.color} />
            <DetailRow label="Quantity"     value={viewRecord.quantity?.toLocaleString()} />
            <DetailRow label="No. of Bales" value={viewRecord.bale} />
            <DetailRow label="Weight (kg)"  value={viewRecord.weight ? Number(viewRecord.weight).toLocaleString() : null} />
            <DetailRow label="Customer"     value={viewRecord.customerName || viewRecord.destination} />
            <DetailRow label="Invoice #"    value={viewRecord.invoiceNumber} />
            <DetailRow label="Date"         value={fmtDate(viewRecord.date)} />
            <DetailRow label="Created By"   value={viewRecord.createdBy?.name} />
            <DetailRow label="Status"       value={viewRecord.status || 'Approved'} />
            {viewRecord.notes && <DetailRow label="Remarks" value={viewRecord.notes} />}
          </div>
        )}
        <div className="modal-footer" style={{ marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={() => setViewRecord(null)}>Close</button>
          <button className="btn btn-primary" onClick={() => {
            setEditRecord({ ...viewRecord, date: viewRecord.date?.split('T')[0] || '' });
            setViewRecord(null);
          }}>
            <Edit2 size={14} /> Edit Record
          </button>
        </div>
      </Modal>

      {/* ══════════════════════════════════════
          MODAL: EDIT
      ══════════════════════════════════════ */}
      <Modal
        open={!!editRecord}
        onClose={() => setEditRecord(null)}
        title="Edit Stock Out Record"
        width={560}
      >
        {editRecord && (
          <form className="so-form" onSubmit={handleEditSave}>
            <div className="so-form-grid">
              <div className="form-group">
                <label>Item Type</label>
                <input type="text" value={editRecord.itemType || ''} readOnly className="so-readonly" />
              </div>
              <div className="form-group">
                <label>Colour</label>
                <input type="text" value={editRecord.color || ''} readOnly className="so-readonly" />
              </div>
              <div className="form-group">
                <label>Quantity <span className="so-required">*</span></label>
                <input
                  type="number" required min="1"
                  value={editRecord.quantity || ''}
                  onChange={e => setEditRecord({ ...editRecord, quantity: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Weight (KG)</label>
                <input
                  type="number" step="0.01"
                  value={editRecord.weight || ''}
                  onChange={e => setEditRecord({ ...editRecord, weight: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>No. of Bales</label>
                <input
                  type="text"
                  value={editRecord.bale || ''}
                  onChange={e => setEditRecord({ ...editRecord, bale: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  value={editRecord.customerName || editRecord.destination || ''}
                  onChange={e => setEditRecord({ ...editRecord, customerName: e.target.value, destination: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Invoice #</label>
                <input
                  type="text"
                  value={editRecord.invoiceNumber || ''}
                  onChange={e => setEditRecord({ ...editRecord, invoiceNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Stock Out Date <span className="so-required">*</span></label>
                <input
                  type="date" required
                  value={editRecord.date || ''}
                  onChange={e => setEditRecord({ ...editRecord, date: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 4 }}>
              <label>Remarks</label>
              <textarea
                rows="2"
                value={editRecord.notes || ''}
                onChange={e => setEditRecord({ ...editRecord, notes: e.target.value })}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditRecord(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                {actionLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ══════════════════════════════════════
          CONFIRM: DELETE
      ══════════════════════════════════════ */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Stock Out Record"
        message={`Are you sure you want to delete this record? This will restore ${deleteTarget?.quantity || 0} units back to inventory and cannot be undone.`}
        loading={actionLoading}
      />

      {/* ══════════════════════════════════════
          MODAL: CREATE STOCK OUT
      ══════════════════════════════════════ */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setSelectedInv(null); setInvSearch(''); }}
        title="Create New Stock Out"
        width={680}
      >
        <div className="so-create-layout">
          {/* LEFT: inventory picker */}
          <div className="so-inv-panel">
            <p className="so-inv-panel-label">Select Inventory</p>
            <div className="table-search" style={{ marginBottom: 12 }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search item, colour…"
                value={invSearch}
                onChange={e => setInvSearch(e.target.value)}
              />
            </div>
            <div className="so-inv-list">
              {filteredInv.length === 0 ? (
                <div className="so-inv-empty">No available inventory</div>
              ) : filteredInv.map((s, i) => (
                <div
                  key={i}
                  className={`so-inv-item ${selectedInv === s ? 'so-inv-item--active' : ''}`}
                  onClick={() => {
                    setSelectedInv(s);
                    setCreateForm(f => ({ ...f, weight: s.weight || '', bale: s.bale || '' }));
                  }}
                >
                  <div className="so-inv-item-header">
                    <span className="so-inv-item-name">{s.itemType || s.productName || 'Raw Material'}</span>
                    <span className="badge badge-success">{s.netQuantity} units</span>
                  </div>
                  <div className="so-inv-item-meta">
                    <span>Colour: <strong>{s.color || '—'}</strong></span>
                    <span>Bales: <strong>{s.bale || '—'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: form */}
          <div className="so-create-form-panel">
            {!selectedInv ? (
              <div className="so-select-prompt">
                <Package size={36} style={{ opacity: 0.2 }} />
                <p>Select an inventory item on the left to begin</p>
              </div>
            ) : (
              <form className="so-form" onSubmit={handleCreate}>
                <div className="so-selected-badge">
                  <strong>{selectedInv.itemType || 'Item'}</strong>
                  <span className="text-tertiary"> · {selectedInv.color || 'No colour'}</span>
                  <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>
                    {selectedInv.netQuantity} available
                  </span>
                </div>

                <div className="so-form-grid so-form-grid--2">
                  <div className="form-group">
                    <label>Customer Name <span className="so-required">*</span></label>
                    <input
                      type="text" required
                      placeholder="Enter customer name"
                      value={createForm.customerName}
                      onChange={e => setCreateForm({ ...createForm, customerName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock Out Date <span className="so-required">*</span></label>
                    <input
                      type="date" required
                      value={createForm.date}
                      onChange={e => setCreateForm({ ...createForm, date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantity <span className="so-required">*</span></label>
                    <input
                      type="number" required min="1"
                      max={selectedInv.netQuantity}
                      placeholder={`Max ${selectedInv.netQuantity}`}
                      value={createForm.quantity}
                      onChange={e => setCreateForm({ ...createForm, quantity: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Weight (KG)</label>
                    <input
                      type="number" step="0.01"
                      placeholder="e.g. 50.5"
                      value={createForm.weight}
                      onChange={e => setCreateForm({ ...createForm, weight: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Number of Bales</label>
                    <input
                      type="text"
                      placeholder="e.g. 5"
                      value={createForm.bale}
                      onChange={e => setCreateForm({ ...createForm, bale: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Invoice #</label>
                    <input
                      type="text"
                      placeholder="Invoice number"
                      value={createForm.invoiceNumber}
                      onChange={e => setCreateForm({ ...createForm, invoiceNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Remarks (Optional)</label>
                  <textarea
                    rows="2"
                    placeholder="Any additional notes…"
                    value={createForm.notes}
                    onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button" className="btn btn-secondary"
                    onClick={() => setSelectedInv(null)}
                  >Clear Selection</button>
                  <button type="submit" className="btn btn-primary" disabled={createLoading}>
                    {createLoading ? 'Recording…' : 'Record Stock Out'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Stockout;
