/**
 * Render a South African domestic-worker employment contract to a PDF using
 * pdf-lib. The output is deterministic (fixed metadata dates) so re-rendering
 * the same stored terms + signatures yields byte-identical bytes — which keeps
 * the vault document's checksum valid without persisting the file.
 */

import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import type { ContractTerms } from "@/domain/contract/terms";

export interface ContractSignature {
  name: string;
  signedAtIso: string;
  dataUrl?: string | null;
}

export interface ContractPdfInput {
  terms: ContractTerms;
  contractNumber: string;
  generatedAtIso: string;
  signatures?: {
    employer?: ContractSignature | null;
    employee?: ContractSignature | null;
  };
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = 70;

const INK = rgb(0.13, 0.15, 0.2);
const MUTED = rgb(0.42, 0.45, 0.5);
const ACCENT = rgb(0.15, 0.39, 0.92);
const RULE = rgb(0.85, 0.87, 0.9);

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
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
    lines.push(line);
  }
  return lines;
}

export async function renderContractPdf(input: ContractPdfInput): Promise<Uint8Array> {
  const { terms, contractNumber } = input;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const fixedDate = new Date(input.generatedAtIso);
  doc.setTitle(`Employment Contract ${contractNumber}`);
  doc.setAuthor("LabourMate");
  doc.setSubject("South African Domestic Worker Employment Contract");
  doc.setProducer("LabourMate");
  doc.setCreator("LabourMate");
  doc.setCreationDate(fixedDate);
  doc.setModificationDate(fixedDate);

  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  };
  const ensure = (needed: number) => {
    if (y - needed < BOTTOM) newPage();
  };

  const text = (
    value: string,
    opts: { font?: PDFFont; size?: number; color?: typeof INK; x?: number; lineHeight?: number; maxWidth?: number } = {},
  ) => {
    const f = opts.font ?? font;
    const size = opts.size ?? 10.5;
    const x = opts.x ?? MARGIN;
    const lineHeight = opts.lineHeight ?? size * 1.45;
    const maxWidth = opts.maxWidth ?? CONTENT_W - (x - MARGIN);
    for (const line of wrap(value, f, size, maxWidth)) {
      ensure(lineHeight);
      page.drawText(line, { x, y: y - size, size, font: f, color: opts.color ?? INK });
      y -= lineHeight;
    }
  };

  const gap = (h: number) => {
    y -= h;
  };

  // ---- Header ----
  text("EMPLOYMENT CONTRACT", { font: bold, size: 20 });
  gap(2);
  text("Domestic Worker · Republic of South Africa", { color: MUTED, size: 10 });
  gap(10);
  ensure(1);
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: RULE });
  gap(14);

  page.drawText(`Contract no. ${contractNumber}`, { x: MARGIN, y: y - 9, size: 9, font: bold, color: ACCENT });
  page.drawText(
    `Generated ${fixedDate.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}`,
    { x: PAGE_W - MARGIN - font.widthOfTextAtSize("Generated 00 September 0000", 9), y: y - 9, size: 9, font, color: MUTED },
  );
  gap(24);

  // ---- Parties ----
  const partyBlock = (label: string, lines: string[]) => {
    text(label, { font: bold, size: 9, color: MUTED });
    gap(2);
    for (const line of lines) text(line, { size: 10.5 });
    gap(8);
  };
  partyBlock("EMPLOYER", [
    terms.employer.name,
    terms.employer.address ?? "",
    [terms.employer.phone, terms.employer.email].filter(Boolean).join("  ·  "),
  ].filter(Boolean));
  partyBlock("EMPLOYEE", [
    terms.employee.fullName,
    terms.employee.idOrPassport ? `ID / Passport / Work Permit: ${terms.employee.idOrPassport}` : "",
    terms.employee.address ?? "",
    `Position: ${terms.employee.occupationLabel}`,
  ].filter(Boolean));

  gap(6);

  // ---- Clauses ----
  for (const clause of terms.clauses) {
    ensure(30);
    text(`${clause.number}.  ${clause.heading}`, { font: bold, size: 11.5 });
    gap(3);
    for (const para of clause.body) {
      text(para, { size: 10.5, color: INK });
      gap(3);
    }
    gap(7);
  }

  // ---- Signatures ----
  gap(6);
  ensure(150);
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: RULE });
  gap(16);
  text("Signatures", { font: bold, size: 12 });
  gap(14);

  const colW = (CONTENT_W - 30) / 2;
  const signatureColumn = async (x: number, role: string, party: { name: string } | undefined, sig?: ContractSignature | null) => {
    const topY = y;
    // Signature image or ruled line
    if (sig?.dataUrl && sig.dataUrl.startsWith("data:image")) {
      try {
        const base64 = sig.dataUrl.split(",")[1] ?? "";
        const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
        const png = await doc.embedPng(bytes);
        const h = 40;
        const w = Math.min((png.width / png.height) * h, colW);
        page.drawImage(png, { x, y: topY - h, width: w, height: h });
      } catch {
        /* fall back to a line below */
      }
    }
    page.drawLine({ start: { x, y: topY - 46 }, end: { x: x + colW, y: topY - 46 }, thickness: 0.75, color: INK });
    page.drawText(role, { x, y: topY - 60, size: 9, font: bold, color: MUTED });
    page.drawText(sig?.name ?? party?.name ?? "", { x, y: topY - 74, size: 10.5, font, color: INK });
    if (sig?.signedAtIso) {
      const d = new Date(sig.signedAtIso).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
      page.drawText(`Signed: ${d}`, { x, y: topY - 88, size: 9, font, color: MUTED });
    } else {
      page.drawText("Date: ____________________", { x, y: topY - 88, size: 9, font, color: MUTED });
    }
  };

  await signatureColumn(MARGIN, "Employer", terms.employer, input.signatures?.employer);
  await signatureColumn(MARGIN + colW + 30, "Employee", { name: terms.employee.fullName }, input.signatures?.employee);
  y -= 100;

  // ---- Footers (page x of n) ----
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(`LabourMate · Contract ${contractNumber}`, { x: MARGIN, y: 40, size: 8, font, color: MUTED });
    const label = `Page ${i + 1} of ${pages.length}`;
    p.drawText(label, { x: PAGE_W - MARGIN - font.widthOfTextAtSize(label, 8), y: 40, size: 8, font, color: MUTED });
  });

  return doc.save();
}
