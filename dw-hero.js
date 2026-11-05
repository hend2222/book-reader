/* ============================================================
   DreamWings — magical hero: story tree, little reader,
   sky sparkles and the bilingual hover greeting.
   ============================================================ */

const T = (text, vars) => (typeof window.dwT === "function" ? window.dwT(text, vars) : text);
const lang = () => (typeof window.dwGetLanguage === "function" ? window.dwGetLanguage() : "en");
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SCENE = `
<defs>
    <linearGradient id="trunk" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#4a2c1d"/><stop offset="55%" stop-color="#6b4229"/><stop offset="100%" stop-color="#8a5a38"/>
    </linearGradient>
    <linearGradient id="dress" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8a4560"/><stop offset="100%" stop-color="#63304a"/>
    </linearGradient>
    <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d4633a"/><stop offset="100%" stop-color="#9c3f26"/>
    </linearGradient>
    <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fbdcbe"/><stop offset="100%" stop-color="#f0c39f"/>
    </linearGradient>
    <linearGradient id="page" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffaf0"/><stop offset="100%" stop-color="#f2ddb9"/>
    </linearGradient>
    <radialGradient id="bookGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffd98d" stop-opacity=".95"/>
      <stop offset="60%" stop-color="#f5a623" stop-opacity=".35"/>
      <stop offset="100%" stop-color="#f5a623" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="treeGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffcf87" stop-opacity=".22"/>
      <stop offset="100%" stop-color="#ffcf87" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <ellipse cx="320" cy="500" rx="240" ry="26" fill="#2a1710" opacity=".35"/>
  <ellipse cx="300" cy="250" rx="250" ry="180" fill="url(#treeGlow)"/>

  <!-- trunk + branches -->
  <g fill="url(#trunk)">
    <path d="M268 496c-8-58-6-114 0-162l4-30 32 0 6 30c8 48 10 104 2 162q-22 9-44 0Z"/>
    <path d="M274 356c-26-26-52-56-72-90 6-16 14-22 24-16 22 30 46 54 66 70Z"/>
    <path d="M290 348c26-30 56-56 86-72 10 8 12 16 6 24-24 18-48 40-70 64Z"/>
    <path d="M240 300c-18-16-32-34-40-54 4-8 10-12 16-8 10 18 22 32 34 44Z"/>
    <path d="M356 300c18-18 38-32 58-40 8 4 10 10 6 16-18 8-34 20-50 34Z"/>
  </g>
  <g stroke="#3f2416" stroke-width="2" opacity=".26" fill="none">
    <path d="M280 472c2-46 2-92 2-132"/><path d="M292 462c0-40 0-80 2-112"/>
  </g>
  <g fill="#ffd88a" opacity=".9">
    <circle cx="206" cy="286" r="3"/><circle cx="374" cy="272" r="2.6"/><circle cx="176" cy="330" r="2.2"/><circle cx="330" cy="336" r="2"/>
  </g>

  <!-- canopy soft mass -->
  <g fill="#ffcf87" opacity=".07">
    <ellipse cx="300" cy="180" rx="215" ry="115"/>
    <ellipse cx="180" cy="215" rx="95" ry="70"/>
    <ellipse cx="420" cy="205" rx="100" ry="72"/>
  </g>

  <!-- canopy page-leaves -->

  <!-- girl -->
  <g id="dwGirl">
    <ellipse cx="422" cy="494" rx="62" ry="11" fill="#2a1710" opacity=".26"/>

    <!-- grassy mound seat -->
    <path d="M372 472c6-14 26-20 50-20s46 6 52 20c4 8-98 8-102 0Z" fill="#6b4229"/>
    <path d="M378 468c8-10 26-14 44-14s38 4 46 14c-24 6-66 6-90 0Z" fill="#805130"/>

    <!-- crossed shins -->
    <path d="M396 452c-6 6-6 12 2 14 10 2 22-2 30-8" stroke="#f0c39f" stroke-width="11" stroke-linecap="round" fill="none"/>
    <path d="M446 452c6 6 6 12-2 14-10 2-22-2-30-8" stroke="#f7d3b0" stroke-width="11" stroke-linecap="round" fill="none"/>

    <!-- thighs -->
    <path d="M400 442c-2 10 6 16 20 16s24-6 22-16Z" fill="#f0c39f"/>

    <!-- dress -->
    <path d="M404 424c-4 12-10 22-14 30 6 8 18 10 32 10s26-2 34-10c-6-8-12-18-16-30Z" fill="url(#dress)"/>
    <path d="M406 414c6 5 24 5 30 0l-2 8c-8 4-18 4-26 0Z" fill="#f5c66a" opacity=".9"/>
    <path d="M394 452c6 4 16 6 28 6s24-2 30-6" stroke="#4d2338" stroke-width="2" fill="none" opacity=".5"/>

    <!-- neck + head -->
    <path d="M416 352h10v10c0 3-10 3-10 0Z" fill="url(#skin)"/>
    <circle cx="421" cy="328" r="25" fill="url(#skin)"/>

    <!-- head group -->
    <g id="dwHead">
    <!-- hair -->
    <path d="M396 332c-4-26 8-40 26-40s30 14 26 38c-1 5-6 5-7 0-2-14-9-21-19-21s-16 7-18 21c-1 5-6 6-8 2Z" fill="url(#hair)"/>
    <path d="M446 318c17 8 23 30 14 48-3 7-12 5-11-2 5-14 1-27-9-34Z" fill="url(#hair)"/>
    <path d="M446 318c10 11 12 25 5 37" stroke="#7e2f1c" stroke-width="2" fill="none" opacity=".45"/>
    <circle cx="449" cy="301" r="3.2" fill="#ffd88a"/>

    <!-- face -->
    <path d="M407 329q4 4 8 0" stroke="#6b3b22" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M425 329q4 4 8 0" stroke="#6b3b22" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M415 338q6 6 12 0" stroke="#a5533a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <circle cx="404" cy="335" r="4.2" fill="#f29a86" opacity=".5"/>
    <circle cx="437" cy="335" r="4.2" fill="#f29a86" opacity=".5"/>
    </g>

    <!-- book glow -->
    <ellipse id="dwBookGlow" cx="420" cy="408" rx="70" ry="40" fill="url(#bookGlow)"/>

    <!-- left arm resting on book -->
    <path d="M406 364c-9 10-14 20-14 28" stroke="#eeb98f" stroke-width="8.2" stroke-linecap="round" fill="none"/>
    <circle cx="391" cy="396" r="5.4" fill="#f7d3b0"/>

    <!-- open book on lap -->
    <g>
      <path d="M420 396c-12-6-24-7-34-3l3 22c10-3 21-1 31 5Z" fill="url(#page)" stroke="#b98247" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M420 396c12-6 24-7 34-3l-3 22c-10-3-21-1-31 5Z" fill="url(#page)" stroke="#b98247" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M420 396v24" stroke="#8a5a2c" stroke-width="2.2"/>
      <g stroke="#dcc094" stroke-width="1.4" stroke-linecap="round">
        <path d="M394 400c7-1 13 0 18 2"/><path d="M395 406c7-1 13 0 18 2"/>
        <path d="M428 402c6-2 12-3 18-2"/><path d="M427 408c6-2 12-3 18-2"/>
      </g>
    </g>

    <!-- right arm waving -->
    <g id="dwWaveArm">
      <path d="M435 362c11-3 19-13 23-26" stroke="url(#skin)" stroke-width="8.6" stroke-linecap="round" fill="none"/>
      <circle cx="459" cy="332" r="7" fill="url(#skin)"/>
      <path d="M456 328l-2-8M461 327l0-9M466 329l3-8" stroke="#f0c39f" stroke-width="3.2" stroke-linecap="round"/>
    </g>
  </g>

  <!-- floating pages -->

  <!-- sparkles -->
`;

