/* ============================================================
   DreamWings — single-page magical reader
   Closed cover → one tap → golden opening → story pages.
   Everything below is bilingual (EN / AR) and re-renders on language change.
   ============================================================ */

import { db, auth } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { markBookRead, addStar, getReadIds, certificateProgress, addListeningMinutes } from "./dw-progress.js";
import { avatarSvg, loadAvatar, fetchAvatar } from "./dw-avatar.js";
import { saveJournalEntry } from "./dw-journal.js";
import { logReading } from "./dw-leaderboard.js";

const $ = id => document.getElementById(id);
const bookId = new URLSearchParams(location.search).get("id");
const audio = $("bookNarration");

const state = {
  book: null,
  pages: [],
  page: 0,
  resumePage: 0,
  opened: false,
  quizIndex: 0,
  quizOpen: false,
  quizAwarded: false,
  activeUid: null,
  avatar: null,
  logged: false
};

const T = (text, vars) => (typeof window.dwT === "function" ? window.dwT(text, vars) : text);
const lang = () => (typeof window.dwGetLanguage === "function" ? window.dwGetLanguage() : "en");

/* ------------------------------------------------------------
   Text helpers
   ------------------------------------------------------------ */

function getStory(data) {
  if (!data) return "";
  const candidates = [data.storyText, data.story, data.content, data.fullStory, data.storyContent];
  return candidates.find(value => typeof value === "string" && value.trim())?.trim() || "";
}

function makePages(text) {
  const paragraphs = String(text || "").replace(/\r/g, "").split(/\n+/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let page = "";
  const limit = 520;

  for (const paragraph of paragraphs) {
    let remaining = paragraph;
    while (remaining.length) {
      const separator = page ? "\n\n" : "";
      const room = limit - page.length - separator.length;
      if (remaining.length <= room) {
        page += separator + remaining;
        remaining = "";
      } else {
        let cut = remaining.lastIndexOf(" ", Math.max(1, room));
        if (cut < room * 0.55) cut = room;
        page += separator + remaining.slice(0, cut).trim();
        if (page.trim()) chunks.push(page.trim());
        page = "";
        remaining = remaining.slice(cut).trim();
      }
    }
    if (page.length > limit * 0.75) { chunks.push(page.trim()); page = ""; }
  }
  if (page.trim()) chunks.push(page.trim());
  return chunks.length ? chunks : [String(text || "").trim()].filter(Boolean);
}

function fillPage(element, text) {
  if (!element) return;
  element.replaceChildren();
  (text || "").split(/\n\n+/).filter(Boolean).forEach(paragraph => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    p.dir = "auto";
    element.appendChild(p);
  });
}

function localizedBook() {
  const book = state.book || {};
  const ar = lang() === "ar";
  return {
    title: (ar && book.titleAr) || book.title || T("Untitled Story"),
    author: (ar && book.authorAr) || book.author || "DreamWings",
    description: (ar && book.descriptionAr) || book.description || ""
  };
}

function renderCompanion() {
  const holder = $("dwCompanion");
  const face = $("dwCompanionFace");
  const bubble = $("dwCompanionBubble");
  if (!holder || !face) return;
  const avatar = state.avatar || loadAvatar(state.activeUid || "guest");
  state.avatar = avatar;
  face.innerHTML = avatarSvg(avatar, { size: 86, id: "reader" });
  if (bubble) bubble.textContent = T("I'm reading this one with you!");
  holder.hidden = !state.opened;
}

function setCompanionMessage(message) {
  const bubble = $("dwCompanionBubble");
  if (bubble) bubble.textContent = message;
}

function bindGratitude() {
  const button = $("gratitudeSave");
  if (!button) return;
  button.addEventListener("click", () => {
    const input = $("gratitudeText");
    const status = $("gratitudeStatus");
    const text = (input?.value || "").trim();
    if (!text) {
      if (status) status.textContent = T("Write one little happy moment first 💛");
      input?.focus();
      return;
    }
    const meta = localizedBook();
    saveJournalEntry(text, { bookId, bookTitle: meta.title });
    if (input) input.value = "";
    if (status) status.textContent = T("Saved to your bedtime journal ✨");
    button.disabled = true;
    setCompanionMessage(T("What a beautiful day to remember. Sleep well! 🌙"));
    if (typeof window.dwToast === "function") window.dwToast(T("Saved to your bedtime journal ✨"), "success");
    setTimeout(() => { button.disabled = false; }, 1200);
  });
}

