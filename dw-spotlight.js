/* ============================================================
   DreamWings — Young Illustrator of the Month
   Winner stored in site/spotlight, showcased on the home page;
   the gallery shows the open contest prompt.
   ============================================================ */

import { db } from "./firebase-config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { BOOK_CLUB_DOC, escapeHtml } from "./dw-config.js";

const T = (text, vars) => (typeof window.dwT === "function" ? window.dwT(text, vars) : text);
const lang = () => (typeof window.dwGetLanguage === "function" ? window.dwGetLanguage() : "en");
export const SPOTLIGHT_DOC = ["site", "spotlight"];

let cache = null;

export async function loadSpotlight(force = false) {
  if (cache && !force) return cache;
  try {
    const snap = await getDoc(doc(db, ...SPOTLIGHT_DOC));
    cache = snap.exists() ? snap.data() : null;
  } catch (error) {
    console.warn("Spotlight unavailable:", error);
    cache = null;
  }
  return cache;
}

export async function publishSpotlight(payload) {
  await setDoc(doc(db, ...SPOTLIGHT_DOC), {
    childName: payload.childName || "",
    childAge: payload.childAge || "",
    imageUrl: payload.imageUrl || "",
    artworkTitle: payload.artworkTitle || "",
    storyTitleEn: payload.storyTitleEn || "",
    storyTitleAr: payload.storyTitleAr || "",
    noteEn: payload.noteEn || "",
    noteAr: payload.noteAr || "",
    monthEn: payload.monthEn || "",
    monthAr: payload.monthAr || "",
    galleryId: payload.galleryId || "",
    hidden: false,
    updatedAt: new Date().toISOString()
  }, { merge: true });
  cache = null;
  window.dispatchEvent(new CustomEvent("dreamwings:spotlight"));
}

export async function clearSpotlight() {
  await setDoc(doc(db, ...SPOTLIGHT_DOC), { hidden: true, updatedAt: new Date().toISOString() }, { merge: true });
  cache = null;
  window.dispatchEvent(new CustomEvent("dreamwings:spotlight"));
}

export function spotlightMarkup(data, { featuredHref = "book-club.html" } = {}) {
  if (!data || data.hidden || !data.imageUrl) return "";
  const ar = lang() === "ar";
  const name = data.childName || T("Young Illustrator");
  const month = ar ? (data.monthAr || data.monthEn) : data.monthEn;
  const story = ar ? (data.storyTitleAr || data.storyTitleEn) : data.storyTitleEn;
  const note = ar ? (data.noteAr || data.noteEn) : data.noteEn;
  const corner = '<svg class="dw-spot-corner %s" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12C2 6.5 6.5 2 12 2M2 6.5A4.5 4.5 0 0 1 6.5 2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';

  return `
    <div class="dw-spot-frame" aria-labelledby="spotlightTitle">
      ${corner.replace("%s", "tl")}${corner.replace("%s", "tr")}${corner.replace("%s", "bl")}${corner.replace("%s", "br")}
      <div class="dw-spot-art">
        <img src="${escapeHtml(data.imageUrl)}" alt="${escapeHtml(name)}" loading="lazy">
        <span class="dw-spot-badge"><i class="fa-solid fa-medal" aria-hidden="true"></i> ${T("Illustrator of the Month")}</span>
      </div>
      <div class="dw-spot-copy">
        <span class="dw-spot-kicker"><i class="fa-solid fa-palette" aria-hidden="true"></i> ${T("Young Illustrator of the Month")}${month ? ` · ${escapeHtml(month)}` : ""}</span>
        <h2 class="dw-spot-name" id="spotlightTitle">${escapeHtml(name)}${data.childAge ? ` · ${escapeHtml(String(data.childAge))} ${T("yrs")}` : ""}</h2>
        ${story ? `<p class="dw-spot-story"><i class="fa-solid fa-book-open" aria-hidden="true"></i><span>${escapeHtml(story)}</span></p>` : ""}
        ${note ? `<p class="dw-spot-note">“${escapeHtml(note)}”</p>` : ""}
        <a class="dw-spot-cta" href="${escapeHtml(featuredHref)}">
          <i class="fa-solid fa-wand-sparkles" aria-hidden="true"></i>
          <span>${T("Watch this month's featured story ✨")}</span>
        </a>
      </div>
    </div>`;
}

async function featuredStoryHref() {
  try {
    const snap = await getDoc(doc(db, ...BOOK_CLUB_DOC));
    const bookId = snap.exists() ? snap.data().bookId : "";
    if (bookId) return `reader.html?id=${encodeURIComponent(bookId)}`;
  } catch { /* fall back below */ }
  return "book-club.html";
}

export async function renderSpotlight(root) {
  if (!root) return;
  const [data, href] = await Promise.all([loadSpotlight(), featuredStoryHref()]);
  root.innerHTML = spotlightMarkup(data, { featuredHref: href });
  root.hidden = !root.innerHTML.trim();
}

export async function renderContestPrompt(root) {
  if (!root) return;
  let club = null;
  try {
    const snap = await getDoc(doc(db, ...BOOK_CLUB_DOC));
    club = snap.exists() ? snap.data() : null;
  } catch { club = null; }

  const ar = lang() === "ar";
  const story = club ? (ar ? club.bookTitleAr || club.bookTitleEn : club.bookTitleEn) : "";
  const month = club ? (ar ? club.monthAr || club.monthEn : club.monthEn) : "";

  root.innerHTML = `
    <div class="dw-contest-banner">
      <div class="dw-contest-icon"><i class="fa-solid fa-palette"></i></div>
      <div>
        <h3>${T("Young Illustrator of the Month")}</h3>
        <p>${story
          ? T("Draw your favourite scene from {story} and send it below — the winning artwork is showcased on our home page!", { story: escapeHtml(story) })
          : T("Send us your drawing inspired by this month's story — the winning artwork is showcased on our home page!")}</p>
        ${month ? `<span class="dw-contest-month">${escapeHtml(month)}</span>` : ""}
      </div>
      <a class="dw-btn dw-btn-gold" href="#submitDrawingForm">
        <i class="fa-solid fa-upload"></i><span>${T("Enter the contest")}</span>
      </a>
    </div>`;
}
