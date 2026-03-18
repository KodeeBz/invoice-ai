interface ProposalSection {
  title: string;
  content: string;
}

interface ProposalHtmlData {
  proposalNumber: string;
  status: string;
  title: string;
  validUntil: string;
  sections: ProposalSection[];
  total: number;
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

function markdownToHtml(text: string): string {
  return text
    .split("\n\n")
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return "";
      // Handle bullet lists
      if (trimmed.match(/^[-*]\s/m)) {
        const items = trimmed
          .split(/\n/)
          .map((line) =>
            `<li style="margin-bottom:4px">${escHtml(line.replace(/^[-*]\s+/, ""))}</li>`
          )
          .join("");
        return `<ul style="margin:0 0 12px 16px;padding:0;list-style:disc">${items}</ul>`;
      }
      return `<p style="margin:0 0 12px 0;line-height:1.7">${escHtml(trimmed)}</p>`;
    })
    .join("");
}

export function renderProposalHtml(data: ProposalHtmlData): string {
  const accent = data.accentColor || "#2563EB";

  const sectionsHtml = data.sections
    .map(
      (section) => `
    <div style="margin-bottom:28px">
      <h2 style="font-size:16px;font-weight:600;color:${accent};margin:0 0 12px 0;padding-bottom:8px;border-bottom:1px solid #e2e8f0">
        ${escHtml(section.title)}
      </h2>
      <div style="font-size:13px;color:#334155;line-height:1.7">
        ${markdownToHtml(section.content)}
      </div>
    </div>`
    )
    .join("");

  const statusBg =
    data.status === "ACCEPTED"
      ? "#dcfce7"
      : data.status === "REJECTED"
        ? "#fee2e2"
        : "#f1f5f9";
  const statusColor =
    data.status === "ACCEPTED"
      ? "#16a34a"
      : data.status === "REJECTED"
        ? "#dc2626"
        : "#64748b";

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
    </div>
    <div style="text-align:right">
      <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;color:${accent};letter-spacing:-0.5px">PROPOSAL</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:14px;color:#64748b;margin-top:4px">${escHtml(data.proposalNumber)}</div>
      <div style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-top:6px;background:${statusBg};color:${statusColor}">${escHtml(data.status)}</div>
    </div>
  </div>

  <!-- Title -->
  <h1 style="font-size:24px;font-weight:700;color:#0f172a;margin-bottom:24px;line-height:1.3">${escHtml(data.title)}</h1>

  <!-- Prepared For + Dates -->
  <div style="display:flex;justify-content:space-between;margin-bottom:28px;background:#f8fafc;border-radius:8px;padding:16px 20px">
    <div>
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px">Prepared For</div>
      <div style="font-size:14px;font-weight:500;color:#0f172a">${escHtml(data.client.name)}</div>
      ${data.client.company ? `<div style="color:#64748b;font-size:12px;margin-top:2px">${escHtml(data.client.company)}</div>` : ""}
      <div style="color:#64748b;font-size:12px;margin-top:2px">${escHtml(data.client.email)}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;margin-bottom:4px">
        <span style="color:#94a3b8">Valid Until: </span>
        <span style="color:#334155;font-weight:500">${fmtDate(data.validUntil)}</span>
      </div>
      <div style="font-size:12px">
        <span style="color:#94a3b8">Total: </span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:${accent}">${fmt(data.total)}</span>
      </div>
    </div>
  </div>

  <!-- Sections -->
  ${sectionsHtml}

  <!-- Total -->
  <div style="background:${accent};border-radius:8px;padding:20px;text-align:center;margin-bottom:28px">
    <div style="font-size:12px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Project Total</div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;color:#ffffff">${fmt(data.total)}</div>
  </div>

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #f1f5f9;text-align:center;font-size:10px;color:#cbd5e1">
    Generated by InvoiceAI
  </div>

</div>
</body>
</html>`;
}
