import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "re_placeholder");
}

interface SendInvoiceEmailParams {
  to: string;
  cc?: string;
  invoiceNumber: string;
  businessName: string;
  businessLogo?: string | null;
  clientName: string;
  total: number;
  dueDate: string;
  pdfUrl: string;
  publicViewUrl?: string;
  personalMessage?: string;
  lineItems: { description: string; quantity: number; total: number }[];
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

function escHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendInvoiceEmail(params: SendInvoiceEmailParams) {
  const {
    to,
    cc,
    invoiceNumber,
    businessName,
    businessLogo,
    clientName,
    total,
    dueDate,
    pdfUrl,
    publicViewUrl,
    personalMessage,
    lineItems,
  } = params;

  const fromEmail = process.env.RESEND_FROM_EMAIL || "invoices@invoiceai.com";

  const lineItemRows = lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155">${escHtml(item.description)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;text-align:center">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;text-align:right;font-weight:500">${formatCurrency(item.total)}</td>
      </tr>`
    )
    .join("");

  const logoHtml = businessLogo
    ? `<img src="${escHtml(businessLogo)}" alt="${escHtml(businessName)}" style="height:36px;margin-bottom:16px" />`
    : "";

  const personalMessageHtml = personalMessage
    ? `<div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;font-size:14px;color:#475569;line-height:1.6">${escHtml(personalMessage)}</div>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">

      <!-- Header -->
      <div style="background:#2563EB;padding:24px 32px;text-align:center">
        ${logoHtml}
        <h1 style="color:#ffffff;font-size:18px;font-weight:600;margin:0">${escHtml(businessName)}</h1>
      </div>

      <!-- Body -->
      <div style="padding:32px">
        <p style="font-size:15px;color:#1e293b;margin:0 0 8px">Hi ${escHtml(clientName)},</p>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.6">
          Please find your invoice <strong>${escHtml(invoiceNumber)}</strong> attached below.
          The total amount of <strong>${formatCurrency(total)}</strong> is due by <strong>${formatDate(dueDate)}</strong>.
        </p>

        ${personalMessageHtml}

        <!-- Invoice Summary -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <thead>
            <tr>
              <th style="padding:8px 12px;background:#f8fafc;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;border-bottom:1px solid #e2e8f0">Description</th>
              <th style="padding:8px 12px;background:#f8fafc;text-align:center;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;border-bottom:1px solid #e2e8f0">Qty</th>
              <th style="padding:8px 12px;background:#f8fafc;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;border-bottom:1px solid #e2e8f0">Total</th>
            </tr>
          </thead>
          <tbody>${lineItemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:12px;text-align:right;font-size:14px;font-weight:600;color:#0f172a">Total Due</td>
              <td style="padding:12px;text-align:right;font-size:16px;font-weight:700;color:#2563EB">${formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Download Button -->
        <div style="text-align:center;margin-bottom:24px">
          <a href="${escHtml(pdfUrl)}" style="display:inline-block;background:#2563EB;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
            Download Invoice PDF
          </a>
        </div>

        ${publicViewUrl
          ? `<div style="text-align:center;margin-bottom:24px">
          <a href="${escHtml(publicViewUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
            View Invoice Online
          </a>
        </div>`
          : ""}

        <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.6;text-align:center">
          If you have any questions about this invoice, please don't hesitate to reach out.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0">
        <p style="font-size:11px;color:#94a3b8;margin:0">
          Sent via InvoiceAI &middot; ${escHtml(businessName)}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const emailParams: {
    from: string;
    to: string[];
    cc?: string[];
    subject: string;
    html: string;
  } = {
    from: `${businessName} <${fromEmail}>`,
    to: [to],
    subject: `Invoice ${invoiceNumber} from ${businessName}`,
    html,
  };

  if (cc) {
    emailParams.cc = [cc];
  }

  const result = await getResend().emails.send(emailParams);
  return result;
}

interface SendProposalEmailParams {
  to: string;
  cc?: string;
  proposalNumber: string;
  title: string;
  businessName: string;
  businessLogo?: string | null;
  clientName: string;
  total: number;
  validUntil: string;
  pdfUrl: string;
  publicViewUrl?: string;
  personalMessage?: string;
}

export async function sendProposalEmail(params: SendProposalEmailParams) {
  const {
    to,
    cc,
    proposalNumber,
    title,
    businessName,
    businessLogo,
    clientName,
    total,
    validUntil,
    pdfUrl,
    publicViewUrl,
    personalMessage,
  } = params;

  const fromEmail = process.env.RESEND_FROM_EMAIL || "invoices@invoiceai.com";

  const logoHtml = businessLogo
    ? `<img src="${escHtml(businessLogo)}" alt="${escHtml(businessName)}" style="height:36px;margin-bottom:16px" />`
    : "";

  const personalMessageHtml = personalMessage
    ? `<div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;font-size:14px;color:#475569;line-height:1.6">${escHtml(personalMessage)}</div>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">

      <!-- Header -->
      <div style="background:#2563EB;padding:24px 32px;text-align:center">
        ${logoHtml}
        <h1 style="color:#ffffff;font-size:18px;font-weight:600;margin:0">${escHtml(businessName)}</h1>
      </div>

      <!-- Body -->
      <div style="padding:32px">
        <p style="font-size:15px;color:#1e293b;margin:0 0 8px">Hi ${escHtml(clientName)},</p>
        <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.6">
          Please find your proposal <strong>${escHtml(proposalNumber)}</strong> for
          <strong>${escHtml(title)}</strong> attached below.
          The proposed investment is <strong>${formatCurrency(total)}</strong>,
          valid until <strong>${formatDate(validUntil)}</strong>.
        </p>

        ${personalMessageHtml}

        <!-- Download Button -->
        <div style="text-align:center;margin-bottom:24px">
          <a href="${escHtml(pdfUrl)}" style="display:inline-block;background:#2563EB;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
            Download Proposal PDF
          </a>
        </div>

        ${publicViewUrl
          ? `<div style="text-align:center;margin-bottom:24px">
          <a href="${escHtml(publicViewUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
            View Proposal Online
          </a>
        </div>`
          : ""}

        <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.6;text-align:center">
          If you have any questions about this proposal, please don't hesitate to reach out.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0">
        <p style="font-size:11px;color:#94a3b8;margin:0">
          Sent via InvoiceAI &middot; ${escHtml(businessName)}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const emailParams: {
    from: string;
    to: string[];
    cc?: string[];
    subject: string;
    html: string;
  } = {
    from: `${businessName} <${fromEmail}>`,
    to: [to],
    subject: `Proposal: ${title} from ${businessName}`,
    html,
  };

  if (cc) {
    emailParams.cc = [cc];
  }

  const result = await getResend().emails.send(emailParams);
  return result;
}
