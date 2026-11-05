/* ============================================================
   DreamWings — Monthly Book Club
   Creator-selected featured story (site/bookClub), bilingual
   discussion prompts and family reflections in Firestore.
   ============================================================ */

import { db, auth } from "./firebase-config.js";
import {
  doc, getDoc, collection, addDoc, query, orderBy, limit,
  getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { BOOK_CLUB_DOC, escapeHtml } from "./dw-config.js";
import { showToast } from "./notifications.js";

const $ = id => document.getElementById(id);
const T = (text, vars) => (typeof window.dwT === "function" ? window.dwT(text, vars) : text);
const lang = () => (typeof window.dwGetLanguage === "function" ? window.dwGetLanguage() : "en");
const isArabic = () => lang() === "ar";

const REFLECTIONS = "bookClubReflections";

/* Bilingual fallback so the page is never empty before the creator
   publishes this month's selection. */
const FALLBACK_CLUB = {
  bookId: "benny-bear-sleepy-star",
  monthEn: "November",
  monthAr: "نوفمبر",
  bookTitleEn: "Benny Bear & The Sleepy Star",
  bookTitleAr: "بيني بير والنجمة الناعسة",
  descriptionEn: "A heartwarming bedtime adventure about small acts of kindness, empathy, and learning that even the softest light can brighten someone's lonely night.",
  descriptionAr: "مغامرة دافئة قبل النوم عن أعمال الطيبة الصغيرة والتعاطف، وعن أن أنعم ضوء يمكن أن يضيء ليلة وحيدة.",
  moralEn: "Kindness is never too small — even one warm blanket can comfort a lonely heart.",
  moralAr: "الطيبة لا تكون صغيرة أبداً — حتى بطانية دافئة واحدة قد تريح قلباً وحيداً.",
  coverUrl: "book-10.jfif",
  questions: [
    { en: "What did Benny Bear do when he saw that the sleepy star was feeling lonely?", ar: "ماذا فعل بيني بير عندما رأى النجمة الناعسة تشعر بالوحدة؟" },
    { en: "How can we share our own “warm blanket” with a friend who might need kindness?", ar: "كيف يمكننا مشاركة «بطانيتنا الدافئة» مع صديق يحتاج إلى الطيبة؟" },
    { en: "Why does doing something kind for others make our own bedtime feel warmer?", ar: "لماذا يجعل فعل الطيبة مع الآخرين وقت نومنا أكثر دفئاً؟" }
  ]
};

const state = {
  club: null,
  reflections: [],
  loaded: false,
  posting: false
};

/* ---------------- boot ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  bindForm();
  loadClub();
  loadReflections();
  window.addEventListener("dreamwings:language", renderAll);
});

async function loadClub() {
  try {
    const snap = await getDoc(doc(db, ...BOOK_CLUB_DOC));
    state.club = snap.exists() ? normalizeClub(snap.data()) : FALLBACK_CLUB;
  } catch (error) {
    console.warn("Book club unavailable, using fallback:", error);
    state.club = FALLBACK_CLUB;
  }
  state.loaded = true;
  renderAll();
}

function normalizeClub(data) {
  const clean = value => (typeof value === "string" ? value.trim() : "");
  const questions = Array.isArray(data.questions)
    ? data.questions
      .map(item => ({ en: clean(item?.en), ar: clean(item?.ar) }))
      .filter(item => item.en || item.ar)
    : [];
  return {
    bookId: clean(data.bookId),
    monthEn: clean(data.monthEn),
    monthAr: clean(data.monthAr),
    bookTitleEn: clean(data.bookTitleEn) || FALLBACK_CLUB.bookTitleEn,
    bookTitleAr: clean(data.bookTitleAr) || FALLBACK_CLUB.bookTitleAr,
    descriptionEn: clean(data.descriptionEn) || FALLBACK_CLUB.descriptionEn,
    descriptionAr: clean(data.descriptionAr) || FALLBACK_CLUB.descriptionAr,
    moralEn: clean(data.moralEn),
    moralAr: clean(data.moralAr),
    coverUrl: clean(data.coverUrl) || FALLBACK_CLUB.coverUrl,
    questions: questions.length ? questions : FALLBACK_CLUB.questions
  };
}

/* ---------------- rendering ---------------- */
function renderAll() {
  renderClub();
  renderQuestions();
  renderReflections();
  translatePlaceholders();
}

function renderClub() {
  const club = state.club || FALLBACK_CLUB;
  const ar = isArabic();

  const badge = $("clubBadge");
  if (badge) {
    const month = ar ? (club.monthAr || club.monthEn) : club.monthEn;
    badge.textContent = month
      ? `${month} · ${T("Featured Book of the Month")}`
      : T("Featured Book of the Month");
  }

  const cover = $("clubCover");
  if (cover) {
    cover.src = club.coverUrl || FALLBACK_CLUB.coverUrl;
    cover.alt = ar ? club.bookTitleAr : club.bookTitleEn;
  }

  const title = $("clubTitle");
  if (title) title.textContent = ar ? (club.bookTitleAr || club.bookTitleEn) : club.bookTitleEn;

  const desc = $("clubDesc");
  if (desc) desc.textContent = ar ? (club.descriptionAr || club.descriptionEn) : club.descriptionEn;

  const moral = $("clubMoral");
  const moralBox = moral?.closest(".dw-moral-box");
  const moralText = ar ? (club.moralAr || club.moralEn) : club.moralEn;
  if (moral) moral.textContent = moralText || "";
  if (moralBox) moralBox.hidden = !moralText;

  const readBtn = $("clubReadBtn");
  if (readBtn) {
    const label = readBtn.querySelector("span");
    if (label) label.textContent = T("Read Book of the Month");
    if (club.bookId) {
      readBtn.href = `reader.html?id=${encodeURIComponent(club.bookId)}`;
      readBtn.hidden = false;
    } else {
      readBtn.href = "library.html";
    }
  }
}

function renderQuestions() {
  const holder = $("clubQuestions");
  if (!holder) return;
  const club = state.club || FALLBACK_CLUB;
  const ar = isArabic();

  holder.replaceChildren();
  club.questions.forEach((question, index) => {
    const text = ar ? (question.ar || question.en) : question.en;
    if (!text) return;
    const card = document.createElement("div");
    card.className = "dw-question-card";
    card.dir = ar ? "rtl" : "ltr";
    card.innerHTML = `
      <span class="dw-question-num">${index + 1}</span>
      <p class="dw-question-text">${escapeHtml(text)}</p>`;
    holder.appendChild(card);
  });
}

function renderReflections() {
  const feed = $("reflectionFeed");
  const empty = $("reflectionEmpty");
  if (!feed) return;

  feed.replaceChildren();
  const ar = isArabic();

  if (!state.reflections.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  state.reflections.forEach(item => {
    const row = document.createElement("article");
    row.className = "dw-reflection";
    row.dir = ar ? "rtl" : "ltr";
    const name = document.createElement("div");
    name.className = "dw-reflection-author";
    name.innerHTML = `<i class="fa-solid fa-star"></i>`;
    name.appendChild(document.createTextNode(item.name));
    const body = document.createElement("p");
    body.className = "dw-reflection-body";
    body.textContent = `“${item.text}”`;
    row.append(name, body);
    feed.appendChild(row);
  });
}

async function loadReflections() {
  try {
    const snap = await getDocs(query(
      collection(db, REFLECTIONS),
      orderBy("createdAt", "desc"),
      limit(30)
    ));
    state.reflections = snap.docs
      .map(entry => entry.data())
      .filter(item => item && item.text && item.approved !== false)
      .map(item => ({ name: item.name || "DreamWings Family", text: item.text }));
  } catch (error) {
    console.warn("Reflections could not be loaded:", error);
    state.reflections = [];
  }
  renderReflections();
}

/* ---------------- form ---------------- */
function bindForm() {
  const form = $("reflectionForm");
  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (state.posting) return;

    const nameInput = $("reflectionName");
    const textInput = $("reflectionText");
    const status = $("reflectionStatus");
    const submit = $("reflectionSubmit");

    const name = (nameInput?.value || "").trim().replace(/\s+/g, " ");
    const text = (textInput?.value || "").trim();

    if (!name || !text) {
      setStatus(T("Please add your name and a short reflection."), "error");
      (name ? textInput : nameInput)?.focus();
      return;
    }

    state.posting = true;
    if (submit) submit.disabled = true;
    setStatus(T("Posting your reflection…"));

    try {
      const payload = {
        name: name.slice(0, 60),
        text: text.slice(0, 500),
        bookId: (state.club || FALLBACK_CLUB).bookId || "",
        monthEn: (state.club || FALLBACK_CLUB).monthEn || "",
        uid: auth.currentUser?.uid || null,
        approved: true,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, REFLECTIONS), payload);

      state.reflections.unshift({ name: payload.name, text: payload.text });
      state.reflections = state.reflections.slice(0, 30);
      renderReflections();

      form.reset();
      setStatus("");
      showToast(T("🧡 Thank you for sharing your family reflection with our Book Club! ✨"), "success");
    } catch (error) {
      console.error("Reflection could not be posted:", error);
      setStatus(T("Your reflection could not be posted. Please try again."), "error");
    } finally {
      state.posting = false;
      if (submit) submit.disabled = false;
    }
  });
}

function setStatus(message, type = "") {
  const status = $("reflectionStatus");
  if (!status) return;
  status.textContent = message;
  status.dataset.state = type;
}

function translatePlaceholders() {
  const name = $("reflectionName");
  const text = $("reflectionText");
  if (name) name.placeholder = T("Parent & Child Name (e.g. Mama Sarah & Adam)");
  if (text) text.placeholder = T("What was your child's favorite part or answer?");
}
