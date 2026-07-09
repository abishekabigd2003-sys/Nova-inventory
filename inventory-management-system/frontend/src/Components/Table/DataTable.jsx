import { useState, useMemo } from 'react';
import { 
  Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, 
  Eye, Edit, Trash2, Filter, Download
} from 'lucide-react';
import './DataTable.css';

export default function DataTable({ 
  columns, 
  data, 
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  searchPlaceholder = "Search...",
  rowsPerPageOptions = [5, 10, 20, 50],
  defaultRowsPerPage = 10
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  // Sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and Sort Data
  const processedData = useMemo(() => {
    if (!data) return [];
    
    // Search
    let filtered = data.filter((item) => {
      return Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Sort
    if (sortConfig.key !== null) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  }, [data, searchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = processedData.slice(startIndex, startIndex + rowsPerPage);

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const s = String(status).toLowerCase();
    let variant = "default";
    if (["completed", "delivered", "active", "approved"].includes(s)) variant = "success";
    else if (["pending", "processing", "in-transit"].includes(s)) variant = "warning";
    else if (["cancelled", "failed", "rejected"].includes(s)) variant = "danger";
    
    return (
      <span className={`status-badge status-badge--${variant}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="data-table-container">
      {/* Table Toolbar */}
      <div className="data-table-toolbar">
        <div className="data-table-search">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to page 1 on search
            }}
          />
        </div>
        <div className="data-table-actions">
          <button className="btn btn-secondary" title="Filter" style={{width: 'auto', padding: '6px 12px', gap: '6px'}}>
            <Filter size={16} /> Filter
          </button>
          <button className="btn btn-secondary" title="Export" style={{width: 'auto', padding: '6px 12px', gap: '6px'}}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Table Wrapper for horizontal scroll on mobile */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  onClick={() => col.sortable !== false && requestSort(col.key)}
                  className={col.sortable !== false ? "sortable" : ""}
                  style={{ width: col.width }}
                >
                  <div className="th-content">
                    {col.label}
                    {col.sortable !== false && sortConfig.key === col.key && (
                      <span className="sort-icon">
                        {sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(onView || onEdit || onDelete) && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading Skeletons
              Array.from({ length: rowsPerPage }).map((_, idx) => (
                <tr key={idx}>
                  {columns.map(col => (
                    <td key={col.key}><div className="skeleton skeleton-text" /></td>
                  ))}
                  {(onView || onEdit || onDelete) && <td><div className="skeleton skeleton-text" /></td>}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length + (onView || onEdit || onDelete ? 1 : 0)} className="data-table-empty">
                  <div className="empty-state">
                    <p>No records found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr key={row.id || rowIndex}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.isStatus ? (
                        <StatusBadge status={row[col.key]} />
                      ) : col.render ? (
                        col.render(row[col.key], row)
                      ) : (
                        row[col.key]
                      )}
                    </td>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <td className="text-right">
                      <div className="inline-actions" style={{ justifyContent: 'flex-end' }}>
                        {onView && (
                          <button onClick={() => onView(row)} className="action-btn view-btn" title="View">
                            <Eye size={16} />
                          </button>
                        )}
                        {onEdit && (
                          <button onClick={() => onEdit(row)} className="action-btn edit-btn" title="Edit">
                            <Edit size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={() => onDelete(row)} className="action-btn delete-btn" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="data-table-pagination">
        <div className="pagination-info">
          Showing {processedData.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + rowsPerPage, processedData.length)} of {processedData.length} entries
        </div>
        
        <div className="pagination-controls">
          <div className="rows-per-page">
            <span className="text-muted text-sm">Rows per page:</span>
            <select 
              value={rowsPerPage} 
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {rowsPerPageOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="page-buttons">
            <button 
              className="page-btn" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="page-current">{currentPage} / {totalPages}</span>
            <button 
              className="page-btn" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
