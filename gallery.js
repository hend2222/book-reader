/* ============================================================
   DreamWings — Little Artists Gallery
   Approved drawings from Firestore + curated starter artwork,
   bilingual likes and a moderated submission form.
   ============================================================ */

import { db, auth } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, doc, updateDoc, increment, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { uploadFile, isImage, safeFileName } from "./dw-upload.js";
import { EMAILJS, escapeHtml } from "./dw-config.js";
import { showToast } from "./notifications.js";
import { renderContestPrompt } from "./dw-spotlight.js";

const T = (text, vars) => (typeof window.dwT === "function" ? window.dwT(text, vars) : text);
const lang = () => (typeof window.dwGetLanguage === "function" ? window.dwGetLanguage() : "en");
const $ = id => document.getElementById(id);

/* Curated starter drawings keep the gallery warm before families submit. */
const STARTERS = [
  { id: "sample-1", childName: "Lina", childAge: 7, storyTitle: "Benny Bear & Sleepy Star", imageUrl: "draw-1.jpeg", likes: 24, sample: true },
  { id: "sample-2", childName: "Omar", childAge: 6, storyTitle: "The Little Dreamer", imageUrl: "draw-2.jpeg", likes: 19, sample: true },
  { id: "sample-3", childName: "Yara", childAge: 8, storyTitle: "Lila & Midnight Lantern", imageUrl: "draw-3.jpeg", likes: 31, sample: true },
  { id: "sample-4", childName: "Zaid", childAge: 5, storyTitle: "Space & Stars", imageUrl: "draw-5.jpeg", likes: 16, sample: true },
  { id: "sample-5", childName: "Sarah", childAge: 7, storyTitle: "Secret Kingdoms", imageUrl: "draw-11.png", likes: 28, sample: true }
];

const state = { items: [], liked: new Set() };

document.addEventListener("DOMContentLoaded", () => {
  loadLikes();
  loadGallery();
  bindUI();
});

function loadLikes() {
  try {
    const list = JSON.parse(localStorage.getItem("dreamwings:gallery-likes") || "[]");
    state.liked = new Set(Array.isArray(list) ? list : []);
  } catch { state.liked = new Set(); }
}

function saveLikes() {
  try {
    localStorage.setItem("dreamwings:gallery-likes", JSON.stringify([...state.liked]));
  } catch { /* ignore */ }
}

