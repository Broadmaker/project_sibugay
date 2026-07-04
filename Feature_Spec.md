# Project SIBUGAY — Feature & Module Spec

Digital Glossary for the Subanen & Kolibugan Peoples of Zamboanga Sibugay

A working checklist for development. Check items off as you build them.

---

## 1. Navigation & App Shell

- [x] Fix nav structure: move **Culture** into the bottom nav as a primary tab (5 tabs: Home, Browse, Culture, Activities, Profile)
- [x] Persistent top bar: logo, search shortcut, notifications bell
- [x] Splash screen with a Subanen/Kolibugan greeting or word-of-the-day phrase (not just "SB")
- [x] First-launch onboarding: 3 swipeable screens (what the app is, who the communities are, what you can do) with Next/Skip, dot indicators, scroll-snap, and localStorage flag to show once
- [x] Global loading states (skeleton screens) for word lists, images, audio
- [x] Global empty states (no search results, no favorites yet, no offline data cached)
- [x] Global error states (audio failed to load, offline with no cache, submission failed)
- [x] PWA manifest + app icons (installable to home screen)
- [x] Service worker for offline asset caching

---

## 2. Authentication & Roles (Mock — client-side, localStorage)

- [x] Sign up / log in (modal with login & signup forms, validated against MOCK_USERS)
- [x] Guest/browse-only mode (no login required — "Continue as Guest" button)
- [x] Role-based accounts (stored in localStorage session):
  - [x] **Learner** — browse, search, save favorites, take quizzes
  - [x] **Contributor** — submit new words, audio, stories (pending review)
  - [x] **Elder/Validator** — review and approve/reject submissions, flag culturally sensitive entries
  - [x] **Researcher/Admin** — full dictionary management, analytics, exports
- [x] Admin Console link removed from Profile for non-admin users — gated behind `hasRole('admin')`
- [x] Session persistence / "remember me" (localStorage `sibugay_user`)
- [x] Password reset flow (mock — shows toast notification)

---

## 3. Search

- [x] Multi-language search across Subanen, Kolibugan, Filipino, English
- [x] Fuzzy matching / typo tolerance (character overlap with 1-mismatch allowance + 3-char substring matching)
- [x] Search-as-you-type with debounce
- [x] Filter search by category, language, or part of speech
- [x] Recent searches history (localStorage, up to 8, with clear-all and tap-to-re-search)
- [x] "No results" state with suggestion to submit the missing word

---

## 4. Home

