import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, PackageOpen } from 'lucide-react';
import './ProductSelector.css';

const ProductSelector = ({ 
  products = [], 
  value, 
  onChange, 
  disabled = false,
  placeholder = 'Select a product...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const selectedProduct = useMemo(() => {
    return products.find(p => p._id === value) || null;
  }, [products, value]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.sku && p.sku.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearchQuery('');
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  // Handle scrolling to highlighted item
  useEffect(() => {
    if (isOpen && listRef.current && filteredProducts.length > 0) {
      const highlightedEl = listRef.current.children[highlightedIndex];
      if (highlightedEl) {
        highlightedEl.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex, isOpen, filteredProducts.length]);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredProducts[highlightedIndex]) {
          onChange(filteredProducts[highlightedIndex]._id);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const getDefaultImage = () => {
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmMTVmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEycHgiIGZpbGw9IiM5NDliYjIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
  };

  return (
    <div 
      className={`product-selector-container ${disabled ? 'disabled' : ''}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <div 
        className={`selector-trigger ${isOpen ? 'open' : ''} ${selectedProduct ? 'has-value' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
      >
        {selectedProduct ? (
          <div className="selected-display">
            <div className="selected-thumb">
              <img 
                src={selectedProduct.imageUrl || getDefaultImage()} 
                alt={selectedProduct.name} 
                onError={(e) => { e.target.src = getDefaultImage(); }}
              />
            </div>
            <div className="selected-info">
              <span className="selected-name">{selectedProduct.name}</span>
              <span className="selected-sku">SKU: {selectedProduct.sku}</span>
            </div>
          </div>
        ) : (
          <span className="placeholder-text">{placeholder}</span>
        )}
        <ChevronDown size={20} className="trigger-icon" />
      </div>

      {isOpen && (
        <div className="selector-dropdown">
          <div className="selector-search-box">
            <Search size={18} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by Product Name or SKU..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="selector-options" ref={listRef}>
            {filteredProducts.length === 0 ? (
              <div className="no-options">
                <PackageOpen size={32} className="no-options-icon" />
                <p>No products found</p>
              </div>
            ) : (
              filteredProducts.map((product, index) => {
                const isSelected = value === product._id;
                const isHighlighted = highlightedIndex === index;
                
                return (
                  <div
                    key={product._id}
                    className={`selector-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                    onClick={() => {
                      onChange(product._id);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="option-image">
                      <img 
                        src={product.imageUrl || getDefaultImage()} 
                        alt={product.name} 
                        onError={(e) => { e.target.src = getDefaultImage(); }}
                      />
                    </div>
                    <div className="option-details">
                      <div className="option-header">
                        <span className="option-name">{product.name}</span>
                        {isSelected && <Check size={16} className="check-icon" />}
                      </div>
                      <div className="option-meta">
                        <span className="meta-sku">SKU: {product.sku}</span>
                        <span className="meta-dot">&bull;</span>
                        <span className="meta-category">{product.categoryId?.name || product.category || 'Uncategorized'}</span>
                        <span className="meta-dot">&bull;</span>
                        <span className="meta-stock">Stock: {product.inventoryCount || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSelector;
