import { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import DataTable from '../../Components/DataTable/DataTable';
import Drawer from '../../Components/Drawer/Drawer';
import { Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { validateEntityName } from '../../utils/validation';
import './Categories.css';

const Categories = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useInventory();
  const { showToast, ToastContainer } = useToast();
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    status: 'Active'
  });

  const handleOpenDrawer = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, status: category.status });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', status: 'Active' });
    }
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const nameError = validateEntityName(formData.name);
    if (nameError) return showToast(nameError, 'error');

    if (editingCategory) {
      updateCategory(editingCategory._id, formData);
    } else {
      addCategory(formData);
    }
    handleCloseDrawer();
  };

  const columns = [
    { header: 'ID', accessor: '_id', render: (row) => row._id.substring(row._id.length - 6).toUpperCase() },
    { header: 'Category Name', accessor: 'name' },
    { header: 'Total Products', accessor: 'totalProducts' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <span className={`badge ${row.status === 'Active' ? 'badge-success' : 'badge-inactive'}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="inline-actions">
          <button className="action-btn edit-btn" title="Edit" onClick={() => handleOpenDrawer(row)}>
            <Edit2 size={16} />
          </button>
          <button className="action-btn delete-btn" title="Delete" onClick={() => deleteCategory(row._id)}>
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <ToastContainer />
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Manage your product categories</p>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={categories} 
        searchPlaceholder="Search categories..."
        actions={
          <button className="btn btn-primary" onClick={() => handleOpenDrawer()}>
            + Add Category
          </button>
        }
      />

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={handleCloseDrawer} 
        title={editingCategory ? "Edit Category" : "Add New Category"}
      >
        <form className="drawer-form" onSubmit={handleSubmit}>
          <div className="drawer-form-group">
            <label htmlFor="name">Category Name</label>
            <input 
              type="text" 
              id="name" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required 
              placeholder="e.g. Electronics"
            />
          </div>
          <div className="drawer-form-group">
            <label htmlFor="status">Status</label>
            <select 
              id="status" 
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          
          <div className="drawer-footer">
            <button type="button" className="btn btn-secondary" onClick={handleCloseDrawer}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingCategory ? "Update Category" : "Save Category"}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};

export default Categories;
