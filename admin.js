/* ============================================================
   DreamWings — Creator Control Panel
   Books • Gallery moderation • Monthly Book Club • Messages
   Guarded by UID / email / Firestore role (see admin-guard.js).
   ============================================================ */

import { auth, db } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { adminReady } from "./admin-guard.js";
import { showToast } from "./notifications.js";
import { DEFAULT_CATEGORIES, BOOK_CLUB_DOC, categorySlug, escapeHtml } from "./dw-config.js";
import { uploadFile, safeFileName, isImage, isAudio, isVideo } from "./dw-upload.js";

const $ = id => document.getElementById(id);
const T = (text, vars) => (typeof window.dwT === "function" ? window.dwT(text, vars) : text);
const lang = () => (typeof window.dwGetLanguage === "function" ? window.dwGetLanguage() : "en");

const state = {
  books: [],
  gallery: [],
  categories: [...DEFAULT_CATEGORIES],
  club: null,
  messages: [],
  editing: null,
  pendingIllustrations: [],
  coverPreviewUrl: ""
};

/* ------------------------------------------------------------
   Boot & guard
   ------------------------------------------------------------ */

(async function boot() {
  const allowed = await adminReady();

  if (!allowed) {
    $("gateTitle").textContent = T("Restricted Area");
    const user = auth.currentUser;
    $("gateMessage").textContent = user
      ? T("You are signed in as {email}. This account does not have administrator access.", { email: user.email || user.uid })
      : T("This area is reserved for the platform creator only.");
    $("gateActions").classList.remove("dw-hidden");
    $("gateActions").style.display = "flex";
    return;
  }

  $("adminGate").classList.add("dw-hidden");
  $("adminApp").classList.remove("dw-hidden");
  $("adminEmail").textContent = auth.currentUser?.email || auth.currentUser?.displayName || "Hind";

  bindUI();
  await Promise.all([loadCategories(), loadBooks(), loadGallery(), loadClub(), loadMessages()]);
  renderAll();

  const editId = new URLSearchParams(location.search).get("edit");
  if (editId) startEdit(editId);
})();

function bindUI() {
  $("adminNav")?.addEventListener("click", event => {
    const button = event.target.closest("[data-panel]");
    if (!button) return;
    activatePanel(button.dataset.panel);
  });

  document.querySelectorAll("[data-jump]").forEach(button => {
    button.addEventListener("click", () => activatePanel(button.dataset.jump));
  });

  $("adminSignOut")?.addEventListener("click", async () => {
    await signOut(auth).catch(() => {});
    location.href = "home.html";
  });

  $("adminBookForm")?.addEventListener("submit", handleBookSubmit);
  $("abCancelEdit")?.addEventListener("click", resetBookForm);
  $("bookSearch")?.addEventListener("input", renderBooksTable);

  $("abCover")?.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) { clearCoverPreview(); return; }
    if (!isImage(file)) {
      toast(T("Choose an image up to 8 MB (JPG, PNG or WebP)."), "warning");
      event.target.value = "";
      return;
    }
    state.coverPreviewUrl = URL.createObjectURL(file);
    const preview = $("abCoverPreview");
    preview.src = state.coverPreviewUrl;
    preview.classList.add("is-visible");
  });

  $("abIllustrations")?.addEventListener("change", event => {
    const files = [...(event.target.files || [])];
    state.pendingIllustrations = files.filter(file => isImage(file));
    if (state.pendingIllustrations.length !== files.length) {
      toast(T("Choose an image up to 8 MB (JPG, PNG or WebP)."), "warning");
    }
    renderIllustrationChips();
  });

  $("bcBookSelect")?.addEventListener("change", event => {
    const book = state.books.find(item => item.id === event.target.value);
    if (!book) return;
    if (!$("bcTitleEn").value) $("bcTitleEn").value = book.title || "";
    if (!$("bcTitleAr").value) $("bcTitleAr").value = book.titleAr || "";
    if (!$("bcDescEn").value) $("bcDescEn").value = book.description || "";
  });

  $("bookClubForm")?.addEventListener("submit", handleClubSubmit);

  window.addEventListener("dreamwings:language", () => {
    renderAll(true);
  });
}