- [x] Word of the Day (rotating, deterministic by date so it's consistent across users)
- [x] Glossary stats (word count, language count, category count) — pull from live data, not hardcoded
- [x] Category chip browser (horizontal scroll) with category filtering
- [x] "Recently added" word list — pull from actual submission timestamps
- [x] "See all" / "View all" links wired to Browse view with filters pre-applied

---

## 5. Browse

- [x] Alphabetical index navigation, wired to actual data (not a fixed hardcoded letter list — generate from available entries)
- [x] Show More / progressive loading (pagination — shows 6 words initially, "Show N more" button)
- [x] Filter by category (via home chips), dialect (Subanen vs. Kolibugan), part of speech
- [x] Sort options (alphabetical, most viewed, recently added) — with tab bar on browse page

---

## 6. Word Detail

- [x] Audio player UI (play/pause with animated progress bar, mock playback at 4-second duration)
- [x] Translations grid (Filipino, English — expandable to more languages later)
- [x] Definition
- [x] Example sentence (original + translation)
- [x] Cultural context section
- [x] Etymology section
- [x] Category tags
- [x] **Dialect indicator** — distinguish Subanen vs. Kolibugan usage/spelling instead of combining them into one tag, where they differ
- [x] Contributor & validator attribution ("Submitted by **_", "Validated by _** / Gukom council")
- [x] Content status badge (Validated / Pending review / Community-submitted)
- [x] "Restricted" flag support for culturally sensitive entries (Diwata — shows badge + warning notice)
- [x] Save to favorites
- [x] Report an issue / suggest a correction on this entry (bottom-sheet form)
- [x] Version history (who edited what, when — generated from entry dates)
- [x] Related words / "see also" links (computed from shared categories)

---

## 7. Culture & Heritage Module

- [x] Interactive dialect/community map (SVG map with pinned communities, clickable popups with info)
- [x] Multimedia gallery: videos with functional media viewer modal, image gallery viewer
- [x] Photo galleries (ancestral domain, artifacts, events — via mock media data)
- [x] Oral traditions: proverbs, folk tales, with a story reader modal showing full text and meaning
- [x] Audio storytelling / oral history recordings (story reader for oral traditions)
- [x] Cultural calendar (festivals, rituals, significant dates — scrollable event cards)
- [x] Community contribution CTA wired to a functional submission form (requires auth, sends to review)

---

## 8. Learning Activities

- [x] Word match quiz (functional, randomized question pool from GLOSSARY data)
- [ ] Listen & pick quiz (requires real audio files — deferred)
- [ ] Fill in the blanks (deferred)
- [x] Flashcards (flip animation, swipe to reveal, prev/next navigation)
- [x] Progress bar / question counter wired to real quiz state
- [x] Results screen with score, correct/incorrect breakdown per question
- [ ] Spaced repetition system (SRS) — deferred (needs more data + session tracking)
- [x] Difficulty levels (beginner/intermediate/advanced word pools by category)
- [x] Daily streak tracking (localStorage, tied to activity completion)

---

## 9. Profile & Settings

- [ ] Real user data (name, role, program/school) instead of static "Student / Teacher"
- [ ] Daily goal progress (real word-learned count)
- [ ] Stats: words learned, day streak, quiz accuracy — computed from real activity logs
- [ ] Interface language toggle (Filipino/English) — actually localizes UI strings
- [ ] Audio autoplay toggle — functional
- [ ] Dark mode — functional (currently a non-wired toggle)
- [ ] Offline mode toggle — triggers actual download/caching of glossary data
- [ ] Notification preferences (word of the day reminders, community updates)
- [ ] Community Contribution entry point → real submission form (word, audio upload, story, photo)
- [ ] About page (project background, WMSU/IP-ED program credit)
- [ ] Ethical data use / consent policy page (full text, not just a settings row)
- [ ] Admin Console — role-gated, not a public link

---

## 10. Content Governance & Cultural Safeguards

- [ ] Submission review pipeline: Contributor submits → Elder/Validator reviews → Published
- [ ] Ability for validators to reject with feedback/reason
- [ ] "Restricted" content flag — some entries may be marked sensitive/not for public consumption at the community's discretion (this is a policy decision to make _with_ the Gukom council, not a default assumption)
- [ ] Attribution trail for every entry (contributor + validator)
- [ ] Full version history / audit log per entry
- [ ] Process documentation for Free, Prior and Informed Consent (FPIC) where applicable — this is a policy/legal question to confirm with your research team and community elders, not just an engineering task
- [ ] Admin dashboard: pending submissions queue, flagged content, moderation actions log

---

## 11. Data & Backend

- [ ] Real database (not static HTML templates) — e.g. PostgreSQL/Firebase/Supabase
- [ ] API layer for words, categories, media, users, submissions
- [ ] Media storage/CDN for audio, images, video
- [ ] Data export tool (CSV/JSON) for researchers
- [ ] Citation generator (APA/MLA format) for academic use of entries
- [ ] Backup and sync across devices tied to user accounts
- [ ] Basic analytics: most-searched terms, coverage gaps by category, active users

---

## 12. Accessibility & Quality

- [ ] Screen reader support audit (ARIA labels already present in prototype — verify with real screen reader testing)
- [ ] Adjustable font size setting
- [ ] High-contrast mode
- [ ] Color contrast check against WCAG AA for all text/background pairs
- [ ] Keyboard navigation support for web version
- [ ] Cross-device testing (low-end Android phones, since target users may have older devices)

---

## 13. Branding & Visual Identity

- [x] Move all inline `style="..."` attributes into a proper CSS/design system (colors, spacing, typography as variables/classes) — partial pass done, remaining inline styles are minimal and intentional
- [ ] Logo/mark developed in consultation with Subanen/Kolibugan community members or elders — avoid finalizing symbolic visual elements unilaterally
- [ ] Color palette and any pattern/motif use reviewed with community input before being treated as final branding
- [ ] Consistent use of Noto Serif for vernacular terms / cultural content, Inter for UI chrome (already a good pattern — keep it)
- [x] Icon set audit — replaced key emoji with SVG icons: settings (globe, speaker, moon, wifi), activity cards, admin/security, about/book, profile avatar (initials), WOTD lightbulb, event icons, empty/error states, video play button. Remaining emoji in toast messages and seed data kept as intentional decorative elements.

---

## Suggested Build Order

1. ✅ App shell + nav fix + design system cleanup (CSS classes, no inline styles)
2. ✅ Seed data + data-driven UI/UX (search, browse, detail, home all driven by GLOSSARY data)
3. Search + Browse + Word Detail (core reading experience) — polishing pass
4. Auth + roles + submission/review pipeline
5. Activities module with real quiz logic
6. Culture module (map, media, stories)
7. Profile stats, offline mode, PWA packaging
8. Analytics, exports, polish, accessibility pass