function logFinishedStory() {
  if (state.logged || !state.book) return;
  state.logged = true;
  const meta = localizedBook();
  logReading({ bookId, title: state.book.title || meta.title, titleAr: state.book.titleAr || "", avatar: state.avatar || null });
}

function setStatus(message) {
  const element = $("readerStatus");
  if (element) element.textContent = message;
}

/* ------------------------------------------------------------
   Loading
   ------------------------------------------------------------ */

async function loadBook() {
  const loading = $("loading");

  if (!bookId) {
    if (loading) loading.textContent = T("No story was selected.");
    return;
  }

  try {
    const snapshot = await getDoc(doc(db, "books", bookId));
    if (!snapshot.exists()) {
      if (loading) loading.textContent = T("This book could not be found.");
      return;
    }

    state.book = snapshot.data();
    const book = state.book;
    const meta = localizedBook();

    if (loading) loading.hidden = true;
    document.body.classList.add("dw-cover-only");
    $("reader").hidden = false;
    $("reader").classList.add("is-closed");

    $("bookTitle").textContent = meta.title;
    $("coverTitle").textContent = meta.title;
    $("coverAuthor").textContent = meta.author;
    $("bookAuthor").textContent = book.author
      ? T("A story by {author}", { author: meta.author })
      : T("A DreamWings story");
    if ($("pageTitleChip")) $("pageTitleChip").textContent = meta.title;

    if (book.coverUrl) {
      $("bookCover").src = book.coverUrl;
      $("bookCover").hidden = false;
    } else {
      $("bookCover").hidden = true;
    }

    $("cover").hidden = false;
    $("openBook").hidden = true;
    $("prevPage").hidden = true;
    $("nextPage").hidden = true;

    const story = getStory(book);
    if (story) {
      state.pages = makePages(story);
      $("startReading").hidden = false;
      $("startReading").disabled = false;
    } else {
      $("startReading").hidden = true;
      setStatus(T("This book has no text story yet. The owner can add it from the Admin Panel."));
    }

    setupVideo(book);
    setupAudio(book);
    renderCertificateChip();
    updateQuizVisibility();

    document.title = `${meta.title} - DreamWings`;
  } catch (error) {
    console.error("Error loading book:", error);
    if (loading) loading.textContent = T("Could not load this story. Please try again.");
  }
}

function setupVideo(book) {
  const section = $("storyVideoSection");
  const video = $("storyVideo");
  if (!section || !video) return;
  if (book.videoUrl) {
    video.src = book.videoUrl;
    section.hidden = false;
    video.load();
  } else {
    video.pause();
    video.removeAttribute("src");
    video.load();
    section.hidden = true;
  }
}

let listenStart = 0;

function setupAudio(book) {
  if (!audio) return;
  if (!book.audioUrl) {
    $("playNarration").hidden = true;
    $("pauseNarration").hidden = true;
    return;
  }

  audio.src = book.audioUrl;
  $("playNarration").hidden = false;
  $("pauseNarration").hidden = false;

  $("playNarration").addEventListener("click", async () => {
    try {
      await audio.play();
      setStatus(T("Playing the narration uploaded for this book."));
    } catch {
      setStatus(T("Couldn't play the uploaded audio. Check the audio file URL."));
    }
  });

  $("pauseNarration").addEventListener("click", () => {
    audio.pause();
    setStatus(T("Narration paused."));
  });

  audio.addEventListener("play", () => { if (!listenStart) listenStart = Date.now(); });
  audio.addEventListener("pause", flushListening);
  audio.addEventListener("ended", () => {
    flushListening();
    setStatus(T("Narration finished."));
  });
  audio.addEventListener("error", () => setStatus(T("The uploaded audio file could not be loaded.")));
}

function flushListening() {
  if (!listenStart) return;
  const minutes = Math.floor((Date.now() - listenStart) / 60000);
  listenStart = 0;
  if (minutes > 0) addListeningMinutes(minutes);
}

