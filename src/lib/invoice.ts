import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PLANS } from "./subscription";
import type { SubscriptionPlan } from "@/types";

export interface InvoiceData {
  invoiceNumber: string;
  paymentReference: string;
  storeName: string;
  storeEmail: string;
  plan: SubscriptionPlan;
  amount: number; // in kobo
  currency: string;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
}

/**
 * Generate a branded PDF invoice for a subscription payment.
 * Returns the raw PDF bytes — caller decides how to serve/store.
 */
export async function generateInvoicePDF(invoice: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const purple = rgb(0.66, 0.33, 0.97);
  const dark = rgb(0.06, 0.06, 0.09);
  const muted = rgb(0.58, 0.64, 0.72);
  const green = rgb(0.06, 0.73, 0.51);
  const lightGray = rgb(0.95, 0.96, 0.97);

  let y = 750;

  // Header bar
  page.drawRectangle({
    x: 40, y: y - 10, width: 515, height: 50,
    color: rgb(0.08, 0.08, 0.12),
  });

  // Brand name
  page.drawText("stallHq", {
    x: 56, y: y + 8, size: 20, font: bold, color: purple,
  });

  // INVOICE label
  page.drawText("INVOICE", {
    x: 440, y: y + 10, size: 14, font: bold, color: rgb(1, 1, 1),
  });

  y -= 60;

  // Invoice details (left)
  page.drawText("Invoice Number:", { x: 56, y, size: 9, font, color: muted });
  page.drawText(invoice.invoiceNumber, { x: 160, y, size: 10, font: bold, color: dark });
  y -= 18;
  page.drawText("Payment Reference:", { x: 56, y, size: 9, font, color: muted });
  page.drawText(invoice.paymentReference, { x: 160, y, size: 10, font: bold, color: dark });
  y -= 18;
  page.drawText("Date Paid:", { x: 56, y, size: 9, font, color: muted });
  page.drawText(formatDate(invoice.paidAt), { x: 160, y, size: 10, font, color: dark });

  // Status badge (right)
  page.drawRectangle({
    x: 420, y: y + 2, width: 60, height: 20,
    color: green,
  });
  page.drawText("PAID", {
    x: 433, y: y + 7, size: 10, font: bold, color: rgb(1, 1, 1),
  });

  y -= 50;

  // From / To section
  page.drawText("From", { x: 56, y, size: 9, font: bold, color: muted });
  page.drawText("To", { x: 320, y, size: 9, font: bold, color: muted });
  y -= 16;
  page.drawText("stallHq", { x: 56, y, size: 11, font: bold, color: dark });
  page.drawText(invoice.storeName, { x: 320, y, size: 11, font: bold, color: dark });
  y -= 15;
  page.drawText("hqlink.vercel.app", { x: 56, y, size: 9, font, color: muted });
  if (invoice.storeEmail) {
    page.drawText(invoice.storeEmail, { x: 320, y, size: 9, font, color: muted });
  }
  y -= 15;
  page.drawText("Lagos, Nigeria", { x: 56, y, size: 9, font, color: muted });

  y -= 40;

  // Table header
  page.drawRectangle({
    x: 40, y: y - 4, width: 515, height: 24,
    color: lightGray,
  });
  page.drawText("Description", { x: 56, y, size: 9, font: bold, color: dark });
  page.drawText("Period", { x: 300, y, size: 9, font: bold, color: dark });
  page.drawText("Amount", { x: 440, y, size: 9, font: bold, color: dark });

  y -= 30;

  // Line item
  const planInfo = PLANS[invoice.plan];
  const planName = planInfo?.name || invoice.plan;
  page.drawText(`${planName} Plan — Subscription`, { x: 56, y, size: 10, font, color: dark });
  page.drawText(`${formatDate(invoice.periodStart)} – ${formatDate(invoice.periodEnd)}`, { x: 300, y, size: 9, font, color: muted });
  page.drawText(formatNaira(invoice.amount), { x: 440, y, size: 10, font: bold, color: dark });

  y -= 30;

  // Divider
  page.drawLine({
    start: { x: 40, y }, end: { x: 555, y },
    thickness: 1, color: rgb(0.9, 0.91, 0.92),
  });

  y -= 20;

  // Total
  page.drawText("Total", { x: 380, y, size: 12, font: bold, color: dark });
  page.drawText(formatNaira(invoice.amount), { x: 440, y, size: 14, font: bold, color: green });

  y -= 60;

  // Footer
  page.drawText("Thank you for your subscription!", { x: 56, y, size: 10, font, color: muted });
  y -= 15;
  page.drawText("Questions? Contact support@hqlink.vercel.app", { x: 56, y, size: 9, font, color: muted });
  y -= 25;
  page.drawText("stallHq — Your store in your pocket", { x: 56, y, size: 8, font, color: muted });

  return doc.save();
}

function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return `₦${naira.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return iso;
  }
}
