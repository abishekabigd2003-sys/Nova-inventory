import { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, X, Check, FileDown,
  RefreshCw, AlertCircle, PackagePlus, Hash, User, Calendar, Eye
} from 'lucide-react';
import { 
  getStockInRecords, createStockInRecord, updateStockInRecord, deleteStockInRecord 
} from '../../api/stockin.api';
import './Stockin.css';

const Stockin = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState('');

  // Form State
  const initialFormState = {
    poDate: new Date().toISOString().split('T')[0],
    poNumber: '',
    partyName: '',
    yarnCount: '',
    itemName: '',
    color: '',
    baleCount: '',
    weight: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  
  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getStockInRecords({ search });
      setRecords(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch Stock In records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  // Handlers
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditFormChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await createStockInRecord(formData);
      showSuccess('Stock In record created successfully');
      setFormData(initialFormState);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create record');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await deleteStockInRecord(id);
      showSuccess('Record deleted successfully');
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const startEdit = (record) => {
    setEditingId(record._id);
    setEditFormData({
      poDate: record.poDate.split('T')[0],
      poNumber: record.poNumber,
      partyName: record.partyName,
      yarnCount: record.yarnCount,
      itemName: record.itemName,
      color: record.color || '',
      baleCount: record.baleCount,
      weight: record.weight,
      status: record.status
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const saveEdit = async (id) => {
    try {
      await updateStockInRecord(id, editFormData);
      showSuccess('Record updated successfully');
      setEditingId(null);
      setEditFormData(null);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update record');
    }
  };

  return (
    <div className="page-container stockin-container fade-in">
      
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon"><PackagePlus size={28} /></div>
          <div>
            <h1 className="page-title">Stock In Workflow</h1>
            <p className="page-subtitle">Record and manage incoming inventory</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && <div className="alert alert-success"><Check size={18} /> {success}</div>}
      {error && <div className="alert alert-error"><AlertCircle size={18} /> {error}</div>}

      <div className="stockin-grid">
        {/* Left Pane: Form */}
        <div className="stockin-form-pane">
          <div className="pane-header">
            <h3>New Entry</h3>
          </div>
          
          <form className="stockin-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label><Calendar size={14} /> PO Date</label>
              <input type="date" name="poDate" value={formData.poDate} onChange={handleFormChange} required />
            </div>

            <div className="form-group">
              <label><Hash size={14} /> PO Number</label>
              <input type="text" name="poNumber" value={formData.poNumber} onChange={handleFormChange} placeholder="e.g. PO-1001" required />
            </div>

            <div className="form-group">
              <label><User size={14} /> Party Name</label>
              <input type="text" name="partyName" value={formData.partyName} onChange={handleFormChange} placeholder="Supplier / Vendor" required />
            </div>

            <div className="form-group">
              <label>Yarn Count</label>
              <input type="text" name="yarnCount" value={formData.yarnCount} onChange={handleFormChange} placeholder="e.g. 40s" required />
            </div>
            
            <div className="form-group">
              <label>Item Name</label>
              <input type="text" name="itemName" value={formData.itemName} onChange={handleFormChange} placeholder="e.g. Cotton" required />
            </div>

            <div className="form-group">
              <label>Colour (Optional)</label>
              <input type="text" name="color" value={formData.color} onChange={handleFormChange} placeholder="e.g. White, Natural" />
            </div>

            <div className="form-group">
              <label>No. of Bales</label>
              <input type="number" name="baleCount" min="1" value={formData.baleCount} onChange={handleFormChange} placeholder="10" required />
            </div>
            
            <div className="form-group">
              <label>Weight (KG)</label>
              <input type="number" step="0.01" min="0" name="weight" value={formData.weight} onChange={handleFormChange} placeholder="50.0" required />
            </div>

            <button type="submit" className="btn btn-primary w-100 submit-btn" disabled={submitLoading}>
              {submitLoading ? <RefreshCw className="spin" size={18} /> : <Plus size={18} />}
              {submitLoading ? 'Saving...' : 'Add Stock In'}
            </button>
          </form>
        </div>

        {/* Right Pane: Table Log */}
        <div className="stockin-table-pane">
          <div className="table-pane-header">
            <div className="table-header-left">
              <h3>Stock In Log</h3>
              <span className="badge badge-neutral">{records.length} Records</span>
            </div>
            <div className="table-actions">
              <div className="table-search search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search PO, Party, Item..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="btn btn-secondary btn-icon" onClick={fetchData} title="Refresh">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          <div className="table-responsive">
            {loading ? (
              <div className="loading-state">
                <RefreshCw className="spin" size={24} />
                <p>Loading records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="empty-state">
                <FileDown size={48} />
                <p>No Stock In records found</p>
              </div>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>PO Date</th>
                    <th>PO Number</th>
                    <th>Party Name</th>
                    <th>Item Details</th>
                    <th>Bales</th>
                    <th>Weight</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr key={record._id}>
                      {editingId === record._id ? (
                        /* Inline Edit Mode */
                        <>
                          <td><input type="date" name="poDate" className="edit-input" value={editFormData.poDate} onChange={handleEditFormChange} /></td>
                          <td><input type="text" name="poNumber" className="edit-input" value={editFormData.poNumber} onChange={handleEditFormChange} /></td>
                          <td><input type="text" name="partyName" className="edit-input" value={editFormData.partyName} onChange={handleEditFormChange} /></td>
                          <td>
                            <input type="text" name="itemName" className="edit-input mb-1" placeholder="Item" value={editFormData.itemName} onChange={handleEditFormChange} />
                            <input type="text" name="yarnCount" className="edit-input" placeholder="Count" value={editFormData.yarnCount} onChange={handleEditFormChange} />
                          </td>
                          <td><input type="number" name="baleCount" className="edit-input warning-bg" value={editFormData.baleCount} onChange={handleEditFormChange} /></td>
                          <td><input type="number" name="weight" className="edit-input success-bg" value={editFormData.weight} onChange={handleEditFormChange} /></td>
                          <td>
                            <select name="status" className="edit-input" value={editFormData.status} onChange={handleEditFormChange}>
                              <option value="Approved">Approved</option>
                              <option value="Pending">Pending</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="actions-cell">
                            <button className="btn-icon text-success" onClick={() => saveEdit(record._id)} title="Save"><Check size={18} /></button>
                            <button className="btn-icon text-danger" onClick={cancelEdit} title="Cancel"><X size={18} /></button>
                          </td>
                        </>
                      ) : (
                        /* View Mode */
                        <>
                          <td>{new Date(record.poDate).toLocaleDateString()}</td>
                          <td className="font-medium">{record.poNumber}</td>
                          <td><div className="truncate-text" title={record.partyName}>{record.partyName}</div></td>
                          <td>
                            <div className="item-details">
                              <span className="item-name">{record.itemName}</span>
                              <span className="item-meta">{record.yarnCount} {record.color && `• ${record.color}`}</span>
                            </div>
                          </td>
                          <td><span className="badge badge-warning">{record.baleCount}</span></td>
                          <td><span className="badge badge-success">{record.weight} KG</span></td>
                          <td>
                            <span className={`status-badge status-${record.status.toLowerCase()}`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <div className="inline-actions">
                              <button type="button" className="action-btn view-btn" title="View Details">
                                <Eye size={16} />
                              </button>
                              <button type="button" className="action-btn edit-btn" title="Edit Record" onClick={() => startEdit(record)}>
                                <Edit2 size={16} />
                              </button>
                              <button type="button" className="action-btn delete-btn" title="Delete Record" onClick={() => handleDelete(record._id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stockin;