/* ------------------------------------------------------------
   Opening the book
   ------------------------------------------------------------ */

function openBookWithAnimation() {
  if (!state.opened) {
    state.opened = true;
    const stage = $("bookStage");
    const cover = $("cover");
    const openBook = $("openBook");
    const startBtn = $("startReading");
    const hint = $("coverHint");

    stage.classList.add("is-opening");
    renderCompanion();

    setTimeout(() => {
      if (cover) cover.hidden = true;
      if (hint) hint.hidden = true;
      stage.classList.remove("is-opening", "opening");

      document.body.classList.remove("dw-cover-only");
      $("reader").classList.remove("is-closed");
      openBook.hidden = false;
      openBook.classList.add("revealing");

      state.page = Math.min(state.resumePage || 0, Math.max(state.pages.length - 1, 0));
      renderPage(false);
      document.body.classList.add("dw-reading");

      if (startBtn) startBtn.hidden = true;
      setStatus(T("Your story has begun. Enjoy reading! ✨"));

      markBookRead(bookId, state.activeUid || undefined);
      renderCertificateChip();
      setTimeout(() => openBook.classList.remove("revealing"), 900);
    }, 720);
  }
}

/* ------------------------------------------------------------
   Leaving fullscreen: back to the book details
   ------------------------------------------------------------ */

function closeBookToDetails() {
  if (!state.opened) return;

  state.opened = false;
  state.resumePage = state.page;

  try { audio?.pause(); } catch { /* ignore */ }
  document.body.classList.remove("dw-reading");

  $("reader")?.classList.add("is-closed");
  if ($("openBook")) $("openBook").hidden = true;
  if ($("cover")) $("cover").hidden = false;
  if ($("coverHint")) $("coverHint").hidden = false;
  ["prevPage", "nextPage", "takeQuizBtn"].forEach(id => { if ($(id)) $(id).hidden = true; });
  if ($("readerComplete")) $("readerComplete").hidden = true;

  const startBtn = $("startReading");
  if (startBtn) {
    startBtn.hidden = false;
    startBtn.disabled = false;
    const label = startBtn.querySelector("span");
    if (label) label.textContent = T("Continue Reading");
  }

  setStatus(T("Back to the book details — you can watch the story video below."));
  $("reader")?.scrollIntoView({ behavior: "smooth", block: "start" });
  startBtn?.focus({ preventScroll: true });
}

/* ------------------------------------------------------------
   Pages
   ------------------------------------------------------------ */

function renderPage(animate = true) {
  if (!state.pages.length) return;
  const index = state.page;
  const body = $("singlePageBody");

  if (animate && body) {
    body.classList.remove("page-flip-anim");
    void body.offsetWidth;
    body.classList.add("page-flip-anim");
  }

  fillPage($("pageText"), state.pages[index] || "");

  const total = state.pages.length;
  if ($("pagePill")) $("pagePill").textContent = T("Page {current} of {total}", { current: index + 1, total });
  if ($("pageFooterNumber")) $("pageFooterNumber").textContent = T("Page {current} of {total}", { current: index + 1, total });

  const list = Array.isArray(state.book?.illustrationUrls)
    ? state.book.illustrationUrls
    : (Array.isArray(state.book?.storyIllustrations) ? state.book.storyIllustrations : []);

  const image = $("pageIllustration");
  const box = $("illustrationBox");
  const illustration = list[index];

  if (illustration && image && box) {
    image.src = illustration;
    image.hidden = false;
    box.hidden = false;
  } else if (image && box) {
    image.hidden = true;
    image.removeAttribute("src");
    box.hidden = true;
  }

  $("openBook").hidden = false;
  $("prevPage").hidden = false;
  $("nextPage").hidden = false;
  $("prevPage").disabled = index <= 0;
  $("nextPage").disabled = index >= total - 1;

  if ($("pageProgress")) {
    $("pageProgress").textContent = `${index + 1} / ${total}`;
  }
  if ($("progressFill")) {
    $("progressFill").style.width = `${((index + 1) / Math.max(total, 1)) * 100}%`;
  }

  const isLast = index === total - 1;
  if ($("readerComplete")) $("readerComplete").hidden = !isLast;

  updateQuizVisibility();
}

