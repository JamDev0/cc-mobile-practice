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

async function openRadialByLongPress(page: import("@playwright/test").Page, pageNumber: number) {
  const hitbox = page.getByTestId(`pdf-page-hitbox-${pageNumber}`);
  await expect(hitbox).toBeVisible();
  await hitbox.scrollIntoViewIfNeeded();
  const box = await hitbox.boundingBox();
  if (!box) throw new Error("Missing PDF page hitbox bounds");
  const clientX = box.x + box.width * 0.6;
  const clientY = box.y + box.height * 0.55;
  await page.mouse.move(clientX, clientY);
  await page.mouse.down();
  await page.waitForTimeout(320);
  await expect(page.getByTestId("radial-picker-overlay")).toBeVisible();
}

async function slideToTokenAndRelease(page: import("@playwright/test").Page, token: "A" | "B") {
  const container = page.getByTestId("radial-picker-container");
  await expect(container).toBeVisible();
  const box = await container.boundingBox();
  if (!box) throw new Error("Missing radial picker bounds");
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const r = box.width * 0.35;
  const angle = token === "A" ? (-5 * Math.PI) / 6 : -Math.PI / 2;
  const x = centerX + r * Math.cos(angle);
  const y = centerY + r * Math.sin(angle);
  await page.mouse.move(x, y);
  await page.mouse.up();
}

test("press on PDF opens radial and marker can be edited by click", async ({ page }) => {
  await createSessionWithPdf(page, 2);
  await openRadialByLongPress(page, 1);
  await slideToTokenAndRelease(page, "A");
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
  await expect(page.getByText("Mobile Practice E2E Page 6/6")).toBeVisible({ timeout: 10000 });

  await openRadialByLongPress(page, 6);
  const scrollBefore = await viewport.evaluate((node) => node.scrollTop);
  await slideToTokenAndRelease(page, "A");
  const scrollAfter = await viewport.evaluate((node) => node.scrollTop);
  expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(2);
  await expect(page.getByRole("button", { name: /Marker question 1, answer A/i }).first()).toBeVisible();

  await page.getByRole("tab", { name: "Review" }).click();
  await expect(page.getByRole("tab", { name: "Review", selected: true })).toBeVisible();
  await page.getByTestId("user-answer-Q1").click();
  await expect(page.getByRole("tab", { name: "Solve", selected: true })).toBeVisible();

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const container = document.querySelector('[data-testid="pdf-viewport-scroll"]');
        const marker = document.querySelector('[data-marker-id]');
        if (!(container instanceof HTMLElement) || !(marker instanceof HTMLElement)) return false;
        const c = container.getBoundingClientRect();
        const m = marker.getBoundingClientRect();
        const viewportCenter = c.top + c.height / 2;
        const markerCenter = m.top + m.height / 2;
        return Math.abs(markerCenter - viewportCenter) < c.height * 0.45;
      });
    })
    .toBe(true);
});
