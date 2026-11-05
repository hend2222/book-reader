# DreamWings v10 — Advanced Upgrade Notes

## What's new
| Area | Files |
|---|---|
| Single-page magical reader (closed cover → burst → story pages → quiz) | `reader.html`, `reader.js` |
| Bilingual smart search + voice search + genre chips | `library.html`, `library.script.js` |
| Little Artists Gallery (moderated uploads, likes, lightbox) | `gallery.html`, `gallery.js` |
| Shareable quote cards (1080×1920 story + square, AR/EN) | `quote-cards.html`, `quote-cards.js`, `quotes-data.js` |
| Monthly Book Club (creator-selected book, moral, questions, reflections) | `book-club.html`, `book-club.js` |
| Printable / downloadable reading certificate | `certificate.html`, `certificate.js` |
| Secure admin panel (books, gallery, book club, messages) | `admin.html`, `admin.js`, `admin-guard.js` |
| Shared config / uploads / progress | `dw-config.js`, `dw-upload.js`, `dw-progress.js` |
| Shared design system | `dw-advanced.css` |

## Configuration
- **Admin UID** — `dw-config.js` → `ADMIN_UIDS` (`LNghcfytsiU2x627gt4iAzPFaFH3`). Optionally add emails in `ADMIN_EMAILS`, or set `users/{uid}.role = "admin"` in Firestore.
- **Certificate threshold** — `dw-config.js` → `CERTIFICATE_TARGET` (default `5` story completions).
- **EmailJS** — `dw-config.js` → `EMAILJS` (`service_w6fgbub`, `template_un06ljz`, public key included).
- **Supabase uploads** — `UPLOAD_FUNCTION = "upload-book"`, authorised with the Firebase ID token through the `supabase` client in `firebase-config.js`.
- **Language** — persisted in `dw_lang` (`en` | `ar`); legacy `dreamwings:lang` is migrated automatically. Every page flips text, placeholders, `dir`, and alignment on switch.

## Firestore model
- `books/{id}` — existing catalogue (title/titleAr, author, category, coverUrl, storyText, audioUrl, videoUrl, quiz[]).
- `gallery/{id}` — `{ childName, childAge, storyTitle, note, imageUrl, status: "pending"|"approved", likes, submittedBy, createdAt }`. Uploads start as `pending`.
- `site/bookClub` — `{ bookId, bookTitleEn/Ar, monthEn/Ar, descriptionEn/Ar, moralEn/Ar, coverUrl, questions:[{en,ar}], updatedAt }`.
- `bookClubReflections/{id}` — `{ name, text, bookId, uid, approved, createdAt }`.
- `users/{uid}` — profile + `readBooks[]`, `excellenceStars`, `listeningMinutes`.

## Deploy the security rules
`firestore.rules` is included. Publish it in the Firebase console (Firestore → Rules) or with:

```bash
firebase deploy --only firestore:rules
```

It enforces: public read of books/categories/site content; admin-only writes; gallery submissions forced to `status:"pending"` with admin-only approval; reflection length limits; users can only write their own profile document.

> The UI guard (`admin-guard.js`) is convenience only — the rules file is the real security boundary. Deploy it before sharing the site.

## Removed / moved
- “Add New Book” is no longer in `profile.html`; the hidden `#adminToolsCard` reveals an **Open Admin Panel** button for the creator only.
- `book-studio.html` now redirects to `admin.html#books`; `book-admin.js` is a thin bridge so legacy `editBook()/deleteBook()` calls still work.

## Quick test checklist
1. Switch to العربية on every page — no untranslated labels, layout stays intact (RTL).
2. `admin.html` while signed in as a normal user → access denied screen.
3. Add a book from the admin panel → appears in Library and its category shelf.
4. Submit a gallery drawing → hidden until approved in the admin panel.
5. Read a story to the end → quiz → star awarded → certificate progress increases.
6. Download a quote card in both languages → Arabic text right-aligned on the image.


---

## Gamification layer (v11)