function activatePanel(name) {
  document.querySelectorAll(".dw-panel").forEach(panel => {
    panel.classList.toggle("is-active", panel.dataset.panel === name);
  });
  document.querySelectorAll(".dw-admin-nav [data-panel]").forEach(button => {
    button.classList.toggle("is-active", button.dataset.panel === name);
  });
  if (name === "books") {
    const card = $("bookFormCard");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* ------------------------------------------------------------
   Data loading
   ------------------------------------------------------------ */

async function loadCategories() {
  const merged = [...DEFAULT_CATEGORIES];
  try {
    const snap = await getDocs(collection(db, "categories"));
    snap.forEach(item => {
      const data = item.data() || {};
      if (!data.name) return;
      const index = merged.findIndex(category => category.id === item.id);
      const entry = { id: item.id, ...data };
      if (index >= 0) merged[index] = { ...merged[index], ...entry };
      else merged.push(entry);
    });
  } catch (error) {
    console.warn("Could not load custom categories:", error);
  }
  state.categories = merged;
  renderCategoryOptions();
  renderStats();
}

async function loadBooks() {
  try {
    const snap = await getDocs(collection(db, "books"));
    state.books = snap.docs
      .map(item => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (error) {
    console.warn("Could not load books:", error);
    toast(T("Could not load this story. Please try again."), "error");
  }
}

async function loadGallery() {
  try {
    const snap = await getDocs(collection(db, "gallery"));
    state.gallery = snap.docs
      .map(item => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (error) {
    console.warn("Could not load gallery:", error);
  }
}

async function loadClub() {
  try {
    const snap = await getDoc(doc(db, ...BOOK_CLUB_DOC));
    state.club = snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    console.warn("Could not load book club settings:", error);
  }
}

async function loadMessages() {
  try {
    const snap = await getDocs(collection(db, "contactMessages"));
    state.messages = snap.docs
      .map(item => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (error) {
    console.warn("Could not load messages:", error);
  }
}

/* ------------------------------------------------------------
   Rendering
   ------------------------------------------------------------ */

function renderAll(isLanguageChange = false) {
  renderStats();
  renderRecentBooks();
  renderBooksTable();
  renderGalleryAdmin();
  renderMessages();
  renderCategoryOptions();
  if (!isLanguageChange) renderClubForm();
}

function renderStats() {
  const pending = state.gallery.filter(item => (item.status || "pending") === "pending").length;
  if ($("statBooks")) $("statBooks").textContent = state.books.length;
  if ($("statCategories")) $("statCategories").textContent = state.categories.length;
  if ($("statGallery")) $("statGallery").textContent = state.gallery.length;
  if ($("statPending")) $("statPending").textContent = pending;
}

function categoryName(id) {
  const category = state.categories.find(item => item.id === id);
  if (!category) return T("No category");
  return lang() === "ar" ? (category.nameAr || category.name) : category.name;
}

function formatDate(value) {
  const seconds = value?.seconds;
  const date = seconds ? new Date(seconds * 1000) : null;
  if (!date) return "—";
  return date.toLocaleDateString(lang() === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric", month: "short", day: "numeric"
  });
}

function bookRow(book) {
  const cover = book.coverUrl
    ? `<img src="${escapeHtml(book.coverUrl)}" alt="">`
    : `<span class="dw-brand-book" style="width:36px;height:50px;border-radius:5px;"><i class="fa-solid fa-book"></i></span>`;
  return `
    <tr>
      <td>
        <div class="dw-book-cell">
          ${cover}
          <div>
            <strong>${escapeHtml(book.title || T("Untitled Story"))}</strong>
            <div class="dw-muted" style="font-size:11.5px;">${escapeHtml(book.author || "DreamWings")}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(categoryName(book.category))}</td>
      <td>${formatDate(book.createdAt)}</td>
      <td>
        <div class="dw-row-actions">
          <button type="button" class="dw-mini-btn" data-edit="${escapeHtml(book.id)}" title="${T("Edit")}" aria-label="${T("Edit")}">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button type="button" class="dw-mini-btn is-danger" data-delete="${escapeHtml(book.id)}" title="${T("Delete")}" aria-label="${T("Delete")}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`;
}

function bindRowActions(container) {
  container.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => startEdit(button.dataset.edit));
  });
  container.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => removeBook(button.dataset.delete));
  });
}

function renderRecentBooks() {
  const body = $("recentBooksBody");
  if (!body) return;
  const recent = state.books.slice(0, 5);
  body.innerHTML = recent.length
    ? recent.map(bookRow).join("")
    : `<tr><td colspan="4" class="dw-muted">${T("No books yet. Add your first story ✨")}</td></tr>`;
  bindRowActions(body);
}

function renderBooksTable() {
  const body = $("booksTableBody");
  if (!body) return;
  const query = ($("bookSearch")?.value || "").toLowerCase().trim();
  const books = state.books.filter(book => {
    if (!query) return true;
    return [book.title, book.author, book.description, book.category]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(query));
  });
  body.innerHTML = books.length
    ? books.map(bookRow).join("")
    : `<tr><td colspan="4" class="dw-muted">${T("No books yet. Add your first story ✨")}</td></tr>`;
  bindRowActions(body);
}

