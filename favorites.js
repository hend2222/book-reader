import { auth, db } from "./firebase-config.js";
import { setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const T = text => (typeof window.dwT === "function" ? window.dwT(text) : text);
const keyFor = uid => `dreamwings:favorites:${uid}`;

export const read = uid => {
  if (!uid) return [];
  try {
    const value = JSON.parse(localStorage.getItem(keyFor(uid)) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export const write = async (uid, items) => {
  if (!uid) return;
  localStorage.setItem(keyFor(uid), JSON.stringify(items));
  try {
    // Mirror to Firestore (both IDs and rich objects) so favorites sync across devices
    await setDoc(doc(db, "users", uid), {
      favoriteBooks: items.map(item => item.id),
      favoriteBooksData: items
    }, { merge: true });
  } catch (error) {
    console.warn("Could not sync favorites to Firestore:", error);
  }
};

let activeUser = null;

function notify(message, type = "success") {
  if (typeof window.dwToast === "function") {
    window.dwToast(message, type, { title: T("Favorites") });
    return;
  }
  let el = document.getElementById("dreamwings-fav-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "dreamwings-fav-toast";
    Object.assign(el.style, {
      position: "fixed", left: "50%", bottom: "28px", transform: "translateX(-50%)",
      zIndex: "100000", background: "#2b1b18", color: "#fff", border: "1px solid #d6a85f",
      borderRadius: "14px", padding: "12px 20px", boxShadow: "0 8px 28px #0007",
      font: "600 14px Quicksand, sans-serif", textAlign: "center", maxWidth: "min(90vw, 420px)"
    });
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.display = "block";
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.display = "none"; }, 2600);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}

function currentBook(button) {
  const card = button.closest("[data-book-id]");
  const title = button.dataset.title || card?.dataset.title || card?.querySelector(".dw-book-caption strong, strong")?.textContent?.trim() || document.getElementById("modalBookTitle")?.textContent || "Story";
  const id = button.dataset.bookId || card?.dataset.bookId || title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const image = button.dataset.image || card?.dataset.image || card?.querySelector("img")?.getAttribute("src") || document.getElementById("modalBookCover")?.getAttribute("src") || "book-1.png";
  const description = button.dataset.description || card?.dataset.description || document.getElementById("modalBookDesc")?.textContent || "";
  const author = button.dataset.author || card?.dataset.author || card?.querySelector(".dw-book-caption span, span")?.textContent?.trim() || document.getElementById("modalBookAuthor")?.textContent || "DreamWings";
  return { id, title, image, description, author };
}

export function syncButton(button) {
  if (!button) return;
  const book = currentBook(button);
  const saved = !!activeUser && read(activeUser.uid).some(item => item.id === book.id);
  button.classList.toggle("active", saved);
  const label = T(saved ? "Remove from Favorites" : "Add to Favorites");
  button.title = label;
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-pressed", String(saved));
}

export function syncAllButtons() {
  document.querySelectorAll("[data-favorite-toggle]").forEach(syncButton);
}

export function renderFavorites() {
  const grids = document.querySelectorAll("#favoritesGrid, #profileFavoritesGrid");
  if (!grids.length) return;

  grids.forEach(grid => {
    if (!activeUser) {
      grid.innerHTML = `
        <div class="empty-favorites">
          <i class="fa-solid fa-lock" style="font-size:2.2rem;color:#f5a623;margin-bottom:12px;display:block"></i>
          <p>${T("Please sign in to view your saved stories.")}</p>
        </div>`;
      return;
    }

    const items = read(activeUser.uid);
    if (!items.length) {
      grid.innerHTML = `
        <div class="empty-favorites">
          <i class="fa-regular fa-star" style="font-size:2.2rem;color:#f5a623;margin-bottom:12px;display:block"></i>
          <p>${T("No favorites yet. Open a story and tap the star to save it.")}</p>
        </div>`;
      return;
    }

    grid.innerHTML = items.map(book => `
      <div class="book-card-item" data-book-id="${escapeHtml(book.id)}">
        <div class="book-card-real" onclick="location.href='reader.html?id=${encodeURIComponent(book.id)}'" style="cursor:pointer;" title="${escapeHtml(book.title)}">
          <div class="book-3d-wrapper">
            <div class="real-book-cover">
              <img src="${escapeHtml(book.image || 'book-1.png')}" alt="${escapeHtml(book.title)}">
              <div class="book-spine-effect"></div>
            </div>
          </div>
          <div class="book-shadow"></div>
        </div>
        <div class="book-info-bottom">
          <span class="book-title-label" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</span>
          <button class="book-fav-btn active" data-remove-favorite="${escapeHtml(book.id)}" title="${T("Remove from Favorites")}" aria-label="${T("Remove from Favorites")}">
            <i class="fa-solid fa-star"></i>
          </button>
        </div>
      </div>
    `).join("");
  });
}

export async function toggle(button) {
  if (!activeUser) {
    notify(T("Sign in to save this story to your personal Favorites."), "info");
    setTimeout(() => { window.location.href = "login.html"; }, 1200);
    return;
  }
  const book = currentBook(button);
  let items = read(activeUser.uid);
  const exists = items.some(item => item.id === book.id);
  items = exists ? items.filter(item => item.id !== book.id) : [...items, book];
  await write(activeUser.uid, items);
  syncAllButtons();
  renderFavorites();
  notify(exists ? T("Removed from your Favorites.") : T("Added to your Favorites ⭐"), exists ? "info" : "success");
  window.dispatchEvent(new CustomEvent("dreamwings:favorites-changed", { detail: { count: items.length } }));
}

/**
 * Automatically decorates all book cards across the site with a floating star button.
 */
export function enhanceBookCards() {
  document.querySelectorAll(".book-card-real[data-book-id], .dw-book-card[data-book-id]").forEach(card => {
    if (card.querySelector(".card-fav-btn")) return;
    const cover = card.querySelector(".real-book-cover");
    if (!cover) return;

    const bookId = card.dataset.bookId;
    const title = card.dataset.title || card.querySelector(".dw-book-caption strong, strong")?.textContent?.trim() || "Story";
    const image = card.dataset.image || card.querySelector("img")?.getAttribute("src") || "";
    const description = card.dataset.description || "";
    const author = card.dataset.author || card.querySelector(".dw-book-caption span, span")?.textContent?.trim() || "DreamWings";

    const btn = document.createElement("button");
    btn.className = "card-fav-btn";
    btn.type = "button";
    btn.dataset.favoriteToggle = "true";
    btn.dataset.bookId = bookId;
    btn.dataset.title = title;
    btn.dataset.image = image;
    btn.dataset.description = description;
    btn.dataset.author = author;
    btn.title = T("Add to Favorites");
    btn.setAttribute("aria-label", T("Add to Favorites"));
    btn.innerHTML = '<i class="fa-solid fa-star"></i>';

    btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      toggle(btn);
    });

    cover.appendChild(btn);
    syncButton(btn);
  });
}

onAuthStateChanged(auth, async user => {
  activeUser = user;
  if (user) {
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        const cloudData = Array.isArray(data.favoriteBooksData) ? data.favoriteBooksData : [];
        const local = read(user.uid);

        // Merge cloud and local favorites by unique book ID
        const map = new Map();
        cloudData.forEach(item => { if (item && item.id) map.set(item.id, item); });
        local.forEach(item => { if (item && item.id) map.set(item.id, item); });

        const merged = Array.from(map.values());
        localStorage.setItem(keyFor(user.uid), JSON.stringify(merged));
      }
    } catch (err) {
      console.warn("Could not fetch user favorites from Firestore:", err);
    }
  }
  enhanceBookCards();
  syncAllButtons();
  renderFavorites();
  window.dispatchEvent(new CustomEvent("dreamwings:favorites-changed"));
});

