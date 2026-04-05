import { format } from "date-fns";
import { vi } from "date-fns/locale";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export interface BillExpense {
  date: string;
  description: string;
  amount: number;
}

export function printMarketBill(expenses: BillExpense[], month: string, total: number) {
  const [year, m] = month.split("-").map(Number);
  const monthLabel = new Date(year, m - 1, 1).toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  const rows = expenses
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      (e, i) => `
      <tr class="${i % 2 === 0 ? "even" : ""}">
        <td class="center">${i + 1}</td>
        <td class="center">${format(new Date(e.date), "dd/MM", { locale: vi })}</td>
        <td>${e.description || "—"}</td>
        <td class="right amount">${formatVND(e.amount)}</td>
      </tr>`
    )
    .join("");

  const printedAt = format(new Date(), "HH:mm dd/MM/yyyy", { locale: vi });

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Bill Đi Chợ – ${monthLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Arial", sans-serif;
      font-size: 12px;
      color: #111;
      background: #fff;
      padding: 24px;
      max-width: 600px;
      margin: auto;
    }
    .header {
      text-align: center;
      margin-bottom: 18px;
      border-bottom: 2px solid #111;
      padding-bottom: 14px;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header p {
      font-size: 13px;
      color: #444;
      margin-top: 4px;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 14px;
      font-size: 11px;
      color: #555;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    thead tr {
      background: #111;
      color: #fff;
    }
    thead th {
      padding: 7px 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    thead th.center { text-align: center; }
    thead th.right  { text-align: right; }
    tbody tr td {
      padding: 6px 8px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }
    tbody tr.even td { background: #f9fafb; }
    td.center { text-align: center; }
    td.right   { text-align: right; }
    td.amount  { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .footer {
      margin-top: 14px;
      border-top: 2px solid #111;
      padding-top: 10px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-row .label {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .total-row .value {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }
    .printed {
      margin-top: 14px;
      text-align: right;
      font-size: 10px;
      color: #999;
    }
    @media print {
      body { padding: 12px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛒 Bill Đi Chợ</h1>
    <p>${monthLabel}</p>
  </div>

  <div class="meta">
    <span>Số lượng: <strong>${expenses.length} khoản</strong></span>
    <span>In lúc: ${printedAt}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th class="center" style="width:36px">#</th>
        <th class="center" style="width:60px">Ngày</th>
        <th>Mô tả</th>
        <th class="right" style="width:130px">Số tiền</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="4" style="text-align:center;padding:16px;color:#888">Chưa có dữ liệu</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <div class="total-row">
      <span class="label">Tổng cộng</span>
      <span class="value">${formatVND(total)}</span>
    </div>
  </div>

  <p class="printed">Xuất từ ứng dụng Quản Lý Thu Chi</p>
</body>
</html>`;

  const win = window.open("", "_blank", "width=680,height=800");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 300);
}
