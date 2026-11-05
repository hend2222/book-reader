/* ============================================================
   DreamWings — Magical Character Creator
   Children build a reading hero (hat, eye colour, pet friend).
   Saved to users/{uid}.magicalAvatar and shown in the reader.
   ============================================================ */

import { db, auth } from "./firebase-config.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const T = (text, vars) => (typeof window.dwT === "function" ? window.dwT(text, vars) : text);
const KEY = uid => `dreamwings:avatar:${uid || "guest"}`;

export const HATS = [
  { id: "none", label: "No hat" },
  { id: "wizard", label: "Wizard hat" },
  { id: "crown", label: "Golden crown" },
  { id: "flower", label: "Flower crown" },
  { id: "beanie", label: "Cozy beanie" }
];
export const EYES = [
  { id: "brown", label: "Brown eyes", color: "#6b3f1d" },
  { id: "green", label: "Green eyes", color: "#3f7d4e" },
  { id: "blue", label: "Blue eyes", color: "#2f6fb0" },
  { id: "violet", label: "Violet eyes", color: "#6a4b9e" }
];
export const PETS = [
  { id: "none", label: "No pet" },
  { id: "bird", label: "Little bird" },
  { id: "cat", label: "Sleepy cat" },
  { id: "fox", label: "Clever fox" }
];
export const DEFAULT_AVATAR = { hat: "wizard", eyes: "brown", pet: "bird", skin: "warm" };

export function normalizeAvatar(config = {}) {
  const pick = (list, value, fallback) => (list.some(item => item.id === value) ? value : fallback);
  return {
    hat: pick(HATS, config.hat, DEFAULT_AVATAR.hat),
    eyes: pick(EYES, config.eyes, DEFAULT_AVATAR.eyes),
    pet: pick(PETS, config.pet, DEFAULT_AVATAR.pet),
    skin: typeof config.skin === "string" && config.skin ? config.skin : DEFAULT_AVATAR.skin
  };
}

function hatMarkup(hat) {
  if (hat === "wizard") return `
    <path d="M100 18 L142 82 L58 82 Z" fill="#5b3fa0"/>
    <path d="M100 18 L142 82 L100 82 Z" fill="#6d4bbd"/>
    <circle cx="100" cy="30" r="3.4" fill="#ffd88a"/>
    <circle cx="88" cy="58" r="2.6" fill="#ffd88a"/>
    <rect x="52" y="78" width="96" height="12" rx="6" fill="#4b338a"/>`;
  if (hat === "crown") return `
    <path d="M62 78 L62 44 L82 62 L100 36 L118 62 L138 44 L138 78 Z" fill="#f3c15c" stroke="#c98f2a" stroke-width="3"/>
    <circle cx="100" cy="58" r="5" fill="#b5482f"/>
    <circle cx="76" cy="60" r="3.4" fill="#8e5bd0"/>
    <circle cx="124" cy="60" r="3.4" fill="#4a86c8"/>`;
  if (hat === "flower") return `
    <circle cx="74" cy="66" r="9" fill="#f2a0b6"/><circle cx="86" cy="56" r="9" fill="#f7c1cf"/>
    <circle cx="100" cy="52" r="9" fill="#f2a0b6"/><circle cx="114" cy="56" r="9" fill="#f7c1cf"/>
    <circle cx="126" cy="66" r="9" fill="#f2a0b6"/>
    <circle cx="100" cy="64" r="8" fill="#ffd88a" stroke="#e0a93c" stroke-width="2"/>`;
  if (hat === "beanie") return `
    <path d="M56 80 A44 44 0 0 1 144 80 Z" fill="#c9714a"/>
    <rect x="52" y="76" width="96" height="16" rx="8" fill="#a95a39"/>
    <circle cx="100" cy="34" r="7" fill="#f5d7a4"/>`;
  return "";
}

