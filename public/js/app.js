/* ============================================================
   Project SIBUGAY — App Router & Shared JavaScript
   ============================================================ */
(function () {
  'use strict';

  try {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('service-worker.js').catch(function () {});
    }
  } catch (e) {} /* SW not supported on file:// */

  /* ---------- Onboarding ---------- */
  function finishOnboarding() {
    try { localStorage.setItem('sibugay_onboarded', '1'); } catch (e) {}
    var ob = document.getElementById('onboarding');
    if (ob) { ob.style.display = 'none'; ob.remove(); }
  }

  /* Show onboarding on first launch */
  setTimeout(function () {
    var splash = document.getElementById('splash-screen');
    var onboarded = false;
    try { onboarded = localStorage.getItem('sibugay_onboarded') === '1'; } catch (e) {}

    if (splash) {
      splash.classList.add('hidden');
      setTimeout(function () { splash.remove(); }, 600);
    }

    if (!onboarded) {
      var ob = document.getElementById('onboarding');
      if (ob) {
        ob.style.display = 'flex';
        ob.style.flexDirection = 'column';
        initOnboarding();
      }
    }
  }, 2000);

  function initOnboarding() {
    var slides = document.getElementById('onboarding-slides');
    var dots = document.querySelectorAll('.dot');
    var nextBtn = document.getElementById('onboarding-next');
    var skipBtn = document.getElementById('onboarding-skip');
    if (!slides || !nextBtn) return;

    function updateDots() {
      var idx = Math.round(slides.scrollLeft / slides.clientWidth);
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
      if (idx >= dots.length - 1) {
        nextBtn.textContent = 'Get Started';
      } else {
        nextBtn.textContent = 'Next';
      }
    }

    slides.addEventListener('scroll', updateDots);

    nextBtn.addEventListener('click', function () {
      var idx = Math.round(slides.scrollLeft / slides.clientWidth);
      if (idx >= dots.length - 1) {
        finishOnboarding();
      } else {
        slides.scrollTo({ left: slides.clientWidth * (idx + 1), behavior: 'smooth' });
      }
    });

    skipBtn.addEventListener('click', finishOnboarding);
  }

  var state = { currentPage: 'home' };

  var $main = document.getElementById('main-content');
  var $navItems = document.querySelectorAll('.bottomnav__item');
  var $detailPanel = document.getElementById('detail-panel');
  var $detailContent = document.getElementById('detail-content');
  var $detailHeading = document.getElementById('detail-heading');
  var pageCache = {};

  /* ---------- utility: get entry by word ---------- */
  function getEntry(word) {
    return GLOSSARY.find(function (e) { return e.word.toLowerCase() === word.toLowerCase(); }) || GLOSSARY[0];
  }

  /* ---------- utility: render word card HTML ---------- */
  function wordCardHTML(entry) {
    var first = entry.word.charAt(0).toUpperCase();
    return '<li class="word-card" role="listitem" data-id="' + entry.id + '">' +
      '<div class="word-card__alpha" aria-hidden="true">' + first + '</div>' +
      '<div class="word-card__body">' +
        '<div class="word-card__term">' + entry.word + ' <span class="word-card__pos">' + entry.pos + '</span></div>' +
        '<div class="word-card__translations"><span class="word-card__lang-tag">FIL:</span> ' + entry.filipino + ' · <span class="word-card__lang-tag">EN:</span> ' + entry.english + '</div>' +
      '</div>' +
      '<div class="word-card__actions">' +
        '<button class="btn-audio" aria-label="Play pronunciation of ' + entry.word + '">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>' +
        '</button>' +
        '<button class="btn-chevron" aria-label="View full entry for ' + entry.word + '">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>' +
        '</button>' +
      '</div>' +
    '</li>';
  }

  /* ---------- utility: categories from data ---------- */
  function getAllCategories() {
    var cats = {};
    GLOSSARY.forEach(function (e) {
      e.categories.forEach(function (c) { cats[c] = true; });
    });
    return Object.keys(cats).sort();
  }

  /* ---------- skeleton HTML ---------- */
  var skeletonHTML = {
    home: '<div class="skeleton skeleton--hero"></div><div style="padding:0 1.25rem;margin-top:-20px;"><div class="skeleton" style="width:100%;height:48px;border-radius:40px;"></div></div><div class="skeleton-list"><div class="skeleton skeleton--card"></div><div class="skeleton skeleton--card"></div><div class="skeleton skeleton--card"></div></div>',
    browse: '<div style="padding:8px 1.25rem;display:flex;gap:6px;">' + new Array(10).fill('<div class="skeleton" style="width:28px;height:28px;border-radius:4px;"></div>').join('') + '</div><div class="skeleton-list">' + new Array(4).fill('<div class="skeleton-list__row"><div class="skeleton skeleton-list__alpha"></div><div class="skeleton-list__body"><div class="skeleton skeleton-list__line"></div><div class="skeleton skeleton-list__line"></div></div></div>').join('') + '</div>',
    activities: '<div style="padding:1.5rem 1.25rem;"><div class="skeleton" style="height:14px;width:100px;border-radius:20px;"></div><div class="skeleton" style="height:24px;width:180px;margin-top:12px;border-radius:4px;"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:1.25rem;">' + new Array(4).fill('<div class="skeleton" style="height:100px;border-radius:10px;"></div>').join('') + '</div>',
    culture: '<div class="skeleton skeleton--hero" style="height:120px;"></div><div class="skeleton-list">' + new Array(3).fill('<div class="skeleton skeleton--card"></div>').join('') + '</div>',
    profile: '<div style="padding:2rem;text-align:center;"><div class="skeleton" style="width:72px;height:72px;border-radius:50%;margin:0 auto 12px;"></div><div class="skeleton" style="height:24px;width:140px;margin:0 auto 8px;border-radius:4px;"></div><div class="skeleton" style="height:14px;width:200px;margin:0 auto;border-radius:4px;"></div></div><div class="skeleton-list">' + new Array(5).fill('<div class="skeleton" style="height:60px;border-radius:10px;"></div>').join('') + '</div>'
  };

  function showSkeleton(page) {
    $main.innerHTML = skeletonHTML[page] || skeletonHTML.home;
  }

  /* ---------- load page HTML ---------- */
  function loadPage(name) {
    if (pageCache[name]) return Promise.resolve(pageCache[name]);
    var tpl = document.getElementById('tpl-' + name);
    if (!tpl) return Promise.reject(new Error('Failed to load page: ' + name));
    pageCache[name] = tpl.innerHTML;
    return Promise.resolve(tpl.innerHTML);
  }

  /* ======================== PAGE RENDERERS ======================== */

  /* ---------- safe getElementById ---------- */
  function safeEl(id) {
    var el = document.getElementById(id);
    if (!el) console.warn('Element #' + id + ' not found');
    return el;
  }

  /* ---------- render home ---------- */
  function renderHome() {
    var wotdEntry = getWordOfTheDay();

    var wotdEl = safeEl('wotd-container');
    if (wotdEl) {
      wotdEl.innerHTML =
        '<div class="wotd-card" data-word="' + wotdEntry.word + '">' +
          '<div class="wotd-card__badge">Word of the Day</div>' +
          '<div class="wotd-card__word">' + wotdEntry.word + '</div>' +
          '<div class="wotd-card__def">' + wotdEntry.english + '</div>' +
        '</div>';
    }

    var statsEl = safeEl('stats-container');
    if (statsEl) {
      statsEl.innerHTML =
        '<div class="stat-card"><div class="stat-card__number">' + GLOSSARY.length + '</div><div class="stat-card__label">Words</div></div>' +
        '<div class="stat-card"><div class="stat-card__number">3</div><div class="stat-card__label">Languages</div></div>' +
        '<div class="stat-card"><div class="stat-card__number">' + getAllCategories().length + '</div><div class="stat-card__label">Categories</div></div>';
    }

    var chipsEl = safeEl('category-chips');
    if (chipsEl) {
      var chips = ['All words'].concat(getAllCategories());
      chipsEl.innerHTML = chips.map(function (c, i) {
        return '<button class="chip' + (i === 0 ? ' active' : '') + '" role="listitem">' + c + '</button>';
      }).join('');
    }

    var recentEl = safeEl('recent-words');
    if (recentEl) {
      var recent = GLOSSARY.slice().sort(function (a, b) {
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      }).slice(0, 5);
      recentEl.innerHTML = recent.map(wordCardHTML).join('');
    }
  }

  /* ---------- render browse ---------- */
  var currentSort = 'alpha';
  var browsePageSize = 6;
  var browseShowAll = false;

  function renderBrowse() {
    var sorted = getSortedWords(currentSort);

    var alphaNav = document.getElementById('alpha-nav');
    if (alphaNav) {
      var uniqueLetters = {};
      GLOSSARY.forEach(function (e) { uniqueLetters[e.word.charAt(0).toUpperCase()] = true; });
      alphaNav.innerHTML = Object.keys(uniqueLetters).sort().map(function (l) {
        return '<button class="alpha-btn" data-letter="' + l + '">' + l + '</button>';
      }).join('');
    }

    var html = '';
    if (currentSort === 'alpha') {
      /* Group by letter */
      var letters = {};
      sorted.forEach(function (e) {
        var l = e.word.charAt(0).toUpperCase();
        if (!letters[l]) letters[l] = [];
        letters[l].push(e);
      });
      var sortedLetters = Object.keys(letters).sort();
      sortedLetters.forEach(function (l) {
        html += '<p class="alpha-section-label">— ' + l + ' —</p>';
        html += '<ul class="word-list">' + letters[l].map(wordCardHTML).join('') + '</ul>';
      });
    } else {
      /* Flat list (no letter grouping) */
      var displayList = browseShowAll ? sorted : sorted.slice(0, browsePageSize);
      html += '<ul class="word-list">' + displayList.map(wordCardHTML).join('') + '</ul>';
      if (!browseShowAll && sorted.length > browsePageSize) {
        html += '<div style="padding:1rem 1.25rem;text-align:center;">' +
          '<button class="btn-outline w-full justify-center" id="show-more-btn">Show ' + (sorted.length - browsePageSize) + ' more words</button>' +
        '</div>';
      }
    }

    var listEl = document.getElementById('browse-list');
    if (listEl) listEl.innerHTML = html;
  }

  function getSortedWords(sortBy) {
    var arr = GLOSSARY.slice();
    if (sortBy === 'views') {
      arr.sort(function (a, b) { return (b.views || 0) - (a.views || 0); });
    } else if (sortBy === 'recent') {
      arr.sort(function (a, b) { return new Date(b.dateAdded) - new Date(a.dateAdded); });
    } else {
      arr.sort(function (a, b) { return a.word.localeCompare(b.word); });
    }
    return arr;
  }

  function bindBrowseSort() {
    var sortBtns = document.querySelectorAll('.sort-btn');
    sortBtns.forEach(function (btn) {
      var newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', function () {
        sortBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        currentSort = this.dataset.sort;
        browseShowAll = false;
        renderBrowse();
        bindBrowseSort();
        bindWordCardActions();
        bindBrowseAlpha();
        var showMore = document.getElementById('show-more-btn');
        if (showMore) {
          showMore.addEventListener('click', function () {
            browseShowAll = true;
            renderBrowse();
            bindBrowseSort();
            bindWordCardActions();
            bindBrowseAlpha();
          });
        }
      });
    });

    var showMore = document.getElementById('show-more-btn');
    if (showMore) {
      var newShowMore = showMore.cloneNode(true);
      showMore.parentNode.replaceChild(newShowMore, showMore);
      newShowMore.addEventListener('click', function () {
        browseShowAll = true;
        renderBrowse();
        bindBrowseSort();
        bindWordCardActions();
        bindBrowseAlpha();
      });
    }
  }

  function bindBrowseAlpha() {
    document.querySelectorAll('.alpha-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var letter = this.dataset.letter;
        var target = document.querySelector('.alpha-section-label');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          /* Find the specific letter */
          var labels = document.querySelectorAll('.alpha-section-label');
          for (var i = 0; i < labels.length; i++) {
            if (labels[i].textContent.indexOf(letter) !== -1) {
              labels[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
              break;
            }
          }
        }
      });
    });
  }

  /* ---------- render word detail ---------- */
  function renderDetail(word) {
    var entry = getEntry(word);
    if (!entry) { $detailContent.innerHTML = '<div class="error-state"><div class="error-state__title">Word not found</div></div>'; return; }

    var statusBadge = entry.status === 'validated'
      ? '<span class="badge badge--pos" style="background:var(--color-success);">Validated</span>'
      : '<span class="badge badge--pos" style="background:var(--color-gold);">Pending</span>';

    var restrictedHTML = '';
    if (entry.restricted) {
      restrictedHTML = '<div class="restricted-badge">🛡️ Culturally sensitive</div>' +
        '<div class="restricted-notice">' + (entry.restrictedNote || 'This entry contains culturally sensitive content shared with community consent.') + '</div>';
    }

    /* Related words: entries sharing categories */
    var related = GLOSSARY.filter(function (e) {
      return e.id !== entry.id && e.categories.some(function (c) { return entry.categories.indexOf(c) !== -1; });
    }).slice(0, 6);

    var relatedHTML = related.length > 0
      ? '<div class="detail-section"><div class="detail-section__label">Related words</div><div class="related-words">' +
        related.map(function (r) {
          return '<span class="related-word" data-word="' + r.word + '">' + r.word + ' <span class="related-word__pos">' + r.pos + '</span></span>';
        }).join('') +
        '</div></div>'
      : '';

    $detailContent.innerHTML =
      '<div class="detail-hero">' +
        '<div class="detail-hero__word">' + entry.word + '</div>' +
        '<div class="detail-hero__pronunciation">/' + entry.pronunciation + '/</div>' +
        '<div class="detail-hero__meta">' +
          '<span class="badge badge--pos">' + entry.pos + '</span>' +
          '<span class="badge badge--lang">' + entry.dialect + '</span>' +
          statusBadge +
        '</div>' +
        restrictedHTML +
        '<div class="audio-player" id="audio-player">' +
          '<button class="audio-player__btn" id="audio-play-btn" aria-label="Play pronunciation">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>' +
          '</button>' +
          '<div class="audio-player__track">' +
            '<div class="audio-player__bar" id="audio-bar">' +
              '<div class="audio-player__fill" id="audio-fill"></div>' +
            '</div>' +
            '<div class="audio-player__time">' +
              '<span id="audio-current">0:00</span>' +
              '<span id="audio-duration">0:04</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="detail-body">' +
        '<div class="detail-section">' +
          '<div class="detail-section__label">Translations</div>' +
          '<div class="detail-section__content">' +
            '<div class="translations-grid">' +
              '<div class="translation-item"><div class="translation-item__flag">&#127477;&#127469;</div><div class="translation-item__lang">Filipino</div><div class="translation-item__word">' + entry.filipino + '</div></div>' +
              '<div class="translation-item"><div class="translation-item__flag">&#127468;&#127463;</div><div class="translation-item__lang">English</div><div class="translation-item__word">' + entry.english + '</div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="detail-section">' +
          '<div class="detail-section__label">Definition</div>' +
          '<div class="detail-section__content"><p class="text-base" style="line-height:1.75;">' + entry.definition + '</p></div>' +
        '</div>' +
        '<div class="detail-section">' +
          '<div class="detail-section__label">Example sentence</div>' +
          '<div class="detail-section__content">' +
            '<p class="example-sentence">' + entry.exampleSentence + '</p>' +
            '<p class="example-sentence__translation">' + entry.exampleTranslation + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="detail-section">' +
          '<div class="detail-section__label">Cultural context</div>' +
          '<div class="detail-section__content"><p class="cultural-note">' + entry.culturalContext + '</p></div>' +
        '</div>' +
        '<div class="detail-section">' +
          '<div class="detail-section__label">Etymology</div>' +
          '<div class="detail-section__content">' +
            '<span class="etymology-tag">' + entry.etymologyTag + '</span>' +
            '<p class="text-sm text-muted" style="line-height:1.75;">' + entry.etymology + '</p>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div class="text-xs text-muted font-semibold tracking-wider text-uppercase mb-sm">Categories</div>' +
          '<div class="flex flex-wrap gap-xs">' +
            entry.categories.map(function (c) { return '<span class="chip active text-xs" style="padding:4px 10px;">' + c + '</span>'; }).join('') +
          '</div>' +
        '</div>' +
        relatedHTML +
        '<div class="text-xs text-muted mt-lg" style="padding-top:12px;border-top:1px solid var(--color-border);">' +
          'Submitted by <strong>' + entry.contributor + '</strong> &middot; Validated by <strong>' + entry.validator + '</strong>' +
        '</div>' +
        '<div class="flex gap-sm mt-md" style="padding-top:12px;border-top:1px solid var(--color-border);">' +
          '<button class="btn-outline flex-1 justify-center text-xs p-sm" onclick="window.openReportForm(\'' + entry.word + '\')">Report issue</button>' +
          '<button class="btn-outline flex-1 justify-center text-xs p-sm" onclick="window.openVersionHistory(' + entry.id + ')">Version history</button>' +
        '</div>' +
      '</div>';

    $detailHeading.textContent = entry.word;
    $detailPanel.classList.add('open');
    document.body.style.overflow = 'hidden';

    /* Audio player mock playback */
    bindAudioPlayer();
    /* Related word clicks */
    $detailContent.querySelectorAll('.related-word').forEach(function (el) {
      el.addEventListener('click', function () {
        var w = this.dataset.word;
        if (w) { window.closeDetail(); renderDetail(w); }
      });
    });
  }

  /* ---------- mock audio player ---------- */
  var audioTimer = null;
  var audioPlaying = false;
  var audioProgress = 0;

  function bindAudioPlayer() {
    var btn = document.getElementById('audio-play-btn');
    var fill = document.getElementById('audio-fill');
    var currentEl = document.getElementById('audio-current');
    if (!btn || !fill || !currentEl) return;

    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', function () {
      if (audioPlaying) {
        clearInterval(audioTimer);
        audioPlaying = false;
        newBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>';
        return;
      }
      audioPlaying = true;
      audioProgress = 0;
      newBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
      audioTimer = setInterval(function () {
        audioProgress += 2;
        fill.style.width = audioProgress + '%';
        var sec = Math.floor(audioProgress / 25);
        currentEl.textContent = '0:' + (sec < 10 ? '0' : '') + sec;
        if (audioProgress >= 100) {
          clearInterval(audioTimer);
          audioPlaying = false;
          newBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>';
          fill.style.width = '0%';
          currentEl.textContent = '0:00';
        }
      }, 80);
    });
  }

  /* ---------- Report form ---------- */
  window.openReportForm = function (word) {
    document.getElementById('report-form').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeReportForm = function () {
    document.getElementById('report-form').classList.remove('open');
    document.body.style.overflow = '';
  };

  window.submitReport = function (e) {
    e.preventDefault();
    window.closeReportForm();
    document.getElementById('report-desc').value = '';
    document.getElementById('report-email').value = '';
    window.showToast('✅ Report submitted. Our team will review it shortly.');
    return false;
  };

  /* ---------- Version history ---------- */
  window.openVersionHistory = function (id) {
    var entry = GLOSSARY.find(function (e) { return e.id === id; });
    if (!entry) return;
    var body = document.getElementById('version-history-body');
    var versions = generateVersions(entry);
    body.innerHTML = versions.map(function (v) {
      return '<div class="version-entry">' +
        '<div class="version-entry__date">' + v.date + '</div>' +
        '<div class="version-entry__body">' +
          '<div class="version-entry__action">' +
            '<span class="version-entry__badge version-entry__badge--' + v.type + '">' + v.label + '</span>' +
          '</div>' +
          '<div class="version-entry__author">' + v.author + '</div>' +
        '</div>' +
      '</div>';
    }).join('') || '<div class="empty-state" style="padding:2rem 0;"><div class="empty-state__title">No history</div></div>';
    document.getElementById('version-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeVersionHistory = function () {
    document.getElementById('version-modal').classList.remove('open');
    document.body.style.overflow = '';
  };

  function generateVersions(entry) {
    var v = [];
    var added = new Date(entry.dateAdded);
    var addedStr = added.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    v.push({ date: addedStr, label: 'Created', type: 'created', author: entry.contributor });

    var reviewDate = new Date(added);
    reviewDate.setDate(reviewDate.getDate() + 3);
    if (entry.status === 'validated') {
      v.push({ date: reviewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), label: 'Reviewed & validated', type: 'reviewed', author: entry.validator });
    }

    var editDate = new Date(added);
    editDate.setDate(editDate.getDate() + 1);
    v.push({ date: editDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), label: 'Edited', type: 'edited', author: entry.contributor });

    return v;
  }

  /* ---------- Word of the Day (deterministic) ---------- */
  function getWordOfTheDay() {
    var today = new Date();
    var dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
    return GLOSSARY[dayOfYear % GLOSSARY.length];
  }

  /* ---------- fuzzy match ---------- */
  function fuzzyMatch(text, query) {
    var t = text.toLowerCase();
    var q = query.toLowerCase();
    if (t.indexOf(q) !== -1) return true;
    /* Character overlap: allow 1 mismatch per 4 chars */
    var mismatches = 0;
    var minLen = Math.min(t.length, q.length);
    for (var i = 0; i < minLen; i++) {
      if (t[i] !== q[i]) mismatches++;
    }
    if (mismatches <= 1 && minLen >= 3) return true;
    /* Substring of the query appears in text */
    if (q.length >= 4) {
      for (var j = 0; j <= q.length - 3; j++) {
        if (t.indexOf(q.substring(j, j + 3)) !== -1) return true;
      }
    }
    return false;
  }

  /* ---------- recent searches ---------- */
  function getRecentSearches() {
    try { return JSON.parse(localStorage.getItem('sibugay_recent_searches') || '[]'); } catch (e) { return []; }
  }

  function saveRecentSearch(term) {
    if (!term) return;
    try {
      var list = getRecentSearches();
      list = list.filter(function (s) { return s !== term; });
      list.unshift(term);
      if (list.length > 8) list = list.slice(0, 8);
      localStorage.setItem('sibugay_recent_searches', JSON.stringify(list));
    } catch (e) {}
  }

  function renderRecentSearches() {
    var el = document.getElementById('recent-searches');
    if (!el) return;
    var list = getRecentSearches();
    if (list.length === 0) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.innerHTML = list.map(function (s) {
      return '<span class="recent-search-chip" data-term="' + s.replace(/"/g, '&quot;') + '">🔍 ' + s + '<span class="recent-search-chip__clear" data-clear="' + s.replace(/"/g, '&quot;') + '">×</span></span>';
    }).join('') + '<button class="recent-search-clear-all" id="clear-recent-searches">Clear</button>';
  }

  function bindRecentSearches() {
    document.querySelectorAll('.recent-search-chip').forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        if (e.target.classList.contains('recent-search-chip__clear')) {
          var term = e.target.dataset.clear;
          try {
            var list = getRecentSearches().filter(function (s) { return s !== term; });
            localStorage.setItem('sibugay_recent_searches', JSON.stringify(list));
          } catch (e) {}
          renderRecentSearches();
          bindRecentSearches();
          return;
        }
        var term = this.dataset.term;
        if (term) {
          var input = document.getElementById('search-input');
          if (input) { input.value = term; input.dispatchEvent(new Event('input')); }
        }
      });
    });

    var clearBtn = document.getElementById('clear-recent-searches');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        try { localStorage.removeItem('sibugay_recent_searches'); } catch (e) {}
        renderRecentSearches();
      });
    }
  }

  /* ---------- search ---------- */
  function bindSearch() {
    var input = document.getElementById('search-input');
    if (!input) return;

    renderRecentSearches();
    bindRecentSearches();

    input.addEventListener('input', function (e) {
      var q = e.target.value.toLowerCase().trim();
      var container = document.getElementById('recent-words');
      if (!container) return;
      if (q.length === 0) {
        var recent = GLOSSARY.slice().sort(function (a, b) { return new Date(b.dateAdded) - new Date(a.dateAdded); }).slice(0, 5);
        container.innerHTML = recent.map(wordCardHTML).join('');
        bindWordCardActions();
        return;
      }
      var results = GLOSSARY.filter(function (e) {
        return fuzzyMatch(e.word, q) ||
               fuzzyMatch(e.filipino, q) ||
               fuzzyMatch(e.english, q) ||
               fuzzyMatch(e.definition, q);
      });
      if (results.length === 0) {
        container.innerHTML =
          '<div class="empty-state">' +
            '<div class="empty-state__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="48" height="48" style="opacity:0.5;"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" /></svg></div>' +
            '<div class="empty-state__title">No results found</div>' +
            '<div class="empty-state__desc">No words match "' + e.target.value + '". Try a different search term.</div>' +
          '</div>';
      } else {
        container.innerHTML = results.map(wordCardHTML).join('');
      }
      bindWordCardActions();
      /* Save to recent searches when user stops typing */
      if (q.length >= 2) {
        clearTimeout(input._searchTimer);
        input._searchTimer = setTimeout(function () { saveRecentSearch(q); renderRecentSearches(); bindRecentSearches(); }, 1500);
      }
    });
  }

  /* ======================== NAVIGATION ======================== */

  function navigate(page) {
    try {
      showSkeleton(page);
      setTimeout(function () {
        loadPage(page).then(function (html) {
          $main.innerHTML = html;
          state.currentPage = page;

          $navItems.forEach(function (btn) {
            var isActive = btn.dataset.page === page;
            btn.classList.toggle('active', isActive);
            if (isActive) btn.setAttribute('aria-current', 'page');
            else btn.removeAttribute('aria-current');
          });

          bindPage(page);
        }).catch(function () {
          $main.innerHTML = '<div class="error-state"><div class="error-state__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="48" height="48" style="opacity:0.5;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg></div><div class="error-state__title">Failed to load page</div><div class="error-state__desc">Something went wrong. Please try again.</div></div>';
        });
      }, 80);
    } catch (err) {
      $main.innerHTML = '<div class="error-state"><div class="error-state__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="48" height="48" style="opacity:0.5;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg></div><div class="error-state__title">Failed to load page</div><div class="error-state__desc">Something went wrong. Please try again.</div></div>';
    }
  }

  /* ---------- page-specific binding ---------- */
  function bindPage(page) {
    switch (page) {
      case 'home':
        renderHome();
        bindSearch();
        bindCategoryChips();
        bindHomeWOTD();
        break;
      case 'browse':
        renderBrowse();
        bindBrowseSort();
        bindBrowseAlpha();
        break;
      case 'activities':
        bindActivities();
        break;
      case 'culture':
        renderCulture();
        bindCulture();
        break;
      case 'profile':
        renderProfile();
        break;
    }
    bindWordCardActions();
    bindSeeAllLinks();
  }

  /* ---------- bind: WOTD click ---------- */
  function bindHomeWOTD() {
    var wotd = document.querySelector('.wotd-card');
    if (wotd) {
      wotd.addEventListener('click', function () {
        var word = this.dataset.word;
        if (word) renderDetail(word);
      });
    }
  }

  /* ---------- bind: category chips ---------- */
  function bindCategoryChips() {
    document.querySelectorAll('.chips-scroll .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('.chips-scroll .chip').forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active');
        var cat = this.textContent.trim();
        var container = document.getElementById('recent-words');
        if (!container) return;
        if (cat === 'All words') {
          var recent = GLOSSARY.slice().sort(function (a, b) { return new Date(b.dateAdded) - new Date(a.dateAdded); }).slice(0, 5);
          container.innerHTML = recent.map(wordCardHTML).join('');
        } else {
          var filtered = GLOSSARY.filter(function (e) { return e.categories.indexOf(cat) !== -1; });
          if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="48" height="48" style="opacity:0.5;"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg></div><div class="empty-state__title">No words in this category yet</div></div>';
          } else {
            container.innerHTML = filtered.map(wordCardHTML).join('');
          }
        }
        bindWordCardActions();
      });
    });
  }

  /* ---------- bind: See all / View all links ---------- */
  function bindSeeAllLinks() {
    var seeAll = document.getElementById('see-all-categories');
    if (seeAll) {
      seeAll.addEventListener('click', function (e) { e.preventDefault(); navigate('browse'); });
    }
    var viewAll = document.getElementById('view-all-words');
    if (viewAll) {
      viewAll.addEventListener('click', function (e) { e.preventDefault(); navigate('browse'); });
    }
  }

  /* ---------- bind: word card actions ---------- */
  function bindWordCardActions() {
    document.querySelectorAll('.word-card').forEach(function (card) {
      var newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);
      newCard.addEventListener('click', function (e) {
        if (e.target.closest('.btn-audio')) return;
        var term = this.querySelector('.word-card__term');
        if (term) renderDetail(term.textContent.trim().split(' ')[0]);
      });
    });
    document.querySelectorAll('.btn-audio').forEach(function (btn) {
      var newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var term = this.closest('.word-card') ? this.closest('.word-card').querySelector('.word-card__term').textContent.trim().split(' ')[0] : 'word';
        window.showToast('🔊 Playing pronunciation for ' + term);
      });
    });
  }

  /* ---------- close detail ---------- */
  window.closeDetail = function () {
    $detailPanel.classList.remove('open');
    document.body.style.overflow = '';
  };

  /* ---------- culture page ---------- */
  function renderCulture() {
    if (typeof CULTURE_DATA === 'undefined') return;

    /* --- Map --- */
    var mapEl = document.getElementById('culture-map');
    if (mapEl) {
      var mapHTML = '<div class="culture-map" id="culture-map-inner">' +
        '<div class="culture-map__water"></div>';
      CULTURE_DATA.communities.forEach(function (c) {
        mapHTML += '<div class="community-pin community-pin--' + c.dialect + '" style="left:' + c.x + '%;top:' + c.y + '%;" data-community="' + c.id + '">' +
          '<div class="community-pin__dot"></div>' +
          '<div class="community-pin__name">' + c.name + '</div>' +
        '</div>';
      });
      mapHTML += '<div class="culture-map__label">Zamboanga Sibugay · ' + CULTURE_DATA.communities.length + ' communities</div></div>';
      mapEl.innerHTML = mapHTML;
    }

    /* --- Media --- */
    var mediaEl = document.getElementById('culture-media');
    if (mediaEl) {
      mediaEl.innerHTML = CULTURE_DATA.media.map(function (m) {
        var thumbBg = 'background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(\'' + m.thumbnail + '\') center/cover;';
        if (m.type === 'image') {
          return '<div class="media-card flex-shrink-0 bg-white border" style="border-radius: var(--radius-md);cursor:pointer;" data-media="' + m.id + '">' +
            '<div style="height:120px;' + thumbBg + '"></div>' +
            '<div class="p-md">' +
              '<div class="font-semibold text-sm" style="color:var(--color-text);">' + m.title + '</div>' +
              '<div class="text-xs text-muted mt-xs">' + m.count + '</div>' +
            '</div>' +
          '</div>';
        }
        return '<div class="media-card media-card--video flex-shrink-0" style="border-radius: var(--radius-md);cursor:pointer;" data-media="' + m.id + '">' +
          '<div class="media-card__thumb" style="height:120px;' + thumbBg + '"></div>' +
          '<div class="media-card__play"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="40" height="40"><polygon points="5 3 19 12 5 21 5 3" /></svg></div>' +
          '<div class="media-card__info">' +
            '<div class="font-semibold text-sm">' + m.title + '</div>' +
            '<div class="text-xs" style="opacity:0.7;">Video · ' + m.duration + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    /* --- Stories --- */
    var storiesEl = document.getElementById('culture-stories');
    if (storiesEl) {
      storiesEl.innerHTML = CULTURE_DATA.stories.map(function (s) {
        var tagClass = s.type === 'proverb' ? 'story-card__tag--proverb' : 'story-card__tag--folktale';
        var tagLabel = s.type === 'proverb' ? 'Proverb' : 'Folk Tale';
        return '<div class="story-card" data-story="' + s.id + '">' +
          '<div class="story-card__tag ' + tagClass + '">' + tagLabel + '</div>' +
          '<div class="story-card__title">' + s.title + '</div>' +
          '<div class="story-card__preview">' + s.content + '</div>' +
        '</div>';
      }).join('');
    }

    /* --- Events --- */
    var eventsEl = document.getElementById('culture-events');
    if (eventsEl) {
      eventsEl.innerHTML = CULTURE_DATA.events.map(function (e) {
        var d = new Date(e.date);
        var dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return '<div class="event-card">' +
          '<div class="event-card__icon">' + e.icon + '</div>' +
          '<div class="event-card__name">' + e.name + '</div>' +
          '<div class="event-card__date">' + dateStr + '</div>' +
          '<div class="event-card__desc">' + e.description + '</div>' +
        '</div>';
      }).join('');
    }
  }

  function bindCulture() {
    /* --- Community pins --- */
    document.querySelectorAll('.community-pin').forEach(function (pin) {
      pin.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(this.dataset.community);
        var c = CULTURE_DATA.communities.find(function (x) { return x.id === id; });
        if (!c) return;

        document.querySelectorAll('.community-popup').forEach(function (p) { p.remove(); });
        document.querySelectorAll('.community-pin').forEach(function (p) { p.classList.remove('active'); });
        this.classList.add('active');

        var popup = document.createElement('div');
        popup.className = 'community-popup open';
        popup.innerHTML = '<div class="community-popup__title">' + c.name + '</div>' +
          '<div class="community-popup__dialect">' + c.dialect + ' · Pop: ' + c.population + '</div>' +
          '<div class="community-popup__desc">' + c.desc + '</div>';
        this.appendChild(popup);

        var closePopup = function () { popup.classList.remove('open'); setTimeout(function () { popup.remove(); }, 200); };
        setTimeout(function () {
          document.addEventListener('click', function handler(ev) {
            if (!ev.target.closest('.community-pin')) {
              closePopup();
              document.removeEventListener('click', handler);
            }
          });
        }, 0);
      });
    });

    /* --- Events icons: replace emoji with SVG --- */
    document.querySelectorAll('.event-card__icon').forEach(function (el) {
      var iconMap = {
        '🎭': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75l1.5-1.5M9 9.75l1.5-1.5m3-3l1.5 1.5M12 15l-6 6m0-6l6 6m3-15l6 6m0-6l-6 6m-3 3l6 6m-6 0l6-6"/></svg>',
        '🌾': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21V3m0 0L8.25 6M12 3l3.75 3M12 9l3.75 3M12 9l-3.75 3M12 15l3.75 3M12 15l-3.75 3"/></svg>',
        '⚖️': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 3 3m-3-3V3"/></svg>',
        '📚': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>'
      };
      var text = el.textContent.trim();
      if (iconMap[text]) { el.innerHTML = iconMap[text]; }
    });

    /* --- Media cards --- */
    document.querySelectorAll('[data-media]').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = parseInt(this.dataset.media);
        var m = CULTURE_DATA.media.find(function (x) { return x.id === id; });
        if (!m) return;
        openMediaViewer(m);
      });
    });

    /* --- Story cards --- */
    document.querySelectorAll('.story-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = parseInt(this.dataset.story);
        var s = CULTURE_DATA.stories.find(function (x) { return x.id === id; });
        if (!s) return;
        openStoryReader(s);
      });
    });

    /* --- Contribution button --- */
    var contributeBtn = document.querySelector('[data-action="open-contribute"]');
    if (contributeBtn) {
      contributeBtn.addEventListener('click', function () {
        if (!isLoggedIn() || getCurrentUser().role === 'guest') {
          window.showToast('🔒 Please sign in to contribute');
          window.openAuth();
          return;
        }
        document.getElementById('contribute-form').classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    }
  }

  /* --- Media Viewer --- */
  window.openMediaViewer = function (m) {
    var viewer = document.getElementById('media-viewer');
    document.getElementById('media-viewer-title').textContent = m.title;
    var isVideo = m.type === 'video';
    document.getElementById('media-viewer-body').innerHTML =
      '<div class="media-viewer__thumb" style="background: linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url(\'' + m.thumbnail + '\') center/cover;"></div>' +
      '<div class="media-viewer__desc">' + m.description + '</div>';
    document.getElementById('media-viewer-status').textContent = isVideo
      ? '▶️ Media player — playing ' + m.title + ' (' + m.duration + ')'
      : '📸 ' + m.count + ' — tap to view full gallery';
    viewer.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeMediaViewer = function () {
    document.getElementById('media-viewer').classList.remove('open');
    document.body.style.overflow = '';
  };

  /* --- Story Reader --- */
  window.openStoryReader = function (s) {
    var reader = document.getElementById('story-reader');
    document.getElementById('story-reader-title').textContent = s.title;
    var tagLabel = s.type === 'proverb' ? 'Proverb' : 'Folk Tale';
    var tagClass = s.type === 'proverb' ? 'story-card__tag--proverb' : 'story-card__tag--folktale';
    document.getElementById('story-reader-content').innerHTML =
      '<div class="story-reader__tag ' + tagClass + '">' + tagLabel + '</div>' +
      '<div class="story-reader__content">' + s.content + '</div>' +
      '<div class="story-reader__meaning-label">What it means</div>' +
      '<div class="story-reader__meaning">' + s.meaning + '</div>';
    reader.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeStoryReader = function () {
    document.getElementById('story-reader').classList.remove('open');
    document.body.style.overflow = '';
  };

  /* --- Contribution Form --- */
  window.closeContributeForm = function () {
    document.getElementById('contribute-form').classList.remove('open');
    document.body.style.overflow = '';
  };

  window.openContributeForm = function () {
    var user = getCurrentUser();
    if (!user) {
      window.showToast('🔒 Please sign in to contribute');
      window.openAuth();
      return;
    }
    document.getElementById('contribute-form').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.submitContribution = function (e) {
    e.preventDefault();
    var type = document.getElementById('contribute-type').value;
    var title = document.getElementById('contribute-title').value.trim();
    var desc = document.getElementById('contribute-desc').value.trim();
    if (!title) {
      window.showToast('❌ Please enter a title or word');
      return false;
    }
    window.closeContributeForm();
    document.getElementById('contribute-form-body').reset();
    window.showToast('✅ Your ' + type + ' submission has been sent for review. Thank you!');
    return false;
  };

  /* --- About / Ethical modals --- */
  window.openAbout = function () {
    document.getElementById('about-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  window.closeAbout = function () {
    document.getElementById('about-modal').classList.remove('open');
    document.body.style.overflow = '';
  };
  window.openEthical = function () {
    document.getElementById('ethical-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  window.closeEthical = function () {
    document.getElementById('ethical-modal').classList.remove('open');
    document.body.style.overflow = '';
  };

  /* --- Activity Logging --- */
  function logActivity(type, detail) {
    var log;
    try {
      log = JSON.parse(localStorage.getItem('sibugay_activity_log')) || [];
    } catch (e) { log = []; }
    log.push({ date: new Date().toISOString(), type: type, detail: detail });
    if (log.length > 500) log = log.slice(-500);
    try { localStorage.setItem('sibugay_activity_log', JSON.stringify(log)); } catch (e) {}
  }

  function getRealStats() {
    var log;
    try {
      log = JSON.parse(localStorage.getItem('sibugay_activity_log')) || [];
    } catch (e) { log = []; }

    var wordsLearned = 0;
    var quizAttempts = 0;
    var quizCorrect = 0;
    var seenWords = {};

    log.forEach(function (entry) {
      if (entry.type === 'quiz_question' && entry.detail) {
        quizAttempts++;
        if (entry.detail.indexOf('correct') !== -1) quizCorrect++;
      }
      if (entry.type === 'view_word' && entry.detail) {
        seenWords[entry.detail] = true;
      }
    });

    wordsLearned = Object.keys(seenWords).length;

    var streak = 0;
    try {
      var act = JSON.parse(localStorage.getItem('sibugay_activity'));
      if (act && act.streak) streak = act.streak;
    } catch (e) {}

    var accuracy = quizAttempts > 0 ? Math.round((quizCorrect / quizAttempts) * 100) : 0;

    return { wordsLearned: wordsLearned, dayStreak: streak, quizAccuracy: accuracy };
  }

  function getDailyGoal() {
    try {
      return parseInt(localStorage.getItem('sibugay_daily_goal'), 10) || 10;
    } catch (e) { return 10; }
  }

  function getTodaysProgress() {
    var log;
    try {
      log = JSON.parse(localStorage.getItem('sibugay_activity_log')) || [];
    } catch (e) { log = []; }
    var today = new Date().toISOString().slice(0, 10);
    var count = 0;
    var seenWords = {};
    log.forEach(function (entry) {
      if (entry.date && entry.date.slice(0, 10) === today) {
        if (entry.type === 'view_word' && entry.detail && !seenWords[entry.detail]) {
          seenWords[entry.detail] = true;
          count++;
        }
      }
    });
    return count;
  }



  /* ---------- activities ---------- */
  /* --- Difficulty word pools --- */
  function getWordsByDifficulty(diff) {
    if (diff === 'beginner') {
      return GLOSSARY.filter(function (e) {
        return e.categories.some(function (c) { return c === 'Family & Kinship' || c === 'Nature & Land' || c === 'Community'; });
      });
    }
    if (diff === 'intermediate') {
      return GLOSSARY.filter(function (e) {
        return e.categories.some(function (c) { return c === 'Governance' || c === 'Trade & Craft' || c === 'Community'; });
      });
    }
    return GLOSSARY; /* advanced = all */
  }

  /* --- Generate quiz from GLOSSARY --- */
  function generateQuiz(difficulty) {
    var pool = getWordsByDifficulty(difficulty);
    var shuffled = pool.slice().sort(function () { return Math.random() - 0.5; });
    var questions = shuffled.slice(0, Math.min(8, shuffled.length));

    return questions.map(function (entry) {
      var wrongPool = GLOSSARY.filter(function (e) { return e.id !== entry.id; });
      var wrongAnswers = [];
      var usedIdx = {};
      while (wrongAnswers.length < 3 && wrongPool.length > 0) {
        var idx = Math.floor(Math.random() * wrongPool.length);
        if (!usedIdx[idx]) {
          usedIdx[idx] = true;
          wrongAnswers.push(wrongPool[idx].english);
        }
      }
      var options = [entry.english].concat(wrongAnswers);
      /* shuffle options */
      for (var i = options.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = options[i]; options[i] = options[j]; options[j] = tmp;
      }
      var correctIdx = options.indexOf(entry.english);
      return { word: entry.word, lang: entry.dialect, options: options, correct: correctIdx, pos: entry.pos, filipino: entry.filipino };
    });
  }

  var activeQuiz = [];
  var currentQ = 0;
  var score = 0;
  var quizLog = [];
  var currentDifficulty = 'beginner';

  function loadQuestion() {
    var q = activeQuiz[currentQ];
    if (!q) return;
    document.getElementById('quiz-word').textContent = q.word;
    document.getElementById('quiz-lang').textContent = q.lang + ' · ' + q.pos;
    document.getElementById('quiz-counter').textContent = (currentQ + 1) + ' / ' + activeQuiz.length;
    document.getElementById('quiz-progress-fill').style.width = ((currentQ + 1) / activeQuiz.length * 100) + '%';

    var optsDiv = document.getElementById('quiz-options');
    optsDiv.innerHTML = '';
    optsDiv.dataset.answered = 'false';

    q.options.forEach(function (opt, idx) {
      var btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.onclick = function () {
        if (optsDiv.dataset.answered === 'true') return;
        optsDiv.dataset.answered = 'true';
        var isCorrect = idx === q.correct;
        if (isCorrect) { btn.classList.add('correct'); score++; }
        else { btn.classList.add('wrong'); optsDiv.children[q.correct].classList.add('correct'); }
        quizLog.push({ word: q.word, correct: isCorrect, yourAnswer: opt, correctAnswer: q.options[q.correct] });
        setTimeout(function () {
          currentQ++;
          optsDiv.dataset.answered = 'false';
          if (currentQ >= activeQuiz.length) { showResults(); }
          else { loadQuestion(); }
        }, 800);
      };
      optsDiv.appendChild(btn);
    });
  }

  function showResults() {
    var pct = Math.round(score / activeQuiz.length * 100);
    document.getElementById('quiz-active').style.display = 'none';
    document.getElementById('quiz-result').style.display = 'block';
    document.getElementById('quiz-score').textContent = score + '/' + activeQuiz.length;
    document.getElementById('result-icon').textContent = pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪';
    document.getElementById('result-heading').textContent = pct >= 80 ? 'Great Job!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!';
    document.getElementById('result-perfect').textContent = pct >= 100 ? 'Perfect score! 🌟' : '';

    var breakdown = document.getElementById('result-breakdown');
    breakdown.innerHTML = '<p class="text-xs text-muted font-semibold mb-sm text-uppercase tracking-wide">Breakdown</p>' +
      quizLog.map(function (item) {
        return '<div class="result-item result-item--' + (item.correct ? 'correct' : 'wrong') + '">' +
          '<div class="result-item__icon">' + (item.correct ? '✅' : '❌') + '</div>' +
          '<div class="result-item__word">' + item.word + '</div>' +
          '<div class="result-item__answer">' + (item.correct ? item.yourAnswer : '→ ' + item.correctAnswer) + '</div>' +
        '</div>';
      }).join('');

    recordActivity();
  }

  function recordActivity() {
    try {
      var today = new Date().toDateString();
      var data = JSON.parse(localStorage.getItem('sibugay_activity') || '{}');
      if (data.lastDate !== today) {
        /* new day — increment streak if yesterday */
        var yesterday = new Date(Date.now() - 86400000).toDateString();
        data.streak = (data.lastDate === yesterday ? (data.streak || 0) : 0) + 1;
        data.lastDate = today;
      }
      data.lastActivity = Date.now();
      localStorage.setItem('sibugay_activity', JSON.stringify(data));
    } catch (e) {}
    renderStreak();
  }

  function renderStreak() {
    var streakEl = document.getElementById('activities-streak');
    if (!streakEl) return;
    try {
      var data = JSON.parse(localStorage.getItem('sibugay_activity') || '{}');
      var streak = data.streak || 0;
      var todayDone = data.lastDate === new Date().toDateString();
      streakEl.innerHTML =
        '<div class="streak-bar__icon">🔥</div>' +
        '<div class="streak-bar__info">' +
          '<div class="streak-bar__count">' + streak + ' day' + (streak !== 1 ? 's' : '') + '</div>' +
          '<div class="streak-bar__label">' + (todayDone ? 'Practiced today!' : 'Complete an activity to start your streak') + '</div>' +
        '</div>' +
        '<button class="streak-bar__btn" onclick="window.showToast(\'🔥 Keep it up! Practice daily to maintain your streak.\')">Info</button>';
    } catch (e) {
      streakEl.innerHTML = '';
    }
  }

  /* --- Flashcards --- */
  var flashcardList = [];
  var fcIndex = 0;

  function loadFlashcard(index) {
    var card = flashcardList[index];
    if (!card) return;
    document.getElementById('fc-word').textContent = card.word;
    document.getElementById('fc-dialect').textContent = card.dialect + ' · ' + card.pos;
    document.getElementById('fc-trans').textContent = card.filipino + ' · ' + card.english;
    document.getElementById('fc-def').textContent = card.definition;
    document.getElementById('flashcard-counter').textContent = (index + 1) + ' / ' + flashcardList.length;
    document.getElementById('fc-prev').disabled = index === 0;
    document.getElementById('fc-next').textContent = index >= flashcardList.length - 1 ? 'Done' : 'Next';
    document.getElementById('flashcard').classList.remove('flipped');
  }

  function bindFlashcards() {
    var container = document.getElementById('flashcard-container');
    if (!container) return;
    var newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);
    newContainer.addEventListener('click', function () {
      document.getElementById('flashcard').classList.toggle('flipped');
    });

    var prevBtn = document.getElementById('fc-prev');
    var nextBtn = document.getElementById('fc-next');
    if (prevBtn) {
      var newPrev = prevBtn.cloneNode(true);
      prevBtn.parentNode.replaceChild(newPrev, prevBtn);
      newPrev.addEventListener('click', function () {
        if (fcIndex > 0) { fcIndex--; loadFlashcard(fcIndex); }
      });
    }
    if (nextBtn) {
      var newNext = nextBtn.cloneNode(true);
      nextBtn.parentNode.replaceChild(newNext, nextBtn);
      newNext.addEventListener('click', function () {
        if (fcIndex < flashcardList.length - 1) { fcIndex++; loadFlashcard(fcIndex); recordActivity(); }
        else {
          /* done — go back */
          document.getElementById('flashcard-panel').classList.add('hidden');
          document.getElementById('flashcard-panel').style.display = 'none';
          document.getElementById('activity-menu').style.display = 'grid';
        }
      });
    }

    fcIndex = 0;
    loadFlashcard(0);
  }

  /* --- Bind activities --- */
  function bindActivities() {
    renderStreak();

    /* Difficulty buttons */
    document.querySelectorAll('.difficulty-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.difficulty-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        currentDifficulty = this.dataset.diff;
      });
    });

    var menu = document.getElementById('activity-menu');
    var quizPanel = document.getElementById('quiz-panel');
    var fcPanel = document.getElementById('flashcard-panel');

    /* Quiz */
    document.querySelectorAll('[data-action="show-quiz"]').forEach(function (el) {
      var newEl = el.cloneNode(true);
      el.parentNode.replaceChild(newEl, el);
      newEl.addEventListener('click', function () {
        menu.style.display = 'none';
        quizPanel.classList.remove('hidden');
        quizPanel.style.display = 'block';
        document.getElementById('quiz-active').style.display = 'block';
        document.getElementById('quiz-result').style.display = 'none';
        currentQ = 0; score = 0; quizLog = [];
        activeQuiz = generateQuiz(currentDifficulty);
        if (activeQuiz.length === 0) {
          document.getElementById('quiz-word').textContent = 'No words available';
          return;
        }
        loadQuestion();
      });
    });

    /* Flashcards */
    document.querySelectorAll('[data-action="show-flashcards"]').forEach(function (el) {
      var newEl = el.cloneNode(true);
      el.parentNode.replaceChild(newEl, el);
      newEl.addEventListener('click', function () {
        menu.style.display = 'none';
        fcPanel.classList.remove('hidden');
        fcPanel.style.display = 'block';
        var pool = getWordsByDifficulty(currentDifficulty);
        flashcardList = pool.slice().sort(function () { return Math.random() - 0.5; });
        bindFlashcards();
      });
    });

    /* Back buttons */
    var qBack = quizPanel ? quizPanel.querySelector('[data-action="hide-quiz"]') : null;
    if (qBack) {
      var newQBack = qBack.cloneNode(true);
      qBack.parentNode.replaceChild(newQBack, qBack);
      newQBack.addEventListener('click', function () {
        quizPanel.style.display = 'none';
        quizPanel.classList.add('hidden');
        menu.style.display = 'grid';
      });
    }

    var fcBack = fcPanel ? fcPanel.querySelector('[data-action="hide-flashcards"]') : null;
    if (fcBack) {
      var newFcBack = fcBack.cloneNode(true);
      fcBack.parentNode.replaceChild(newFcBack, fcBack);
      newFcBack.addEventListener('click', function () {
        fcPanel.style.display = 'none';
        fcPanel.classList.add('hidden');
        menu.style.display = 'grid';
      });
    }
  }

  /* ---------- bottom nav ---------- */
  $navItems.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var page = this.dataset.page;
      if (page && page !== state.currentPage) navigate(page);
    });
  });

  /* ---------- global click handlers ---------- */
  document.addEventListener('click', function (e) {
    var favBtn = e.target.closest('[aria-label="Save to favorites"]');
    if (favBtn) {
      var word = document.getElementById('detail-heading').textContent || 'Word';
      window.showToast('❤️ ' + word + ' saved to favorites!');
    }

    var darkToggle = e.target.closest('.toggle[aria-label="Toggle dark mode"]');
    if (darkToggle) {
      var isDark = document.body.classList.toggle('dark-theme');
      try { localStorage.setItem('sibugay_dark_mode', isDark ? '1' : ''); } catch (e) {}
      window.showToast(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
    }

    var toggle = e.target.closest('.toggle:not([aria-label="Toggle dark mode"]):not([aria-label="Toggle audio autoplay"]):not([aria-label="Toggle offline mode"]):not([aria-label="Toggle notifications"])');
    if (toggle) {
      toggle.classList.toggle('on');
      toggle.setAttribute('aria-pressed', toggle.classList.contains('on'));
    }

    var audioToggle = e.target.closest('.toggle[aria-label="Toggle audio autoplay"]');
    if (audioToggle) {
      audioToggle.classList.toggle('on');
      audioToggle.setAttribute('aria-pressed', audioToggle.classList.contains('on'));
      try { localStorage.setItem('sibugay_autoplay', audioToggle.classList.contains('on') ? '1' : ''); } catch (e) {}
      window.showToast(audioToggle.classList.contains('on') ? '🔊 Audio autoplay on' : '🔇 Audio autoplay off');
    }

    var offlineToggle = e.target.closest('.toggle[aria-label="Toggle offline mode"]');
    if (offlineToggle) {
      offlineToggle.classList.toggle('on');
      offlineToggle.setAttribute('aria-pressed', offlineToggle.classList.contains('on'));
      try { localStorage.setItem('sibugay_offline', offlineToggle.classList.contains('on') ? '1' : ''); } catch (e) {}
      window.showToast(offlineToggle.classList.contains('on') ? '📶 Downloading glossary for offline use...' : '📶 Offline mode disabled');
    }

    var notifToggle = e.target.closest('.toggle[aria-label="Toggle notifications"]');
    if (notifToggle) {
      notifToggle.classList.toggle('on');
      notifToggle.setAttribute('aria-pressed', notifToggle.classList.contains('on'));
      try { localStorage.setItem('sibugay_notifications', notifToggle.classList.contains('on') ? '1' : ''); } catch (e) {}
      window.showToast(notifToggle.classList.contains('on') ? '🔔 Notifications on' : '🔕 Notifications off');
    }

    var langOpt = e.target.closest('.lang-option');
    if (langOpt) {
      var selector = langOpt.closest('.lang-selector');
      if (selector) {
        selector.querySelectorAll('.lang-option').forEach(function (o) {
          o.classList.remove('active');
          o.setAttribute('aria-pressed', 'false');
        });
        langOpt.classList.add('active');
        langOpt.setAttribute('aria-pressed', 'true');
      }
    }

    var chip = e.target.closest('.chips-scroll .chip');
    if (chip) {
      document.querySelectorAll('.chips-scroll .chip').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
    }

    var aboutChevron = e.target.closest('.btn-chevron[aria-label="Learn more about this project"]');
    if (aboutChevron) {
      e.preventDefault();
      window.openAbout();
    }

    var ethicalChevron = e.target.closest('.btn-chevron[aria-label="Read ethical data policy"]');
    if (ethicalChevron) {
      e.preventDefault();
      window.openEthical();
    }
  });

  /* ---------- auto-hide bottom nav on scroll ---------- */
  var lastScrollY = 0;
  var bottomNav = document.querySelector('.bottomnav');
  $main.addEventListener('scroll', function () {
    var st = this.scrollTop;
    if (st > lastScrollY && st > 60) {
      bottomNav.classList.add('bottomnav--hidden');
    } else {
      bottomNav.classList.remove('bottomnav--hidden');
    }
    lastScrollY = st;
  });

  /* ======================== AUTH ======================== */

  function getSavedUser() {
    try {
      var data = localStorage.getItem('sibugay_user');
      if (data) return JSON.parse(data);
    } catch (e) {}
    return null;
  }

  function saveUser(user) {
    try { localStorage.setItem('sibugay_user', JSON.stringify(user)); } catch (e) {}
  }

  function clearUser() {
    try { localStorage.removeItem('sibugay_user'); } catch (e) {}
  }

  function getCurrentUser() {
    return getSavedUser();
  }

  function isLoggedIn() {
    return !!getCurrentUser();
  }

  function hasRole(role) {
    var u = getCurrentUser();
    return u && u.role === role;
  }

  window.openAuth = function () {
    document.getElementById('auth-panel').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeAuth = function () {
    document.getElementById('auth-panel').classList.remove('open');
    document.body.style.overflow = '';
  };

  window.switchAuthTab = function (tab) {
    document.querySelectorAll('.auth-tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.authTab === tab);
      t.setAttribute('aria-selected', t.dataset.authTab === tab);
    });
    document.querySelectorAll('.auth-form').forEach(function (f) {
      f.classList.toggle('auth-form--active', f.id === 'auth-form-' + tab);
    });
  };

  window.doLogin = function (e) {
    e.preventDefault();
    var email = document.getElementById('login-email').value.trim().toLowerCase();
    var password = document.getElementById('login-password').value;
    var remember = document.getElementById('login-remember').checked;

    var user = null;
    if (typeof MOCK_USERS !== 'undefined') {
      user = MOCK_USERS.find(function (u) { return u.email.toLowerCase() === email && u.password === password; });
    }
    if (!user) {
      window.showToast('❌ Invalid email or password. Try rani@example.com / password');
      return false;
    }

    saveUser({ id: user.id, name: user.name, email: user.email, role: user.role, roleLabel: user.roleLabel, avatar: user.avatar, program: user.program, stats: user.stats });
    window.closeAuth();
    window.showToast('👋 Welcome back, ' + user.name + '!');
    if (state.currentPage === 'profile') navigate('profile');
    return false;
  };

  window.doSignup = function (e) {
    e.preventDefault();
    var name = document.getElementById('signup-name').value.trim();
    var email = document.getElementById('signup-email').value.trim().toLowerCase();
    var password = document.getElementById('signup-password').value;
    var role = document.getElementById('signup-role').value;
    var program = document.getElementById('signup-program').value.trim();

    if (!name || !email || !password) {
      window.showToast('❌ Please fill in all required fields');
      return false;
    }

    var roleLabels = { learner: 'Learner', contributor: 'Contributor', elder: 'Elder / Validator', admin: 'Researcher / Admin' };
    var avatars = { learner: '👤', contributor: '🎓', elder: '👴', admin: '🔬' };
    var newUser = {
      id: Date.now(),
      name: name,
      email: email,
      role: role,
      roleLabel: roleLabels[role] || 'Learner',
      avatar: avatars[role] || '👤',
      program: program || 'Not specified',
      stats: { wordsLearned: 0, dayStreak: 0, quizAccuracy: 0 }
    };

    saveUser({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, roleLabel: newUser.roleLabel, avatar: newUser.avatar, program: newUser.program, stats: newUser.stats });
    window.closeAuth();
    window.showToast('🎉 Account created! Welcome, ' + name + '!');
    if (state.currentPage === 'profile') navigate('profile');
    return false;
  };

  window.loginAsGuest = function () {
    saveUser({ id: 0, name: 'Guest', email: '', role: 'guest', roleLabel: 'Guest', avatar: '👤', program: 'Browse-only mode', stats: { wordsLearned: 0, dayStreak: 0, quizAccuracy: 0 } });
    window.closeAuth();
    window.showToast('👋 Browsing as Guest');
    if (state.currentPage === 'profile') navigate('profile');
  };

  window.logoutUser = function () {
    clearUser();
    window.showToast('👋 Signed out');
    navigate('profile');
  };

  /* ---------- render profile ---------- */
  function renderProfile() {
    var user = getCurrentUser();
    var section = document.querySelector('[data-profile-section]');
    if (!section) return;

    if (!user) {
      section.innerHTML =
        '<div class="profile-header">' +
          '<div class="avatar" aria-hidden="true">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>' +
          '</div>' +
          '<h2>Welcome!</h2>' +
          '<p>Sign in to track your progress</p>' +
        '</div>' +
        '<div style="padding:1.25rem;text-align:center;">' +
          '<button class="btn-primary" onclick="window.openAuth()" style="display:inline-flex;align-items:center;gap:8px;">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>' +
            'Sign In / Register' +
          '</button>' +
          '<p class="text-xs text-muted mt-sm">Or <button class="auth-link" onclick="window.loginAsGuest()">continue as Guest</button></p>' +
        '</div>' +
        getSettingsHTML() +
        getAboutHTML();
      return;
    }

    var isAdmin = user.role === 'admin';
    var isElder = user.role === 'elder';
    var isContributor = user.role === 'contributor';
    var isGuest = user.role === 'guest';

    var initials = user.name.split(' ').map(function (s) { return s.charAt(0); }).join('').slice(0, 2).toUpperCase();
    var stats = getRealStats();
    var dailyGoal = getDailyGoal();
    var todayCount = getTodaysProgress();
    var progressPct = Math.min(todayCount / dailyGoal * 100, 100);
    var circumference = 2 * Math.PI * 39;
    var offset = circumference - (progressPct / 100) * circumference;

    section.innerHTML =
      '<div class="profile-header">' +
        '<div class="avatar" aria-hidden="true"><span style="font-family:var(--font-serif);font-size:24px;font-weight:600;">' + initials + '</span></div>' +
        '<h2>' + user.name + '</h2>' +
        '<p>' + user.program + '</p>' +
        '<div class="mt-sm"><span class="badge badge--pos" style="background:var(--color-primary);color:#fff;font-size:11px;">' + user.roleLabel + '</span></div>' +
      '</div>' +
      (isGuest ? '' :
        '<div class="goal-section">' +
          '<div class="goal-ring">' +
            '<svg viewBox="0 0 88 88" aria-hidden="true">' +
              '<circle class="goal-ring__bg" cx="44" cy="44" r="39"/>' +
              '<circle class="goal-ring__fill" cx="44" cy="44" r="39" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '"/>' +
            '</svg>' +
            '<div class="goal-ring__text">' + todayCount + '<span>of ' + dailyGoal + '</span></div>' +
          '</div>' +
          '<div class="goal-label">Daily Goal — ' + (progressPct >= 100 ? 'Complete!' : Math.round(progressPct) + '%') + '</div>' +
        '</div>' +
        '<div class="stats-row" aria-label="Learning progress">' +
          '<div class="stat-card"><div class="stat-card__number">' + stats.wordsLearned + '</div><div class="stat-card__label">Words learned</div></div>' +
          '<div class="stat-card"><div class="stat-card__number">' + stats.dayStreak + '</div><div class="stat-card__label">Day streak</div></div>' +
          '<div class="stat-card"><div class="stat-card__number">' + stats.quizAccuracy + '%</div><div class="stat-card__label">Quiz accuracy</div></div>' +
        '</div>'
      ) +
      getSettingsHTML() +
      (isGuest ? '' : getContributionHTML(isContributor)) +
      (isAdmin ? getAdminHTML() : '') +
      getAboutHTML() +
      '<div style="padding:0 1.25rem 1.5rem;text-align:center;">' +
        '<button class="btn-outline w-full justify-center" onclick="window.logoutUser()" style="color:var(--color-danger);border-color:#f0c0c0;">' +
          'Sign Out' +
        '</button>' +
      '</div>';
  }

  function getSettingsHTML() {
    var autoplayOn = (function () { try { return localStorage.getItem('sibugay_autoplay') === '1'; } catch (e) { return true; } })();
    var darkOn = (function () { try { return localStorage.getItem('sibugay_dark_mode') === '1'; } catch (e) { return false; } })();
    var offlineOn = (function () { try { return localStorage.getItem('sibugay_offline') === '1'; } catch (e) { return false; } })();
    var notifOn = (function () { try { return localStorage.getItem('sibugay_notifications') === '1'; } catch (e) { return false; } })();
    return '' +
      '<div class="section-header mt-sm"><h2>App settings</h2></div>' +
      '<div class="settings-list" role="list">' +
        '<div class="settings-item" role="listitem">' +
          '<div class="settings-item__icon bg-primary-light" aria-hidden="true">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>' +
          '</div>' +
          '<div class="settings-item__body"><div class="settings-item__label">Interface language</div><div class="settings-item__desc">Choose your display language</div></div>' +
          '<div class="lang-selector" role="group" aria-label="Interface language">' +
            '<button class="lang-option active" aria-pressed="true">FIL</button><button class="lang-option" aria-pressed="false">EN</button>' +
          '</div>' +
        '</div>' +
        '<div class="settings-item" role="listitem">' +
          '<div class="settings-item__icon bg-gold-light" aria-hidden="true">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"/></svg>' +
          '</div>' +
          '<div class="settings-item__body"><div class="settings-item__label">Audio autoplay</div><div class="settings-item__desc">Play pronunciation when a word opens</div></div>' +
          '<button class="toggle' + (autoplayOn ? ' on' : '') + '" aria-pressed="' + autoplayOn + '" aria-label="Toggle audio autoplay"></button>' +
        '</div>' +
        '<div class="settings-item" role="listitem">' +
          '<div class="settings-item__icon" style="background:#F0F0FF;" aria-hidden="true">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>' +
          '</div>' +
          '<div class="settings-item__body"><div class="settings-item__label">Dark mode</div><div class="settings-item__desc">Switch to a darker color scheme</div></div>' +
          '<button class="toggle' + (darkOn ? ' on' : '') + '" aria-pressed="' + darkOn + '" aria-label="Toggle dark mode"></button>' +
        '</div>' +
        '<div class="settings-item" role="listitem">' +
          '<div class="settings-item__icon" style="background:#FDE8E8;" aria-hidden="true">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"/></svg>' +
          '</div>' +
          '<div class="settings-item__body"><div class="settings-item__label">Offline mode</div><div class="settings-item__desc">Download glossary for offline use</div></div>' +
          '<button class="toggle' + (offlineOn ? ' on' : '') + '" aria-pressed="' + offlineOn + '" aria-label="Toggle offline mode"></button>' +
        '</div>' +
        '<div class="settings-item" role="listitem">' +
          '<div class="settings-item__icon" style="background:#E8F5E9;" aria-hidden="true">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>' +
          '</div>' +
          '<div class="settings-item__body"><div class="settings-item__label">Notifications</div><div class="settings-item__desc">Word of the day reminders</div></div>' +
          '<button class="toggle' + (notifOn ? ' on' : '') + '" aria-pressed="' + notifOn + '" aria-label="Toggle notifications"></button>' +
        '</div>' +
      '</div>';
  }

  function getContributionHTML(isContributor) {
    return '' +
      '<div class="section-header mt-xl"><h2>Community Contribution</h2></div>' +
      '<div class="contribution-card">' +
        '<h3 class="text-base text-primary-dark font-semibold mb-sm">' + (isContributor ? 'Submit a word' : 'Know a missing word?') + '</h3>' +
        '<p class="text-sm text-muted mb-lg">' + (isContributor ? 'Share indigenous terms, audio recordings, or cultural stories for review.' : 'Help preserve our heritage by submitting indigenous terms, audio recordings, or cultural stories.') + '</p>' +
        '<button class="btn-primary w-full justify-center" onclick="window.openContributeForm()">Submit to Glossary</button>' +
      '</div>';
  }

  function getAdminHTML() {
    return '' +
      '<div class="section-header mt-xl"><h2>Admin Access</h2></div>' +
      '<div class="settings-list" role="list">' +
        '<a href="../admin/admin.html" class="settings-item flex" role="listitem">' +
          '<div class="settings-item__icon text-danger" style="background:#FDE8E8;" aria-hidden="true">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>' +
          '</div>' +
          '<div class="settings-item__body"><div class="settings-item__label text-danger">Admin Console</div><div class="settings-item__desc">Manage dictionary entries, review submissions, view analytics</div></div>' +
          '<button class="btn-chevron" aria-label="Go to Admin Console"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></button>' +
        '</a>' +
      '</div>';
  }

  function getAboutHTML() {
    return '' +
      '<div class="section-header mt-xl"><h2>About</h2></div>' +
      '<div class="settings-list" role="list">' +
        '<div class="settings-item" role="listitem">' +
          '<div class="settings-item__icon bg-primary-light" aria-hidden="true">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>' +
          '</div>' +
          '<div class="settings-item__body"><div class="settings-item__label">About this project</div><div class="settings-item__desc">WMSU · Pasgala &amp; Ruing · 2025</div></div>' +
          '<button class="btn-chevron" aria-label="Learn more about this project"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></button>' +
        '</div>' +
        '<div class="settings-item" role="listitem">' +
          '<div class="settings-item__icon bg-primary-light" aria-hidden="true">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>' +
          '</div>' +
          '<div class="settings-item__body"><div class="settings-item__label">Ethical data use</div><div class="settings-item__desc">All words validated by Gukom elders</div></div>' +
          '<button class="btn-chevron" aria-label="Read ethical data policy"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></button>' +
        '</div>' +
      '</div>';
  }

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (document.getElementById('auth-panel').classList.contains('open')) window.closeAuth();
      if ($detailPanel.classList.contains('open')) window.closeDetail();
      if (document.getElementById('story-reader').classList.contains('open')) window.closeStoryReader();
      if (document.getElementById('media-viewer').classList.contains('open')) window.closeMediaViewer();
      if (document.getElementById('contribute-form').classList.contains('open')) window.closeContributeForm();
      if (document.getElementById('report-form').classList.contains('open')) window.closeReportForm();
      if (document.getElementById('version-modal').classList.contains('open')) window.closeVersionHistory();
      if (document.getElementById('about-modal').classList.contains('open')) window.closeAbout();
      if (document.getElementById('ethical-modal').classList.contains('open')) window.closeEthical();
    }
  });

  /* ---------- init ---------- */
  try {
    var savedDark = localStorage.getItem('sibugay_dark_mode');
    if (savedDark === '1') document.body.classList.add('dark-theme');

    if (typeof GLOSSARY !== 'undefined' && GLOSSARY.length > 0) {
      navigate('home');
      var notifOn = localStorage.getItem('sibugay_notifications') === '1';
      if (notifOn) {
        var todayWord = GLOSSARY[new Date().getDate() % GLOSSARY.length];
        setTimeout(function () {
          window.showToast('🔔 Word of the Day: "' + todayWord.word + '" — ' + todayWord.english);
        }, 2000);
      }
    } else {
      $main.innerHTML = '<div class="error-state"><div class="error-state__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="48" height="48" style="opacity:0.5;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg></div><div class="error-state__title">Data not loaded</div><div class="error-state__desc">The glossary data file could not be loaded. Please check that js/data.js exists.</div></div>';
    }
  } catch (e) {
    $main.innerHTML = '<div class="error-state"><div class="error-state__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" width="48" height="48" style="opacity:0.5;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg></div><div class="error-state__title">Something went wrong</div><div class="error-state__desc">' + e.message + '</div></div>';
  }

  /* ---------- toast ---------- */
  window.showToast = function (message) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('show'); });
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  };
})();
