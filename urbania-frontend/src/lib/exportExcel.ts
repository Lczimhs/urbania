import * as XLSX from 'xlsx';

export function exportGridToXlsx(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filename: string
) {
  try {
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
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');

    // Gerar ArrayBuffer 100% puro no browser sem depender de fs/Node
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.warn('Falha no exportador nativo .xlsx, usando fallback CSV:', err);
    exportGridToCsv(headers, rows, filename);
  }
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
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
