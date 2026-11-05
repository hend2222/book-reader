/* ============================================================
   DreamWings — Printable Reading Certificate
   Real reading progress (localStorage + Firestore mirror) gates
   the diploma; name, date and copy follow the active language.
   ============================================================ */

import { auth } from "./firebase-config.js";
import { CERTIFICATE_TARGET } from "./dw-config.js";
import {
  getReadIds, getReadIdsRemote, certificateProgress
} from "./dw-progress.js";
import { showToast } from "./notifications.js";

const $ = id => document.getElementById(id);
const T = (text, vars) => (typeof window.dwT === "function" ? window.dwT(text, vars) : text);
const lang = () => (typeof window.dwGetLanguage === "function" ? window.dwGetLanguage() : "en");
const isArabic = () => lang() === "ar";
const NAME_KEY = "dreamwings:cert-name";

const state = {
  ids: [],
  progress: certificateProgress([]),
  name: "",
  ready: false
};

/* ---------------- boot ---------------- */
document.addEventListener("DOMContentLoaded", async () => {
  state.name = localStorage.getItem(NAME_KEY) || auth.currentUser?.displayName || "";
  const input = $("certNameInput");
  if (input) {
    input.value = state.name;
    input.addEventListener("input", () => {
      state.name = input.value.trim();
      try { localStorage.setItem(NAME_KEY, state.name); } catch { /* ignore */ }
      renderName();
    });
  }

  $("certPrintBtn")?.addEventListener("click", printCertificate);
  $("certDownloadBtn")?.addEventListener("click", downloadCertificate);
  window.addEventListener("dreamwings:language", render);
  window.addEventListener("afterprint", () => document.body.classList.remove("dw-print-cert"));
  window.addEventListener("dreamwings:auth", () => loadProgress());

  render();
  await loadProgress();
});

async function loadProgress() {
  let ids = getReadIds();
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const remote = await getReadIdsRemote(uid);
      ids = [...new Set([...ids, ...remote])];
    } catch (error) {
      console.warn("Remote reading progress unavailable:", error);
    }
  }
  state.ids = ids;
  state.progress = certificateProgress(ids);
  state.ready = true;
  render();
}

/* ---------------- rendering ---------------- */
function render() {
  const ar = isArabic();
  const { count, target, unlocked, remaining, percent } = state.progress;

  document.title = T("DreamWings | Reading Certificate of Achievement");

  const progressText = $("certProgressText");
  if (progressText) {
    progressText.textContent = unlocked
      ? T("You unlocked your certificate!")
      : T("Read {count} of {target} stories to unlock your certificate", { count, target });
  }
  const fill = $("certProgressFill");
  if (fill) fill.style.width = `${percent}%`;

  const sheet = $("certSheet");
  if (sheet) {
    sheet.dir = ar ? "rtl" : "ltr";
    sheet.classList.toggle("dw-cert-locked", !unlocked);
  }

  const lockNote = $("certLockNote");
  if (lockNote) lockNote.hidden = unlocked;
  const lockText = $("certLockText");
  if (lockText) {
    lockText.textContent = T("Read {count} more stories to unlock this certificate.", { count: remaining });
  }
  const lockLink = $("certLockLink");
  if (lockLink) lockLink.textContent = T("Browse the Library");

  const brand = document.querySelector(".dw-cert-brand span:last-child");
  if (brand) brand.textContent = T("DreamWings Storybook Academy");

  const title = document.querySelector(".dw-cert-title");
  if (title) title.textContent = T("Certificate of Achievement");

  const sub = document.querySelector(".dw-cert-sub");
  if (sub) sub.textContent = T("For Inspiring Reading & Imagination");

  const lead = document.querySelector(".dw-cert-lead");
  if (lead) lead.textContent = T("This magical certificate is proudly presented to");

  const body = document.querySelector(".dw-cert-body");
  if (body) {
    body.textContent = T("In recognition of outstanding curiosity, dedication to bedtime stories, and opening their wings to explore wonderful tales of kindness, friendship, and courage.");
  }

  const stats = $("certStoryCount");
  if (stats) {
    stats.textContent = `${count} ${T("Stories completed")}`;
  }

  const date = $("certDateDisplay");
  if (date) date.textContent = formatDate(new Date());

  const sigLabel = document.querySelectorAll(".dw-cert-sig-label");
  if (sigLabel[0]) sigLabel[0].textContent = T("Founder, DreamWings");
  if (sigLabel[1]) sigLabel[1].textContent = T("Date Awarded");

  const seal = document.querySelector(".dw-cert-seal");
  if (seal) {
    seal.innerHTML = ar ? "نجمة<br>التميز<br>السحرية" : "Magical<br>Excellence<br>Star";
  }

  const hint = $("certHint");
  if (hint) {
    hint.textContent = T("Tip: turn on “Background graphics” in your print settings for the full gold frame.");
  }

  const printBtn = $("certPrintBtn");
  const downloadBtn = $("certDownloadBtn");
  if (printBtn) printBtn.disabled = !unlocked;
  if (downloadBtn) downloadBtn.disabled = !unlocked;

  renderName();
}

