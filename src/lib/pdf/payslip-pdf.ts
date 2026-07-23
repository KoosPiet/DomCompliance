/**
 * Render a professional monthly payslip to PDF (pdf-lib). Deterministic output
 * (fixed metadata date) so re-rendering the stored payslip yields identical
 * bytes — the vault document's size/checksum stay valid without storing a blob.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatZar } from "@/domain/money";

export interface PayslipPdfInput {
  payslipNumber: string;
  generatedAtIso: string;
  employer: { name: string; address?: string | null; uifReference?: string | null };
  employee: {
    fullName: string;
    idOrPassport?: string | null;
    occupation: string;
    bankName?: string | null;
    bankAccountMasked?: string | null;
  };
  period: { label: string; payDateLabel: string; rangeLabel: string };
  earnings: {
    basicSalary: number;
    overtime: number;
    allowances: number;
    bonuses: number;
    otherEarnings: number;
    gross: number;
  };
  deductions: { uifEmployee: number; paye: number; otherDeductions: number; total: number };
  uifEmployer: number;
  netPay: number;
  notes?: string | null;
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 56;
const INK = rgb(0.13, 0.15, 0.2);
const MUTED = rgb(0.42, 0.45, 0.5);
const ACCENT = rgb(0.15, 0.39, 0.92);
const RULE = rgb(0.85, 0.87, 0.9);
const PANEL = rgb(0.96, 0.97, 0.99);

export async function renderPayslipPdf(input: PayslipPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const fixedDate = new Date(input.generatedAtIso);
  doc.setTitle(`Payslip ${input.payslipNumber}`);
  doc.setAuthor("LabourMate");
  doc.setProducer("LabourMate");
  doc.setCreator("LabourMate");
  doc.setCreationDate(fixedDate);
  doc.setModificationDate(fixedDate);

  const page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const drawText = (
    value: string,
    x: number,
    size: number,
    f: PDFFont = font,
    color = INK,
  ) => page.drawText(value, { x, y: y - size, size, font: f, color });

  const right = (value: string, xRight: number, size: number, f: PDFFont = font, color = INK) =>
    page.drawText(value, {
      x: xRight - f.widthOfTextAtSize(value, size),
      y: y - size,
      size,
      font: f,
      color,
    });

  // ---- Header ----
  drawText("PAYSLIP", MARGIN, 22, bold);
  right(input.employer.name, PAGE_W - MARGIN, 12, bold);
  y -= 20;
  if (input.employer.address) {
    right(input.employer.address, PAGE_W - MARGIN, 9, font, MUTED);
    y -= 12;
  }
  if (input.employer.uifReference) {
    right(`UIF ref: ${input.employer.uifReference}`, PAGE_W - MARGIN, 9, font, MUTED);
    y -= 12;
  }
  y -= 6;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: RULE });
  y -= 20;

  // ---- Meta panel (employee + period) ----
  const panelH = 74;
  page.drawRectangle({
    x: MARGIN,
    y: y - panelH,
    width: PAGE_W - MARGIN * 2,
    height: panelH,
    color: PANEL,
  });
  const leftX = MARGIN + 14;
  const rightX = PAGE_W / 2 + 6;
  const rowY = (i: number) => y - 16 - i * 15;
  const cell = (label: string, value: string, x: number, i: number) => {
    page.drawText(label, { x, y: rowY(i), size: 8.5, font, color: MUTED });
    page.drawText(value, { x: x + 78, y: rowY(i), size: 9.5, font: bold, color: INK });
  };
  cell("Employee", input.employee.fullName, leftX, 0);
  cell("Occupation", input.employee.occupation, leftX, 1);
  cell("ID / Passport", input.employee.idOrPassport ?? "—", leftX, 2);
  cell("Pay period", input.period.label, rightX, 0);
  cell("Pay date", input.period.payDateLabel, rightX, 1);
  cell("Payslip no.", input.payslipNumber, rightX, 2);
  y -= panelH + 24;

  // ---- Earnings / deductions columns ----
  const colGap = 24;
  const colW = (PAGE_W - MARGIN * 2 - colGap) / 2;
  const leftCol = MARGIN;
  const rightCol = MARGIN + colW + colGap;
  const startY = y;

  const columnHeader = (title: string, x: number) => {
    page.drawText(title.toUpperCase(), { x, y: startY - 10, size: 9, font: bold, color: ACCENT });
    page.drawLine({
      start: { x, y: startY - 16 },
      end: { x: x + colW, y: startY - 16 },
      thickness: 0.75,
      color: RULE,
    });
  };
  columnHeader("Earnings", leftCol);
  columnHeader("Deductions", rightCol);

  const line = (x: number, i: number, label: string, amount: number, opts?: { bold?: boolean; hide0?: boolean }) => {
    if (opts?.hide0 && amount === 0) return i;
    const ly = startY - 32 - i * 16;
    const f = opts?.bold ? bold : font;
    page.drawText(label, { x, y: ly, size: 9.5, font: f, color: INK });
    const amt = formatZar(amount);
    page.drawText(amt, { x: x + colW - f.widthOfTextAtSize(amt, 9.5), y: ly, size: 9.5, font: f, color: INK });
    return i + 1;
  };

  let li = 0;
  li = line(leftCol, li, "Basic salary", input.earnings.basicSalary);
  li = line(leftCol, li, "Overtime", input.earnings.overtime, { hide0: true });
  li = line(leftCol, li, "Allowances", input.earnings.allowances, { hide0: true });
  li = line(leftCol, li, "Bonuses", input.earnings.bonuses, { hide0: true });
  li = line(leftCol, li, "Other earnings", input.earnings.otherEarnings, { hide0: true });

  let ri = 0;
  ri = line(rightCol, ri, "UIF (1%)", input.deductions.uifEmployee);
  ri = line(rightCol, ri, "PAYE", input.deductions.paye, { hide0: true });
  ri = line(rightCol, ri, "Other deductions", input.deductions.otherDeductions, { hide0: true });

  const rows = Math.max(li, ri);
  const totalsY = startY - 32 - rows * 16 - 6;
  page.drawLine({ start: { x: leftCol, y: totalsY + 12 }, end: { x: leftCol + colW, y: totalsY + 12 }, thickness: 0.75, color: RULE });
  page.drawLine({ start: { x: rightCol, y: totalsY + 12 }, end: { x: rightCol + colW, y: totalsY + 12 }, thickness: 0.75, color: RULE });

  const totalRow = (x: number, label: string, amount: number) => {
    page.drawText(label, { x, y: totalsY, size: 10, font: bold, color: INK });
    const amt = formatZar(amount);
    page.drawText(amt, { x: x + colW - bold.widthOfTextAtSize(amt, 10), y: totalsY, size: 10, font: bold, color: INK });
  };
  totalRow(leftCol, "Gross earnings", input.earnings.gross);
  totalRow(rightCol, "Total deductions", input.deductions.total);

  y = totalsY - 30;

  // ---- Net pay banner ----
  const bannerH = 42;
  page.drawRectangle({ x: MARGIN, y: y - bannerH, width: PAGE_W - MARGIN * 2, height: bannerH, color: rgb(0.12, 0.16, 0.28) });
  page.drawText("NET PAY", { x: MARGIN + 16, y: y - 26, size: 11, font: bold, color: rgb(1, 1, 1) });
  const net = formatZar(input.netPay);
  page.drawText(net, {
    x: PAGE_W - MARGIN - 16 - bold.widthOfTextAtSize(net, 16),
    y: y - 28,
    size: 16,
    font: bold,
    color: rgb(1, 1, 1),
  });
  y -= bannerH + 22;

  // ---- Employer UIF + banking + notes ----
  page.drawText(
    `Employer UIF contribution (paid by employer, not deducted): ${formatZar(input.uifEmployer)}`,
    { x: MARGIN, y: y - 9, size: 9, font, color: MUTED },
  );
  y -= 16;
  if (input.employee.bankName || input.employee.bankAccountMasked) {
    page.drawText(
      `Paid to: ${[input.employee.bankName, input.employee.bankAccountMasked].filter(Boolean).join("  ")}`,
      { x: MARGIN, y: y - 9, size: 9, font, color: MUTED },
    );
    y -= 16;
  }
  if (input.notes) {
    y -= 6;
    page.drawText("Notes", { x: MARGIN, y: y - 9, size: 9, font: bold, color: INK });
    y -= 14;
    for (const wrapped of wrapText(input.notes, font, 9, PAGE_W - MARGIN * 2)) {
      page.drawText(wrapped, { x: MARGIN, y: y - 9, size: 9, font, color: MUTED });
      y -= 13;
    }
  }

  // ---- Footer ----
  page.drawText(`LabourMate · Payslip ${input.payslipNumber}`, { x: MARGIN, y: 40, size: 8, font, color: MUTED });
  const disclaimer = "This payslip complies with BCEA s33.";
  page.drawText(disclaimer, { x: PAGE_W - MARGIN - font.widthOfTextAtSize(disclaimer, 8), y: 40, size: 8, font, color: MUTED });

  return doc.save();
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}
