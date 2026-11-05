import { showToast } from "./notifications.js";
import { auth, db } from "./firebase-config.js";
import { isPlatformAdmin } from "./admin-guard.js";
import { getStars, certificateProgress } from "./dw-progress.js";
import { mountAvatarStudio } from "./dw-avatar.js";
import { listJournalEntries, saveJournalEntry } from "./dw-journal.js";
import { loadWeekChampions, boardMarkup, championTitle } from "./dw-leaderboard.js";
import {
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const $ = id => document.getElementById(id);

const avatarDefaults = ["🦊", "🐻", "🦉", "🐱", "🦋", "🦄", "🐼", "🐰"];

let currentUser = null;
let selectedEmoji = "🦊";
let selectedPhoto = "";
let latestProfile = {};
let displayName = "Reader";

/* ---------------- language helper ---------------- */
const tr = (text, vars) => (typeof window.dwT === "function" ? window.dwT(text, vars) : text);

/* ============================================================
   REAL PROFILE STATISTICS
   Sources are the same ones the rest of the app writes to, so
   the numbers always match what the reader actually did:

   1) Stories Read    -> users/{uid}.readBooks (Firestore array,
                         written by reader.js) + local mirror
   2) Favorite Books  -> dreamwings:favorites:{uid} (the exact
                         list rendered on this page and favorite.html)
   3) Listening Time  -> dreamwings:listening:{uid} minutes added
                         by the reader's audio player, mirrored to
                         users/{uid}.listeningMinutes in Firestore
   ============================================================ */
const readKey = uid => `dreamwings:read:${uid || "guest"}`;
const favKey = uid => `dreamwings:favorites:${uid || "guest"}`;
const listenKey = uid => `dreamwings:listening:${uid || "guest"}`;

function parseList(raw) {
  try {
    const value = JSON.parse(raw || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function uniqueIds(...lists) {
  const set = new Set();
  lists.flat().forEach(item => {
    if (!item) return;
    set.add(typeof item === "string" ? item : item.id);
  });
  return set;
}

function formatListening(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  if (total < 60) return `${total} ${tr("mins")}`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!rest) return `${hours} ${tr("hours")}`;
  const currentLang = typeof window.dwGetLanguage === "function" ? window.dwGetLanguage() : "en";
  return currentLang === "ar"
    ? `${hours} ${tr("hours")} و ${rest} ${tr("mins")}`
    : `${hours} ${tr("hours")} ${rest} ${tr("mins")}`;
}

function renderStats() {
  if (!currentUser) return;
  const uid = currentUser.uid;

  const readIds = uniqueIds(
    parseList(localStorage.getItem(readKey(uid))),
    Array.isArray(latestProfile.readBooks) ? latestProfile.readBooks : []
  );

  const favouriteIds = uniqueIds(
    parseList(localStorage.getItem(favKey(uid))),
    Array.isArray(latestProfile.favoriteBooks) ? latestProfile.favoriteBooks : []
  );

  const localMinutes = Number(localStorage.getItem(listenKey(uid)) || 0);
  const cloudMinutes = Number(latestProfile.listeningMinutes || 0);
  const minutes = Math.max(localMinutes, cloudMinutes);

  const readCount = readIds.size;
  const favCount = favouriteIds.size;

  const readEl = $("storiesReadCount");
  const favEl = $("favoriteCount");
  const listenEl = $("listeningTime");

  if (readEl) readEl.textContent = String(readCount);
  if (favEl) favEl.textContent = String(favCount);
  if (listenEl) listenEl.textContent = formatListening(minutes);

  const starsEl = $("excellenceStars");
  if (starsEl) starsEl.textContent = String(getStars(uid));

  const certificate = certificateProgress([...readIds]);
  const certText = $("profileCertText");
  const certFill = $("profileCertFill");
  if (certText) {
    certText.textContent = certificate.unlocked
      ? tr("You unlocked your certificate!")
      : tr("Read {count} of {target} stories to unlock your certificate", {
          count: certificate.count,
          target: certificate.target
        });
  }
  if (certFill) certFill.style.width = `${certificate.percent}%`;

  renderBadges({ readCount, favoriteCount: favCount, listeningMinutes: minutes });
}

/* ============================================================
   🏆 GAMIFIED BADGES & REWARDS SYSTEM
   Tracks reading milestones, listening time, and saved favorites,
   unlocking magical badges and synchronizing progress with Firestore.
   ============================================================ */
const BADGES = [
  {
    id: "story-explorer",
    icon: "🌟",
    titleEn: "Story Explorer",
    titleAr: "مستكشف الحكايات",
    descEn: "Read your first magical story",
    descAr: "اقرأ أول قصة سحرية لك في دريم وينجز",
    type: "read",
    target: 1,
    tier: "bronze"
  },
  {
    id: "space-explorer",
    icon: "🚀",
    titleEn: "Space Explorer",
    titleAr: "مكتشف الفضاء",
    descEn: "Read 3 stories in the library",
    descAr: "اقرأ 3 قصص وانطلق في رحلة بين النجوم",
    type: "read",
    target: 3,
    tier: "bronze"
  },
  {
    id: "magic-apprentice",
    icon: "🧙‍♂️",
    titleEn: "Magic Storyteller",
    titleAr: "ساحر الحكايات",
    descEn: "Read 5 magical stories",
    descAr: "اقرأ 5 قصص سحرية واكتشف أسرار الممالك",
    type: "read",
    target: 5,
    tier: "silver"
  },
  {
    id: "reader-of-the-week",
    icon: "🏆",
    titleEn: "Reader of the Week",
    titleAr: "قارئ الأسبوع",
    descEn: "Read 10 stories across DreamWings",
    descAr: "اقرأ 10 قصص لتصبح بطل القراءة المتوج",
    type: "read",
    target: 10,
    tier: "gold"
  },
  {
    id: "attentive-listener",
    icon: "🎧",
    titleEn: "Attentive Listener",
    titleAr: "المستمع الصغير",
    descEn: "Listen to 5 minutes of narration",
    descAr: "استمع إلى 5 دقائق من السرد الصوتي الدافئ",
    type: "listen",
    target: 5,
    tier: "bronze"
  },
  {
    id: "night-owl-listener",
    icon: "🌙",
    titleEn: "Bedtime Hero",
    titleAr: "بطل حكايات النوم",
    descEn: "Listen to 15 minutes of stories",
    descAr: "استمع إلى 15 دقيقة من قصص النوم الهادئة",
    type: "listen",
    target: 15,
    tier: "silver"
  },
  {
    id: "audio-adventurer",
    icon: "🎙️",
    titleEn: "Audio Adventurer",
    titleAr: "مغامر الأصوات الذهبي",
    descEn: "Listen to 30 minutes of voice narration",
    descAr: "استمع إلى 30 دقيقة من السرد الصوتي الممتع",
    type: "listen",
    target: 30,
    tier: "gold"
  },
  {
    id: "story-collector",
    icon: "⭐",
    titleEn: "Story Collector",
    titleAr: "جامع الحكايات",
    descEn: "Save 3 stories to your favorites",
    descAr: "احفظ 3 قصص مفضلة في مكتبتك السحرية",
    type: "favorite",
    target: 3,
    tier: "silver"
  }
];

const previousUnlockedBadgeIds = new Set();

function renderBadges(stats) {
  const grid = $("profileBadgesGrid");
  const countChip = $("badgesUnlockedCount");
  if (!grid) return;

  const currentLang = typeof window.dwGetLanguage === "function" ? window.dwGetLanguage() : "en";
  let unlockedCount = 0;
  const newlyUnlocked = [];
  const currentUnlockedIds = [];

  const cardsHtml = BADGES.map(badge => {
    let currentVal = 0;
    if (badge.type === "read") currentVal = stats.readCount;
    else if (badge.type === "listen") currentVal = stats.listeningMinutes;
    else if (badge.type === "favorite") currentVal = stats.favoriteCount;

    const isUnlocked = currentVal >= badge.target;
    if (isUnlocked) {
      unlockedCount++;
      currentUnlockedIds.push(badge.id);
      if (previousUnlockedBadgeIds.size > 0 && !previousUnlockedBadgeIds.has(badge.id)) {
        newlyUnlocked.push(badge);
      }
    }

    const percent = Math.min(100, Math.round((currentVal / badge.target) * 100));
    const title = currentLang === "ar" ? badge.titleAr : badge.titleEn;
    const desc = currentLang === "ar" ? badge.descAr : badge.descEn;

    return `
      <div class="badge-item ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="badge-icon-box">
          <span>${badge.icon}</span>
        </div>
        <div class="badge-info">
          <div class="badge-title-row">
            <span class="badge-title">${title}</span>
            <span class="badge-status-tag ${isUnlocked ? 'unlocked-tag' : 'locked-tag'}">
              ${isUnlocked ? `<i class="fa-solid fa-sparkles"></i> ${tr("Unlocked ✨")}` : `<i class="fa-solid fa-lock"></i> ${currentVal}/${badge.target}`}
            </span>
          </div>
          <span class="badge-desc">${desc}</span>
          <div class="badge-progress-bar">
            <div class="badge-progress-fill" style="width: ${percent}%;"></div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  grid.innerHTML = cardsHtml;
  if (countChip) {
    countChip.textContent = tr("{unlocked} / {total} Unlocked", {
      unlocked: unlockedCount,
      total: BADGES.length
    });
  }

  // Celebrate newly unlocked badges with toast notification
  if (previousUnlockedBadgeIds.size === 0) {
    currentUnlockedIds.forEach(id => previousUnlockedBadgeIds.add(id));
  } else if (newlyUnlocked.length > 0) {
    newlyUnlocked.forEach(badge => {
      previousUnlockedBadgeIds.add(badge.id);
      const bTitle = currentLang === "ar" ? badge.titleAr : badge.titleEn;
      showToast(tr("🎉 New Badge Unlocked: {name}! ✨", { name: bTitle }), "success");
    });
  }

  // Persist unlocked badge IDs to Firestore user profile document
  if (currentUser && currentUnlockedIds.length > 0) {
    setDoc(doc(db, "users", currentUser.uid), {
      unlockedBadges: currentUnlockedIds
    }, { merge: true }).catch(err => console.warn("Could not sync unlocked badges:", err));
  }
}

function renderWelcome() {
  const el = $("profileUserName");
  if (!el) return;
  const nameToDisplay = (!displayName || displayName === "Reader") ? tr("Reader") : displayName;
  el.textContent = tr("Welcome, {name}! 🧡", { name: nameToDisplay });
}

function showAvatar(photo, emoji) {
  for (const id of ["profileHeroAvatar", "profileEditAvatar"]) {
    const el = $(id);
    if (!el) continue;

    el.style.backgroundImage = photo ? `url("${photo}")` : "none";
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
    el.textContent = photo ? "" : (emoji || "🦊");
    el.style.display = "grid";
    el.style.placeItems = "center";
    el.style.fontSize = photo ? "0" : "58px";
  }
}

function selectEmoji(emoji) {
  selectedEmoji = emoji;
  selectedPhoto = "";

  showAvatar("", emoji);

  document.querySelectorAll(".avatar-choice").forEach(button => {
    button.classList.toggle("selected", button.dataset.avatar === emoji);
  });

  if ($("avatarUpload")) $("avatarUpload").value = "";
  saveProfile();
}

function setStatus(message, error = false) {
  const status = $("profileSaveStatus");
  if (!status) return;

  status.textContent = message;
  status.style.color = error ? "#ffb4a8" : "#dfcfc5";
}

async function saveProfile() {
  if (!currentUser) return;

  try {
    setStatus(tr("Saving your profile..."));

    await setDoc(doc(db, "users", currentUser.uid), {
      displayName: currentUser.displayName || displayName || "",
      avatarEmoji: selectedEmoji,
      avatarPhoto: selectedPhoto,
      updatedAt: serverTimestamp()
    }, { merge: true });

    setStatus(tr("Your profile has been saved successfully ✨"));
  } catch (error) {
    console.error("Profile save error:", error);
    setStatus(tr("Couldn't save your profile. Please try again."), true);
  }
}

async function compressImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be smaller than 5 MB.");
  }

  const image = await createImageBitmap(file);
  const canvas = document.createElement("canvas");

  const maxSize = 256;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));

  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  image.close();

  return canvas.toDataURL("image/jpeg", 0.65);
}

async function uploadAvatar(file) {
  try {
    setStatus(tr("Preparing your picture..."));

    selectedPhoto = await compressImage(file);
    showAvatar(selectedPhoto, selectedEmoji);

    document.querySelectorAll(".avatar-choice").forEach(button => {
      button.classList.remove("selected");
    });

    await saveProfile();
  } catch (error) {
    console.error("Avatar upload error:", error);
    setStatus(error.message || "Couldn't use this picture.", true);
  }
}


/* ---------------- gamification blocks ---------------- */
async function renderProfileLeaderboard(uid) {
  const holder = $("profileLeaderboard");
  if (!holder) return;
  holder.innerHTML = `<p class="dw-help">${tr("Loading this week's champions…")}</p>`;
  const rows = await loadWeekChampions(8);
  holder.innerHTML = boardMarkup(rows);
  const chip = $("myRankChip");
  if (chip) {
    const mine = rows.find(row => row.uid === uid);
    chip.textContent = mine ? `${tr("You are")} #${mine.rank} · ${championTitle(mine.rank)}` : tr("Finish a story to join the board!");
  }
}

function formatJournalDate(entry) {
  const stamp = Number(entry.createdAt) || Date.now();
  const locale = tr("en") === "ar" ? "ar-EG" : "en-GB";
  try { return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", calendar: "gregory" }).format(new Date(stamp)); }
  catch { return entry.dateKey || ""; }
}

async function renderJournal(uid) {
  const list = $("journalList");
  const empty = $("journalEmpty");
  if (!list) return;
  list.innerHTML = "";
  const entries = await listJournalEntries(uid, 12);
  if (!entries.length) { if (empty) empty.hidden = false; return; }
  if (empty) empty.hidden = true;
  entries.forEach(entry => {
    const card = document.createElement("article");
    card.className = "dw-journal-entry";
    card.dir = tr("en") === "ar" ? "rtl" : "ltr";
    const date = document.createElement("div");
    date.className = "dw-journal-date";
    date.innerHTML = `<i class="fa-solid fa-moon"></i>`;
    date.appendChild(document.createTextNode(formatJournalDate(entry)));
    const text = document.createElement("p");
    text.textContent = entry.text;
    card.append(date, text);
    if (entry.bookTitle) {
      const small = document.createElement("small");
      small.textContent = `${tr("From")} · ${entry.bookTitle}`;
      card.appendChild(small);
    }
    list.appendChild(card);
  });
}

function bindJournalForm() {
  const form = $("journalForm");
  if (!form) return;
  form.addEventListener("submit", event => {
    event.preventDefault();
    const input = $("journalText");
    const status = $("journalStatus");
    const text = (input?.value || "").trim();
    if (!text) {
      if (status) status.textContent = tr("Write one little happy moment first 💛");
      input?.focus();
      return;
    }
    saveJournalEntry(text, {});
    if (input) input.value = "";
    if (status) status.textContent = tr("Saved to your bedtime journal ✨");
    renderJournal(currentUser?.uid || "guest");
    showToast(tr("Saved to your bedtime journal ✨"), "success");
  });
}

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  renderStats();
  mountAvatarStudio($("avatarStudio"), { uid: user.uid });
  renderProfileLeaderboard(user.uid);
  renderJournal(user.uid);          // instant paint from the reader's own history

  isPlatformAdmin(user).then(allowed => {
    const card = $("adminToolsCard");
    if (card) card.classList.toggle("dw-hidden", !allowed);
  }).catch(() => {});

  try {
    const snapshot = await getDoc(doc(db, "users", user.uid));
    latestProfile = snapshot.exists() ? snapshot.data() : {};

    selectedEmoji = latestProfile.avatarEmoji || "🦊";
    selectedPhoto = latestProfile.avatarPhoto || "";

    displayName =
      latestProfile.displayName ||
      user.displayName ||
      user.email?.split("@")[0] ||
      "Reader";

    renderWelcome();
    showAvatar(selectedPhoto, selectedEmoji);
    renderStats();

    document.querySelectorAll(".avatar-choice").forEach(button => {
      button.classList.toggle("selected", button.dataset.avatar === selectedEmoji);
    });
  } catch (error) {
    console.error("Profile loading error:", error);
    displayName = user.displayName || user.email?.split("@")[0] || "Reader";
    renderWelcome();
    renderStats();
    setStatus("Couldn't load your saved profile.", true);
  }
});

document.querySelectorAll(".avatar-choice").forEach(button => {
  button.addEventListener("click", () => {
    selectEmoji(button.dataset.avatar);
  });
});

bindJournalForm();

$("avatarUpload")?.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (file) uploadAvatar(file);
});

/* Statistics stay live: favorites toggled elsewhere, a language
   switch, a new tab, or coming back to this page all refresh them. */
window.addEventListener("dreamwings:favorites-changed", renderStats);
window.addEventListener("dreamwings:language", () => {
  renderWelcome();
  renderStats();
  if (currentUser) { renderProfileLeaderboard(currentUser.uid); renderJournal(currentUser.uid); }
});
window.addEventListener("storage", renderStats);
window.addEventListener("focus", renderStats);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) renderStats();
});
window.dreamWingsRefreshStats = renderStats;

window.handleLogout = async function () {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout error:", error);
    showToast("We could not sign you out. Please try again.", "error");
  }
};