async function loadGallery() {
  const grid = $("galleryGrid");
  if (grid) grid.innerHTML = `<p class="dw-muted" style="grid-column:1/-1;text-align:center;">${T("Gallery is loading…")}</p>`;

  let submitted = [];
  try {
    const snap = await getDocs(collection(db, "gallery"));
    submitted = snap.docs
      .map(item => ({ id: item.id, ...item.data() }))
      .filter(item => (item.status || "pending") === "approved")
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (error) {
    console.warn("Could not load the gallery:", error);
  }

  state.items = [...submitted, ...STARTERS];
  renderGallery();
}

function renderGallery() {
  const grid = $("galleryGrid");
  if (!grid) return;

  if (!state.items.length) {
    grid.innerHTML = `<p class="dw-muted" style="grid-column:1/-1;text-align:center;">${T("No drawings yet — be the first little artist! 🎨")}</p>`;
    return;
  }

  grid.innerHTML = state.items.map(item => {
    const liked = state.liked.has(item.id);
    const count = Number(item.likes || 0) + (liked ? 1 : 0);
    return `
      <article class="dw-art-card" data-id="${escapeHtml(item.id)}">
        <div class="dw-art-frame" data-zoom="${escapeHtml(item.imageUrl || "")}">
          <img src="${escapeHtml(item.imageUrl || "")}" alt="${escapeHtml(T("Artwork by"))} ${escapeHtml(item.childName || "")}" loading="lazy">
          <span class="dw-art-zoom"><i class="fa-solid fa-expand"></i> ${T("Zoom")}</span>
        </div>
        <div class="dw-art-head">
          <h3 class="dw-art-name">${escapeHtml(item.childName || "—")}</h3>
          ${item.childAge ? `<span class="dw-art-age">${escapeHtml(item.childAge)} ${T("years old")}</span>` : ""}
        </div>
        ${item.storyTitle ? `<span class="dw-art-story"><i class="fa-solid fa-book-bookmark"></i>${escapeHtml(item.storyTitle)}</span>` : ""}
        <div class="dw-art-foot">
          <span>${T("Shared with love 🧡")}</span>
          <button type="button" class="dw-star-react ${liked ? "is-on" : ""}" data-like="${escapeHtml(item.id)}" aria-pressed="${liked}">
            <i class="fa-solid fa-star"></i><span class="dw-like-count">${count}</span>
          </button>
        </div>
      </article>`;
  }).join("");

  grid.querySelectorAll("[data-zoom]").forEach(frame => {
    frame.addEventListener("click", () => openLightbox(frame.dataset.zoom));
  });
  grid.querySelectorAll("[data-like]").forEach(button => {
    button.addEventListener("click", () => toggleLike(button.dataset.like, button));
  });
}

async function toggleLike(id, button) {
  const isLiked = state.liked.has(id);
  if (isLiked) {
    state.liked.delete(id);
  } else {
    state.liked.add(id);
    showToast(T("⭐ You gave a magical star to this young artist! ✨"), "success");
  }
  saveLikes();

  renderGallery();

  if (!id.startsWith("sample-") && !isLiked) {
    updateDoc(doc(db, "gallery", id), { likes: increment(1) }).catch(() => {});
  }
}

function bindUI() {
  $("openSubmitModalBtn")?.addEventListener("click", () => {
    $("submitModal")?.classList.add("is-open");
    document.body.style.overflow = "hidden";
  });

  $("closeSubmitModalBtn")?.addEventListener("click", closeSubmitModal);
  $("submitModal")?.addEventListener("click", event => {
    if (event.target === $("submitModal")) closeSubmitModal();
  });
  $("closeLightboxBtn")?.addEventListener("click", closeLightbox);
  $("lightboxModal")?.addEventListener("click", event => {
    if (event.target === $("lightboxModal")) closeLightbox();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") { closeLightbox(); closeSubmitModal(); }
  });

  $("drawingFileInput")?.addEventListener("change", event => {
    const file = event.target.files?.[0];
    const preview = $("drawingPreview");
    if (!file) { preview?.classList.remove("is-visible"); return; }
    if (!isImage(file)) {
      showToast(T("Please choose a drawing image (JPG, PNG or WebP up to 8 MB)."), "warning");
      event.target.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    if (preview) { preview.src = url; preview.classList.add("is-visible"); }
  });

  $("submitDrawingForm")?.addEventListener("submit", submitDrawing);

  window.addEventListener("dreamwings:language", renderGallery);
}

function closeSubmitModal() {
  $("submitModal")?.classList.remove("is-open");
  document.body.style.overflow = "";
}

function openLightbox(src) {
  if (!src) return;
  const image = $("lightboxImg");
  if (image) image.src = src;
  $("lightboxModal")?.classList.add("is-open");
}

function closeLightbox() {
  $("lightboxModal")?.classList.remove("is-open");
}

async function submitDrawing(event) {
  event.preventDefault();

  const name = $("childNameInput").value.trim();
  const age = $("childAgeInput").value.trim();
  const story = $("inspiredStoryInput").value.trim();
  const note = $("drawingNote").value.trim();
  const file = $("drawingFileInput").files?.[0];
  const status = $("submitStatus");
  const button = $("submitDrawingBtn");

  if (!name || !age || !file) {
    if (status) status.textContent = T("This field is required.");
    return;
  }
  if (!isImage(file)) {
    if (status) status.textContent = T("Please choose a drawing image (JPG, PNG or WebP up to 8 MB).");
    return;
  }

  button.disabled = true;
  if (status) status.textContent = T("Uploading your drawing…");

  try {
    const id = `${Date.now()}-${name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "drawing"}`;
    const imageUrl = await uploadFile(`gallery/${id}/${safeFileName(file.name)}`, file);

    const payload = {
      childName: name,
      childAge: Number(age) || null,
      storyTitle: story,
      note,
      imageUrl,
      status: "pending",
      likes: 0,
      submittedBy: auth.currentUser?.uid || null,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "gallery"), payload);

    /* Non-blocking email notification to the creator. */
    notifyCreator({ name, age, story, note, imageUrl }).catch(() => {});

    event.target.reset();
    $("drawingPreview")?.classList.remove("is-visible");
    closeSubmitModal();
    showToast(T("Thank you! Your child's drawing has been received with love! ✨"), "success");
  } catch (error) {
    console.error("Drawing upload failed:", error);
    if (status) status.textContent = error.message || T("Something went wrong. Please try again.");
    showToast(T("Something went wrong. Please try again."), "error");
  } finally {
    button.disabled = false;
  }
}

async function notifyCreator({ name, age, story, note, imageUrl }) {
  const emailjs = (await import("https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm")).default;
  await emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, {
    from_name: `${name} (${age})`,
    from_email: auth.currentUser?.email || "no-reply@dreamwings",
    subject: "New Little Artists Gallery submission",
    message: [
      `Child: ${name} (${age})`,
      `Inspired by: ${story || "—"}`,
      `Note: ${note || "—"}`,
      `Image: ${imageUrl}`,
      "Open the Admin Control Panel → Gallery to approve it."
    ].join("\n")
  }, { publicKey: EMAILJS.publicKey });
}


/* ---------------- Illustrator of the Month banner ---------------- */
const contestHolder = document.getElementById("contestBanner");
if (contestHolder) renderContestPrompt(contestHolder);
window.addEventListener("dreamwings:language", () => {
  if (contestHolder) renderContestPrompt(contestHolder);
});
