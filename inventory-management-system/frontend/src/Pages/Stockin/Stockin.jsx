import { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import SearchableDropdown from '../../Components/SearchableDropdown/SearchableDropdown';
import { validateEntityName, validatePositiveNumber } from '../../utils/validation';
import '../Categories/Categories.css';
import './Stockin.css';

const Stockin = () => {
  const { recordStockIn } = useInventory();
  
  const [formData, setFormData] = useState({
    quantity: '',
    color: '',
    bale: '',
    weight: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    itemType: ''
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemType) {
      setErrorMsg('Item Type is required.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    
    // Default quantity to Number of Bales or 1
    const finalQuantity = formData.bale ? Number(formData.bale) : 1;
    
    if (formData.bale) {
      const baleError = validatePositiveNumber(formData.bale, 'Number of Bales');
      if (baleError) { setErrorMsg(baleError); setTimeout(() => setErrorMsg(''), 4000); return; }
    }
    
    if (formData.weight) {
      const weightError = validatePositiveNumber(formData.weight, 'Weight');
      if (weightError) { setErrorMsg(weightError); setTimeout(() => setErrorMsg(''), 4000); return; }
    }
    
    if (formData.supplier) {
      const supplierError = validateEntityName(formData.supplier);
      if (supplierError) { setErrorMsg("Please enter a valid supplier name"); setTimeout(() => setErrorMsg(''), 4000); return; }
    }
    
    const finalData = { ...formData, quantity: finalQuantity };
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      await recordStockIn(null, finalQuantity, finalData);
      
      setSuccessMsg(`Successfully recorded stock in.`);
      setFormData({
        quantity: '',
        color: '',
        bale: '',
        weight: '',
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        itemType: ''
      });
      
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to record stock in.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Stock In</h1>
        <p className="page-subtitle">Add new inventory to your system</p>
      </div>

      <div className="form-card">
        {successMsg && <div className="alert-success fade-in">{successMsg}</div>}
        {errorMsg && <div className="alert-error fade-in" style={{color: 'var(--color-danger)', background: 'var(--color-danger-bg)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-default)', marginBottom: '16px'}}>{errorMsg}</div>}
        
        <form className="standard-form" onSubmit={handleSubmit}>
          
          <div className="form-row">
            <div className="form-group">
              <label>Item Type</label>
              <SearchableDropdown
                options={['Cotton', 'Polyester', 'Sliver', 'FS', 'Drash', 'Powder', 'Cotton Rags']}
                value={formData.itemType}
                onChange={(val) => setFormData({ ...formData, itemType: val })}
                placeholder="Select item type..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="color">Color</label>
              <input 
                type="text" 
                id="color" 
                placeholder="e.g. Red, Blue" 
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bale">Number of Bales</label>
              <input 
                type="number" 
                id="bale" 
                min="0"
                placeholder="e.g. 10" 
                value={formData.bale}
                onChange={(e) => setFormData({...formData, bale: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label htmlFor="weight">Weight (kg)</label>
              <input 
                type="number" 
                id="weight" 
                min="0"
                step="0.01"
                placeholder="e.g. 50.5" 
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="supplier">Supplier</label>
              <input 
                type="text" 
                id="supplier" 
                placeholder="Supplier name" 
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label htmlFor="date">Date Received</label>
              <input 
                type="date" 
                id="date" 
                required 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Remarks (Optional)</label>
            <textarea 
              id="notes" 
              rows="3" 
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            ></textarea>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                setFormData({
                  quantity: '', color: '', bale: '', weight: '', supplier: '', 
                  date: new Date().toISOString().split('T')[0], notes: '', itemType: ''
                });
              }}
            >
              Clear
            </button>
            <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
              {loading ? 'Recording...' : 'Record Stock In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Stockin;
