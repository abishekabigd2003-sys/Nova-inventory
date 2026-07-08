import { useState, useEffect, useCallback } from 'react';
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
  
  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [tab, activeTab]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = useCallback(async (type) => {
    setLoading(true);
    setError('');
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
      item.destination?.toLowerCase().includes(term)
    );
  });



  const handlePrint = async () => {
    await exportToExcel(filteredData, activeTab);
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
              <th>Product Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Current Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((p) => (
              <tr key={p._id}>
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
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No products found.</td></tr>
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
              <th>PO Date</th>
              <th>PO Number</th>
              <th>Party Name</th>
              <th>Item Details</th>
              <th>Color</th>
              <th>Bales</th>
              <th>Weight (kg)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((s) => (
              <tr key={s._id}>
                <td className="text-tertiary">{new Date(s.poDate).toLocaleDateString()}</td>
                <td><strong>{s.poNumber || '—'}</strong></td>
                <td>{s.partyName || '—'}</td>
                <td>{s.itemName} {s.yarnCount ? `(${s.yarnCount})` : ''}</td>
                <td>{s.color || '—'}</td>
                <td>{s.baleCount || '—'}</td>
                <td>{s.weight || '—'}</td>
                <td>
                  <span className={`badge ${s.status === 'Approved' ? 'badge-success' : 'badge-neutral'}`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No records found.</td></tr>
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
            <th>Product</th>
            <th>Item Type</th>
            <th>SKU</th>
            <th>Qty</th>
            <th>Color</th>
            <th>Bale</th>
            <th>Weight (kg)</th>
            <th>Customer/Destination</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((s) => (
            <tr key={s._id}>
              <td><strong>{s.productId?.name || '—'}</strong></td>
              <td>{s.itemType || '—'}</td>
              <td className="text-tertiary">{s.productId?.sku || '—'}</td>
              <td>{s.quantity}</td>
              <td>{s.color || '—'}</td>
              <td>{s.bale || '—'}</td>
              <td>{s.weight || '—'}</td>
              <td>{s.customerName || s.destination || '—'}</td>
              <td className="text-tertiary">{new Date(s.date).toLocaleDateString()}</td>
            </tr>
          ))}
          {filteredData.length === 0 && (
            <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>No records found.</td></tr>
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
          <h1 className="page-title">Reports</h1>
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
            placeholder="Search by product, SKU, color..." 
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
