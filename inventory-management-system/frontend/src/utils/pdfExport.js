import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToPDF = (data, reportType) => {
  if (!data || data.length === 0) return;

  const doc = new jsPDF();
  
  // Set Title
  doc.setFontSize(18);
  doc.text(`NovaStock - ${reportType} Report`, 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  // Map columns based on reportType
  let head = [];
  let body = [];

  if (reportType === 'Stock In' || reportType === 'stock-in') {
    head = [['Date', 'Product', 'Item', 'Color', 'Bale', 'Weight', 'Qty', 'Supplier']];
    body = data.map(item => [
      new Date(item.date || item.createdAt).toLocaleDateString(),
      item.productId?.name || 'Unknown',
      item.itemType || '-',
      item.color || '-',
      item.bale || '-',
      item.weight ? `${item.weight} kg` : '-',
      item.quantity,
      item.supplier || '-'
    ]);
  } else if (reportType === 'Stock Out' || reportType === 'stock-out') {
    head = [['Date', 'Product', 'Item', 'Color', 'Bale', 'Weight', 'Qty', 'Customer']];
    body = data.map(item => [
      new Date(item.date || item.createdAt).toLocaleDateString(),
      item.productId?.name || 'Unknown',
      item.itemType || '-',
      item.color || '-',
      item.bale || '-',
      item.weight ? `${item.weight} kg` : '-',
      item.quantity,
      item.customerName || '-'
    ]);
  } else if (reportType === 'Inventory' || reportType === 'inventory') {
    head = [['Product', 'Category', 'SKU', 'Total Stock', 'Total Weight', 'Total Bales', 'Price']];
    body = data.map(item => [
      item.name,
      item.categoryId?.name || 'Uncategorized',
      item.sku,
      item.inventoryCount,
      item.totalWeight ? `${item.totalWeight} kg` : '-',
      item.totalBales || '-',
      `$${item.price?.toFixed(2) || '0.00'}`
    ]);
  }

  // Generate Table
  doc.autoTable({
    startY: 36,
    head: head,
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [200, 150, 62] }, // Enterprise gold
    styles: { fontSize: 9 },
  });

  const fileName = `${reportType.replace(/\s+/g, '-')}-Report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
