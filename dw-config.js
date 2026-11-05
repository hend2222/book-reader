/* ============================================================
   DreamWings — shared platform configuration
   One place for the creator allow-list, categories and services.
   ============================================================ */

/* The creator account (Hind). Firebase UID is authoritative because it
   cannot be spoofed from the browser. */
export const ADMIN_UIDS = [
  "LNghcfytsiU2x627gt4iAzPFaFH3"
];

/* Optional second factor: add the creator's sign-in email(s) here.
   Leave empty to rely on UID + Firestore role only. */
export const ADMIN_EMAILS = [];

/* Stories a reader must finish before the printable certificate unlocks. */
export const CERTIFICATE_TARGET = 5;

/* EmailJS (same service used by the contact form). */
export const EMAILJS = {
  serviceId: "service_w6fgbub",
  templateId: "template_un06ljz",
  publicKey: "g9k-qL-hziIzzvWIp",
  toName: "Hind — DreamWings"
};

/* Supabase edge function that stores uploaded media. */
export const UPLOAD_FUNCTION = "upload-book";

/* Firestore documents used by the new features. */
export const SITE_CONFIG_DOC = ["site", "platform"];
export const BOOK_CLUB_DOC = ["site", "bookClub"];

/* Built-in shelves. `nameAr` keeps the Arabic interface readable even
   before a category document exists in Firestore. */
export const DEFAULT_CATEGORIES = [
  { id: "space-stars", name: "Space & Stars", nameAr: "الفضاء والنجوم", color: "#477aa5", icon: "fa-rocket" },
  { id: "secret-kingdoms", name: "Secret Kingdoms", nameAr: "الممالك السرية", color: "#7b4da3", icon: "fa-hat-wizard" },
  { id: "time-portals", name: "Time Portals", nameAr: "بوابات الزمن", color: "#b86c45", icon: "fa-hourglass-start" },
  { id: "kind-hearts", name: "Kind Hearts", nameAr: "قلوب طيبة", color: "#a64f78", icon: "fa-hands-holding-child" },
  { id: "little-scientist", name: "Little Scientist", nameAr: "العالم الصغير", color: "#4b987d", icon: "fa-flask" },
  { id: "sleepy-star-dreams", name: "Sleepy Star Dreams", nameAr: "أحلام النجمة الناعسة", color: "#53618f", icon: "fa-cloud-moon" }
];

export function categorySlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "") || "stories";
}

export function categoryLabel(category, lang = "en") {
  if (!category) return lang === "ar" ? "قصص" : "Stories";
  if (lang === "ar") return category.nameAr || category.name || "قصص";
  return category.name || category.nameAr || "Stories";
}

export function findCategory(id) {
  return DEFAULT_CATEGORIES.find(item => item.id === id) || null;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}