function renderName() {
  const display = $("certDisplayName");
  if (!display) return;
  const fallback = T("Little Explorer");
  display.textContent = state.name || fallback;
}

function formatDate(date) {
  const locale = isArabic() ? "ar-EG" : "en-GB";
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      calendar: "gregory"
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

/* ---------------- print ---------------- */
function printCertificate() {
  if (!state.progress.unlocked) {
    showToast(T("Read {count} more stories to unlock this certificate.", { count: state.progress.remaining }), "info");
    return;
  }
  if (!state.name) {
    showToast(T("Add your child's name before printing."), "info");
    $("certNameInput")?.focus();
    return;
  }
  document.body.classList.add("dw-print-cert");
  setTimeout(() => window.print(), 60);
}

/* ---------------- canvas export ---------------- */
function loadFonts() {
  return document.fonts?.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach(word => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function buildCertificateCanvas() {
  const ar = isArabic();
  const W = 2339;
  const H = 1654;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const serif = ar ? '"Tajawal", "Cairo", sans-serif' : '"Playfair Display", Georgia, serif';
  const sans = ar ? '"Tajawal", sans-serif' : '"Quicksand", "Helvetica Neue", sans-serif';

  // parchment
  const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
  bg.addColorStop(0, "#fffdf7");
  bg.addColorStop(0.55, "#fdf6e8");
  bg.addColorStop(1, "#f6ebd5");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // warm top glow
  const glow = ctx.createRadialGradient(W / 2, 0, 40, W / 2, 0, H * 0.9);
  glow.addColorStop(0, "rgba(245, 166, 35, 0.16)");
  glow.addColorStop(1, "rgba(245, 166, 35, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // frames
  ctx.strokeStyle = "#7a4a24";
  ctx.lineWidth = 34;
  ctx.strokeRect(17, 17, W - 34, H - 34);
  ctx.strokeStyle = "rgba(202, 161, 98, 0.9)";
  ctx.lineWidth = 4;
  ctx.strokeRect(62, 62, W - 124, H - 124);

  // corner ticks
  ctx.strokeStyle = "#b98545";
  ctx.lineWidth = 6;
  const corners = [[110, 110, 1, 1], [W - 110, 110, -1, 1], [110, H - 110, 1, -1], [W - 110, H - 110, -1, -1]];
  corners.forEach(([x, y, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(x + 70 * sx, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + 70 * sy);
    ctx.stroke();
  });

  // logo
  const logoX = W / 2 - 34;
  const logoY = 132;
  const grad = ctx.createLinearGradient(logoX, logoY, logoX + 68, logoY + 68);
  grad.addColorStop(0, "#f6c473");
  grad.addColorStop(1, "#cf7f24");
  ctx.fillStyle = grad;
  drawRoundRect(ctx, logoX, logoY, 68, 68, 20);
  ctx.fill();

  ctx.save();
  ctx.translate(logoX + 34, logoY + 34);
  ctx.scale(0.68, 0.68);
  ctx.strokeStyle = "#2b1612";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-32, -20);
  ctx.quadraticCurveTo(-14, -28, 0, -16);
  ctx.quadraticCurveTo(14, -28, 32, -20);
  ctx.lineTo(32, 22);
  ctx.quadraticCurveTo(14, 14, 0, 26);
  ctx.quadraticCurveTo(-14, 14, -32, 22);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 26);
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#9a5a24";
  ctx.font = `700 30px ${sans}`;
  if (!ar) ctx.letterSpacing = "6px";
  const brandText = T("DreamWings Storybook Academy");
  ctx.fillText(ar ? brandText : brandText.toUpperCase(), W / 2, logoY + 108);
  if (!ar) ctx.letterSpacing = "0px";

  // title
  ctx.fillStyle = "#7a3f16";
  ctx.font = `700 92px ${serif}`;
  ctx.fillText(T("Certificate of Achievement"), W / 2, 372);

  ctx.fillStyle = "#a56a30";
  ctx.font = `italic 500 40px ${serif}`;
  ctx.fillText(T("For Inspiring Reading & Imagination"), W / 2, 452);

  ctx.fillStyle = "#6b4a2c";
  ctx.font = `500 36px ${sans}`;
  ctx.fillText(T("This magical certificate is proudly presented to"), W / 2, 536);

  // name
  const name = state.name || T("Little Explorer");
  ctx.fillStyle = "#5f2f0e";
  let nameSize = 118;
  ctx.font = `700 ${nameSize}px ${serif}`;
  while (ctx.measureText(name).width > W * 0.62 && nameSize > 52) {
    nameSize -= 6;
    ctx.font = `700 ${nameSize}px ${serif}`;
  }
  ctx.fillText(name, W / 2, 668);

  const nameWidth = Math.min(W * 0.7, Math.max(560, ctx.measureText(name).width + 160));
  ctx.strokeStyle = "rgba(160, 106, 52, 0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2 - nameWidth / 2, 742);
  ctx.lineTo(W / 2 + nameWidth / 2, 742);
  ctx.stroke();

  // body
  ctx.fillStyle = "#6d4a2b";
  ctx.font = `400 33px ${serif}`;
  const bodyText = T("In recognition of outstanding curiosity, dedication to bedtime stories, and opening their wings to explore wonderful tales of kindness, friendship, and courage.");
  wrapLines(ctx, bodyText, W * 0.68).forEach((line, index) => {
    ctx.fillText(line, W / 2, 812 + index * 52);
  });

  // stats pill
  const pillText = `${state.progress.count} ${T("Stories completed")}`;
  ctx.font = `700 30px ${sans}`;
  const pillW = ctx.measureText(pillText).width + 130;
  const pillY = 1012;
  ctx.fillStyle = "rgba(245, 166, 35, 0.16)";
  drawRoundRect(ctx, W / 2 - pillW / 2, pillY, pillW, 62, 31);
  ctx.fill();
  ctx.strokeStyle = "rgba(160, 106, 52, 0.45)";
  ctx.lineWidth = 2;
  drawRoundRect(ctx, W / 2 - pillW / 2, pillY, pillW, 62, 31);
  ctx.stroke();
  ctx.fillStyle = "#8a4c1d";
  ctx.fillText(`★  ${pillText}`, W / 2, pillY + 33);

  // signature
  const leftX = W * 0.28;
  const rightX = W * 0.72;
  ctx.fillStyle = "#6b3a15";
  ctx.font = `italic 600 52px ${serif}`;
  ctx.fillText("Hind", leftX, 1252);
  ctx.strokeStyle = "rgba(120, 76, 38, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftX - 110, 1292);
  ctx.lineTo(leftX + 110, 1292);
  ctx.stroke();
  ctx.fillStyle = "#96643a";
  ctx.font = `700 26px ${sans}`;
  ctx.fillText(T("Founder, DreamWings"), leftX, 1332);

  ctx.fillStyle = "#6b3a15";
  ctx.font = `600 40px ${sans}`;
  ctx.fillText(formatDate(new Date()), rightX, 1262);
  ctx.beginPath();
  ctx.moveTo(rightX - 160, 1292);
  ctx.lineTo(rightX + 160, 1292);
  ctx.stroke();
  ctx.fillStyle = "#96643a";
  ctx.font = `700 26px ${sans}`;
  ctx.fillText(T("Date Awarded"), rightX, 1332);

  // seal
  const sealCx = W / 2;
  const sealCy = 1272;
  const sealR = 92;
  const sealGrad = ctx.createRadialGradient(sealCx - 30, sealCy - 30, 12, sealCx, sealCy, sealR);
  sealGrad.addColorStop(0, "#f9d089");
  sealGrad.addColorStop(1, "#c4761f");
  ctx.fillStyle = sealGrad;
  ctx.beginPath();
  ctx.arc(sealCx, sealCy, sealR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8a4f18";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 240, 200, 0.65)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sealCx, sealCy, sealR - 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#4a2508";
  ctx.font = `800 24px ${sans}`;
  const sealLines = ar ? ["نجمة", "التميز", "السحرية"] : ["MAGICAL", "EXCELLENCE", "STAR"];
  sealLines.forEach((line, index) => {
    ctx.fillText(line, sealCx, sealCy - 26 + index * 27);
  });

  // footer
  ctx.fillStyle = "rgba(150, 100, 58, 0.85)";
  ctx.font = `600 24px ${sans}`;
  ctx.fillText(ar ? "دريم وينجز · حكايات تُلامس القلب" : "dreamwings · stories that touch the heart", W / 2, H - 120);

  return canvas;
}

async function downloadCertificate() {
  if (!state.progress.unlocked) {
    showToast(T("Read {count} more stories to unlock this certificate.", { count: state.progress.remaining }), "info");
    return;
  }
  if (!state.name) {
    showToast(T("Add your child's name before printing."), "info");
    $("certNameInput")?.focus();
    return;
  }

  try {
    await loadFonts();
    const canvas = buildCertificateCanvas();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png", 0.95));
    if (!blob) throw new Error("empty canvas");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dreamwings-certificate-${(state.name || "reader").replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast(T("Your certificate image is ready!"), "success");
  } catch (error) {
    console.error("Certificate export failed:", error);
    showToast(T("The certificate could not be created. Please try printing instead."), "error");
  }
}
