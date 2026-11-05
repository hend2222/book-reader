/* ============================================================
   DreamWings — smart bilingual library search
   One search bar understands English + Arabic, genres and magic words.
   ============================================================ */

import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { DEFAULT_CATEGORIES, escapeHtml } from "./dw-config.js";

const T = (text, vars) => (typeof window.dwT === "function" ? window.dwT(text, vars) : text);
const lang = () => (typeof window.dwGetLanguage === "function" ? window.dwGetLanguage() : "en");

/* Words that mean the same thing in both languages. */
const GROUPS = {
  animals: ["animals", "animal", "pets", "pet", "bear", "rabbit", "cat", "fox", "owl", "forest", "paw",
    "حيوانات", "حيوان", "دب", "أرنب", "قطة", "ثعلب", "بومة", "غابة", "أليف", "بنى", "بني"],
  space: ["space", "stars", "star", "moon", "sun", "planet", "planets", "rocket", "astronaut", "galaxy", "cosmos",
    "فضاء", "نجوم", "نجمة", "قمر", "شمس", "كواكب", "كوكب", "صاروخ", "رائد", "مجرة", "كون"],
  adventure: ["adventure", "adventures", "journey", "explore", "quest", "travel",
    "مغامرة", "مغامرات", "رحلة", "استكشاف", "مهمة", "سفر"],
  kindness: ["kindness", "kind", "friendship", "friend", "sharing", "empathy", "family", "love", "values", "moral",
    "طيبة", "لطف", "صداقة", "صديق", "مشاركة", "تعاطف", "عائلة", "حب", "قيم", "أخلاق"],
  bedtime: ["bedtime", "sleep", "sleepy", "night", "dream", "dreams", "lullaby", "calm",
    "نوم", "نعاس", "ليل", "حلم", "أحلام", "تهويدة", "هدوء", "ما قبل النوم"],
  magic: ["magic", "magical", "wizard", "fairy", "castle", "kingdom", "kingdoms", "dragon", "wand", "fantasy",
    "سحر", "سحري", "ساحر", "جنية", "قلعة", "مملكة", "ممالك", "تنين", "عصا", "خيال"],
  science: ["science", "scientist", "experiment", "nature", "plants", "discovery", "school", "learn",
    "علوم", "عالم", "تجربة", "تجارب", "طبيعة", "نباتات", "اكتشاف", "مدرسة", "تعلم"],
  time: ["time", "history", "dinosaur", "future", "clock", "portal", "portals",
    "زمن", "تاريخ", "ديناصور", "مستقبل", "ساعة", "بوابة", "بوابات"]
};

const WORD_TO_GROUP = new Map();
Object.entries(GROUPS).forEach(([group, words]) => {
  words.forEach(word => WORD_TO_GROUP.set(normalize(word), group));
});

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return normalize(value).split(" ").filter(Boolean);
}

function expand(token) {
  const group = WORD_TO_GROUP.get(token);
  return group ? new Set([token, ...GROUPS[group].map(normalize)]) : new Set([token]);
}

function matches(haystack, queryTokens) {
  if (!queryTokens.length) return true;
  const words = new Set(tokens(haystack));
  return queryTokens.every(token => {
    const options = expand(token);
    for (const option of options) if (words.has(option)) return true;
    return false;
  });
}

