import React from "react";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceTemplateProps {
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function InvoiceTemplate({
  invoiceNumber,
  status,
  issueDate,
  dueDate,
  lineItems,
  subtotal,
  taxRate,
  taxAmount,
  discountType,
  discountValue,
  discountAmount,
  total,
  notes,
  client,
  user,
  accentColor = "#2563EB",
}: InvoiceTemplateProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

              * { margin: 0; padding: 0; box-sizing: border-box; }

              body {
                font-family: 'Inter', -apple-system, sans-serif;
                color: #1e293b;
                font-size: 13px;
                line-height: 1.5;
              }

              .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 0;
              }

              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 24px;
                border-bottom: 2px solid ${accentColor};
                margin-bottom: 24px;
              }

              .business-info h1 {
                font-size: 20px;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 4px;
              }

              .business-info p {
                color: #64748b;
                font-size: 12px;
                line-height: 1.6;
              }

              .invoice-label {
                text-align: right;
              }

              .invoice-label .label {
                font-family: 'JetBrains Mono', monospace;
                font-size: 28px;
                font-weight: 700;
                color: ${accentColor};
                letter-spacing: -0.5px;
              }

              .invoice-label .number {
                font-family: 'JetBrains Mono', monospace;
                font-size: 14px;
                color: #64748b;
                margin-top: 4px;
              }

              .status-badge {
                display: inline-block;
                padding: 2px 10px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-top: 6px;
              }

              .meta-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 28px;
              }

              .meta-label {
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #94a3b8;
                margin-bottom: 6px;
              }

              .meta-value {
                font-size: 14px;
                font-weight: 500;
                color: #0f172a;
              }

              .meta-value p {
                color: #64748b;
                font-size: 12px;
                margin-top: 2px;
              }

              .dates-grid {
                text-align: right;
              }

              .dates-grid .date-row {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                margin-bottom: 4px;
                font-size: 12px;
              }

              .dates-grid .date-label { color: #94a3b8; }
              .dates-grid .date-value { color: #334155; font-weight: 500; }

              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 24px;
              }

              thead th {
                background: ${accentColor}0D;
                padding: 10px 12px;
                text-align: left;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #475569;
                border-bottom: 1px solid #e2e8f0;
              }

              thead th:nth-child(2),
              thead th:nth-child(3),
              thead th:nth-child(4) {
                text-align: right;
              }

              tbody tr { border-bottom: 1px solid #f1f5f9; }
              tbody tr:nth-child(even) { background: #f8fafc; }

              tbody td {
                padding: 10px 12px;
                font-size: 13px;
              }

              tbody td:first-child { color: #1e293b; }

              tbody td:nth-child(2),
              tbody td:nth-child(3),
              tbody td:nth-child(4) {
                text-align: right;
                font-family: 'JetBrains Mono', monospace;
                font-size: 12px;
                color: #475569;
              }

              tbody td:nth-child(4) {
                font-weight: 600;
                color: #0f172a;
              }

              .totals-section {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 28px;
              }

              .totals-table {
                width: 280px;
              }

              .totals-row {
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                font-size: 13px;
              }

              .totals-row .label { color: #64748b; }

              .totals-row .value {
                font-family: 'JetBrains Mono', monospace;
                font-weight: 500;
                color: #1e293b;
              }

              .totals-row.discount .value { color: #dc2626; }

              .totals-row.total {
                border-top: 2px solid #e2e8f0;
                margin-top: 8px;
                padding-top: 12px;
              }

              .totals-row.total .label {
                font-size: 16px;
                font-weight: 700;
                color: #0f172a;
              }

              .totals-row.total .value {
                font-size: 18px;
                font-weight: 700;
                color: ${accentColor};
              }

              .notes-section {
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
                margin-top: 20px;
              }

              .notes-section .notes-label {
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #94a3b8;
                margin-bottom: 8px;
              }

              .notes-section .notes-content {
                font-size: 12px;
                color: #64748b;
                line-height: 1.7;
                white-space: pre-line;
              }

              .footer {
                margin-top: 40px;
                padding-top: 16px;
                border-top: 1px solid #f1f5f9;
                text-align: center;
                font-size: 10px;
                color: #cbd5e1;
              }
            `,
          }}
        />
      </head>
      <body>
        <div className="invoice-container">
          {/* Header */}
          <div className="header">
            <div className="business-info">
              {user.businessLogo && (
                <img
                  src={user.businessLogo}
                  alt="Logo"
                  style={{ height: 40, marginBottom: 8 }}
                />
              )}
              <h1>{user.businessName || user.name}</h1>
              {user.address && <p>{user.address}</p>}
              {user.phone && <p>{user.phone}</p>}
              {user.taxNumber && <p>Tax #: {user.taxNumber}</p>}
            </div>
            <div className="invoice-label">
              <div className="label">INVOICE</div>
              <div className="number">{invoiceNumber}</div>
              <div
                className="status-badge"
                style={{
                  background:
                    status === "PAID"
                      ? "#dcfce7"
                      : status === "OVERDUE"
                        ? "#fee2e2"
                        : "#f1f5f9",
                  color:
                    status === "PAID"
                      ? "#16a34a"
                      : status === "OVERDUE"
                        ? "#dc2626"
                        : "#64748b",
                }}
              >
                {status}
              </div>
            </div>
          </div>

          {/* Bill To + Dates */}
          <div className="meta-section">
            <div>
              <div className="meta-label">Bill To</div>
              <div className="meta-value">
                {client.name}
                {client.company && <p>{client.company}</p>}
                {client.address && <p>{client.address}</p>}
                <p>{client.email}</p>
              </div>
            </div>
            <div className="dates-grid">
              <div className="date-row">
                <span className="date-label">Issue Date:</span>
                <span className="date-value">{formatDate(issueDate)}</span>
              </div>
              <div className="date-row">
                <span className="date-label">Due Date:</span>
                <span className="date-value">{formatDate(dueDate)}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={i}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="totals-section">
            <div className="totals-table">
              <div className="totals-row">
                <span className="label">Subtotal</span>
                <span className="value">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="totals-row discount">
                  <span className="label">
                    Discount
                    {discountType === "percentage"
                      ? ` (${discountValue}%)`
                      : ""}
                  </span>
                  <span className="value">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="totals-row">
                  <span className="label">Tax ({taxRate}%)</span>
                  <span className="value">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="totals-row total">
                <span className="label">Total</span>
                <span className="value">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="notes-section">
              <div className="notes-label">Notes / Payment Terms</div>
              <div className="notes-content">{notes}</div>
            </div>
          )}

          {/* Footer */}
          <div className="footer">Generated by InvoiceAI</div>
        </div>
      </body>
    </html>
  );
}
