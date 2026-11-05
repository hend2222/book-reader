/* ============================================================
   DreamWings — legacy admin bridge
   Category pages still expose Edit / Delete buttons. Book creation and
   full editing now live in the secure control panel (admin.html), so this
   module only keeps those two entry points working without duplicating
   the whole studio form.

   Loaded on demand by category-page.js.
   ============================================================ */

import { auth, db } from "./firebase-config.js";
import { deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { isPlatformAdmin, requireAdmin } from "./admin-guard.js";
import { showToast } from "./notifications.js";

const T = (text, vars) => (typeof window.dwT === "function" ? window.dwT(text, vars) : text);

/* Kept for older pages that call window.dwAdminReady(). */
window.dwAdminReady = async function (user = auth.currentUser) {
  return isPlatformAdmin(user);
};

/* Hide owner-only controls for everyone else as soon as auth resolves. */
onAuthStateChanged(auth, async user => {
  const allowed = await isPlatformAdmin(user);
  document.querySelectorAll("[data-admin-only]").forEach(element => {
    element.hidden = !allowed;
  });
});

window.editBook = async function (bookId) {
  try {
    await requireAdmin();
    location.href = `admin.html?edit=${encodeURIComponent(bookId)}#books`;
  } catch {
    showToast(T("You do not have administrator access."), "warning");
  }
};

window.deleteBook = async function (bookId) {
  try {
    await requireAdmin();
  } catch {
    showToast(T("You do not have administrator access."), "warning");
    return;
  }

  if (!window.confirm(T("Are you sure you want to delete this book permanently?"))) return;

  try {
    await deleteDoc(doc(db, "books", bookId));
    document.querySelector(`[data-book-id="${CSS.escape(bookId)}"]`)?.remove();
    showToast(T("Book deleted."), "success");
  } catch (error) {
    console.error("Error deleting book:", error);
    showToast(T("Something went wrong. Please try again."), "error");
  }
};