// Click delegation for toggle buttons and remove buttons
document.addEventListener("click", async event => {
  const toggleBtn = event.target.closest("[data-favorite-toggle]");
  if (toggleBtn) {
    event.preventDefault();
    event.stopPropagation();
    await toggle(toggleBtn);
    return;
  }

  const removeBtn = event.target.closest("[data-remove-favorite]");
  if (removeBtn && activeUser) {
    event.preventDefault();
    event.stopPropagation();
    const id = removeBtn.dataset.removeFavorite;
    const next = read(activeUser.uid).filter(item => item.id !== id);
    await write(activeUser.uid, next);
    syncAllButtons();
    renderFavorites();
    notify(T("Removed from your Favorites."), "info");
    window.dispatchEvent(new CustomEvent("dreamwings:favorites-changed", { detail: { count: next.length } }));
  }
});

document.addEventListener("favorite-modal-open", event => {
  if (event.target.matches?.("[data-favorite-toggle]")) syncButton(event.target);
  else document.querySelectorAll("#storyModal [data-favorite-toggle]").forEach(syncButton);
});

window.addEventListener("dreamwings:language", () => {
  syncAllButtons();
  renderFavorites();
});

// Auto-enhance cards dynamically as they are injected
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    enhanceBookCards();
    syncAllButtons();
    renderFavorites();
  });
} else {
  enhanceBookCards();
  syncAllButtons();
  renderFavorites();
}

const observer = new MutationObserver(() => {
  enhanceBookCards();
});
if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
} else {
  document.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });
}
