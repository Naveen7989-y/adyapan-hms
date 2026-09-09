/**
 * Utility to trigger browser download of tabular array as a CSV file
 * @param {string} filename - Filename without extension
 * @param {Array<Object>} rows - Array of flat objects representing rows
 */
export const exportToCsv = (filename, rows) => {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  const separator = ',';
  const keys = Object.keys(rows[0]);

  const csvHeader = keys.join(separator);
  const csvRows = rows.map((row) => {
    return keys
      .map((k) => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = typeof cell === 'object' ? JSON.stringify(cell) : cell.toString();
        // Escape quotes
        cell = cell.replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      })
      .join(separator);
  });

  const csvContent = '\uFEFF' + [csvHeader, ...csvRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
