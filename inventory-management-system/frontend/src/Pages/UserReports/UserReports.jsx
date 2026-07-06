import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { exportToExcel } from '../../utils/excelExport';

const REPORT_TABS = [
  { key: 'stock-in',  label: 'Stock In Report' },
  { key: 'stock-out', label: 'Stock Out Report' },
];

export default function UserReports() {
  const { tab }    = useParams();
  const navigate   = useNavigate();

  const [activeTab, setActiveTab] = useState(tab || 'stock-in');
  const [data,      setData]      = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');

  useEffect(() => {
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [tab, activeTab]);

  const fetchReport = useCallback(async (type) => {
    setLoading(true);
    setError('');
    try {
      let url = `/api/reports?type=${type}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate)   url += `&endDate=${endDate}`;
      const { data: res } = await api.get(url);
      setData(res);
    } catch {
      setError('Failed to load report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, fetchReport]);

  const filtered = data.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.productId?.name?.toLowerCase().includes(q) ||
      item.productId?.sku?.toLowerCase().includes(q)  ||
      item.color?.toLowerCase().includes(q)            ||
      item.supplier?.toLowerCase().includes(q)         ||
      item.destination?.toLowerCase().includes(q)
    );
  });



  const totalQty = filtered.reduce((s, r) => s + (r.quantity || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div className="page-header-left">
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">View Stock In and Stock Out inventory reports</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => exportToExcel(filtered, activeTab)}>🖨️ Print to Excel</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Records',        value: loading ? '...' : filtered.length },
          { label: 'Total Quantity', value: loading ? '...' : totalQty.toLocaleString() },
          { label: 'Report Type',    value: REPORT_TABS.find((t) => t.key === activeTab)?.label },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)', padding: '0 16px' }}>
          {REPORT_TABS.map((t) => (
            <button
              key={t.key}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: activeTab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === t.key ? 'var(--color-primary)' : 'var(--text-tertiary)',
                fontWeight: activeTab === t.key ? 700 : 500,
                fontSize: 13.5,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
                marginBottom: -1,
              }}
              onClick={() => {
                setActiveTab(t.key);
                setSearch('');
                navigate(`/user/dashboard/reports/${t.key}`, { replace: true });
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ padding: 16, display: 'flex', gap: 12, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <div className="table-search" style={{ flex: 1 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
            <input
              placeholder="Search by product, SKU, colour..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="date"
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>to</span>
            <input
              type="date"
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <p style={{ padding: 24, color: 'var(--text-tertiary)' }}>Loading report...</p>
          ) : error ? (
            <p style={{ padding: 24, color: 'var(--color-danger)' }}>{error}</p>
          ) : (
            <table className="enterprise-table" id="report-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Item Type</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Colour</th>
                  <th>Bale</th>
                  <th>Weight (kg)</th>
                  <th>{activeTab === 'stock-in' ? 'Supplier' : 'Destination'}</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id}>
                    <td className="cell-strong">{s.productId?.name || '—'}</td>
                    <td>{s.itemType || '—'}</td>
                    <td className="text-tertiary">{s.productId?.sku || '—'}</td>
                    <td>{s.quantity}</td>
                    <td>{s.color || '—'}</td>
                    <td>{s.bale || '—'}</td>
                    <td>{s.weight || '—'}</td>
                    <td>{activeTab === 'stock-in' ? (s.supplier || '—') : (s.destination || '—')}</td>
                    <td className="text-tertiary">{new Date(s.date).toLocaleDateString()}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        <p className="empty-state-title">No records found</p>
                        <p className="empty-state-desc">
                          {search ? 'Try adjusting your search or date filters.' : 'No records available for this report type.'}
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
    </div>
  );
}
