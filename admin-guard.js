/* ============================================================
   DreamWings — administrator guard
   The single source of truth for "is this the platform creator?".

   Layers:
   1. Firebase UID allow-list (cannot be forged client-side).
   2. Optional email allow-list.
   3. Firestore role flag on users/{uid}: role === "admin" or isAdmin === true.

   Firestore security rules are the real boundary; this guard only controls
   what the interface reveals.
   ============================================================ */

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ADMIN_UIDS, ADMIN_EMAILS } from "./dw-config.js";

export function isOwnerUid(uid) {
  return !!uid && ADMIN_UIDS.includes(uid);
}

export async function isPlatformAdmin(user = auth.currentUser) {
  if (!user) return false;
  if (isOwnerUid(user.uid)) return true;

  const email = String(user.email || "").toLowerCase();
  if (email && ADMIN_EMAILS.map(item => item.toLowerCase()).includes(email)) return true;

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return false;
    const data = snap.data() || {};
    return data.role === "admin" || data.isAdmin === true;
  } catch (error) {
    console.warn("Could not verify administrator role:", error);
    return false;
  }
}

/** Resolves once Firebase has restored the session, then reports the role. */
export function adminReady() {
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      unsubscribe();
      resolve(await isPlatformAdmin(user));
    });
  });
}

export async function requireAdmin() {
  const allowed = await adminReady();
  if (!allowed) throw new Error("admin-required");
  return true;
}
