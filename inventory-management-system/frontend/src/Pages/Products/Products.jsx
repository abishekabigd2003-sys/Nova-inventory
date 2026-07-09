import { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../Components/DataTable/DataTable';
import Drawer from '../../Components/Drawer/Drawer';
import { Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { validateEntityName, validatePositiveNumber } from '../../utils/validation';
import '../Categories/Categories.css'; // Reuse common styles
import './Products.css';

const Products = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useInventory();
  const { showToast, ToastContainer } = useToast();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'Admin';
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    sku: '',
    price: '',
    inventoryCount: 0
  });

  const handleOpenDrawer = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ 
        name: product.name, 
        categoryId: product.categoryId?._id || '',
        sku: product.sku,
        price: product.price,
        inventoryCount: product.inventoryCount
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        name: '', 
        categoryId: (categories.length > 0 ? categories[0]._id : ''),
        sku: '',
        price: '',
        inventoryCount: 0
      });
    }
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validations
    const nameError = validateEntityName(formData.name);
    if (nameError) return showToast(nameError, 'error');

    if (!formData.categoryId) return showToast('Please select a valid category.', 'error');

    const priceError = validatePositiveNumber(formData.price, 'Price');
    if (priceError) return showToast(priceError, 'error');

    if (editingProduct) {
      updateProduct(editingProduct._id, {
        ...formData,
        price: parseFloat(formData.price),
        inventoryCount: parseInt(formData.inventoryCount, 10)
      });
    } else {
      addProduct({
        ...formData,
        price: parseFloat(formData.price),
        inventoryCount: parseInt(formData.inventoryCount, 10)
      });
    }
    handleCloseDrawer();
  };

  const columns = [
    { header: 'Product', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Category', accessor: 'category', render: (row) => row.categoryId?.name || '—' },
    { header: 'SKU', accessor: 'sku' },
    { 
      header: 'Price', 
      accessor: 'price',
      render: (row) => `$${parseFloat(row.price).toFixed(2)}`
    },
    { 
      header: 'Stock', 
      accessor: 'inventoryCount',
      render: (row) => (
        <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
          {row.inventoryCount} units
          <span className={`badge ${row.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
            {row.status || 'Active'}
          </span>
        </span>
      )
    },
    { 
      header: 'Total Weight', 
      accessor: 'totalWeight',
      render: (row) => `${row.totalWeight || 0} kg`
    },
    { 
      header: 'Total Bales', 
      accessor: 'totalBales',
      render: (row) => `${row.totalBales || 0}`
    },
    ...(isAdmin ? [{
      header: 'Actions',
      render: (row) => (
        <div className="inline-actions">
          <button className="action-btn edit-btn" title="Edit" onClick={() => handleOpenDrawer(row)}>
            <Edit2 size={16} />
          </button>
          <button className="action-btn delete-btn" title="Delete" onClick={() => deleteProduct(row._id)}>
            <Trash2 size={16} />
          </button>
        </div>
      )
    }] : [])
  ];

  return (
    <div className="page-container">
      <ToastContainer />
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your inventory items</p>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={products} 
        searchPlaceholder="Search products by name, SKU..."
        actions={
          isAdmin ? (
            <button className="btn btn-primary" onClick={() => handleOpenDrawer()}>
              + Add Product
            </button>
          ) : null
        }
      />

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={handleCloseDrawer} 
        title={editingProduct ? "Edit Product" : "Add New Product"}
      >
        <form className="drawer-form" onSubmit={handleSubmit}>
          <div className="drawer-form-group">
            <label htmlFor="name">Product Name</label>
            <input 
              type="text" 
              id="name" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required 
              placeholder="e.g. Wireless Mouse"
            />
          </div>
          
          <div className="drawer-form-group">
            <label htmlFor="category">Category</label>
            <select 
              id="category" 
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
              required
            >
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
              {categories.length === 0 && <option value="">No categories available</option>}
            </select>
          </div>

          <div className="drawer-form-group">
            <label htmlFor="sku">SKU (Stock Keeping Unit)</label>
            <input 
              type="text" 
              id="sku" 
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
              required 
              placeholder="e.g. SKU-WM-01"
            />
          </div>

          <div className="drawer-form-group">
            <label htmlFor="price">Price ($)</label>
            <input 
              type="number" 
              id="price" 
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required 
              placeholder="0.00"
            />
          </div>

          <div className="drawer-form-group">
            <label htmlFor="stock">Initial Stock</label>
            <input 
              type="number" 
              id="inventoryCount"
              min="0"
              value={formData.inventoryCount}
              onChange={(e) => setFormData({...formData, inventoryCount: e.target.value})}
              required 
              disabled={!!editingProduct} // Don't allow editing stock here, use Stock In/Out
              title={editingProduct ? "Use Stock In/Out modules to adjust stock" : ""}
            />
            {editingProduct && (
              <span style={{fontSize: '0.75rem', color: 'var(--warning-600)', marginTop: '4px'}}>
                * Use Stock In/Out to modify existing stock.
              </span>
            )}
          </div>
          
          <div className="drawer-footer">
            <button type="button" className="btn btn-secondary" onClick={handleCloseDrawer}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingProduct ? "Update Product" : "Save Product"}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};

export default Products;