const GREETINGS = [
  "Welcome to the world of tales, hero! Shall we start reading?",
  "Come sit beside me — the pages are warm tonight.",
  "Which story shall we fly into?",
  "Every page is a little wing. Ready to fly?"
];

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function leafMarkup(x, y, rot, scale) {
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot.toFixed(0)}) scale(${scale.toFixed(2)})">`
    + `<rect x="-21" y="-14" width="42" height="28" rx="5" fill="#fdf4e1" stroke="#e3c39a" stroke-width="1.3"/>`
    + `<path d="M-13 -6h26M-13 0h26M-13 6h18" stroke="#d9b98c" stroke-width="1.1" stroke-linecap="round"/>`
    + `<path d="M21 -14v28" stroke="#e3c39a" stroke-width="1.1"/></g>`;
}

function canopyMarkup() {
  const rows = [
    [[200, 96], [268, 88], [336, 92], [404, 100]],
    [[148, 126], [214, 120], [282, 118], [350, 122], [416, 132]],
    [[104, 162], [170, 156], [238, 152], [306, 150], [374, 154], [440, 164], [498, 178]],
    [[88, 202], [154, 196], [222, 192], [290, 190], [358, 192], [426, 198], [492, 208]],
    [[104, 242], [170, 236], [238, 232], [306, 232], [374, 236], [438, 244], [494, 256]],
    [[146, 272], [212, 268], [280, 266], [348, 268], [412, 276], [468, 288]]
  ];
  const rand = mulberry32(7);
  return rows.flat().map(([x, y]) => {
    const jx = x + (rand() * 12 - 6);
    const jy = y + (rand() * 10 - 5);
    const rot = rand() * 76 - 38;
    const scale = 0.8 + rand() * 0.32;
    return leafMarkup(jx, jy, rot, scale);
  }).join("");
}