function petMarkup(pet) {
  if (pet === "bird") return `
    <g transform="translate(158 148)">
      <ellipse rx="20" ry="17" fill="#5fa8d3"/>
      <circle cx="-2" cy="-10" r="12" fill="#79bbe0"/>
      <circle cx="4" cy="-13" r="2.6" fill="#20140f"/>
      <path d="M10 -10 L22 -6 L10 -2 Z" fill="#f0a83c"/>
    </g>`;
  if (pet === "cat") return `
    <g transform="translate(160 154)">
      <path d="M-20 -4 l-4 -20 l16 8 Z" fill="#8a6244"/><path d="M16 -4 l4 -20 l-16 8 Z" fill="#8a6244"/>
      <circle r="19" fill="#a97a55"/>
      <circle cx="-7" cy="-4" r="2.4" fill="#2a1a12"/><circle cx="7" cy="-4" r="2.4" fill="#2a1a12"/>
      <path d="M-3 4 q3 3 6 0" stroke="#5b3c28" stroke-width="2" fill="none"/>
    </g>`;
  if (pet === "fox") return `
    <g transform="translate(160 152)">
      <path d="M-20 0 l-6 -22 l18 10 Z" fill="#d9743c"/><path d="M20 0 l6 -22 l-18 10 Z" fill="#d9743c"/>
      <circle cy="2" r="19" fill="#e88a4d"/>
      <path d="M-19 2 q19 16 38 0 q-4 18 -19 18 q-15 0 -19 -18" fill="#fdf1e0"/>
      <circle cx="-7" cy="-3" r="2.4" fill="#2a1a12"/><circle cx="7" cy="-3" r="2.4" fill="#2a1a12"/>
      <circle cy="8" r="3" fill="#38231a"/>
    </g>`;
  return "";
}

export function avatarSvg(config, { size = 180, id = "a" } = {}) {
  const avatar = normalizeAvatar(config);
  const eyes = (EYES.find(item => item.id === avatar.eyes) || EYES[0]).color;
  return `
  <svg viewBox="0 0 200 200" width="${size}" height="${size}" class="dw-avatar-svg" aria-hidden="true">
    <defs>
      <radialGradient id="dwAvBg-${id}" cx="50%" cy="28%" r="78%">
        <stop offset="0%" stop-color="#4b3327"/><stop offset="100%" stop-color="#221512"/>
      </radialGradient>
      <clipPath id="dwAvClip-${id}"><circle cx="100" cy="100" r="98"/></clipPath>
    </defs>
    <g clip-path="url(#dwAvClip-${id})">
      <circle cx="100" cy="100" r="98" fill="url(#dwAvBg-${id})"/>
      <circle cx="52" cy="52" r="3" fill="#ffd88a" opacity=".7"/>
      <circle cx="158" cy="44" r="2.4" fill="#ffe9b8" opacity=".8"/>
    </g>
    <path d="M40 200 q10 -46 60 -46 q50 0 60 46 Z" fill="#7a4a2c"/>
    <path d="M86 150 q14 14 28 0 l6 10 q-20 16 -40 0 Z" fill="#f7e2c4"/>
    <circle cx="100" cy="98" r="52" fill="#f6d7b4"/>
    <path d="M48 96 q6 -56 52 -56 q46 0 52 56 q-22 -22 -52 -22 q-30 0 -52 22" fill="#4a2c1c"/>
    <ellipse cx="82" cy="100" rx="7.5" ry="8.5" fill="#fff"/><ellipse cx="118" cy="100" rx="7.5" ry="8.5" fill="#fff"/>
    <circle cx="82" cy="101" r="4.6" fill="${eyes}"/><circle cx="118" cy="101" r="4.6" fill="${eyes}"/>
    <circle cx="83.6" cy="99" r="1.5" fill="#fff"/><circle cx="119.6" cy="99" r="1.5" fill="#fff"/>
    <circle cx="70" cy="114" r="6" fill="#f2a9a0" opacity=".55"/><circle cx="130" cy="114" r="6" fill="#f2a9a0" opacity=".55"/>
    <path d="M90 118 q10 10 20 0" stroke="#8a4a34" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    ${hatMarkup(avatar.hat)}${petMarkup(avatar.pet)}
  </svg>`;
}

export function loadAvatar(uid) {
  try {
    const raw = localStorage.getItem(KEY(uid));
    return normalizeAvatar(raw ? JSON.parse(raw) : DEFAULT_AVATAR);
  } catch { return normalizeAvatar(DEFAULT_AVATAR); }
}

export async function fetchAvatar(uid) {
  const local = loadAvatar(uid);
  if (!uid || uid === "guest") return local;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists() && snap.data()?.magicalAvatar) {
      const merged = normalizeAvatar({ ...local, ...snap.data().magicalAvatar });
      localStorage.setItem(KEY(uid), JSON.stringify(merged));
      return merged;
    }
  } catch (error) { console.warn("Avatar load failed:", error); }
  return local;
}