function goToPage(next) {
  if (next < 0 || next >= state.pages.length) return;
  state.page = next;
  renderPage(true);
  if (next === state.pages.length - 1) {
    markBookRead(bookId, state.activeUid || undefined);
    renderCertificateChip();
    logFinishedStory();
  }
}

function renderCertificateChip() {
  const chip = $("readerCertText");
  if (!chip) return;
  const progress = certificateProgress(getReadIds(state.activeUid || undefined));
  chip.textContent = progress.unlocked
    ? T("You unlocked your certificate!")
    : T("Read {count} of {target} stories to unlock your certificate", {
        count: progress.count,
        target: progress.target
      });
}

/* ------------------------------------------------------------
   Post-story magic quiz
   ------------------------------------------------------------ */

function quizQuestions() {
  const meta = localizedBook();
  const ar = lang() === "ar";
  const custom = Array.isArray(state.book?.quiz) ? state.book.quiz : [];

  if (custom.length) {
    return custom.slice(0, 3).map(item => ({
      question: (ar && item.qAr) || item.qEn || "",
      options: (ar && Array.isArray(item.optionsAr) ? item.optionsAr : item.optionsEn) || [],
      correct: Number(item.answer ?? item.correct ?? 0)
    })).filter(item => item.question && item.options.length);
  }

  if (ar) {
    return [
      {
        question: `ما هي أجمل رسالة تعلّمناها من حكاية «${meta.title}»؟`,
        options: [
          "أن الطيبة والشجاعة تجعلان العالم مكاناً أفضل دائماً ✨",
          "أن نبقى صامتين ولا نشارك أصدقاءنا شيئاً",
          "ألا نجرب أي مغامرة جديدة"
        ],
        correct: 0
      },
      {
        question: "كيف واجه أبطال القصة التحدي الذي مرّوا به؟",
        options: [
          "بالاستسلام والابتعاد",
          "بالصبر والتعاون والإيمان بأنفسهم 💖",
          "بالغضب على الآخرين"
        ],
        correct: 1
      },
      {
        question: "ما هو الشيء السحري الذي يبقى في قلوبنا بعد هذه الحكاية؟",
        options: [
          "شعلة الأمل وحب مساعدة من حولنا 🌟",
          "الخوف من الظلام",
          "نسيان الحكاية بسرعة"
        ],
        correct: 0
      }
    ];
  }

  return [
    {
      question: `What was the most heartwarming message of “${meta.title}”?`,
      options: [
        "Kindness and believing in yourself light up the darkest night ✨",
        "To never try anything new or adventurous",
        "To stay alone and not share with friends"
      ],
      correct: 0
    },
    {
      question: "How did the story characters overcome their challenge?",
      options: [
        "By giving up right away",
        "With patience, friendship, and teamwork 💖",
        "By walking away"
      ],
      correct: 1
    },
    {
      question: "What magical feeling stays with us after this story?",
      options: [
        "Hope, wonder, and the joy of helping others 🌟",
        "Being afraid of adventures",
        "Forgetting what we learned"
      ],
      correct: 0
    }
  ];
}

function updateQuizVisibility() {
  const quizBtn = $("takeQuizBtn");
  if (!quizBtn) return;
  const onLastPage = state.opened && state.page >= state.pages.length - 1 && state.pages.length > 0;
  quizBtn.hidden = !onLastPage;
}

function renderQuizQuestion() {
  const questions = quizQuestions();
  const question = questions[state.quizIndex];
  if (!question) return;

  $("quizQuestionsContainer").style.display = "block";
  $("quizVictoryBox").style.display = "none";

  $("quizQuestionCount").textContent = T("Question {current} of {total}", {
    current: state.quizIndex + 1,
    total: questions.length
  });
  $("quizQuestionText").textContent = question.question;

  const grid = $("quizOptionsGrid");
  grid.replaceChildren();

  question.options.forEach((optionText, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option-btn";

    const icon = document.createElement("i");
    icon.className = "fa-regular fa-circle";
    const label = document.createElement("span");
    label.textContent = optionText;
    button.append(icon, label);

    button.addEventListener("click", () => {
      if (index === question.correct) {
        button.classList.add("correct");
        icon.className = "fa-solid fa-circle-check";
        setStatus(T("Correct! ✨"));

        setTimeout(() => {
          if (state.quizIndex < questions.length - 1) {
            state.quizIndex++;
            renderQuizQuestion();
          } else {
            showQuizVictory();
          }
        }, 620);
      } else {
        button.classList.add("wrong");
        icon.className = "fa-solid fa-circle-xmark";
        setStatus(T("Almost! Try again 💛"));
        setTimeout(() => {
          button.classList.remove("wrong");
          icon.className = "fa-regular fa-circle";
        }, 800);
      }
    });

    grid.appendChild(button);
  });
}

