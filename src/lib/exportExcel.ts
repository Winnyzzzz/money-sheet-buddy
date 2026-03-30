import * as XLSX from "xlsx";

interface ExportOptions {
  data: Record<string, any>[];
  columns: { key: string; header: string }[];
  sheetName: string;
  fileName: string;
}

export function exportToExcel({ data, columns, sheetName, fileName }: ExportOptions) {
  const rows = data.map((item) =>
    columns.reduce((acc, col) => {
      acc[col.header] = item[col.key];
      return acc;
    }, {} as Record<string, unknown>)
  );

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}