function floatersMarkup() {
  const spots = [
    [96, 300, -18, 1.05, 0], [520, 268, 16, 0.95, 1.4],
    [72, 380, 24, 0.85, 2.6], [548, 366, -22, 0.9, 0.8],
    [186, 128, 12, 0.8, 2.1], [470, 120, -14, 0.75, 3.2],
    [140, 404, 14, 0.72, 1.9]
  ];
  return spots.map(([x, y, rot, scale, delay], i) => {
    const leaf = leafMarkup(0, 0, rot, scale).replace('<g transform="', '<g class="dw-float-leaf" transform="');
    return `<g transform="translate(${x},${y})" class="dw-floater" style="--dw-delay:${delay}s;--dw-dur:${7 + i}s">${leaf}</g>`;
  }).join("");
}

function sparksMarkup() {
  const rand = mulberry32(21);
  let out = "";
  for (let i = 0; i < 18; i += 1) {
    const x = 60 + rand() * 520;
    const y = 40 + rand() * 400;
    const s = (0.5 + rand() * 0.9).toFixed(2);
    const delay = (rand() * 6).toFixed(2);
    out += `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)}) scale(${s})" class="dw-scene-spark" style="--dw-delay:${delay}s">`
      + `<path d="M0 -7l1.9 4.6L7 0 1.9 2.4 0 7-1.9 2.4-7 0-1.9-4.6Z" fill="#ffd88a"/></g>`;
  }
  return out;
}

function skyMarkup() {
  const rand = mulberry32(5);
  let out = "";
  for (let i = 0; i < 90; i += 1) {
    const x = (rand() * 100).toFixed(2);
    const y = (rand() * 92).toFixed(2);
    const size = (0.8 + rand() * 2).toFixed(2);
    const delay = (rand() * 7).toFixed(2);
    const dur = (3.4 + rand() * 3.6).toFixed(2);
    out += `<span class="dw-star" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;--dw-delay:${delay}s;--dw-dur:${dur}s"></span>`;
  }
  for (let i = 0; i < 12; i += 1) {
    const x = (rand() * 100).toFixed(2);
    const y = (30 + rand() * 66).toFixed(2);
    const delay = (rand() * 9).toFixed(2);
    out += `<span class="dw-mote" style="left:${x}%;top:${y}%;--dw-delay:${delay}s"></span>`;
  }
  return out;
}

function mountSparks() {
  const art = document.getElementById("dwHeroArtwork");
  if (!art) return;
  let layer = art.querySelector(".dw-hero-sparks");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "dw-hero-sparks";
    layer.setAttribute("aria-hidden", "true");
    art.appendChild(layer);
  }
  const spots = [
    [63.5, 55.0, 1.0, 0.0], [69.0, 52.5, 0.7, 1.3], [72.5, 59.5, 0.85, 2.6],
    [59.0, 62.0, 0.6, 0.7], [74.0, 66.0, 0.7, 3.4], [61.5, 69.5, 0.95, 1.9],
    [70.5, 72.5, 0.65, 2.2], [66.5, 47.5, 0.55, 4.0], [57.5, 57.5, 0.5, 3.0]
  ];
  layer.innerHTML = spots.map(([x, y, sc, d]) =>
    `<span class="dw-spark" style="left:${x}%;top:${y}%;--dw-scale:${sc};--dw-delay:${d}s"></span>`
  ).join("");
}

export function mountHero() {
  const scene = document.getElementById("dwHeroScene");
  if (!scene) return;

  scene.innerHTML = `<svg viewBox="0 0 640 560" class="dw-scene-svg" role="img" aria-labelledby="dwSceneTitle">
    <title id="dwSceneTitle">${T("A little reader under a tree of flying pages")}</title>
    ${SCENE}
    <g id="dwCanopy">${canopyMarkup()}</g>
    <g id="dwFloaters">${floatersMarkup()}</g>
    <g id="dwSparks">${sparksMarkup()}</g>
  </svg>`;

  mountSparks();

  const sky = document.getElementById("dwSky");
  if (sky) sky.innerHTML = skyMarkup();
}

