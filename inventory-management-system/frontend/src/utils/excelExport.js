import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToExcel = async (data, activeTab) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  let columns;
  let rows;
  let fileName;

  if (activeTab === 'stock-in') {
    fileName = `Stock-In-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
    columns = [
      { header: 'Product', key: 'product', width: 25 },
      { header: 'Item', key: 'item', width: 15 },
      { header: 'Colour', key: 'color', width: 15 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Quantity', key: 'qty', width: 10 },
      { header: 'Bale', key: 'bale', width: 15 },
      { header: 'Weight (KG)', key: 'weight', width: 12 },
      { header: 'Supplier', key: 'supplier', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
    ];
    rows = data.map(item => ({
      product: item.productId?.name || '—',
      item: item.itemType || '—',
      color: item.color || '—',
      sku: item.productId?.sku || '—',
      qty: item.quantity,
      bale: item.bale || '—',
      weight: item.weight || '—',
      supplier: item.supplier || '—',
      date: new Date(item.date).toLocaleDateString(),
    }));
  } else if (activeTab === 'stock-out') {
    fileName = `Stock-Out-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
    columns = [
      { header: 'Product', key: 'product', width: 25 },
      { header: 'Item', key: 'item', width: 15 },
      { header: 'Colour', key: 'color', width: 15 },
      { header: 'Quantity', key: 'qty', width: 10 },
      { header: 'Bale', key: 'bale', width: 15 },
      { header: 'Weight (KG)', key: 'weight', width: 12 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
    ];
    rows = data.map(item => ({
      product: item.productId?.name || '—',
      item: item.itemType || '—',
      color: item.color || '—',
      qty: item.quantity,
      bale: item.bale || '—',
      weight: item.weight || '—',
      customer: item.customerName || item.destination || '—',
      date: new Date(item.date).toLocaleDateString(),
    }));
  } else if (['inventory', 'item'].includes(activeTab)) {
    fileName = `Inventory-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
    columns = [
      { header: 'Product Name', key: 'product', width: 25 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Price', key: 'price', width: 12 },
      { header: 'Current Stock', key: 'stock', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    rows = data.map(item => ({
      product: item.name,
      sku: item.sku,
      category: item.categoryId?.name || '—',
      price: item.price,
      stock: item.inventoryCount,
      status: item.status,
    }));
  } else if (['color', 'bale', 'weight'].includes(activeTab)) {
    fileName = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
    columns = [
      { header: activeTab.charAt(0).toUpperCase() + activeTab.slice(1), key: 'name', width: 20 },
      { header: 'Total Quantity', key: 'qty', width: 15 },
    ];
    rows = data.map(item => ({
      name: item._id || '—',
      qty: item.totalQuantity,
    }));
  } else {
    // Fallback
    fileName = `Report-${new Date().toISOString().split('T')[0]}.xlsx`;
    columns = [
      { header: 'ID', key: '_id', width: 20 },
    ];
    rows = data.map(item => ({ _id: item._id }));
  }

  worksheet.columns = columns;

  // Add rows
  worksheet.addRows(rows);

  // Format header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' } // Light gray background
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Format data cells
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' };
        
        // Auto-detect numbers
        if (!isNaN(cell.value) && cell.value !== '—' && cell.value !== '') {
          cell.value = Number(cell.value);
        }
      });
    }
  });

  // Generate and save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
};
