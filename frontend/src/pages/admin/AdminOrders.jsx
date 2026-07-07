import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Phone, RefreshCw, Printer, FileText, Trash2 } from "lucide-react";
import { useOrdersList } from "@/hooks/useOrdersList";
import { useLanguage } from "@/lib/language";
import {
  ORDER_STATUS,
  ORDER_STATUS_FILTER_OPTIONS,
  formatOrderDisplayId,
  getNextOrderStatuses,
  getOrderStatusLabel,
  getOrderStatusMeta,
  isTerminalOrderStatus,
  needsStaffAttention,
  normalizeOrderStatus,
  statusBadgeClass,
} from "@/lib/orders";
import { updateOrderStatus as persistOrderStatus, deleteOrder } from "@/lib/ordersService";

// ─── Print helpers ───────────────────────────────────────────────────────────

// ─── Print helpers ───────────────────────────────────────────────────────────

function numberToWordsFR(number) {
  const parts = Number(number).toFixed(3).split(".");
  const dinars = parseInt(parts[0], 10);
  const millimes = parseInt(parts[1], 10);

  function convertLessThanThousand(n) {
    if (n === 0) return "";
    const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
    const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
    const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

    let words = "";
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;

    if (hundreds > 0) {
      if (hundreds === 1) {
        words += "cent ";
      } else {
        words += units[hundreds] + " cent ";
      }
    }

    if (rest > 0) {
      if (rest < 10) {
        words += units[rest];
      } else if (rest < 20) {
        words += teens[rest - 10];
      } else {
        const ten = Math.floor(rest / 10);
        const unit = rest % 10;
        if (ten === 7) {
          words += "soixante-" + (unit === 1 ? "et-onze" : teens[unit]);
        } else if (ten === 9) {
          words += "quatre-vingt-" + teens[unit];
        } else {
          words += tens[ten];
          if (unit > 0) {
            words += (unit === 1 ? " et un" : "-" + units[unit]);
          }
        }
      }
    }
    return words.trim();
  }

  function convert(n) {
    if (n === 0) return "zéro";
    let words = "";
    const millions = Math.floor(n / 1000000);
    const thousands = Math.floor((n % 1000000) / 1000);
    const rest = n % 1000;

    if (millions > 0) {
      words += convertLessThanThousand(millions) + " million" + (millions > 1 ? "s" : "") + " ";
    }
    if (thousands > 0) {
      if (thousands === 1) {
        words += "mille ";
      } else {
        words += convertLessThanThousand(thousands) + " mille ";
      }
    }
    if (rest > 0) {
      words += convertLessThanThousand(rest);
    }
    return words.trim();
  }

  const dinarStr = convert(dinars) + " dinar" + (dinars > 1 ? "s" : "");
  const millimeStr = millimes > 0 ? " et " + convert(millimes) + " millime" + (millimes > 1 ? "s" : "") : "";

  const res = dinarStr + millimeStr;
  return res.charAt(0).toUpperCase() + res.slice(1);
}