### New Firestore paths
| Path | Written by | Read by |
| --- | --- | --- |
| `readingLog/{uid_bookId_week}` | reader (own uid) | library, profile, home |
| `users/{uid}` field `magicalAvatar` | reader | reader companion, profile studio |
| `users/{uid}/journal/{entryId}` | reader | profile journal archive |
| `site/spotlight` | creator only | home page spotlight |

Deploy `firestore.rules` again — `readingLog` and the `journal` subcollection are new.

### New files
- `dw-avatar.js` — SVG hero builder (hats, eye colours, pets), save/load to Firestore + localStorage.
- `dw-journal.js` — gratitude entries (local mirror + `users/{uid}/journal`).
- `dw-leaderboard.js` — ISO week keys, bilingual champion titles, champions board markup.
- `dw-spotlight.js` — `site/spotlight` read/write + home spotlight + gallery contest banner.
- `podcast.html` / `podcast.js` — bilingual episode list, player, Spotify/Apple buttons.
- `podcast-feed.xml` — RSS 2.0 + `itunes:` template for Spotify for Podcasters / Apple Podcasts Connect.

### Podcast publishing
1. Record an episode, upload the MP3 to Supabase Storage, copy the public URL.
2. Put the URL in the matching `audio` field in `podcast.js`.
3. Copy the same title/summary/duration/URL into `podcast-feed.xml` and host the XML over HTTPS.
4. Submit the feed once; afterwards only the XML needs updating per episode.
5. Add the show URLs to `PODCAST_LINKS` in `podcast.js` — the "Coming soon" chips become live links.

### Admin
`admin.html` gains a **Home Spotlight** panel: pick an approved drawing, set child name/age, month (EN + AR), the story it was inspired by, and a short note; it appears on the home page immediately. "Remove from Home" hides it without deleting the gallery entry.


---

## Magic layer (v12) — branding, hero, spotlight

### Winged-book logo
`dw-logo.svg` — an open storybook whose pages rise into gold wings, with a star above. Used as the nav mark on every page and as the favicon. Styles live in `dw-advanced.css` (`.dw-logo-wrap`, `.dw-logo-img`); the mark tilts on hover.

### Hero: the story tree
- `dw-hero.js` mounts an inline SVG scene into `#dwHeroScene`: a page-leaf tree, a red-haired reader holding a glowing book, floating pages and sparkles. Leaves/floaters/sparkles are generated from a seeded PRNG so the artwork is identical on every load.
- `#dwSky` is filled with 90 twinkling stars and 12 drifting gold motes (pure CSS animation).
- Hovering, focusing or tapping the artwork plays the wave + nod animation and shows a bilingual greeting bubble (`#dwGreeting`). Keyboard: Enter/Space opens, Escape closes. `prefers-reduced-motion` turns animation off.
- The illustration keeps the original `#heroCharacter` hook, so the existing GSAP float still works.

### Cloud & starry divider
Replaces the old wave: a scalloped cloud path (two cream layers) with seven pulsing gold stars sitting on the edge. It is pinned to the bottom of the dark hero so the cream section grows out of the clouds.

### Spotlight card
`renderSpotlight()` now renders a glowing "magical picture frame": gold double border, corner filigree, inner cream mount, ribbon, name plate and the button **"Watch this month's featured story ✨"**, which links to `reader.html?id=<book club book>` and falls back to `book-club.html`.

### Localization
Nine new dictionary pairs cover the greeting lines, hero badge, tap hint, scene title and the featured-story button; `dw-magic.css` carries the RTL rules for the hero text column and CTA row.