function renderCategoryOptions() {
  const select = $("abCategory");
  if (!select) return;
  const current = select.value;
  select.innerHTML = state.categories.map(category => {
    const label = lang() === "ar" ? (category.nameAr || category.name) : category.name;
    return `<option value="${escapeHtml(category.id)}">${escapeHtml(label)}</option>`;
  }).join("");
  if (current) select.value = current;
}

function renderIllustrationChips() {
  const list = $("abIllustrationList");
  if (!list) return;
  list.innerHTML = state.pendingIllustrations.map((file, index) => `
    <span class="dw-badge wait" style="padding:5px 9px;">
      <i class="fa-solid fa-image"></i> ${index + 1}
    </span>`).join("");
}

function renderGalleryAdmin() {
  const grid = $("adminGalleryGrid");
  if (!grid) return;
  if (!state.gallery.length) {
    grid.innerHTML = `<p class="dw-muted">${T("No submissions yet.")}</p>`;
    return;
  }

  const sortOrder = { pending: 0, approved: 1, hidden: 2 };
  const items = [...state.gallery].sort((a, b) => (sortOrder[a.status || "pending"] ?? 3) - (sortOrder[b.status || "pending"] ?? 3));

  grid.innerHTML = items.map(item => {
    const status = item.status || "pending";
    const badge = status === "approved"
      ? `<span class="dw-badge ok"><i class="fa-solid fa-circle-check"></i>${T("Approved")}</span>`
      : status === "hidden"
        ? `<span class="dw-badge off"><i class="fa-solid fa-eye-slash"></i>${T("Hidden")}</span>`
        : `<span class="dw-badge wait"><i class="fa-solid fa-hourglass-half"></i>${T("Pending")}</span>`;

    return `
      <article class="dw-mod-card">
        <img src="${escapeHtml(item.imageUrl || "")}" alt="${escapeHtml(item.childName || "Drawing")}" loading="lazy">
        <div class="dw-mod-info">
          <strong>${escapeHtml(item.childName || "—")} ${item.childAge ? `· ${escapeHtml(item.childAge)}` : ""}</strong>
          <div class="dw-muted">${escapeHtml(item.storyTitle || "")}</div>
          <div style="margin-top:6px;">${badge}</div>
        </div>
        <div class="dw-mod-actions">
          ${status !== "approved" ? `<button type="button" class="dw-mini-btn" data-approve="${escapeHtml(item.id)}" title="${T("Approve")}"><i class="fa-solid fa-check"></i></button>` : ""}
          ${status !== "hidden" ? `<button type="button" class="dw-mini-btn" data-hide="${escapeHtml(item.id)}" title="${T("Hide")}"><i class="fa-solid fa-eye-slash"></i></button>` : ""}
          <button type="button" class="dw-mini-btn is-danger" data-remove-art="${escapeHtml(item.id)}" title="${T("Delete")}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </article>`;
  }).join("");

  grid.querySelectorAll("[data-approve]").forEach(button => {
    button.addEventListener("click", () => setGalleryStatus(button.dataset.approve, "approved"));
  });
  grid.querySelectorAll("[data-hide]").forEach(button => {
    button.addEventListener("click", () => setGalleryStatus(button.dataset.hide, "hidden"));
  });
  grid.querySelectorAll("[data-remove-art]").forEach(button => {
    button.addEventListener("click", () => removeArtwork(button.dataset.removeArt));
  });
}

