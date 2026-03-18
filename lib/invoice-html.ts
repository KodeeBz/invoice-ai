interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceHtmlData {
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountType: string | null;
  discountValue: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  client: {
    name: string;
    email: string;
    company?: string | null;
    address?: string | null;
  };
  user: {
    name: string;
    businessName?: string | null;
    businessLogo?: string | null;
    address?: string | null;
    phone?: string | null;
    taxNumber?: string | null;
  };
  accentColor?: string;
}

function fmt(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function fmtDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderInvoiceHtml(data: InvoiceHtmlData): string {
  const accent = data.accentColor || "#2563EB";

  const lineItemRows = data.lineItems
    .map(
      (item, i) => `
    <tr${i % 2 === 1 ? ' style="background:#f8fafc"' : ""}>
      <td style="padding:10px 12px;font-size:13px;color:#1e293b">${escHtml(item.description)}</td>
      <td style="padding:10px 12px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;color:#475569">${item.quantity}</td>
      <td style="padding:10px 12px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;color:#475569">${fmt(item.unitPrice)}</td>
      <td style="padding:10px 12px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:#0f172a">${fmt(item.total)}</td>
    </tr>`
    )
    .join("");

  const statusBg =
    data.status === "PAID"
      ? "#dcfce7"
      : data.status === "OVERDUE"
        ? "#fee2e2"
        : "#f1f5f9";
  const statusColor =
    data.status === "PAID"
      ? "#16a34a"
      : data.status === "OVERDUE"
        ? "#dc2626"
        : "#64748b";

  const discountRow =
    data.discountAmount > 0
      ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px">
          <span style="color:#64748b">Discount${data.discountType === "percentage" ? ` (${data.discountValue}%)` : ""}</span>
          <span style="font-family:'JetBrains Mono',monospace;font-weight:500;color:#dc2626">-${fmt(data.discountAmount)}</span>
        </div>`
      : "";

  const taxRow =
    data.taxAmount > 0
      ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px">
          <span style="color:#64748b">Tax (${data.taxRate}%)</span>
          <span style="font-family:'JetBrains Mono',monospace;font-weight:500;color:#1e293b">${fmt(data.taxAmount)}</span>
        </div>`
      : "";

  const notesSection = data.notes
    ? `<div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:20px">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:8px">Notes / Payment Terms</div>
        <div style="font-size:12px;color:#64748b;line-height:1.7;white-space:pre-line">${escHtml(data.notes)}</div>
      </div>`
    : "";

  const logoHtml = data.user.businessLogo
    ? `<img src="${escHtml(data.user.businessLogo)}" alt="Logo" style="height:40px;margin-bottom:8px" />`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Inter',-apple-system,sans-serif; color:#1e293b; font-size:13px; line-height:1.5; }
table { width:100%; border-collapse:collapse; }
</style>
</head>
<body>
<div style="max-width:800px;margin:0 auto">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid ${accent};margin-bottom:24px">
    <div>
      ${logoHtml}
      <h1 style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:4px">${escHtml(data.user.businessName || data.user.name)}</h1>
      ${data.user.address ? `<p style="color:#64748b;font-size:12px;line-height:1.6">${escHtml(data.user.address)}</p>` : ""}
      ${data.user.phone ? `<p style="color:#64748b;font-size:12px">${escHtml(data.user.phone)}</p>` : ""}
      ${data.user.taxNumber ? `<p style="color:#64748b;font-size:12px">Tax #: ${escHtml(data.user.taxNumber)}</p>` : ""}
    </div>
    <div style="text-align:right">
      <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;color:${accent};letter-spacing:-0.5px">INVOICE</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:14px;color:#64748b;margin-top:4px">${escHtml(data.invoiceNumber)}</div>
      <div style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-top:6px;background:${statusBg};color:${statusColor}">${escHtml(data.status)}</div>
    </div>
  </div>

  <!-- Bill To + Dates -->
  <div style="display:flex;justify-content:space-between;margin-bottom:28px">
    <div>
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px">Bill To</div>
      <div style="font-size:14px;font-weight:500;color:#0f172a">${escHtml(data.client.name)}</div>
      ${data.client.company ? `<div style="color:#64748b;font-size:12px;margin-top:2px">${escHtml(data.client.company)}</div>` : ""}
      ${data.client.address ? `<div style="color:#64748b;font-size:12px;margin-top:2px">${escHtml(data.client.address)}</div>` : ""}
      <div style="color:#64748b;font-size:12px;margin-top:2px">${escHtml(data.client.email)}</div>
    </div>
    <div style="text-align:right">
      <div style="display:flex;justify-content:flex-end;gap:12px;margin-bottom:4px;font-size:12px">
        <span style="color:#94a3b8">Issue Date:</span>
        <span style="color:#334155;font-weight:500">${fmtDate(data.issueDate)}</span>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:12px;font-size:12px">
        <span style="color:#94a3b8">Due Date:</span>
        <span style="color:#334155;font-weight:500">${fmtDate(data.dueDate)}</span>
      </div>
    </div>
  </div>

  <!-- Line Items -->
  <table style="margin-bottom:24px">
    <thead>
      <tr>
        <th style="background:${accent}0D;padding:10px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#475569;border-bottom:1px solid #e2e8f0">Description</th>
        <th style="background:${accent}0D;padding:10px 12px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#475569;border-bottom:1px solid #e2e8f0">Qty</th>
        <th style="background:${accent}0D;padding:10px 12px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#475569;border-bottom:1px solid #e2e8f0">Unit Price</th>
        <th style="background:${accent}0D;padding:10px 12px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#475569;border-bottom:1px solid #e2e8f0">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:28px">
    <div style="width:280px">
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px">
        <span style="color:#64748b">Subtotal</span>
        <span style="font-family:'JetBrains Mono',monospace;font-weight:500;color:#1e293b">${fmt(data.subtotal)}</span>
      </div>
      ${discountRow}
      ${taxRow}
      <div style="display:flex;justify-content:space-between;border-top:2px solid #e2e8f0;margin-top:8px;padding-top:12px">
        <span style="font-size:16px;font-weight:700;color:#0f172a">Total</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:${accent}">${fmt(data.total)}</span>
      </div>
    </div>
  </div>

  ${notesSection}

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #f1f5f9;text-align:center;font-size:10px;color:#cbd5e1">
    Generated by InvoiceAI
  </div>

</div>
</body>
</html>`;
}
