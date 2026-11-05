/* ============================================================
   DreamWings — Weekly Reading Champions
   Every finished story writes a light reading log; the board
   groups the current ISO week and crowns readers with playful,
   bilingual titles.
   ============================================================ */

import { db, auth } from "./firebase-config.js";
import { addDoc, collection, getDocs, limit, query, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const T = (text, vars) => (typeof window.dwT === "function" ? window.dwT(text, vars) : text);
const lang = () => (typeof window.dwGetLanguage === "function" ? window.dwGetLanguage() : "en");

export const CHAMPION_TITLES = {
  1: { en: "Cloud Star", ar: "نجمة السحاب" },
  2: { en: "Space Hero", ar: "بطل الفضاء" },
  3: { en: "Story Lantern", ar: "فانوس الحكايات" },
  4: { en: "Dream Rider", ar: "فارس الأحلام" },
  5: { en: "Moon Whisperer", ar: "همسة القمر" },
  6: { en: "Kindness Knight", ar: "فارس الطيبة" },
  7: { en: "Little Explorer", ar: "المستكشف الصغير" },
  8: { en: "Star Collector", ar: "جامع النجوم" },
  9: { en: "Magic Reader", ar: "قارئ سحري" },
  10: { en: "Golden Listener", ar: "المستمع الذهبي" }
};

export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - start) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function championTitle(rank) {
  const entry = CHAMPION_TITLES[rank] || CHAMPION_TITLES[((rank - 1) % 10) + 1];
  return lang() === "ar" ? entry.ar : entry.en;
}

export function logReading({ bookId, title, titleAr, avatar } = {}) {
  const user = auth.currentUser;
  if (!user || !bookId) return;
  const guard = `dreamwings:log:${user.uid}:${weekKey()}:${bookId}`;
  try {
    if (localStorage.getItem(guard)) return;
    localStorage.setItem(guard, "1");
  } catch { /* ignore */ }

  addDoc(collection(db, "readingLog"), {
    uid: user.uid,
    name: user.displayName || user.email?.split("@")[0] || "Reader",
    bookId,
    title: title || "",
    titleAr: titleAr || "",
    avatar: avatar || null,
    weekKey: weekKey(),
    createdAt: serverTimestamp()
  }).catch(error => {
    console.warn("Reading log failed:", error);
    try { localStorage.removeItem(guard); } catch { /* ignore */ }
  });
}

export async function loadWeekChampions(max = 10) {
  try {
    const snap = await getDocs(query(collection(db, "readingLog"), where("weekKey", "==", weekKey()), limit(500)));
    const readers = new Map();
    snap.docs.forEach(entry => {
      const data = entry.data();
      if (!data?.uid) return;
      const row = readers.get(data.uid) || { uid: data.uid, name: data.name || "Reader", books: new Set() };
      if (data.bookId) row.books.add(data.bookId);
      readers.set(data.uid, row);
    });
    return [...readers.values()]
      .map(row => ({ uid: row.uid, name: row.name, stories: row.books.size }))
      .filter(row => row.stories > 0)
      .sort((a, b) => b.stories - a.stories || a.name.localeCompare(b.name))
      .slice(0, max)
      .map((row, index) => ({ ...row, rank: index + 1 }));
  } catch (error) {
    console.warn("Leaderboard unavailable:", error);
    return [];
  }
}

export function boardMarkup(rows, { compact = false } = {}) {
  if (!rows.length) {
    return `<p class="dw-results-empty">${T("This week is just beginning — finish a story to appear here! ✨")}</p>`;
  }
  const medals = ["🥇", "🥈", "🥉"];
  return `
    <ol class="dw-board${compact ? " is-compact" : ""}">
      ${rows.map(row => `
        <li class="dw-board-row${row.rank <= 3 ? " is-podium" : ""}">
          <span class="dw-board-rank">${medals[row.rank - 1] || row.rank}</span>
          <span class="dw-board-name">${escapeHtml(row.name)}</span>
          <span class="dw-board-title">${escapeHtml(championTitle(row.rank))}</span>
          <span class="dw-board-score">${row.stories} <i class="fa-solid fa-book-open"></i></span>
        </li>`).join("")}
    </ol>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
