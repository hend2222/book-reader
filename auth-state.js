import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const T = text => (typeof window.dwT === "function" ? window.dwT(text) : text);

// Keep Sign In as Sign In for visitors. Only show the profile link after
// Firebase confirms an authenticated session.
onAuthStateChanged(auth, async (user) => {
  const containers = [...document.querySelectorAll("#auth-container")];
  const links = [...document.querySelectorAll(".nav-actions .login-btn")];
  const all = [...containers, ...links];

  if (!user) {
    localStorage.removeItem("dreamwings:activeUid");
    all.forEach(el => {
      if (el.tagName === "A") {
        el.href = "login.html";
        el.innerHTML = `<i class="fa-brands fa-google"></i><span>${T("Sign In")}</span>`;
      } else {
        el.innerHTML = `<a href="login.html" class="login-btn" style="text-decoration:none;display:inline-flex;align-items:center;gap:8px"><i class="fa-brands fa-google"></i><span>${T("Sign In")}</span></a>`;
      }
    });
    window.dispatchEvent(new CustomEvent("dreamwings:auth", { detail: { user: null } }));
    return;
  }

  localStorage.setItem("dreamwings:activeUid", user.uid);
  window.dispatchEvent(new CustomEvent("dreamwings:auth", { detail: { user } }));
  let name = user.displayName || user.email?.split("@")[0] || "My Profile";
  let photo = user.photoURL || "";
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const data = snap.data();
      name = data.displayName || data.username || name;
      photo = data.avatarPhoto || data.profilePic || photo;
      const savedEmoji = data.avatarEmoji || data.profileAvatar;
      if (!photo && savedEmoji) photo = `emoji:${savedEmoji}`;
    }
  } catch (error) { console.warn("Could not load profile details:", error); }

  const avatar = photo?.startsWith("emoji:") ? `<span class="nav-user-emoji">${escapeHtml(photo.slice(6))}</span>` : photo ? `<img src="${escapeHtml(photo)}" alt="Profile picture" class="nav-user-avatar">` : '<i class="fa-solid fa-user-circle"></i>';
  all.forEach(el => {
    if (el.tagName === "A") {
      el.href = "profile.html";
      el.classList.add("nav-user-chip");
      el.innerHTML = `${avatar}<span>${escapeHtml(name)}</span>`;
      el.setAttribute("aria-label", T("Profile"));
    } else {
      el.innerHTML = `<a href="profile.html" class="login-btn nav-user-chip">${avatar}<span>${escapeHtml(name)}</span></a>`;
    }
  });
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
// Re-render the chip when the language changes.
window.addEventListener("dreamwings:language", () => {
  document.querySelectorAll(".nav-actions .login-btn, #auth-container .login-btn").forEach(el => {
    const label = el.querySelector("span");
    if (label && el.classList.contains("nav-user-chip")) return;
    if (label) label.textContent = T("Sign In");
  });
});

window.dreamWingsLogout = async function () {
  await signOut(auth);
  window.location.replace("home.html");
};