function greetingNode() {
  return document.getElementById("dwGreeting");
}

let greetingIndex = 0;
let currentGreeting = 0;
let cycleTimer = null;
let hideTimer = null;

function paintGreeting(index) {
  const bubble = greetingNode();
  if (!bubble) return;
  const p = bubble.querySelector("p");
  currentGreeting = index;
  if (p) p.textContent = T(GREETINGS[index]);
}

function startCycle() {
  clearInterval(cycleTimer);
  cycleTimer = setInterval(() => {
    const bubble = greetingNode();
    if (!bubble || !bubble.classList.contains("is-visible")) return;
    bubble.classList.add("is-swapping");
    setTimeout(() => {
      paintGreeting((currentGreeting + 1) % GREETINGS.length);
      bubble.classList.remove("is-swapping");
    }, 260);
  }, 5200);
}

function showGreeting({ advance = true } = {}) {
  const hero = document.getElementById("dwHero");
  const bubble = greetingNode();
  if (!hero || !bubble) return;
  if (advance) {
    greetingIndex += 1;
    paintGreeting((greetingIndex - 1) % GREETINGS.length);
  }
  clearTimeout(hideTimer);
  bubble.hidden = false;
  requestAnimationFrame(() => bubble.classList.add("is-visible"));
  hero.classList.add("is-greeting");
  startCycle();
}

function hideGreeting() {
  const hero = document.getElementById("dwHero");
  const bubble = greetingNode();
  if (hero) hero.classList.remove("is-greeting");
  clearInterval(cycleTimer);
  if (!bubble) return;
  bubble.classList.remove("is-visible");
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => { bubble.hidden = true; }, 340);
}

/* ---------- pointer parallax (opposite direction, eased) ---------- */
function bindHeroParallax() {
  const hero = document.getElementById("dwHero");
  const scene = document.querySelector(".dw-hero-scene");
  if (!hero || !scene || REDUCED) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  let targetX = 0, targetY = 0, curX = 0, curY = 0, raf = null;

  const tick = () => {
    curX += (targetX - curX) * 0.09;
    curY += (targetY - curY) * 0.09;
    scene.style.setProperty("--dw-px", curX.toFixed(3));
    scene.style.setProperty("--dw-py", curY.toFixed(3));
    if (Math.abs(targetX - curX) > 0.0015 || Math.abs(targetY - curY) > 0.0015) {
      raf = requestAnimationFrame(tick);
    } else {
      scene.style.setProperty("--dw-px", targetX.toFixed(3));
      scene.style.setProperty("--dw-py", targetY.toFixed(3));
      raf = null;
    }
  };

  const start = () => { if (!raf) raf = requestAnimationFrame(tick); };

  hero.addEventListener("pointermove", event => {
    const box = hero.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    targetX = Math.max(-1, Math.min(1, x * 1.6));
    targetY = Math.max(-1, Math.min(1, y * 1.6));
    start();
  });

  hero.addEventListener("pointerleave", () => {
    targetX = 0; targetY = 0; start();
  });
}

export function bindHeroGreeting() {
  const art = document.getElementById("dwHeroArtwork");
  const bubble = greetingNode();
  if (!art || !bubble || art.dataset.bound === "1") return;
  art.dataset.bound = "1";

  art.addEventListener("pointerenter", event => {
    if (event.pointerType === "touch") return;
    showGreeting();
  });
  art.addEventListener("pointerleave", hideGreeting);
  art.addEventListener("focus", () => showGreeting({ advance: false }));
  art.addEventListener("blur", hideGreeting);
  art.addEventListener("click", () => {
    if (bubble.hidden || !bubble.classList.contains("is-visible")) showGreeting();
    else hideGreeting();
  });
  art.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); showGreeting(); }
    if (event.key === "Escape") hideGreeting();
  });
}

/* ---------- one gentle greeting per session ---------- */
function autoGreet() {
  if (REDUCED) return;
  try {
    if (sessionStorage.getItem("dw:greeted") === "1") return;
    sessionStorage.setItem("dw:greeted", "1");
  } catch { return; }
  setTimeout(() => {
    showGreeting({ advance: false });
    hideTimer = setTimeout(hideGreeting, 7200);
  }, 2200);
}

if (!REDUCED) document.documentElement.classList.add("dw-motion-ok");

function boot() {
  mountHero();
  bindHeroGreeting();
  bindHeroParallax();
  autoGreet();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

window.addEventListener("dreamwings:language", () => {
  const bubble = greetingNode();
  if (bubble && bubble.classList.contains("is-visible")) paintGreeting(currentGreeting);
  mountHero();
});
