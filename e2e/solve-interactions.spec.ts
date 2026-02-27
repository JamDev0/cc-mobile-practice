import { expect, test } from "@playwright/test";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

async function createPdfBytes(pageCount: number) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pageCount; i += 1) {
    const page = pdf.addPage([595, 842]);
    page.drawText(`Mobile Practice E2E Page ${i}/${pageCount}`, {
      x: 40,
      y: 780,
      size: 18,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText("Tap zone", {
      x: 260,
      y: 420,
      size: 14,
      font,
      color: rgb(0.2, 0.2, 0.8),
    });
  }
  return pdf.save();
}

async function createSessionWithPdf(page: import("@playwright/test").Page, pageCount = 6) {
  await page.goto("/sessions");
  await expect(page.getByRole("heading", { name: "Sessions", exact: true })).toBeVisible();
  const pdfBytes = await createPdfBytes(pageCount);
  await page.locator('input[type="file"]').setInputFiles({
    name: "e2e-test.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(pdfBytes),
  });
  await expect(page).toHaveURL(/\/sessions\/.+/);
  await expect(page.getByRole("tab", { name: "Solve" })).toBeVisible();
  await expect(page.getByTestId("pdf-page-hitbox-1")).toBeVisible({ timeout: 10000 });
}

async function openRadialByPress(page: import("@playwright/test").Page, pageNumber: number) {
  const hitbox = page.getByTestId(`pdf-page-hitbox-${pageNumber}`);
  await expect(hitbox).toBeVisible();
  const box = await hitbox.boundingBox();
  if (!box) throw new Error("Missing PDF page hitbox bounds");
  const clientX = box.x + box.width * 0.6;
  const clientY = box.y + box.height * 0.35;
  await hitbox.dispatchEvent("pointerdown", {
    pointerType: "mouse",
    button: 0,
    clientX,
    clientY,
  });
  await expect(page.getByTestId("radial-picker-overlay")).toBeVisible();
}

async function commitTokenA(page: import("@playwright/test").Page) {
  const container = page.getByTestId("radial-picker-container");
  await expect(container).toBeVisible();
  const box = await container.boundingBox();
  if (!box) throw new Error("Missing radial picker bounds");
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const r = box.width * 0.35;
  const angle = (-5 * Math.PI) / 6;
  const x = centerX + r * Math.cos(angle);
  const y = centerY + r * Math.sin(angle);
  await page.getByTestId("radial-picker-overlay").dispatchEvent("pointerdown", {
    pointerType: "mouse",
    button: 0,
    pointerId: 1,
    clientX: x,
    clientY: y,
  });
  await page.getByTestId("radial-picker-overlay").dispatchEvent("pointerup", {
    pointerType: "mouse",
    button: 0,
    pointerId: 1,
    clientX: x,
    clientY: y,
  });
}

test("press on PDF opens radial and marker can be edited by click", async ({ page }) => {
  await createSessionWithPdf(page, 2);
  await openRadialByPress(page, 1);
  await commitTokenA(page);
  const marker = page.getByRole("button", { name: /Marker question 1, answer A/i }).first();
  await expect(marker).toBeVisible();
  await marker.click();
  await expect(page.getByRole("heading", { name: "Edit marker" })).toBeVisible();
});

test("review jump from answer on late page scrolls solve viewport to target", async ({ page }) => {
  await createSessionWithPdf(page, 6);

  const viewport = page.getByTestId("pdf-viewport-scroll");
  await viewport.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  await expect(page.getByTestId("pdf-page-hitbox-6")).toBeVisible();

  await openRadialByPress(page, 6);
  await commitTokenA(page);
  await expect(page.getByRole("button", { name: /Marker question 1, answer A/i }).first()).toBeVisible();

  await page.getByRole("tab", { name: "Review" }).click();
  await expect(page.getByRole("tab", { name: "Review", selected: true })).toBeVisible();
  await page.getByTestId("user-answer-Q1").click();
  await expect(page.getByRole("tab", { name: "Solve", selected: true })).toBeVisible();

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const container = document.querySelector('[data-testid="pdf-viewport-scroll"]');
        const target = document.querySelector('[data-page-number="6"]');
        if (!(container instanceof HTMLElement) || !(target instanceof HTMLElement)) return false;
        const c = container.getBoundingClientRect();
        const p = target.getBoundingClientRect();
        const viewportCenter = c.top + c.height / 2;
        const pageCenter = p.top + p.height / 2;
        return Math.abs(pageCenter - viewportCenter) < c.height * 0.45;
      });
    })
    .toBe(true);
});