function renderMessages() {
  const box = $("adminMessages");
  if (!box) return;
  if (!state.messages.length) {
    box.innerHTML = `<p class="dw-muted">${T("No submissions yet.")}</p>`;
    return;
  }
  box.innerHTML = state.messages.slice(0, 30).map(message => `
    <article class="dw-reflection">
      <div class="dw-reflection-author">
        <i class="fa-solid fa-envelope" style="color:#f5a623"></i>
        ${escapeHtml(message.name || "—")} · ${escapeHtml(message.email || "")}
      </div>
      <p class="dw-reflection-body"><strong>${escapeHtml(message.subject || "")}</strong><br>${escapeHtml(message.message || "")}</p>
    </article>`).join("");
}

function renderClubForm() {
  const select = $("bcBookSelect");
  if (!select) return;

  select.innerHTML = `<option value="">${T("Choose a book")}</option>` + state.books.map(book =>
    `<option value="${escapeHtml(book.id)}">${escapeHtml(book.title || "—")}</option>`
  ).join("");

  const club = state.club || {};
  if (club.bookId) select.value = club.bookId;
  $("bcMonthEn").value = club.monthEn || "";
  $("bcMonthAr").value = club.monthAr || "";
  $("bcTitleEn").value = club.bookTitleEn || "";
  $("bcTitleAr").value = club.bookTitleAr || "";
  $("bcDescEn").value = club.descriptionEn || "";
  $("bcDescAr").value = club.descriptionAr || "";
  $("bcMoralEn").value = club.moralEn || "";
  $("bcMoralAr").value = club.moralAr || "";

  const questions = Array.isArray(club.questions) && club.questions.length
    ? club.questions
    : [{ en: "", ar: "" }, { en: "", ar: "" }, { en: "", ar: "" }];

  $("bcQuestions").innerHTML = questions.map((question, index) => `
    <div class="dw-grid-2" style="margin-bottom:8px;">
      <div class="dw-field">
        <label class="dw-label">${T("Discussion question {n}", { n: index + 1 })} · EN</label>
        <input class="dw-input" data-q-en="${index}" value="${escapeHtml(question.en || "")}">
      </div>
      <div class="dw-field">
        <label class="dw-label">${T("Discussion question {n}", { n: index + 1 })} · AR</label>
        <input class="dw-input" data-q-ar="${index}" dir="rtl" value="${escapeHtml(question.ar || "")}">
      </div>
    </div>`).join("");
}

/* ------------------------------------------------------------
   Book create / update / delete
   ------------------------------------------------------------ */

function setBookStatus(message) {
  const status = $("abStatus");
  if (status) status.textContent = message;
}

function clearCoverPreview() {
  state.coverPreviewUrl = "";
  const preview = $("abCoverPreview");
  if (preview) {
    preview.removeAttribute("src");
    preview.classList.remove("is-visible");
  }
}

function resetBookForm() {
  $("adminBookForm")?.reset();
  $("editingBookId").value = "";
  state.editing = null;
  state.pendingIllustrations = [];
  renderIllustrationChips();
  clearCoverPreview();
  if ($("abAuthor")) $("abAuthor").value = "Hind";
  if ($("bookFormTitle")) $("bookFormTitle").textContent = T("Add New Book");
  if ($("abSubmit")) $("abSubmit").querySelector("span").textContent = T("Publish Book");
  $("abCancelEdit")?.classList.add("dw-hidden");
  if ($("abExistingIllustrations")) $("abExistingIllustrations").textContent = "";
  setBookStatus("");
}

