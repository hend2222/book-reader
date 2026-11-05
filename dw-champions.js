/* ============================================================
   DreamWings — Weekly Reading Champions strip
   Renders the current ISO week's board into #championsStrip.
   Lived in library.script.js before the panel moved to the home page.
   ============================================================ */

import { loadWeekChampions, boardMarkup } from "./dw-leaderboard.js";

const T = (text, vars) => (typeof window.dwT === "function" ? window.dwT(text, vars) : text);

async function renderChampions() {
  const holder = document.getElementById("championsStrip");
  if (!holder) return;

  holder.innerHTML = `<p class="dw-help">${T("Loading this week's champions…")}</p>`;
  try {
    const rows = await loadWeekChampions(5);
    holder.innerHTML = boardMarkup(rows, { compact: true });
  } catch (error) {
    holder.innerHTML = boardMarkup([]);
    console.error("[champions] could not load the board", error);
  }
}

document.addEventListener("DOMContentLoaded", renderChampions);
window.addEventListener("dreamwings:language", renderChampions);