export async function saveAvatar(config, uid) {
  const avatar = normalizeAvatar(config);
  try { localStorage.setItem(KEY(uid), JSON.stringify(avatar)); } catch { /* ignore */ }
  const target = uid || auth.currentUser?.uid;
  if (target) {
    try { await setDoc(doc(db, "users", target), { magicalAvatar: avatar }, { merge: true }); }
    catch (error) { console.warn("Avatar sync failed:", error); }
  }
  window.dispatchEvent(new CustomEvent("dreamwings:avatar", { detail: { avatar, uid: target } }));
  return avatar;
}

export function mountAvatarStudio(root, { uid, onSaved } = {}) {
  if (!root) return null;
  const avatar = loadAvatar(uid);

  root.innerHTML = `
    <div class="dw-avatar-stage">
      <div class="dw-avatar-preview" id="dwAvatarPreview">${avatarSvg(avatar, { size: 200, id: "studio" })}</div>
      <div>
        <span class="dw-kicker" data-i18n="Magical Character Creator"><i class="fa-solid fa-wand-magic-sparkles"></i> ${T("Magical Character Creator")}</span>
        <h3 class="dw-avatar-title" data-i18n="Design your reading hero">${T("Design your reading hero")}</h3>
        <p class="dw-help" data-i18n="Pick a hat, choose your eye colour and adopt a little companion. Your hero appears inside every story you open.">${T("Pick a hat, choose your eye colour and adopt a little companion. Your hero appears inside every story you open.")}</p>
      </div>
    </div>
    <div class="dw-avatar-controls">
      <div class="dw-avatar-group"><span class="dw-label" data-i18n="Magical hat">${T("Magical hat")}</span><div class="dw-chip-row" data-group="hat"></div></div>
      <div class="dw-avatar-group"><span class="dw-label" data-i18n="Eye colour">${T("Eye colour")}</span><div class="dw-chip-row" data-group="eyes"></div></div>
      <div class="dw-avatar-group"><span class="dw-label" data-i18n="Pet companion">${T("Pet companion")}</span><div class="dw-chip-row" data-group="pet"></div></div>
    </div>
    <div class="dw-btn-row">
      <button type="button" class="dw-btn dw-btn-gold" id="dwAvatarSave">
        <i class="fa-solid fa-floppy-disk"></i><span data-i18n="Save my hero">${T("Save my hero")}</span>
      </button>
      <span class="dw-inline-status" id="dwAvatarStatus" role="status"></span>
    </div>`;

  const preview = root.querySelector("#dwAvatarPreview");
  const groups = { hat: HATS, eyes: EYES, pet: PETS };

  function paint() {
    preview.innerHTML = avatarSvg(avatar, { size: 200, id: "studio" });
    Object.entries(groups).forEach(([group, items]) => {
      const holder = root.querySelector(`[data-group="${group}"]`);
      if (!holder) return;
      holder.replaceChildren();
      items.forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `dw-chip${avatar[group] === item.id ? " is-active" : ""}`;
        button.innerHTML = item.color
          ? `<span class="dw-chip-dot" style="background:${item.color}"></span>${T(item.label)}`
          : T(item.label);
        button.addEventListener("click", () => { avatar[group] = item.id; paint(); });
        holder.appendChild(button);
      });
    });
  }

  root.querySelector("#dwAvatarSave")?.addEventListener("click", async event => {
    const status = root.querySelector("#dwAvatarStatus");
    const button = event.currentTarget;
    button.disabled = true;
    if (status) status.textContent = T("Saving your hero…");
    try {
      await saveAvatar(avatar, uid);
      if (status) status.textContent = "";
      if (typeof window.dwToast === "function") window.dwToast(T("Your magical hero is ready! ✨"), "success");
      onSaved?.(normalizeAvatar(avatar));
    } catch {
      if (status) status.textContent = T("Your hero could not be saved. Please try again.");
    } finally { button.disabled = false; }
  });

  paint();
  window.addEventListener("dreamwings:language", () => {
    root.querySelectorAll("[data-i18n]").forEach(node => {
      const icon = node.querySelector("i");
      node.textContent = T(node.dataset.i18n);
      if (icon) node.prepend(icon);
    });
    paint();
  });
  return { get avatar() { return normalizeAvatar(avatar); } };
}
