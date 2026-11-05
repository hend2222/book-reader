/* ============================================================
   DreamWings — theme switch (dark default / light)
   Loaded synchronously in <head> so the saved theme is applied
   before the first paint (no flash of the wrong colours).
   The home page deliberately does not load this file: it keeps
   its white design in both modes.
   ============================================================ */

(function () {
  var KEY = "dw_theme";
  var root = document.documentElement;
  var changeListeners = [];

  function read() {
    try {
      return localStorage.getItem(KEY) === "light" ? "light" : "dark";
    } catch (error) {
      return "dark";
    }
  }

  function paint(theme) {
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme === "light" ? "light" : "dark";

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#faf6f0" : "#181211");

    document.querySelectorAll("[data-theme-set]").forEach(function (button) {
      var active = button.getAttribute("data-theme-set") === theme;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function set(theme) {
    var next = theme === "light" ? "light" : "dark";
    try { localStorage.setItem(KEY, next); } catch (error) { /* private mode */ }
    paint(next);
    changeListeners.forEach(function (fn) {
      try { fn(next); } catch (error) { /* ignore */ }
    });
    window.dispatchEvent(new CustomEvent("dreamwings:theme", { detail: { theme: next } }));
    return next;
  }

  function toggle() {
    return set(read() === "light" ? "dark" : "light");
  }

  /* Apply immediately — later switches animate. */
  paint(read());
  requestAnimationFrame(function () {
    root.classList.add("dw-theme-anim");
  });

  document.addEventListener("DOMContentLoaded", function () {
    paint(read());
    document.querySelectorAll("[data-theme-set]").forEach(function (button) {
      button.addEventListener("click", function () {
        set(button.getAttribute("data-theme-set"));
      });
    });
  });

  window.dwTheme = {
    get: read,
    set: set,
    toggle: toggle,
    onChange: function (fn) { changeListeners.push(fn); }
  };
})();