const state = {
  books: [],
  query: "",
  genre: "all",
  loaded: false
};

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("librarySearchInput");
  const clearBtn = document.getElementById("clearSearchBtn");
  const voiceBtn = document.getElementById("voiceSearchBtn");
  const chips = [...document.querySelectorAll(".filter-chip")];
  const note = document.getElementById("searchResultNote");
  const shelves = [...document.querySelectorAll(".shelf-wrapper")];
  const cards = [...document.querySelectorAll(".book-card")];
  const emptyBox = document.getElementById("searchEmptyBox");
  const shelvesMain = document.getElementById("shelvesMain");
  const resultsSection = document.getElementById("searchResultsSection");
  const resultsGrid = document.getElementById("searchResults");
  const resultsCount = document.getElementById("resultsCount");
  const resetBtn = document.getElementById("resetFiltersBtn");
  const suggestions = [...document.querySelectorAll("[data-suggest]")];

  loadBooks();

  async function loadBooks() {
    try {
      const snap = await getDocs(collection(db, "books"));
      state.books = snap.docs.map(item => ({ id: item.id, ...item.data() }));
    } catch (error) {
      console.warn("Library search could not load books:", error);
    } finally {
      state.loaded = true;
      if (state.query || state.genre !== "all") applyFilters();
    }
  }

  function categoryMeta(id) {
    return DEFAULT_CATEGORIES.find(category => category.id === id) || null;
  }

  function bookHaystack(book) {
    const category = categoryMeta(book.category);
    return [
      book.title, book.titleAr, book.author, book.description, book.descriptionAr,
      book.category, category?.name, category?.nameAr
    ].filter(Boolean).join(" ");
  }

  function bookTitle(book) {
    return (lang() === "ar" && book.titleAr) || book.title || T("Untitled Story");
  }

  function genreMatches(book) {
    if (state.genre === "all") return true;
    if (book.category === state.genre) return true;
    const group = GROUPS[state.genre];
    if (!group) return false;
    const words = new Set(tokens(bookHaystack(book)));
    return group.map(normalize).some(word => words.has(word));
  }

  function shelfMatches(shelf) {
    const keywords = shelf.dataset.keywords || "";
    const genre = shelf.dataset.genre || "";
    if (state.genre !== "all" && genre !== state.genre) {
      const group = GROUPS[state.genre] || [];
      const words = new Set(tokens(keywords));
      if (!group.map(normalize).some(word => words.has(word))) return false;
    }
    if (state.query) {
      return matches(`${keywords} ${shelf.dataset.title || ""}`, tokens(state.query));
    }
    return state.genre !== "all";
  }

  function applyFilters() {
    const queryTokens = tokens(state.query);
    const filtering = !!state.query || state.genre !== "all";

    if (!filtering) {
      shelvesMain.hidden = false;
      resultsSection.hidden = true;
      emptyBox.hidden = true;
      note.hidden = true;
      shelves.forEach(shelf => { shelf.style.display = ""; });
      cards.forEach(card => { card.style.display = ""; });
      if (clearBtn) clearBtn.hidden = true;
      return;
    }

    shelvesMain.hidden = true;
    resultsSection.hidden = false;
    if (clearBtn) clearBtn.hidden = !state.query;

    const books = state.books.filter(book =>
      genreMatches(book) && matches(bookHaystack(book), queryTokens)
    );

    const matchingShelves = shelves.filter(shelfMatches);

    resultsGrid.replaceChildren();
    books.forEach(book => resultsGrid.appendChild(bookCard(book)));
    matchingShelves.forEach(shelf => resultsGrid.appendChild(shelfCard(shelf)));

    const total = books.length + matchingShelves.length;

    if (!total) {
      const empty = document.createElement("div");
      empty.className = "dw-results-empty";
      empty.innerHTML = `
        <i class="fa-solid fa-magnifying-glass"></i>
        <h3>${escapeHtml(T("No Stories Found"))}</h3>
        <p>${escapeHtml(T("Try searching for other words like “space”, “stars”, “animals”, or click “All Stories”!"))}</p>`;
      resultsGrid.appendChild(empty);
    }

    if (resultsCount) {
      resultsCount.textContent = T("{count} magical stories found ✨", { count: total });
    }
    if (note) {
      note.hidden = false;
      note.textContent = state.query
        ? T("Showing {count} stories for “{query}”", { count: total, query: state.query })
        : T("{count} magical stories found ✨", { count: total });
    }
    if (emptyBox) emptyBox.hidden = true;
  }

  function bookCard(book) {
    const card = document.createElement("article");
    card.className = "dw-result-card";
    card.tabIndex = 0;
    const category = categoryMeta(book.category);
    const cover = book.coverUrl
      ? `<img src="${escapeHtml(book.coverUrl)}" alt="${escapeHtml(bookTitle(book))}" loading="lazy">`
      : `<div style="height:100%;display:grid;place-items:center;background:linear-gradient(145deg,${category?.color || "#6b422b"},#2f1c15);color:#ffe6ba;font-size:34px;"><i class="fa-solid ${category?.icon || "fa-book-open"}"></i></div>`;

    card.innerHTML = `
      <div class="dw-result-cover">
        ${cover}
        ${category ? `<span class="dw-result-badge">${escapeHtml(lang() === "ar" ? (category.nameAr || category.name) : category.name)}</span>` : ""}
      </div>
      <h3 class="dw-result-title">${escapeHtml(bookTitle(book))}</h3>
      <span class="dw-result-author">${escapeHtml(book.author || "DreamWings")}</span>`;

    const open = () => { location.href = `reader.html?id=${encodeURIComponent(book.id)}`; };
    card.addEventListener("click", open);
    card.addEventListener("keydown", event => { if (event.key === "Enter") open(); });
    return card;
  }

  function shelfCard(shelf) {
    const card = document.createElement("article");
    card.className = "dw-result-card";
    card.tabIndex = 0;
    const title = shelf.dataset.title || shelf.querySelector("h3")?.textContent || "";
    const author = shelf.dataset.author || "";
    const category = categoryMeta(shelf.dataset.genre || "");
    const color = category?.color || "#6b422b";
    const icon = category?.icon || "fa-book-open";

    card.innerHTML = `
      <div class="dw-result-cover">
        <div style="height:100%;display:grid;place-items:center;gap:10px;background:linear-gradient(145deg,${color},#241410);color:#ffe6ba;">
          <i class="fa-solid ${icon}" style="font-size:40px;"></i>
          <span style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#ffd88a;">${escapeHtml(T("Story pages"))}</span>
        </div>
      </div>
      <h3 class="dw-result-title">${escapeHtml(lang() === "ar" ? (category?.nameAr || title) : title)}</h3>
      <span class="dw-result-author">${escapeHtml(lang() === "ar" ? (category?.nameAr || author) : author)}</span>`;

    const open = () => { location.href = `category.html?id=${encodeURIComponent(shelf.dataset.genre || "")}`; };
    card.addEventListener("click", open);
    card.addEventListener("keydown", event => { if (event.key === "Enter") open(); });
    return card;
  }

  function setGenre(genre) {
    state.genre = genre || "all";
    chips.forEach(chip => chip.classList.toggle("active", chip.dataset.genre === state.genre));
    applyFilters();
  }

  let debounce = null;
  input?.addEventListener("input", () => {
    state.query = input.value.trim();
    clearTimeout(debounce);
    debounce = setTimeout(applyFilters, 140);
  });

  input?.addEventListener("keydown", event => {
    if (event.key === "Enter") { event.preventDefault(); applyFilters(); }
  });

  clearBtn?.addEventListener("click", () => {
    if (input) input.value = "";
    state.query = "";
    applyFilters();
    input?.focus();
  });

  resetBtn?.addEventListener("click", () => {
    if (input) input.value = "";
    state.query = "";
    setGenre("all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  chips.forEach(chip => {
    chip.addEventListener("click", () => setGenre(chip.dataset.genre || "all"));
  });

  suggestions.forEach(button => {
    button.addEventListener("click", () => {
      const keyword = button.dataset.suggest || "";
      const labels = {
        animals: "Animals", space: "Space", adventure: "Adventure", kindness: "Kindness",
        bedtime: "Bedtime", magic: "Magic", science: "Science", time: "Time travel"
      };
      if (input) input.value = T(labels[keyword] || keyword);
      state.query = input?.value.trim() || keyword;
      applyFilters();
      document.getElementById("librarySearchInput")?.focus();
    });
  });

  /* Voice search */
  if (voiceBtn) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      voiceBtn.addEventListener("click", () => {
        recognition.lang = lang() === "ar" ? "ar-SA" : "en-US";
        try {
          recognition.start();
          voiceBtn.classList.add("recording");
          if (typeof window.dwToast === "function") {
            window.dwToast(T("🎙️ Listening... Tell us what story you want to read!"), "info");
          }
        } catch {
          recognition.stop();
          voiceBtn.classList.remove("recording");
        }
      });

      recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        if (input) input.value = transcript;
        state.query = transcript.trim();
        voiceBtn.classList.remove("recording");
        applyFilters();
      };

      recognition.onerror = () => voiceBtn.classList.remove("recording");
      recognition.onend = () => voiceBtn.classList.remove("recording");
    } else {
      voiceBtn.addEventListener("click", () => {
        if (typeof window.dwToast === "function") {
          window.dwToast(T("Voice search is supported on Chrome and mobile browsers with microphone enabled ✨"), "info");
        }
      });
    }
  }

  window.addEventListener("dreamwings:language", () => {
    if (state.query || state.genre !== "all") applyFilters();
  });
});
