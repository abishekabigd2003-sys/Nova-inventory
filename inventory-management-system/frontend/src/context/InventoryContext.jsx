import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/api';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/api/categories');
      setCategories(res.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Error fetching categories:', err.message);
      }
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Error fetching products:', err.message);
      }
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('ims_user');
    if (stored && JSON.parse(stored).token) {
      Promise.all([fetchCategories(), fetchProducts()]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const addCategory = async (category) => {
    await api.post('/api/categories', category);
    await fetchCategories();
  };

  const updateCategory = async (id, updatedCategory) => {
    await api.put(`/api/categories/${id}`, updatedCategory);
    await fetchCategories();
  };

  const deleteCategory = async (id) => {
    await api.delete(`/api/categories/${id}`);
    await fetchCategories();
  };

  const addProduct = async (product) => {
    await api.post('/api/products', product);
    await fetchProducts();
  };

  const updateProduct = async (id, updatedProduct) => {
    await api.put(`/api/products/${id}`, updatedProduct);
    await fetchProducts();
  };

  const deleteProduct = async (id) => {
    await api.delete(`/api/products/${id}`);
    await fetchProducts();
  };

  const recordStockIn = async (productId, quantity, details) => {
    if (details.image instanceof File) {
      const formData = new FormData();
      formData.append('type', 'IN');
      if (productId) formData.append('productId', productId);
      formData.append('quantity', quantity);
      
      Object.keys(details).forEach(key => {
        if (key !== 'productId' && details[key] !== undefined && details[key] !== null && details[key] !== '') {
          formData.append(key, details[key]);
        }
      });
      
      await api.post('/api/stock', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      const payload = { type: 'IN', quantity, ...details };
      if (!payload.productId) delete payload.productId;
      if (productId) payload.productId = productId;
      await api.post('/api/stock', payload);
    }
    await fetchProducts();
  };

  const recordStockOut = async (productId, quantity, details) => {
    await api.post('/api/stock-out', { productId, quantity, ...details });
    await fetchProducts();
  };

  const getAvailableStock = useCallback(async () => {
    const { data } = await api.get('/api/stock/available');
    return data;
  }, []);

  const fetchStockRecords = useCallback(async (type) => {
    let url = type === 'OUT' ? '/api/stock-out' : '/api/stock';
    if (type && type !== 'OUT') url += `?type=${type}`;
    const res = await api.get(url);
    return res.data;
  }, []);

  const updateStock = async (id, data, type) => {
    const url = type === 'OUT' ? `/api/stock-out/${id}` : `/api/stock/${id}`;
    await api.put(url, data);
    await fetchProducts();
  };

  const deleteStock = async (id, type) => {
    const url = type === 'OUT' ? `/api/stock-out/${id}` : `/api/stock/${id}`;
    await api.delete(url);
    await fetchProducts();
  };

  return (
    <InventoryContext.Provider value={{
      categories, addCategory, updateCategory, deleteCategory, fetchCategories,
      products, addProduct, updateProduct, deleteProduct, fetchProducts,
      recordStockIn, recordStockOut, getAvailableStock, fetchStockRecords, updateStock, deleteStock,
      loading
    }}>
      {children}
    </InventoryContext.Provider>
  );
};