function startEdit(bookId) {
  const book = state.books.find(item => item.id === bookId);
  if (!book) return;
  activatePanel("books");
  state.editing = book;
  state.pendingIllustrations = [];
  renderIllustrationChips();
  clearCoverPreview();

  $("editingBookId").value = book.id;
  $("abTitle").value = book.title || "";
  $("abAuthor").value = book.author || "Hind";
  $("abDescription").value = book.description || book.descriptionEn || "";
  $("abStoryText").value = book.storyText || "";
  $("abCategory").value = book.category || DEFAULT_CATEGORIES[0].id;
  $("abLang").value = book.language || "bilingual";

  if ($("bookFormTitle")) $("bookFormTitle").textContent = T("Edit Book");
  if ($("abSubmit")) $("abSubmit").querySelector("span").textContent = T("Save Changes");
  $("abCancelEdit")?.classList.remove("dw-hidden");

  const illustrations = book.illustrationUrls || book.storyIllustrations || [];
  if ($("abExistingIllustrations")) {
    $("abExistingIllustrations").textContent = illustrations.length
      ? `${illustrations.length} × ${T("Story illustration")}`
      : "";
  }
  if (book.coverUrl) {
    const preview = $("abCoverPreview");
    preview.src = book.coverUrl;
    preview.classList.add("is-visible");
  }
  setBookStatus("");
  $("bookFormCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleBookSubmit(event) {
  event.preventDefault();

  const editing = state.editing;
  const title = $("abTitle").value.trim();
  const author = $("abAuthor").value.trim();
  const description = $("abDescription").value.trim();
  const storyText = $("abStoryText").value.trim();
  const category = $("abCategory").value || DEFAULT_CATEGORIES[0].id;
  const language = $("abLang").value || "bilingual";

  const coverFile = $("abCover").files?.[0] || null;
  const audioFile = $("abAudio").files?.[0] || null;
  const videoFile = $("abVideo").files?.[0] || null;
  const illustrations = state.pendingIllustrations;

  if (!title || !author || !storyText || (!coverFile && !editing)) {
    setBookStatus(T("Please add a title, author, story text and cover image."));
    return;
  }
  if (coverFile && !isImage(coverFile)) {
    setBookStatus(T("Choose an image up to 8 MB (JPG, PNG or WebP)."));
    return;
  }
  if (audioFile && !isAudio(audioFile)) {
    setBookStatus(T("Choose an audio file up to 50 MB."));
    return;
  }
  if (videoFile && !isVideo(videoFile)) {
    setBookStatus(T("Choose a video up to 250 MB."));
    return;
  }

  const submit = $("abSubmit");
  submit.disabled = true;

  try {
    const id = editing?.id || `${Date.now()}-${categorySlug(title)}`;
    let coverUrl = editing?.coverUrl || "";
    let illustrationUrls = editing?.illustrationUrls || editing?.storyIllustrations || [];
    let audioUrl = editing?.audioUrl || "";
    let videoUrl = editing?.videoUrl || "";

    if (coverFile) {
      setBookStatus(T("Uploading…"));
      coverUrl = await uploadFile(`books/${id}/cover-${safeFileName(coverFile.name)}`, coverFile);
    }

    if (illustrations.length) {
      illustrationUrls = [];
      for (let index = 0; index < illustrations.length; index++) {
        setBookStatus(`${T("Uploading…")} ${index + 1}/${illustrations.length}`);
        illustrationUrls.push(await uploadFile(
          `books/${id}/illustration-${index + 1}-${safeFileName(illustrations[index].name)}`,
          illustrations[index]
        ));
      }
    }

    if (audioFile) {
      setBookStatus(T("Uploading…"));
      audioUrl = await uploadFile(`books/${id}/audio-${safeFileName(audioFile.name)}`, audioFile);
    }

    if (videoFile) {
      setBookStatus(T("Uploading…"));
      videoUrl = await uploadFile(`books/${id}/video-${safeFileName(videoFile.name)}`, videoFile);
    }

    setBookStatus(T("Saving book details…"));

    const payload = {
      bookId: id,
      title,
      author,
      description,
      storyText,
      language,
      category,
      coverUrl,
      illustrationUrls,
      audioUrl,
      videoUrl
    };

    if (editing) {
      await updateDoc(doc(db, "books", id), { ...payload, updatedAt: serverTimestamp() });
    } else {
      await setDoc(doc(db, "books", id), {
        ...payload,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || null
      });
    }

    resetBookForm();
    await loadBooks();
    renderAll();
    toast(editing ? T("Book updated successfully! ✨") : T("Book published successfully! ✨"), "success");
  } catch (error) {
    console.error("Book save failed:", error);
    setBookStatus(T("Could not save the book: {message}", { message: error.message || error }));
    toast(T("Could not save the book: {message}", { message: error.message || error }), "error");
  } finally {
    submit.disabled = false;
  }
}

async function removeBook(bookId) {
  const book = state.books.find(item => item.id === bookId);
  if (!book) return;
  const ok = window.confirm(T("Are you sure you want to delete “{title}”? This cannot be undone.", { title: book.title || "" }));
  if (!ok) return;

  try {
    await deleteDoc(doc(db, "books", bookId));
    state.books = state.books.filter(item => item.id !== bookId);
    if (state.editing?.id === bookId) resetBookForm();
    renderAll();
    toast(T("Book deleted."), "success");
  } catch (error) {
    console.error("Delete failed:", error);
    toast(T("Something went wrong. Please try again."), "error");
  }
}

/* ------------------------------------------------------------
   Gallery moderation
   ------------------------------------------------------------ */

async function setGalleryStatus(id, status) {
  try {
    await updateDoc(doc(db, "gallery", id), { status, moderatedAt: serverTimestamp() });
    const item = state.gallery.find(entry => entry.id === id);
    if (item) item.status = status;
    renderGalleryAdmin();
    renderStats();
    toast(status === "approved" ? T("Gallery item approved.") : T("Gallery item hidden."), "success");
  } catch (error) {
    console.error("Could not update gallery item:", error);
    toast(T("Something went wrong. Please try again."), "error");
  }
}

async function removeArtwork(id) {
  if (!window.confirm(T("Delete this drawing permanently?"))) return;
  try {
    await deleteDoc(doc(db, "gallery", id));
    state.gallery = state.gallery.filter(item => item.id !== id);
    renderGalleryAdmin();
    renderStats();
    toast(T("Gallery item deleted."), "success");
  } catch (error) {
    console.error("Could not delete artwork:", error);
    toast(T("Something went wrong. Please try again."), "error");
  }
}

/* ------------------------------------------------------------
   Book club
   ------------------------------------------------------------ */

async function handleClubSubmit(event) {
  event.preventDefault();
  const status = $("bcStatus");
  const submit = event.target.querySelector("[type='submit']");
  submit.disabled = true;
  if (status) status.textContent = T("Saving…");

  try {
    const bookId = $("bcBookSelect").value;
    const book = state.books.find(item => item.id === bookId) || {};
    const coverFile = $("bcCover").files?.[0] || null;
    let coverUrl = state.club?.coverUrl || book.coverUrl || "";

    if (coverFile) {
      if (!isImage(coverFile)) throw new Error(T("Please choose a drawing image (JPG, PNG or WebP up to 8 MB)."));
      if (status) status.textContent = T("Uploading…");
      coverUrl = await uploadFile(`site/book-club-${Date.now()}-${safeFileName(coverFile.name)}`, coverFile);
    }

    const questionEn = [...document.querySelectorAll("[data-q-en]")];
    const questionAr = [...document.querySelectorAll("[data-q-ar]")];
    const questions = questionEn.map((input, index) => ({
      en: input.value.trim(),
      ar: questionAr[index]?.value.trim() || ""
    })).filter(item => item.en || item.ar);

    const payload = {
      bookId,
      bookTitleEn: $("bcTitleEn").value.trim() || book.title || "",
      bookTitleAr: $("bcTitleAr").value.trim() || book.titleAr || "",
      monthEn: $("bcMonthEn").value.trim(),
      monthAr: $("bcMonthAr").value.trim(),
      descriptionEn: $("bcDescEn").value.trim(),
      descriptionAr: $("bcDescAr").value.trim(),
      moralEn: $("bcMoralEn").value.trim(),
      moralAr: $("bcMoralAr").value.trim(),
      coverUrl,
      questions,
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, ...BOOK_CLUB_DOC), payload, { merge: true });
    state.club = { ...(state.club || {}), ...payload };
    if (status) status.textContent = "";
    toast(T("Book Club updated! ✨"), "success");
  } catch (error) {
    console.error("Book club save failed:", error);
    if (status) status.textContent = error.message || T("Something went wrong. Please try again.");
    toast(T("Something went wrong. Please try again."), "error");
  } finally {
    submit.disabled = false;
  }
}

