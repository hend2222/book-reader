/* ============================================================
   DreamWings — Bedtime Gratitude Journal
   One gentle question after each story; archived to the child's
   profile (Firestore subcollection + local mirror).
   ============================================================ */

import { db, auth } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const LOCAL = uid => `dreamwings:journal:${uid || "guest"}`;

export function journalUid() {
  return auth.currentUser?.uid || localStorage.getItem("dreamwings:activeUid") || "guest";
}

function readLocal(uid) {
  try {
    const list = JSON.parse(localStorage.getItem(LOCAL(uid)) || "[]");
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function saveJournalEntry(text, meta = {}) {
  const clean = String(text || "").trim().slice(0, 600);
  if (!clean) return null;
  const uid = journalUid();
  const entry = {
    text: clean,
    bookId: meta.bookId || "",
    bookTitle: meta.bookTitle || "",
    dateKey: todayKey(),
    createdAt: Date.now()
  };
  const list = readLocal(uid);
  list.unshift(entry);
  try { localStorage.setItem(LOCAL(uid), JSON.stringify(list.slice(0, 120))); } catch { /* ignore */ }

  if (uid !== "guest") {
    addDoc(collection(db, "users", uid, "journal"), { ...entry, createdAt: serverTimestamp() })
      .catch(error => console.warn("Journal sync failed:", error));
  }
  window.dispatchEvent(new CustomEvent("dreamwings:journal", { detail: entry }));
  return entry;
}

export async function listJournalEntries(uid = journalUid(), max = 40) {
  const local = readLocal(uid);
  if (uid === "guest") return local;
  try {
    const snap = await getDocs(query(collection(db, "users", uid, "journal"), orderBy("createdAt", "desc"), limit(max)));
    const remote = snap.docs.map(item => {
      const data = item.data();
      return {
        text: data.text || "",
        bookTitle: data.bookTitle || "",
        dateKey: data.dateKey || "",
        createdAt: data.createdAt?.toMillis?.() || Date.now()
      };
    }).filter(item => item.text);

    const merged = [...remote];
    local.forEach(item => {
      if (!merged.some(other => other.text === item.text && other.dateKey === item.dateKey)) merged.push(item);
    });
    return merged.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).slice(0, max);
  } catch (error) {
    console.warn("Journal history unavailable:", error);
    return local;
  }
}