### Hero interactions (v13)
- **Float + breathe:** `.dw-hero-float` bobs the whole scene 6.5 s; `#dwGirl` has her own 5.4 s breathing loop; the original GSAP drift on `#heroCharacter` still runs, so the motion is layered rather than duplicated.
- **3D pointer parallax:** `bindHeroParallax()` eases `--dw-px/--dw-py` on `.dw-hero-scene`; the character moves opposite to the cursor (−13 px) while `#dwCanopy` trails at −5 px, and `.dw-hero-artwork` tilts up to 4°. Hover-capable pointers only, disabled for `prefers-reduced-motion`.
- **Sparkles:** nine `--dw-scale`-sized gold sparks float and fade around the reader's head and book, generated in `mountSparks()`.
- **Greeting:** four bilingual lines cycle every 5.2 s inside the bubble with a soft cross-fade; one greeting per session appears automatically after 2.2 s and fades after 7 s. Hover, focus, tap and Enter/Space all re-open it; Escape closes it.
- `dw-magic.css` was folded into `home.style.css` so the whole Home page (hero, divider, spotlight frame, RTL rules) is styled from one file.

## v13 cleanup — Podcast & Quote Cards removed

The podcast section and the shareable quote-card section were removed from the project.

**Deleted files**
- `podcast.html`, `podcast.js`, `podcast-feed.xml`
- `quote-cards.html`, `quote-cards.js`, `quotes-data.js`

**Updated files**
- `home.html`, `library.html`, `gallery.html`, `book-club.html`, `about.html`, `contact.html`,
  `favorite.html`, `profile.html`, `certificate.html` — Podcast / Quotes links removed from the header
  and footer navigation.
- `library.html` — the "Bedtime stories on the go" podcast call-to-action card was removed.
- `reader.html` — the "Create a quote card" action was removed from the story-complete panel.
- `dw-advanced.css` — the quote-card, style-chip and podcast rule blocks were deleted; the shared
  winged-book logo mark was kept and renamed from `.dw-quote-logo` to `.dw-brand-book`.
- `admin.html`, `admin.js` — brand mark class renamed to `.dw-brand-book`.
- `i18n.js` — the podcast and quote-card translation entries were removed.
- `signup.html` — added the missing `</body>` closing tag.

**Affected feature descriptions in the v10 table above are historical only.**

## v13.1 — Book Club moved onto the Home page

- **Navbar:** the "Book Club" item was removed from the header navigation on every page
  (`home`, `library`, `gallery`, `book-club`, `about`, `contact`, `favorite`, `profile`, `certificate`).
  The five remaining items are Home · Library · Gallery · About Me · Contact Us.
- **Footer:** the "Quick Links" entry is kept on the inner pages, so `book-club.html` stays reachable.
- **Home page:** a new `#dwBookClub` section now sits exactly between the welcome-voice section
  and the "How DreamWings Works" section. It reuses the `.dw-club-banner` card from the Book Club page
  and links to `book-club.html` and the featured reader.
- **Hero:** the "This month's book club" button now scrolls to `#dwBookClub` instead of leaving the page.
- **CSS:** new `.home-club-section` / `.home-club-tag` / `.home-club-card` rules in `home.style.css`,
  collapsing to a single centred column below 820 px and full-width buttons below 480 px.
- **i18n:** Arabic strings added for the new section; a leftover `.dw-quote-grid` rule was removed.

## v13.2 — Weekly Reading Champions moved to the Home page

- **Removed from `library.html`:** the `#championsPanel` card ("Our little heroes this week") and its
  renderer in `library.script.js` (plus the now-unused `dw-leaderboard.js` import).
- **Added to `home.html`:** the same panel as `#dwChampions`, placed directly below the Book Club section
  and above "How DreamWings Works", now inside `.container` so it aligns with the rest of the page.
- **New `dw-champions.js`:** renders `#championsStrip` with `loadWeekChampions(5)` + `boardMarkup(..., { compact: true })`,
  re-renders on `dreamwings:language`, and falls back to the empty state if Firestore is unreachable.
- **CSS:** `.home-champions-section` / `.home-champions-panel` in `home.style.css` (desktop padding 28/32,
  24/22 under 820 px, 20/14 under 480 px with a full-width profile button). The dead
  `.dw-champions-panel` margin rule was removed from `dw-advanced.css`.