function showQuizVictory() {
  $("quizQuestionsContainer").style.display = "none";
  $("quizVictoryBox").style.display = "flex";

  if (typeof window.confetti === "function") {
    window.confetti({ particleCount: 90, spread: 72, origin: { y: 0.62 } });
  }

  if (!state.quizAwarded) {
    state.quizAwarded = true;
    addStar(state.activeUid || undefined);
    try {
      localStorage.setItem(`dreamwings:quiz:${state.activeUid || "guest"}:${bookId}`, "done");
    } catch { /* ignore */ }
  }
}

function openQuiz() {
  state.quizIndex = 0;
  state.quizOpen = true;
  renderQuizQuestion();
  $("quizModal")?.classList.add("active");
}

function closeQuiz() {
  state.quizOpen = false;
  $("quizModal")?.classList.remove("active");
}

/* ------------------------------------------------------------
   Wiring
   ------------------------------------------------------------ */

bindGratitude();
$("startReading")?.addEventListener("click", openBookWithAnimation);
$("readerBack")?.addEventListener("click", closeBookToDetails);
$("prevPage")?.addEventListener("click", () => goToPage(state.page - 1));
$("nextPage")?.addEventListener("click", () => goToPage(state.page + 1));
$("takeQuizBtn")?.addEventListener("click", openQuiz);
$("completeQuizBtn")?.addEventListener("click", openQuiz);
$("closeQuizBtn")?.addEventListener("click", closeQuiz);
$("finishQuizBtn")?.addEventListener("click", () => {
  closeQuiz();
  if (typeof window.dwToast === "function") {
    window.dwToast(T("⭐ Magical Excellence Star awarded! Keep shining! ✨"), "success");
  }
});
$("readAgainBtn")?.addEventListener("click", () => {
  state.page = 0;
  renderPage(true);
  $("readerComplete").hidden = true;
  document.querySelector(".book-stage")?.scrollIntoView({ behavior: "smooth", block: "center" });
});

$("quizModal")?.addEventListener("click", event => {
  if (event.target === $("quizModal")) closeQuiz();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && state.quizOpen) { closeQuiz(); return; }
  if (event.key === "Escape" && state.opened) { closeBookToDetails(); return; }
  if (!state.opened || state.quizOpen) return;
  if (event.key === "ArrowRight" && lang() !== "ar") goToPage(state.page + 1);
  if (event.key === "ArrowLeft" && lang() !== "ar") goToPage(state.page - 1);
});

onAuthStateChanged(auth, async user => {
  state.activeUid = user?.uid || null;
  renderCertificateChip();
  state.avatar = user?.uid ? await fetchAvatar(user.uid) : loadAvatar("guest");
  renderCompanion();
});

window.addEventListener("pagehide", () => {
  audio?.pause();
  flushListening();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) flushListening();
});

/* Language switch: refresh every dynamic string without reloading the page. */
window.addEventListener("dreamwings:language", () => {
  renderCompanion();
  if (!state.book) return;
  const meta = localizedBook();
  $("bookTitle").textContent = meta.title;
  $("coverTitle").textContent = meta.title;
  $("coverAuthor").textContent = meta.author;
  $("bookAuthor").textContent = state.book.author
    ? T("A story by {author}", { author: meta.author })
    : T("A DreamWings story");
  if ($("pageTitleChip")) $("pageTitleChip").textContent = meta.title;
  document.title = `${meta.title} - DreamWings`;

  renderCertificateChip();
  if (state.pages.length) renderPage(false);
  if (state.quizOpen) renderQuizQuestion();
});

loadBook();