function printDocument(htmlContent, title) {
  const win = window.open("", "_blank", "width=850,height=950");
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; padding: 30px; background: #fff; }
    
    .company-header {
      font-size: 10px;
      line-height: 1.4;
      margin-bottom: 20px;
    }
    .company-name {
      font-family: "Times New Roman", Times, serif;
      font-size: 18px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .company-desc {
      font-weight: bold;
      font-size: 11px;
    }
    
    .document-blocks {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      gap: 15px;
    }
    
    .left-block {
      width: 48%;
      border: 1px solid #000;
      border-radius: 10px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 120px;
    }
    
    .doc-banner {
      border: 1.5px solid #000;
      border-radius: 20px;
      padding: 6px 12px;
      font-size: 14px;
      font-weight: bold;
      font-style: italic;
      text-align: center;
      margin-bottom: 10px;
      background: #fff;
    }
    
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 5px;
    }
    .grid-table th {
      border: 1px solid #000;
      background: #fff;
      font-weight: bold;
      text-align: center;
      padding: 4px;
      font-size: 10px;
    }
    .grid-table td {
      border: 1px solid #000;
      text-align: center;
      padding: 6px 4px;
      font-size: 11px;
    }
    
    .empty-lines {
      border: 1px solid #000;
      height: 18px;
      margin-top: 4px;
    }
    
    .right-block {
      width: 50%;
      border: 1px solid #000;
      border-radius: 10px;
      padding: 12px;
      min-height: 120px;
      font-size: 11px;
      line-height: 1.6;
    }
    
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      font-size: 11px;
      padding: 0 5px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th {
      border: 1px solid #000;
      background: #f0f0f0;
      font-weight: bold;
      font-size: 11px;
      padding: 6px;
      text-align: center;
    }
    .items-table td {
      border: 1px solid #000;
      padding: 6px;
      font-size: 11px;
      height: 24px;
    }
    .items-table td.center {
      text-align: center;
    }
    .items-table td.right {
      text-align: right;
    }
    
    .bottom-section {
      display: flex;
      justify-content: space-between;
      gap: 15px;
      margin-top: 15px;
    }
    
    .bottom-left {
      width: 60%;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .tva-summary-table {
      width: 65%;
      border-collapse: collapse;
    }
    .tva-summary-table th {
      border: 1px solid #000;
      background: #fff;
      font-size: 10px;
      padding: 4px;
      text-align: center;
      font-weight: bold;
    }
    .tva-summary-table td {
      border: 1px solid #000;
      padding: 4px;
      text-align: center;
      font-size: 10px;
    }
    
    .amount-words-box {
      margin-top: 10px;
      font-size: 11px;
      line-height: 1.4;
    }
    .amount-words-title {
      font-weight: bold;
      margin-bottom: 4px;
    }
    .amount-words-content {
      font-weight: bold;
    }
    
    .bottom-right {
      width: 35%;
    }
    
    .totals-table {
      width: 100%;
      border-collapse: collapse;
    }
    .totals-table td {
      border: 1px solid #000;
      padding: 6px 8px;
      font-size: 11px;
      height: 24px;
    }
    .totals-table td.label {
      background: #f5f5f5;
      font-weight: bold;
      width: 60%;
    }
    .totals-table td.val {
      text-align: right;
      font-weight: bold;
      width: 40%;
    }
    
    .signatures-row {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      padding: 0 10px;
    }
    .signature-box {
      width: 45%;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .signature-title {
      font-weight: bold;
      font-size: 11px;
    }
    .signature-line {
      border-bottom: 1px solid #000;
      height: 48px;
    }
    
    .bottom-time {
      margin-top: 25px;
      text-align: right;
      font-size: 9px;
      color: #666;
    }
    @media print { body { padding: 15px; } }
  </style>
</head>
<body>
  ${htmlContent}
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`);
  win.document.close();
}

function buildBonLivraison(order) {
  const displayId = formatOrderDisplayId(order.id);
  const orderYear = new Date(order.createdAt).getFullYear().toString().slice(-2);
  const formattedDocNum = String(displayId).padStart(6, "0") + "/" + orderYear;

  const dateStr = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    year: "numeric", month: "2-digit", day: "2-digit"
  });

  const clientCode = order.customerId
    ? String(order.customerId).replace(/\D/g, "").slice(-7).padStart(7, "0")
    : ("411" + (order.phone ? String(order.phone).replace(/\D/g, "").slice(-4).padStart(4, "0") : "0000"));

  const sumTtc = (order.items ?? []).reduce((acc, item) => acc + (item.price ?? 0) * (item.quantity ?? 1), 0);
  const orderTotal = Number(order.total ?? 0);
  const isPriceTtc = Math.abs(orderTotal - sumTtc) < 1.0 || orderTotal === 0;

  let totalHtAccumulator = 0;
  let totalTvaAccumulator = 0;

  const rows = (order.items ?? []).map((item) => {
    const qty = item.quantity ?? 1;
    const rawPrice = Number(item.price ?? 0);

    let puHt, puTtc, totalHtva, mntTva, totalTtc;
    if (isPriceTtc) {
      puTtc = rawPrice;
      puHt = puTtc / 1.19;
      totalTtc = puTtc * qty;
      totalHtva = totalTtc / 1.19;
      mntTva = totalTtc - totalHtva;
    } else {
      puHt = rawPrice;
      puTtc = puHt * 1.19;
      totalHtva = puHt * qty;
      totalTtc = totalHtva * 1.19;
      mntTva = totalTtc - totalHtva;
    }

    totalHtAccumulator += totalHtva;
    totalTvaAccumulator += mntTva;

    const ref = item.sku ?? item.id ?? item.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 5) ?? "—";

    return `
    <tr>
      <td style="width: 10%">${ref}</td>
      <td style="width: 45%">${item.name ?? item.title ?? "—"}</td>
      <td class="center" style="width: 6%">${qty}</td>
      <td class="right" style="width: 10%">${puHt.toFixed(3)}</td>
      <td class="center" style="width: 6%"></td>
      <td class="right" style="width: 10%">${totalHtva.toFixed(3)}</td>
      <td class="center" style="width: 5%">19</td>
      <td class="right" style="width: 10%">${puTtc.toFixed(3)}</td>
      <td class="center" style="width: 5%"></td>
    </tr>`;
  }).join("");

  // Fill up to 10 rows for empty carbon paper styling
  const emptyRowsNeeded = Math.max(0, 8 - (order.items ?? []).length);
  let emptyRowsHtml = "";
  for (let i = 0; i < emptyRowsNeeded; i++) {
    emptyRowsHtml += `
    <tr>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
    </tr>`;
  }

  const finalTotalTtc = totalHtAccumulator + totalTvaAccumulator;
  const writtenAmount = numberToWordsFR(finalTotalTtc);
  const currentTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return `
  <div class="company-header">
    <div class="company-name">STE IBN SINA DE PAPIER</div>
    <div class="company-desc">Vente en Gros Papier et Fourniture de Bureaux</div>
    <div>Route de Monastir Zaouit Sousse</div>
    <div>Sousse 4081</div>
    <div>GSM 23.223.758 50.074.075 Tél Fax : 73.390.221</div>
    <div>RIB : 10 039 152 0004510 788 46</div>
    <div>MATRICULE FISCALE : 1269031/A/A/M/000 RC : B 019193997 2012</div>
  </div>

  <div class="document-blocks">
    <div class="left-block">
      <div class="doc-banner">BON DE LIVRAISON ${formattedDocNum}</div>
      <table class="grid-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Client</th>
            <th>Page</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${dateStr}</td>
            <td>${clientCode}</td>
            <td>1</td>
          </tr>
        </tbody>
      </table>
      <div class="empty-lines"></div>
      <div class="empty-lines"></div>
    </div>
    <div class="right-block">
      <div style="font-weight: bold; text-transform: uppercase;">${order.customerName ?? "—"}</div>
      <div style="margin-top: 4px;">${order.address ?? "—"}</div>
      <div style="margin-top: 4px;">Tél: ${order.phone ?? "—"}</div>
    </div>
  </div>

  <div class="meta-row">
    <div>Saisie Par &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OUMAYMA</div>
    <div>0,000</div>
    <div>Livré Par</div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Réf</th>
        <th>Désignation</th>
        <th>Qté</th>
        <th>P. U. HT</th>
        <th>Re</th>
        <th>Total HTVA</th>
        <th>TVA</th>
        <th>P.U.TTC</th>
        <th>PVP</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      ${emptyRowsHtml}
    </tbody>
  </table>

  <div class="bottom-section">
    <div class="bottom-left">
      <table class="tva-summary-table">
        <thead>
          <tr>
            <th>TVA %</th>
            <th>Assiettes</th>
            <th>Mnt TVA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>19</td>
            <td>${totalHtAccumulator.toFixed(3)}</td>
            <td>${totalTvaAccumulator.toFixed(3)}</td>
          </tr>
        </tbody>
      </table>
      <div class="amount-words-box">
        <div class="amount-words-title">Arrêté le présent Bon à la somme de:</div>
        <div class="amount-words-content">${writtenAmount} Millimes.</div>
      </div>
    </div>
    <div class="bottom-right">
      <table class="totals-table">
        <tr>
          <td class="label">Brut H.TAXES</td>
          <td class="val">${totalHtAccumulator.toFixed(3)}</td>
        </tr>
        <tr>
          <td class="label">&nbsp;</td>
          <td class="val">&nbsp;</td>
        </tr>
        <tr>
          <td class="label">Total H.TVA</td>
          <td class="val">${totalHtAccumulator.toFixed(3)}</td>
        </tr>
        <tr>
          <td class="label">Total TVA</td>
          <td class="val">${totalTvaAccumulator.toFixed(3)}</td>
        </tr>
        <tr>
          <td class="label">Timbre Fiscal</td>
          <td class="val"></td>
        </tr>
        <tr>
          <td class="label">Avance Impot 1%</td>
          <td class="val"></td>
        </tr>
        <tr>
          <td class="label">Total TTC</td>
          <td class="val">${finalTotalTtc.toFixed(3)}</td>
        </tr>
      </table>
    </div>
  </div>

  <div class="signatures-row">
    <div class="signature-box">
      <div class="signature-title">Signature du livreur</div>
      <div class="signature-line"></div>
    </div>
    <div class="signature-box" style="text-align: right;">
      <div class="signature-title" style="display: inline-block;">Signature du client (reçu conforme)</div>
      <div class="signature-line"></div>
    </div>
  </div>

  <div class="bottom-time">${currentTime}</div>`;
}

function buildFacture(order) {
  const displayId = formatOrderDisplayId(order.id);
  const orderYear = new Date(order.createdAt).getFullYear().toString().slice(-2);
  const formattedDocNum = String(displayId).padStart(6, "0") + "/" + orderYear;

  const dateStr = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    year: "numeric", month: "2-digit", day: "2-digit"
  });

  const clientCode = order.customerId
    ? String(order.customerId).replace(/\D/g, "").slice(-7).padStart(7, "0")
    : ("411" + (order.phone ? String(order.phone).replace(/\D/g, "").slice(-4).padStart(4, "0") : "0000"));

  const sumTtc = (order.items ?? []).reduce((acc, item) => acc + (item.price ?? 0) * (item.quantity ?? 1), 0);
  const orderTotal = Number(order.total ?? 0);
  const isPriceTtc = Math.abs(orderTotal - sumTtc) < 1.0 || orderTotal === 0;

  let totalHtAccumulator = 0;
  let totalTvaAccumulator = 0;

  const rows = (order.items ?? []).map((item) => {
    const qty = item.quantity ?? 1;
    const rawPrice = Number(item.price ?? 0);

    let puHt, puTtc, totalHtva, mntTva, totalTtc;
    if (isPriceTtc) {
      puTtc = rawPrice;
      puHt = puTtc / 1.19;
      totalTtc = puTtc * qty;
      totalHtva = totalTtc / 1.19;
      mntTva = totalTtc - totalHtva;
    } else {
      puHt = rawPrice;
      puTtc = puHt * 1.19;
      totalHtva = puHt * qty;
      totalTtc = totalHtva * 1.19;
      mntTva = totalTtc - totalHtva;
    }

    totalHtAccumulator += totalHtva;
    totalTvaAccumulator += mntTva;

    const ref = item.sku ?? item.id ?? item.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 5) ?? "—";

    return `
    <tr>
      <td style="width: 10%">${ref}</td>
      <td style="width: 45%">${item.name ?? item.title ?? "—"}</td>
      <td class="center" style="width: 6%">${qty}</td>
      <td class="right" style="width: 10%">${puHt.toFixed(3)}</td>
      <td class="center" style="width: 6%"></td>
      <td class="right" style="width: 10%">${totalHtva.toFixed(3)}</td>
      <td class="center" style="width: 5%">19</td>
      <td class="right" style="width: 10%">${puTtc.toFixed(3)}</td>
      <td class="center" style="width: 5%"></td>
    </tr>`;
  }).join("");

  // Fill up to 10 rows for empty carbon paper styling
  const emptyRowsNeeded = Math.max(0, 8 - (order.items ?? []).length);
  let emptyRowsHtml = "";
  for (let i = 0; i < emptyRowsNeeded; i++) {
    emptyRowsHtml += `
    <tr>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
    </tr>`;
  }

  // Invoice gets timbre fiscal (1.000 DT) in Tunisia
  const timbreFiscal = 1.000;
  const finalTotalTtc = totalHtAccumulator + totalTvaAccumulator + timbreFiscal;
  const writtenAmount = numberToWordsFR(finalTotalTtc);
  const currentTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return `
  <div class="company-header">
    <div class="company-name">STE IBN SINA DE PAPIER</div>
    <div class="company-desc">Vente en Gros Papier et Fourniture de Bureaux</div>
    <div>Route de Monastir Zaouit Sousse</div>
    <div>Sousse 4081</div>
    <div>GSM 23.223.758 50.074.075 Tél Fax : 73.390.221</div>
    <div>RIB : 10 039 152 0004510 788 46</div>
    <div>MATRICULE FISCALE : 1269031/A/A/M/000 RC : B 019193997 2012</div>
  </div>

  <div class="document-blocks">
    <div class="left-block">
      <div class="doc-banner">BL-FACTURE ${formattedDocNum}</div>
      <table class="grid-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Client</th>
            <th>Page</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${dateStr}</td>
            <td>${clientCode}</td>
            <td>1</td>
          </tr>
        </tbody>
      </table>
      <div class="empty-lines"></div>
      <div class="empty-lines"></div>
    </div>
    <div class="right-block">
      <div style="font-weight: bold; text-transform: uppercase;">${order.customerName ?? "—"}</div>
      <div style="margin-top: 4px;">${order.address ?? "—"}</div>
      <div style="margin-top: 4px;">Tél: ${order.phone ?? "—"}</div>
    </div>
  </div>

  <div class="meta-row">
    <div>Saisie Par &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OUMAYMA</div>
    <div>0,000</div>
    <div>Livré Par</div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Réf</th>
        <th>Désignation</th>
        <th>Qté</th>
        <th>P. U. HT</th>
        <th>Re</th>
        <th>Total HTVA</th>
        <th>TVA</th>
        <th>P.U.TTC</th>
        <th>PVP</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      ${emptyRowsHtml}
    </tbody>
  </table>

  <div class="bottom-section">
    <div class="bottom-left">
      <table class="tva-summary-table">
        <thead>
          <tr>
            <th>TVA %</th>
            <th>Assiettes</th>
            <th>Mnt TVA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>19</td>
            <td>${totalHtAccumulator.toFixed(3)}</td>
            <td>${totalTvaAccumulator.toFixed(3)}</td>
          </tr>
        </tbody>
      </table>
      <div class="amount-words-box">
        <div class="amount-words-title">Arrêtée la présente Facture à la somme de:</div>
        <div class="amount-words-content">${writtenAmount} Millimes.</div>
      </div>
    </div>
    <div class="bottom-right">
      <table class="totals-table">
        <tr>
          <td class="label">Brut H.TAXES</td>
          <td class="val">${totalHtAccumulator.toFixed(3)}</td>
        </tr>
        <tr>
          <td class="label">&nbsp;</td>
          <td class="val">&nbsp;</td>
        </tr>
        <tr>
          <td class="label">Total H.TVA</td>
          <td class="val">${totalHtAccumulator.toFixed(3)}</td>
        </tr>
        <tr>
          <td class="label">Total TVA</td>
          <td class="val">${totalTvaAccumulator.toFixed(3)}</td>
        </tr>
        <tr>
          <td class="label">Timbre Fiscal</td>
          <td class="val">${timbreFiscal.toFixed(3)}</td>
        </tr>
        <tr>
          <td class="label">Avance Impot 1%</td>
          <td class="val"></td>
        </tr>
        <tr>
          <td class="label">Total TTC</td>
          <td class="val">${finalTotalTtc.toFixed(3)}</td>
        </tr>
      </table>
    </div>
  </div>

  <div class="signatures-row">
    <div class="signature-box">
      <div class="signature-title">Signature du livreur</div>
      <div class="signature-line"></div>
    </div>
    <div class="signature-box" style="text-align: right;">
      <div class="signature-title" style="display: inline-block;">Cachet &amp; Signature</div>
      <div class="signature-line"></div>
    </div>
  </div>

  <div class="bottom-time">${currentTime}</div>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { orders, loading, refresh, updateOrders } = useOrdersList();
  const { t } = useLanguage();
  const statusFilter = searchParams.get("status") ?? "all";
  const yearFilter = searchParams.get("year") ?? "all";

  const availableYears = useMemo(() => {
    const years = new Set(orders.map((order) => new Date(order.createdAt).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    
    if (statusFilter !== "all") {
      result = result.filter((order) => normalizeOrderStatus(order.status) === statusFilter);
    }
    
    if (yearFilter !== "all") {
      result = result.filter((order) => new Date(order.createdAt).getFullYear() === Number(yearFilter));
    }
    
    return result;
  }, [orders, statusFilter, yearFilter]);

  const attentionCount = useMemo(
    () => orders.filter((order) => needsStaffAttention(order.status)).length,
    [orders],
  );

  const updateStatus = async (orderId, status) => {
    const nextOrders = await persistOrderStatus(orderId, status);
    updateOrders(nextOrders);
  };

  const handleDelete = async (orderId) => {
    if (!confirm(t("confirmDelete"))) {
      return;
    }
    const nextOrders = await deleteOrder(orderId);
    updateOrders(nextOrders);
  };

  const setFilter = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    setSearchParams(params);
  };

  const setYearFilter = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("year");
    } else {
      params.set("year", value);
    }
    setSearchParams(params);
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-academic-blue">
            {t("orderManagement")}
          </h1>
          <p className="mt-2 text-[16px] text-on-surface-variant">
            {t("orderManagementSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md border border-outline-variant bg-surface px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-academic-blue"
            onClick={refresh}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            {t("refresh")}
          </button>
          <span className="rounded-full bg-oxford-red px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-white">
            {attentionCount} {t("requiresActionBadge")}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${statusFilter === option.value
                ? "bg-academic-blue text-white"
                : "border border-outline-variant bg-surface text-on-surface-variant hover:border-academic-blue"
              }`}
            onClick={() => setFilter(option.value)}
            type="button"
          >
            {option.labelKey ? t(option.labelKey) : option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
          {t("year")}:
        </span>
        <button
          className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${yearFilter === "all"
              ? "bg-academic-blue text-white"
              : "border border-outline-variant bg-surface text-on-surface-variant hover:border-academic-blue"
            }`}
          onClick={() => setYearFilter("all")}
          type="button"
        >
          {t("allYears")}
        </button>
        {availableYears.map((year) => (
          <button
            key={year}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${yearFilter === String(year)
                ? "bg-academic-blue text-white"
                : "border border-outline-variant bg-surface text-on-surface-variant hover:border-academic-blue"
              }`}
            onClick={() => setYearFilter(String(year))}
            type="button"
          >
            {year}
          </button>
        ))}
      </div>

      <section className="mt-8 space-y-4">
        {loading ? (
          <p className="text-on-surface-variant">{t("loadingDashboard")}</p>
        ) : filteredOrders.length ? (
          filteredOrders.map((order) => {
            const normalizedStatus = normalizeOrderStatus(order.status);
            const meta = getOrderStatusMeta(normalizedStatus);
            const nextStatuses = getNextOrderStatuses(normalizedStatus);
            const terminal = isTerminalOrderStatus(normalizedStatus);
            const isGuest = !order.customerId;

            return (
              <article
                key={order.id}
                className="rounded-xl border border-outline-variant bg-surface p-5"
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-[16px] font-semibold text-academic-blue">
                        {t("orderTitle")} #{formatOrderDisplayId(order.id)}
                      </h2>
                      {isGuest && (
                        <span className="rounded-full bg-muted-gray px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface-variant">
                          {t("guest")}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-3 py-1 text-[12px] font-semibold ${statusBadgeClass(meta.tone)}`}
                      >
                        {getOrderStatusLabel(normalizedStatus, { t })}
                      </span>
                    </div>
                    <p className="mt-3 text-[14px] text-on-surface-variant">
                      {t("placedOn")} {new Date(order.createdAt).toLocaleString("fr-TN")}
                    </p>
                    {order.statusUpdatedAt && order.statusUpdatedAt !== order.createdAt && (
                      <p className="mt-1 text-[13px] text-on-surface-variant">
                        {t("statusUpdatedOn")} {new Date(order.statusUpdatedAt).toLocaleString("fr-TN")}
                      </p>
                    )}
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-[14px] text-on-surface-variant">
                      <span>
                        {order.customerName} · {order.phone}
                      </span>
                      {order.phone && (
                        <a
                          className="inline-flex items-center gap-1 rounded-md border border-outline-variant px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-academic-blue hover:border-academic-blue"
                          href={`tel:${order.phone}`}
                        >
                          <Phone className="h-3 w-3" />
                          {t("call")}
                        </a>
                      )}
                    </p>
                    <p className="mt-1 text-[14px] text-on-surface-variant">{order.address}</p>
                    {order.notes && (
                      <p className="mt-3 text-[14px] text-on-surface-variant">{t("note")}: {order.notes}</p>
                    )}
                    <ul className="mt-4 space-y-1 text-[14px] text-on-surface-variant">
                      {order.items?.map((item) => (
                        <li key={`${order.id}-${item.id}`} className="flex justify-between gap-4">
                          <span>{item.name}</span>
                          <span>x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>

                    {/* ── Print buttons ── */}
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-outline-variant pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          printDocument(
                            buildBonLivraison(order),
                            `Bon de livraison #${formatOrderDisplayId(order.id)}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-academic-blue hover:bg-surface-container hover:border-academic-blue transition-colors"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        {t("invoice")}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          printDocument(
                            buildFacture(order),
                            `Facture #${formatOrderDisplayId(order.id)}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-academic-blue hover:bg-surface-container hover:border-academic-blue transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {t("deliveryNote")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(order.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-oxford-red/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-oxford-red hover:bg-oxford-red/10 hover:border-oxford-red transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t("delete")}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4">
                    <p className="font-headline text-2xl font-bold text-academic-blue">
                      DT {Number(order.total ?? 0).toFixed(2)}
                    </p>
                    {terminal ? (
                      <p className="text-[13px] text-on-surface-variant">Aucune action requise.</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                          {t("setStatus")}
                        </p>
                        <div className="flex flex-col gap-2">
                          {nextStatuses.map((nextStatus) => {
                            const isPrimary =
                              nextStatus === ORDER_STATUS.APPROVED_NEED_DELIVERY ||
                              nextStatus === ORDER_STATUS.ON_DELIVERY ||
                              nextStatus === ORDER_STATUS.APPROVED_DELIVERED;
                            const isReject =
                              nextStatus === ORDER_STATUS.REJECTED ||
                              nextStatus === ORDER_STATUS.REJECTED_AFTER_DELIVERY ||
                              nextStatus === ORDER_STATUS.RETURNED_AFTER_DELIVERY;

                            return (
                              <button
                                key={nextStatus}
                                className={`rounded-md px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] ${isReject
                                    ? "border border-oxford-red/40 text-oxford-red"
                                    : isPrimary
                                      ? "bg-oxford-red text-white"
                                      : "border border-outline-variant text-academic-blue"
                                  }`}
                                onClick={() => updateStatus(order.id, nextStatus)}
                                type="button"
                              >
                                {getOrderStatusLabel(nextStatus, { t })}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <p className="text-on-surface-variant">
            {orders.length
              ? t("noProductsMatch")
              : t("cartEmpty")}
          </p>
        )}
      </section>
    </div>
  );
}
