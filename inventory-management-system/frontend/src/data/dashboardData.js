export const kpiData = [
  { id: 1, title: 'Total Revenue', value: '$84,250', change: '+12.5%', changeType: 'positive', icon: 'DollarSign', bg: '#f0fdf4', color: '#16a34a', width: 65 },
  { id: 2, title: 'Total Products', value: '1,248', change: '+3.2%', changeType: 'positive', icon: 'Package', bg: '#eff6ff', color: '#3b82f6', width: 75 },
  { id: 3, title: 'Total Stock In', value: '342', change: '-2.4%', changeType: 'negative', icon: 'TrendingUp', bg: '#fef3c7', color: '#d97706', width: 55 },
  { id: 4, title: 'Total Stock Out', value: '185', change: '+5.1%', changeType: 'positive', icon: 'TrendingUp', bg: '#fef3c7', color: '#d97706', width: 85 },
];

export const inventoryTrendData = [
  { month: 'Jan', value: 4000, sales: 2400 },
  { month: 'Feb', value: 3000, sales: 1398 },
  { month: 'Mar', value: 2000, sales: 9800 },
  { month: 'Apr', value: 2780, sales: 3908 },
  { month: 'May', value: 1890, sales: 4800 },
  { month: 'Jun', value: 2390, sales: 3800 },
  { month: 'Jul', value: 3490, sales: 4300 },
];

export const stockByCategoryData = [
  { name: 'Electronics', value: 45, color: '#3b82f6' },
  { name: 'Furniture', value: 25, color: '#10b981' },
  { name: 'Clothing', value: 20, color: '#f59e0b' },
  { name: 'Food', value: 10, color: '#ef4444' },
];

export const stockByWarehouseData = [
  { name: 'New York', value: 50, color: '#8b5cf6' },
  { name: 'Los Angeles', value: 30, color: '#ec4899' },
  { name: 'Chicago', value: 20, color: '#14b8a6' },
];

export const recentTransactions = [
  { id: 'TX-1001', product: 'Wireless Mouse', type: 'Stock In', quantity: 50, warehouse: 'New York', date: '2023-10-25', value: '$1,250', status: 'Completed' },
  { id: 'TX-1002', product: 'Mechanical Keyboard', type: 'Stock Out', quantity: 10, warehouse: 'Los Angeles', date: '2023-10-24', value: '$850', status: 'Pending' },
  { id: 'TX-1003', product: 'Office Chair', type: 'Transfer', quantity: 5, warehouse: 'Chicago', date: '2023-10-23', value: '$450', status: 'Completed' },
  { id: 'TX-1004', product: 'USB-C Cable', type: 'Stock In', quantity: 200, warehouse: 'New York', date: '2023-10-22', value: '$300', status: 'Completed' },
];

export const salesByCountry = [
  { country: 'United States', flag: '🇺🇸', share: 45, sales: '$45,000', change: '+5.2%' },
  { country: 'United Kingdom', flag: '🇬🇧', share: 20, sales: '$20,000', change: '+2.1%' },
  { country: 'Canada', flag: '🇨🇦', share: 15, sales: '$15,000', change: '-1.5%' },
  { country: 'Germany', flag: '🇩🇪', share: 10, sales: '$10,000', change: '+0.8%' },
];

export const currencyData = [
  { currency: 'USD', symbol: '$', rate: '1.00', change: 'Base', color: '#94a3b8' },
  { currency: 'EUR', symbol: '€', rate: '0.85', change: '+0.5%', color: '#10b981' },
  { currency: 'GBP', symbol: '£', rate: '0.73', change: '-0.2%', color: '#ef4444' },
  { currency: 'CAD', symbol: '$', rate: '1.25', change: '+0.1%', color: '#3b82f6' },
];

export const lowStockAlerts = [
  { id: 1, product: 'Wireless Mouse', sku: 'SKU-WM-01', category: 'Electronics', current: 15, minimum: 50, urgency: 'high' },
  { id: 2, product: 'Office Chair', sku: 'SKU-FC-01', category: 'Furniture', current: 5, minimum: 20, urgency: 'critical' },
  { id: 3, product: 'USB-C Cable', sku: 'SKU-UC-01', category: 'Electronics', current: 40, minimum: 100, urgency: 'medium' },
];

export const quickActions = [
  { id: 1, label: 'Add Product', icon: 'PlusCircle', color: '#16a34a', bg: '#f0fdf4' },
  { id: 2, label: 'Stock In', icon: 'PackagePlus', color: '#3b82f6', bg: '#eff6ff' },
  { id: 3, label: 'Stock Out', icon: 'Truck', color: '#d97706', bg: '#fef3c7' },
  { id: 4, label: 'Transfer', icon: 'ArrowLeftRight', color: '#8b5cf6', bg: '#f5f3ff' },
  { id: 5, label: 'Report', icon: 'FileBarChart', color: '#ec4899', bg: '#fdf2f8' },
];
