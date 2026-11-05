/* ============================================================
   DreamWings — reading progress (shared by reader, profile, certificate)
   Local cache first so guests and offline readers still make progress,
   Firestore mirror for signed-in readers.
   ============================================================ */

import { db, auth } from "./firebase-config.js";
import { doc, getDoc, setDoc, arrayUnion, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { CERTIFICATE_TARGET } from "./dw-config.js";

const READ_PREFIX = "dreamwings:read:";
const STAR_PREFIX = "dreamwings:stars:";
const LISTEN_PREFIX = "dreamwings:listening:";

export function activeUid() {
  return auth.currentUser?.uid || localStorage.getItem("dreamwings:activeUid") || "guest";
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function getReadIds(uid = activeUid()) {
  const list = readJson(`${READ_PREFIX}${uid}`, []);
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

export function isBookRead(bookId, uid = activeUid()) {
  return !!bookId && getReadIds(uid).includes(bookId);
}

export function markBookRead(bookId, uid = activeUid()) {
  if (!bookId) return getReadIds(uid);
  const ids = getReadIds(uid);
  if (!ids.includes(bookId)) {
    ids.push(bookId);
    try { localStorage.setItem(`${READ_PREFIX}${uid}`, JSON.stringify(ids)); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent("dreamwings:read-changed", { detail: { id: bookId } }));
  }
  if (auth.currentUser) {
    setDoc(doc(db, "users", auth.currentUser.uid), {
      readBooks: arrayUnion(bookId)
    }, { merge: true }).catch(error => console.warn("Could not sync read books:", error));
  }
  return ids;
}

export async function getReadIdsRemote(uid = activeUid()) {
  const local = getReadIds(uid);
  if (!auth.currentUser || uid === "guest") return local;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    const remote = snap.exists() ? snap.data()?.readBooks : [];
    return [...new Set([...local, ...(Array.isArray(remote) ? remote : [])])];
  } catch {
    return local;
  }
}

export function getStars(uid = activeUid()) {
  return Number(localStorage.getItem(`${STAR_PREFIX}${uid}`) || 0) || 0;
}

export function addStar(uid = activeUid()) {
  const count = getStars(uid) + 1;
  try { localStorage.setItem(`${STAR_PREFIX}${uid}`, String(count)); } catch { /* ignore */ }
  if (auth.currentUser) {
    setDoc(doc(db, "users", auth.currentUser.uid), {
      excellenceStars: increment(1)
    }, { merge: true }).catch(error => console.warn("Could not save excellence star:", error));
  }
  window.dispatchEvent(new CustomEvent("dreamwings:stars-changed", { detail: { count } }));
  return count;
}

export function getListeningMinutes(uid = activeUid()) {
  return Number(localStorage.getItem(`${LISTEN_PREFIX}${uid}`) || 0) || 0;
}

export function addListeningMinutes(minutes, uid = activeUid()) {
  if (!minutes || minutes < 0) return getListeningMinutes(uid);
  const total = getListeningMinutes(uid) + Math.round(minutes);
  try { localStorage.setItem(`${LISTEN_PREFIX}${uid}`, String(total)); } catch { /* ignore */ }
  if (auth.currentUser) {
    setDoc(doc(db, "users", auth.currentUser.uid), {
      listeningMinutes: increment(Math.round(minutes))
    }, { merge: true }).catch(error => console.warn("Could not sync listening time:", error));
  }
  window.dispatchEvent(new CustomEvent("dreamwings:listening-changed", { detail: { minutes: total } }));
  return total;
}

export function certificateProgress(ids = getReadIds()) {
  const count = new Set(ids).size;
  return {
    count,
    target: CERTIFICATE_TARGET,
    unlocked: count >= CERTIFICATE_TARGET,
    remaining: Math.max(0, CERTIFICATE_TARGET - count),
    percent: Math.min(100, Math.round((count / CERTIFICATE_TARGET) * 100))
  };
}
