#!/usr/bin/env node
/**
 * Patch pdfjs-dist to avoid webpack variable name conflicts in Next.js dev mode.
 * See: https://github.com/mozilla/pdf.js/issues/20724
 *
 * Renames __webpack_require__ and __webpack_exports__ to __pdfjs_* so they
 * don't shadow Next.js webpack runtime when modules are eval-wrapped.
 */
const fs = require("node:fs");
const path = require("node:path");

const pdfjsPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-pdf",
  "node_modules",
  "pdfjs-dist",
  "build",
  "pdf.mjs"
);

if (!fs.existsSync(pdfjsPath)) {
  console.warn("[patch-pdfjs] pdf.mjs not found, skipping");
  process.exit(0);
}

let content = fs.readFileSync(pdfjsPath, "utf8");
content = content.replace(/\b__webpack_require__\b/g, "__pdfjs_require__");
content = content.replace(/\b__webpack_exports__\b/g, "__pdfjs_exports__");
fs.writeFileSync(pdfjsPath, content);
console.log("[patch-pdfjs] Applied webpack variable rename to pdf.mjs");
