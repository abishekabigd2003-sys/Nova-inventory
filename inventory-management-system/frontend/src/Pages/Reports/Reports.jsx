import { useState, useEffect, useCallback, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { exportToExcel } from '../../utils/excelExport';
import './Reports.css';

const REPORT_TABS = [
  { key: 'stock-in',   label: 'Stock In' },
  { key: 'stock-out',  label: 'Stock Out' },
  { key: 'inventory',  label: 'Inventory' },
  { key: 'item',       label: 'Item-wise' },
  { key: 'color',      label: 'Colour-wise' },
  { key: 'bale',       label: 'Bale-wise' },
  { key: 'weight',     label: 'Weight-wise' },
];

export default function Reports() {
  const { tab } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(tab || 'stock-in');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [expandedRow, setExpandedRow] = useState(null); // ID of the row to show audit history
  
  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
      setExpandedRow(null);
    }
  }, [tab, activeTab]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = useCallback(async (type) => {
    setLoading(true);
    setError('');
    setExpandedRow(null);
    try {
      let url = `/api/reports?type=${type}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      setError('Failed to load report data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, fetchReport]);

  // Filter data based on search term
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    if (['inventory', 'item'].includes(activeTab)) {
      return item.name?.toLowerCase().includes(term) || item.sku?.toLowerCase().includes(term);
    }
    if (['color', 'bale', 'weight'].includes(activeTab)) {
      return item._id?.toString().toLowerCase().includes(term);
    }
    // Stock-in (StockIn schema)
    if (activeTab === 'stock-in') {
      return (
        item.poNumber?.toLowerCase().includes(term) ||
        item.partyName?.toLowerCase().includes(term) ||
        item.itemName?.toLowerCase().includes(term) ||
        item.yarnCount?.toLowerCase().includes(term) ||
        item.color?.toLowerCase().includes(term)
      );
    }

    // Stock-out (Stock schema)
    return (
      item.productId?.name?.toLowerCase().includes(term) ||
      item.productId?.sku?.toLowerCase().includes(term) ||
      item.color?.toLowerCase().includes(term) ||
      item.customerName?.toLowerCase().includes(term) ||
      item.destination?.toLowerCase().includes(term) ||
      item.invoiceNumber?.toLowerCase().includes(term)
    );
  });

  const handlePrint = async () => {
    await exportToExcel(filteredData, activeTab);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const renderAuditHistory = (item) => {
    if (!item.auditHistory || item.auditHistory.length === 0) {
      return <p style={{ color: 'var(--text-tertiary)' }}>No audit history available for this record.</p>;
    }
    
    return (
      <div className="audit-timeline">
        {item.auditHistory.map((audit, idx) => (
          <div key={idx} className="audit-item">
            <div className={`audit-icon ${audit.action.toLowerCase()}`}>
              {audit.action.charAt(0)}
            </div>
            <div className="audit-content">
              <div className="audit-header">
                <div>
                  <span className="audit-user">{audit.performedBy?.name || 'Unknown'}</span>
                  <span className="audit-role">({audit.role || audit.performedBy?.role || 'User'})</span>
                </div>
                <span className="audit-time">{formatDate(audit.timestamp)}</span>
              </div>
              <div className="audit-action">
                Performed <strong>{audit.action}</strong> action on this record.
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTable = () => {
    if (loading) return <p style={{ padding: '20px' }}>Loading report...</p>;
    if (error)   return <p style={{ padding: '20px', color: '#ef4444' }}>{error}</p>;

    // Aggregation reports (color, bale, weight)
    if (['color', 'bale', 'weight'].includes(activeTab)) {
      return (
        <table className="enterprise-table" id="report-table">
          <thead>
            <tr>
              <th>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</th>
              <th>Total Quantity</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, i) => (
              <tr key={i}>
                <td><strong>{row._id || '—'}</strong></td>
                <td>{row.totalQuantity} units</td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr><td colSpan="2" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No data found.</td></tr>
            )}
          </tbody>
        </table>
      );
    }

    // Inventory / Item-wise (product list)
    if (['inventory', 'item'].includes(activeTab)) {
      return (
        <table className="enterprise-table" id="report-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Current Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((p, index) => (
              <tr key={p._id}>
                <td className="text-tertiary">{index + 1}</td>
                <td><strong>{p.name}</strong></td>
                <td className="text-tertiary">{p.sku}</td>
                <td>{p.categoryId?.name || '—'}</td>
                <td>${parseFloat(p.price || 0).toFixed(2)}</td>
                <td>
                  {p.inventoryCount}
                  {p.inventoryCount < 10 && (
                    <span className="badge badge-warning" style={{ marginLeft: 8 }}>Low</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${p.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No products found.</td></tr>
            )}
          </tbody>
        </table>
      );
    }

    // Stock In report (StockIn schema)
    if (activeTab === 'stock-in') {
      return (
        <table className="enterprise-table" id="report-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>PO Date</th>
              <th>PO Number</th>
              <th>Party Name</th>
              <th>Item Name</th>
              <th>Colour</th>
              <th>Bales</th>
              <th>Weight (KG)</th>
              <th>Logged By</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((s, index) => (
              <Fragment key={s._id}>
                <tr>
                  <td className="text-tertiary">{index + 1}</td>
                  <td>{new Date(s.poDate).toLocaleDateString('en-GB')}</td>
                  <td><strong>{s.poNumber || '—'}</strong></td>
                  <td>{s.partyName || '—'}</td>
                  <td>{s.itemName} <span className="text-tertiary">{s.yarnCount ? `(${s.yarnCount})` : ''}</span></td>
                  <td>{s.color || '—'}</td>
                  <td><span className="cell-bale">{s.baleCount || '—'}</span></td>
                  <td><span className="cell-weight">{s.weight || '—'}</span></td>
                  <td>
                    <div className="badge-logged-by">
                      <div className={`role-dot ${s.createdBy?.role === 'Admin' ? 'admin' : 'user'}`} />
                      {s.createdBy?.name || s.createdBy?.email || 'System'}
                    </div>
                  </td>
                  <td className="text-tertiary">{formatDate(s.createdAt)}</td>
                  <td>
                    <button 
                      className="btn-ghost" 
                      onClick={() => setExpandedRow(expandedRow === s._id ? null : s._id)}
                    >
                      {expandedRow === s._id ? 'Close History' : 'View History'}
                    </button>
                  </td>
                </tr>
                {expandedRow === s._id && (
                  <tr className="audit-row">
                    <td colSpan="11">
                      {renderAuditHistory(s)}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {filteredData.length === 0 && (
              <tr><td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No records found.</td></tr>
            )}
          </tbody>
        </table>
      );
    }

    // Stock Out transaction report (Stock schema)
    return (
      <table className="enterprise-table" id="report-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Invoice Date</th>
            <th>Invoice Number</th>
            <th>Customer Name</th>
            <th>Product Name</th>
            <th>Colour</th>
            <th>Bales</th>
            <th>Weight (KG)</th>
            <th>Logged By</th>
            <th>Timestamp</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((s, index) => (
            <Fragment key={s._id}>
              <tr>
                <td className="text-tertiary">{index + 1}</td>
                <td>{new Date(s.date).toLocaleDateString('en-GB')}</td>
                <td><strong>{s.invoiceNumber || '—'}</strong></td>
                <td>{s.customerName || s.destination || '—'}</td>
                <td>{s.productId?.name || '—'} <span className="text-tertiary">({s.quantity} units)</span></td>
                <td>{s.color || '—'}</td>
                <td><span className="cell-bale">{s.bale || '—'}</span></td>
                <td><span className="cell-weight">{s.weight || '—'}</span></td>
                <td>
                  <div className="badge-logged-by">
                    <div className={`role-dot ${s.createdBy?.role === 'Admin' ? 'admin' : 'user'}`} />
                    {s.createdBy?.name || s.createdBy?.email || 'System'}
                  </div>
                </td>
                <td className="text-tertiary">{formatDate(s.createdAt)}</td>
                <td>
                  <button 
                    className="btn-ghost" 
                    onClick={() => setExpandedRow(expandedRow === s._id ? null : s._id)}
                  >
                    {expandedRow === s._id ? 'Close History' : 'View History'}
                  </button>
                </td>
              </tr>
              {expandedRow === s._id && (
                <tr className="audit-row">
                  <td colSpan="11">
                    {renderAuditHistory(s)}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
          {filteredData.length === 0 && (
            <tr><td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No records found.</td></tr>
          )}
        </tbody>
      </table>
    );
  };

  const totalItems = filteredData.length;
  const totalQty = filteredData.reduce((s, r) => s + (r.quantity || r.totalQuantity || r.inventoryCount || r.baleCount || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div className="page-header-left">
          <h1 className="page-title">Enterprise Reports</h1>
          <p className="page-subtitle">Inventory analytics — Stock In, Stock Out, Item-wise, Colour-wise, Bale-wise, Weight-wise</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            🖨️ Print to Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="reports-summary-row">
        <div className="report-stat-card">
          <span className="report-stat-label">Records</span>
          <span className="report-stat-value">{loading ? '...' : totalItems}</span>
        </div>
        <div className="report-stat-card">
          <span className="report-stat-label">Total Quantity</span>
          <span className="report-stat-value">{loading ? '...' : totalQty.toLocaleString()}</span>
        </div>
        <div className="report-stat-card">
          <span className="report-stat-label">Report Type</span>
          <span className="report-stat-value">{REPORT_TABS.find(t => t.key === activeTab)?.label}</span>
        </div>
      </div>

      <div className="card">
        {/* Tab bar */}
        <div className="report-tabs">
          {REPORT_TABS.map((t) => (
            <button
              key={t.key}
              className={`report-tab-btn ${activeTab === t.key ? 'is-active' : ''}`}
              onClick={() => {
                setActiveTab(t.key);
                setSearchTerm('');
                navigate(`/admin/dashboard/reports/${t.key}`, { replace: true });
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Toolbar: Search & Filter */}
        <div style={{ padding: '16px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search by PO Number, Party, SKU, Item Name..." 
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-default)', flex: 1, minWidth: '200px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {!['inventory', 'item'].includes(activeTab) && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="date" 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-default)' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ color: 'var(--text-tertiary)' }}>to</span>
              <input 
                type="date" 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-default)' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="table-wrap">
          {renderTable()}
        </div>
      </div>
    </div>
  );
}