/* ------------------------------------------------------------
   Helpers
   ------------------------------------------------------------ */

function toast(message, type = "success") {
  try {
    showToast(message, type, { duration: 2600 });
  } catch {
    console[type === "error" ? "error" : "log"](message);
  }
}


/* ---------------- Home Spotlight ---------------- */
import { publishSpotlight, clearSpotlight } from "./dw-spotlight.js";

function initSpotlightPanel() {
  const select = document.getElementById("spotGallerySelect");
  if (!select) return;
  const preview = document.getElementById("spotPreview");
  const status = document.getElementById("spotStatus");

  function populate() {
    const items = (state.gallery || []).filter(item => item.imageUrl);
    select.innerHTML = `<option value="">${T("Choose a drawing")}</option>` + items.map(item =>
      `<option value="${escapeHtml(item.id)}">${escapeHtml(item.childName || "Artist")} · ${escapeHtml(item.storyTitle || "")}</option>`
    ).join("");
  }

  function fill() {
    const item = (state.gallery || []).find(entry => entry.id === select.value);
    if (!item) { if (preview) preview.classList.remove("is-visible"); return; }
    document.getElementById("spotChildName").value = item.childName || "";
    document.getElementById("spotChildAge").value = item.childAge || "";
    document.getElementById("spotStoryEn").value = item.storyTitle || "";
    if (preview) {
      preview.innerHTML = `<img src="${escapeHtml(item.imageUrl)}" alt="" style="max-width:260px;border-radius:14px;">`;
      preview.classList.add("is-visible");
    }
  }

  document.querySelector('[data-panel="spotlight"]')?.addEventListener("click", populate);
  populate();
  select.addEventListener("change", fill);

  document.getElementById("spotSave")?.addEventListener("click", async event => {
    const item = (state.gallery || []).find(entry => entry.id === select.value);
    if (!item) { if (status) status.textContent = T("Choose a drawing first."); return; }
    const button = event.currentTarget;
    button.disabled = true;
    if (status) status.textContent = T("Saving…");
    try {
      await publishSpotlight({
        galleryId: item.id,
        childName: document.getElementById("spotChildName").value.trim() || item.childName || "",
        childAge: document.getElementById("spotChildAge").value.trim(),
        imageUrl: item.imageUrl,
        artworkTitle: "",
        storyTitleEn: document.getElementById("spotStoryEn").value.trim(),
        storyTitleAr: document.getElementById("spotStoryAr").value.trim(),
        monthEn: document.getElementById("spotMonthEn").value.trim(),
        monthAr: document.getElementById("spotMonthAr").value.trim(),
        noteEn: document.getElementById("spotNoteEn").value.trim(),
        noteAr: document.getElementById("spotNoteAr").value.trim()
      });
      if (status) status.textContent = "";
      showToast(T("Featured on the home page! ✨"), "success");
    } catch (error) {
      console.error(error);
      if (status) status.textContent = T("Could not update the spotlight. Please try again.");
    } finally { button.disabled = false; }
  });

  document.getElementById("spotClear")?.addEventListener("click", async () => {
    try { await clearSpotlight(); showToast(T("Spotlight hidden from the home page."), "info"); }
    catch { if (status) status.textContent = T("Could not update the spotlight. Please try again."); }
  });

  window.addEventListener("dreamwings:language", populate);
}

document.addEventListener("DOMContentLoaded", initSpotlightPanel);
