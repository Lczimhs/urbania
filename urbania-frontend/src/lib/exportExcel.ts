import * as XLSX from 'xlsx';

export function exportGridToXlsx(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filename: string
) {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Ajustar largura automática das colunas
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map(r => String(r[i] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 3, 10), 60) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Utilitário de exportação CSV como fallback
export function exportGridToCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filename: string
) {
  const sanitizedRows = rows.map(r =>
    r.map(cell => (cell === null || cell === undefined ? '' : `"${String(cell).replace(/"/g, '""')}"`)).join(';')
  );
  const csvContent = '\uFEFF' + [headers.join(';'), ...sanitizedRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
