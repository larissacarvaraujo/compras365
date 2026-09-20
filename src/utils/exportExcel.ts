/**
 * Utility to export tabular data to an Excel-compatible CSV file with UTF-8 BOM
 */
export function exportToExcel(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  // Format cell value for CSV (escape quotes and commas)
  const formatCell = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(formatCell).join(';');
  const contentRows = rows.map((row) => row.map(formatCell).join(';')).join('\r\n');
  const csvContent = '\uFEFF' + headerRow + '\r\n' + contentRows; // \uFEFF is the UTF-8 BOM for Excel

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
