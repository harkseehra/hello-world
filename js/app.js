// ── Masnavi.ca · app.js ──────────────────────────────────────────────────────
'use strict';

// ── Size tables ───────────────────────────────────────────────────────────────
const SIZE_STEPS  = 6;
const SIZE_EN     = [16, 18, 20, 22, 24, 26];
const SIZE_FA_V   = [20, 22, 24, 26, 28, 30];     // Vazirmatn
const LH_FA_V     = [2.05, 2.05, 2.10, 2.10, 2.15, 2.20];
const SIZE_FA_L   = [23, 25, 28, 30, 32, 35];     // Nazanin (+15%)
const LH_FA_L     = [2.00, 2.00, 2.05, 2.05, 2.10, 2.15];
const SIZE_FA_A   = [24, 26, 29, 31, 34, 37];     // Arial (+20%, heavier optical weight)
const LH_FA_A     = [2.00, 2.00, 2.05, 2.05, 2.10, 2.15];
const LH_EN       = [1.80, 1.80, 1.80, 1.80, 1.85, 1.85];

const VERSES_PER_PAGE = 10;

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  book:     1,
  mode:     'focus',
  font:     'vazir',
  theme:    'light',
  sizeStep: 1,        // step 1 → en:18 px, naskh fa:22 px
  page:     0,
  pages:    [],
  cache:    {},
  entries:  [],
};

// ── DOM ───────────────────────────────────────────────────────────────────────
const html           = document.documentElement;
const progressBar    = document.getElementById('progress-bar');
const bookTabs       = document.querySelectorAll('.book-tab');
const btnMode        = document.getElementById('btn-mode');
const btnMenu        = document.getElementById('btn-menu');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const btnSearch      = document.getElementById('btn-search');
const btnSettings    = document.getElementById('btn-settings');
const mobileMenu     = document.getElementById('mobile-menu');
const settingsPanel  = document.getElementById('settings-panel');
const fontOpts       = document.getElementById('font-options');
const enFontOpts     = document.getElementById('en-font-options');
const faColorOpts    = document.getElementById('fa-color-options');
const enColorOpts    = document.getElementById('en-color-options');
const sizeUpBtn      = document.getElementById('size-up');
const sizeDownBtn    = document.getElementById('size-down');
const focusView      = document.getElementById('focus-view');
const focusScroll    = document.getElementById('focus-scroll');
const focusLoading   = document.getElementById('focus-loading');
const scholarView    = document.getElementById('scholar-view');
const scholarGrid    = document.getElementById('scholar-grid');
const scholarLoading = document.getElementById('scholar-loading');
const searchOverlay  = document.getElementById('search-overlay');
const searchPanel    = document.getElementById('search-panel');
const searchInput    = document.getElementById('search-input');
const searchResults  = document.getElementById('search-results');
const tocPanel          = document.getElementById('toc-panel');
const tocBackdrop       = document.getElementById('toc-backdrop');
const tocList           = document.getElementById('toc-list');
const tocBookLabel      = document.getElementById('toc-book-label');
const bookmarkPanel     = document.getElementById('bookmark-panel');
const hlPicker          = document.getElementById('hl-picker');
const bookmarkBackdrop  = document.getElementById('bookmark-backdrop');
const bookmarkList      = document.getElementById('bookmark-list');
const btnBookmarks      = document.getElementById('btn-bookmarks');
const navBookPill    = document.getElementById('nav-book-pill');
const pager          = document.getElementById('pager');
const pagerPrevBtn   = document.getElementById('pager-prev');
const pagerNextBtn   = document.getElementById('pager-next');
const pagerInfo      = document.getElementById('pager-info');
const tabBooks       = document.getElementById('tab-books');
const tabSearch      = document.getElementById('tab-search');
const tabBookmarks   = document.getElementById('tab-bookmarks');
const tabSettings    = document.getElementById('tab-settings');

// ── Init ──────────────────────────────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('mv-theme');
  // Migrate old 'sepia' key → 'kaghaz'
  const resolved = saved === 'sepia' ? 'kaghaz' : saved;
  const auto  = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(resolved || auto);
}

function initFont() {
  const savedFont = localStorage.getItem('mv-font');
  // Migrate old font keys → 'vazir'
  const resolvedFont = (savedFont === 'naskh' || savedFont === 'mirza' || savedFont === 'lalezar' || savedFont === 'amiri' || savedFont === 'iransans' || savedFont === 'harmattan' || savedFont === 'markazi') ? 'vazir' : savedFont;
  setFont(resolvedFont || 'vazir', false);

  const savedEnFont = localStorage.getItem('mv-en-font');
  if (savedEnFont) setEnFont(savedEnFont, false);

  const savedFaColor = localStorage.getItem('mv-fa-color');
  const removedFaColors = ['peacock', 'khun', 'zafarani'];
  const resolvedFaColor = removedFaColors.includes(savedFaColor) ? 'irozumi' : savedFaColor;
  if (resolvedFaColor) setFaColor(resolvedFaColor, false);

  const savedEnColor = localStorage.getItem('mv-en-color');
  if (savedEnColor) setEnColor(savedEnColor, false);


  const savedStep = localStorage.getItem('mv-size-step');
  if (savedStep !== null) {
    state.sizeStep = Math.max(0, Math.min(SIZE_STEPS - 1, parseInt(savedStep)));
  }

  applySizes();
}

// ── Theme ─────────────────────────────────────────────────────────────────────

// Internal: apply DOM changes (called inside or outside a view transition)
function applyTheme(t) {
  state.theme        = t;
  html.dataset.theme = t;
  // Aria label describes the NEXT action (what clicking will do)
  const labels = { light: 'Switch to dark mode', dark: 'Switch to کاغذ mode', kaghaz: 'Switch to day mode' };
  btnThemeToggle.setAttribute('aria-label', labels[t] || 'Cycle theme');
  btnThemeToggle.setAttribute('aria-pressed', t !== 'light' ? 'true' : 'false');
}

function setTheme(t, save = true) {
  if (save) localStorage.setItem('mv-theme', t);
  if (document.startViewTransition) {
    document.startViewTransition(() => applyTheme(t));
  } else {
    applyTheme(t);
  }
}

// ── Farsi font ────────────────────────────────────────────────────────────────

function setFont(f, save = true) {
  state.font        = f;
  html.dataset.font = f;
  if (save) localStorage.setItem('mv-font', f);
  document.querySelectorAll('[data-font]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.font === f);
  });
  applySizes();
}

// ── English font ──────────────────────────────────────────────────────────────

function setEnFont(f, save = true) {
  html.dataset.enFont = f;
  if (save) localStorage.setItem('mv-en-font', f);
  document.querySelectorAll('[data-en-font]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.enFont === f);
  });
  applySizes();
}

// ── Farsi colour ──────────────────────────────────────────────────────────────

function setFaColor(c, save = true) {
  html.dataset.faColor = c;
  if (save) localStorage.setItem('mv-fa-color', c);
  document.querySelectorAll('[data-fa-color]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.faColor === c);
  });
}


// ── English colour ────────────────────────────────────────────────────────────

function setEnColor(c, save = true) {
  html.dataset.enColor = c;
  if (save) localStorage.setItem('mv-en-color', c);
  document.querySelectorAll('[data-en-color]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.enColor === c);
  });
}


// ── Size ──────────────────────────────────────────────────────────────────────

function applySizes() {
  const s     = state.sizeStep;
  const serif = html.dataset.enFont === 'serif';

  let fzFa, lhFa;
  if (state.font === 'arial') {
    fzFa = SIZE_FA_A[s]; lhFa = LH_FA_A[s];
  } else if (state.font === 'nazanin') {
    fzFa = SIZE_FA_L[s]; lhFa = LH_FA_L[s];
  } else {
    fzFa = SIZE_FA_V[s]; lhFa = LH_FA_V[s];  // vazir (default)
  }

  html.style.setProperty('--fz-fa', fzFa + 'px');
  html.style.setProperty('--lh-fa', lhFa);
  html.style.setProperty('--fz-en', (SIZE_EN[s] + (serif ? 2 : 0)) + 'px');
  html.style.setProperty('--lh-en', LH_EN[s]);

  sizeUpBtn.disabled   = s >= SIZE_STEPS - 1;
  sizeDownBtn.disabled = s <= 0;
}

function sizeUp() {
  if (state.sizeStep >= SIZE_STEPS - 1) return;
  state.sizeStep++;
  localStorage.setItem('mv-size-step', state.sizeStep);
  applySizes();
}

function sizeDown() {
  if (state.sizeStep <= 0) return;
  state.sizeStep--;
  localStorage.setItem('mv-size-step', state.sizeStep);
  applySizes();
}

// ── Data ──────────────────────────────────────────────────────────────────────

async function loadBook(n) {
  if (state.cache[n]) return state.cache[n];
  const res  = await fetch(`data/book${n}.json`);
  if (!res.ok) throw new Error(`book${n}.json: ${res.status}`);
  const data = await res.json();
  state.cache[n] = data;
  return data;
}

function flattenBook(data) {
  const out = [];
  let idx = 0;
  for (const section of data.sections) {
    if (section.title_en || section.title_fa) {
      out.push({ type: 'heading', title_en: section.title_en, title_fa: section.title_fa, index: idx++ });
    }
    for (const e of section.entries) {
      out.push({ type: 'verse', number: e.number, farsi: e.farsi, english: e.english, index: idx++ });
    }
  }
  return out;
}

// Split entries into pages of N verses; headings ride with their batch
function buildPages(entries) {
  const pages = [];
  let page = [];
  let verseCount = 0;

  for (const e of entries) {
    page.push(e);
    if (e.type === 'verse') {
      verseCount++;
      if (verseCount === VERSES_PER_PAGE) {
        pages.push(page);
        page = [];
        verseCount = 0;
      }
    }
  }
  if (page.length) pages.push(page);
  return pages;
}

// ── Progress ──────────────────────────────────────────────────────────────────

function updateProgress() {
  const el  = state.mode === 'focus' ? focusScroll : scholarGrid;
  const max = el.scrollHeight - el.clientHeight;
  progressBar.style.width = (max > 0 ? (el.scrollTop / max) * 100 : 0) + '%';
}

// ── Pager ─────────────────────────────────────────────────────────────────────

function updatePager() {
  const total = state.pages.length;
  if (total <= 1) { pager.hidden = true; return; }

  pager.hidden = false;
  pagerInfo.textContent = `${state.page + 1} / ${total}`;
  pagerPrevBtn.disabled = state.page === 0;
  pagerNextBtn.disabled = state.page === total - 1;
}

// ── Book switching ────────────────────────────────────────────────────────────

async function switchBook(n) {
  if (n === state.book && state.entries.length) return;

  const prevBook = state.book;
  const dir      = n >= prevBook ? 1 : -1;   // ≥ so initial load enters from right
  state.book     = n;
  state.page     = 0;

  bookTabs.forEach(t => {
    const on = parseInt(t.dataset.book) === n;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', String(on));
  });
  tocBookLabel.textContent = `Book ${n}`;
  navBookPill.textContent  = `Book ${n}`;

  pager.hidden = true;

  // Slide current content out while loading new book in parallel
  const activeEl = state.mode === 'focus' ? focusScroll : scholarGrid;
  const hasContent = activeEl.children.length > 0;

  const exitAnim = hasContent
    ? activeEl.animate(
        [{ opacity: 1, transform: 'translateX(0)' },
         { opacity: 0, transform: `translateX(${dir > 0 ? '-36px' : '36px'})` }],
        { duration: 180, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }
      )
    : null;

  focusLoading.classList.add('visible');
  scholarLoading.classList.add('visible');

  try {
    const [data] = await Promise.all([
      loadBook(n),
      exitAnim?.finished ?? Promise.resolve(),
    ]);

    state.entries = flattenBook(data);
    state.pages   = buildPages(state.entries);
    buildTOC(state.entries);

    focusLoading.classList.remove('visible');
    scholarLoading.classList.remove('visible');

    if (exitAnim) exitAnim.cancel();   // remove fill so element is paint-ready

    if (state.mode === 'focus') {
      renderFocusPage(state.pages[0]);
      focusScroll.scrollTop = 0;
    } else {
      renderScholarPage(state.pages[0]);
      window.scrollTo(0, 0);
    }
    updatePager();
    refreshBookmarkButtons();

    // Slide new content in from the opposite side
    activeEl.animate(
      [{ opacity: 0, transform: `translateX(${dir > 0 ? '36px' : '-36px'})` },
       { opacity: 1, transform: 'translateX(0)' }],
      { duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    );

  } catch (err) {
    console.error(err);
    if (exitAnim) exitAnim.cancel();
    focusLoading.classList.remove('visible');
    scholarLoading.classList.remove('visible');
  }
}

// ── Focus render ──────────────────────────────────────────────────────────────

function renderFocusPage(entries) {
  focusScroll.innerHTML = '';
  const frag = document.createDocumentFragment();
  entries.forEach(e => frag.appendChild(makeCard(e)));
  focusScroll.appendChild(frag);
}

// Animate to a new page; dir: +1 = forward, -1 = back, 0 = instant (TOC jump)
function goToPage(targetPage, dir = 1) {
  if (targetPage < 0 || targetPage >= state.pages.length) return;
  if (targetPage === state.page && (focusScroll.children.length || scholarGrid.children.length)) return;

  state.page = targetPage;
  localStorage.setItem('mv-last-book', state.book);
  localStorage.setItem('mv-last-page', targetPage);

  if (state.mode === 'focus') {
    renderFocusPage(state.pages[state.page]);
    focusScroll.scrollTop = 0;
  } else {
    renderScholarPage(state.pages[state.page]);
    window.scrollTo(0, 0);
  }
  updatePager();
  refreshBookmarkButtons();

  if (dir === 0) return;  // TOC / search jump — instant, no animation

  const target = state.mode === 'focus' ? focusScroll : scholarGrid;
  const yIn    = dir > 0 ? '18px' : '-18px';
  target.animate(
    [{ opacity: 0, transform: `translateY(${yIn})` },
     { opacity: 1, transform: 'translateY(0)' }],
    { duration: 380, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
  );
}

function makeCard(entry) {
  const el = document.createElement('div');
  el.className         = 'verse-unit';
  el.dataset.index     = entry.index;

  if (entry.type === 'heading') {
    el.classList.add('type-heading');

    if (entry.title_en) {
      const en = document.createElement('p');
      en.className   = 'heading-en';
      en.textContent = entry.title_en;
      el.appendChild(en);
    }
    if (entry.title_fa) {
      const fa = document.createElement('p');
      fa.className   = 'heading-fa';
      fa.lang        = 'fa';
      fa.dir         = 'rtl';
      fa.textContent = entry.title_fa;
      el.appendChild(fa);
    }

  } else {
    const faWrap = document.createElement('div');
    faWrap.className = 'verse-fa';
    faWrap.lang      = 'fa';
    faWrap.dir       = 'rtl';

    (entry.farsi || '').split(' / ').forEach((h, i) => {
      const span = document.createElement('span');
      span.textContent  = h.trim();
      span.dataset.part = `fa${i}`;
      span.addEventListener('click', e => {
        e.stopPropagation();
        showPicker(span, state.book, entry.index, `fa${i}`);
      });
      faWrap.appendChild(span);
    });

    const enEl = document.createElement('p');
    enEl.className   = 'verse-en';
    enEl.textContent = entry.english || '';
    enEl.addEventListener('click', e => {
      e.stopPropagation();
      showPicker(enEl, state.book, entry.index, 'en');
    });

    const numEl = document.createElement('span');
    numEl.className   = 'verse-num';
    numEl.textContent = entry.number || '';

    const bmBtn = document.createElement('button');
    bmBtn.className        = 'bm-btn';
    bmBtn.setAttribute('aria-label', 'Bookmark this verse');
    bmBtn.innerHTML        = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 2h10a1 1 0 0 1 1 1v11l-6-3.5L2 14V3a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
    bmBtn.addEventListener('click', e => {
      e.stopPropagation();
      const faText = (entry.farsi || '').split(' / ')[0].trim();
      toggleBookmark(state.book, entry.index, faText, entry.english || '');
    });

    el.appendChild(faWrap);
    el.appendChild(enEl);
    el.appendChild(numEl);
    el.appendChild(bmBtn);
    applyHighlights(el, entry);
  }

  return el;
}

// ── Scholar render ────────────────────────────────────────────────────────────

function renderScholarPage(entries) {
  scholarGrid.innerHTML = '';
  const frag = document.createDocumentFragment();
  entries.forEach(e => frag.appendChild(makeScholarRow(e)));
  scholarGrid.appendChild(frag);
}

function makeScholarRow(entry) {
  const row = document.createElement('div');
  row.className     = 'scholar-row';
  row.dataset.index = entry.index;

  if (entry.type === 'heading') {
    row.classList.add('scholar-heading');

    const fa = document.createElement('div');
    fa.className   = 'scholar-cell scholar-cell--fa';
    fa.lang        = 'fa';
    fa.dir         = 'rtl';
    fa.textContent = entry.title_fa || '';

    const en = document.createElement('div');
    en.className   = 'scholar-cell scholar-cell--en';
    en.textContent = entry.title_en || '';

    row.appendChild(fa);
    row.appendChild(en);

  } else {
    const fa = document.createElement('div');
    fa.className = 'scholar-cell scholar-cell--fa';
    fa.lang      = 'fa';
    fa.dir       = 'rtl';

    (entry.farsi || '').split(' / ').forEach(h => {
      const span = document.createElement('span');
      span.textContent   = h.trim();
      span.style.display = 'block';
      fa.appendChild(span);
    });

    const en = document.createElement('div');
    en.className   = 'scholar-cell scholar-cell--en';
    en.textContent = entry.english || '';

    const num = document.createElement('span');
    num.className   = 'scholar-num';
    num.textContent = entry.number || '';
    fa.appendChild(num);   // verse number sits under Farsi text, right-aligned

    row.appendChild(fa);
    row.appendChild(en);
  }

  return row;
}

// ── TOC ───────────────────────────────────────────────────────────────────────

function buildTOC(entries) {
  tocList.innerHTML = '';
  entries.forEach(e => {
    if (e.type !== 'heading') return;
    const item = document.createElement('div');
    item.className = 'toc-item';
    item.setAttribute('role', 'listitem');

    if (e.title_en) {
      const en = document.createElement('span');
      en.textContent = e.title_en;
      item.appendChild(en);
    }
    if (e.title_fa) {
      const fa = document.createElement('span');
      fa.className   = 'toc-fa';
      fa.lang        = 'fa';
      fa.dir         = 'rtl';
      fa.textContent = e.title_fa;
      item.appendChild(fa);
    }

    item.addEventListener('click', () => {
      // Find which page contains this heading
      const targetPage = state.pages.findIndex(pg => pg.some(pe => pe.index === e.index));
      if (targetPage !== -1) {
        goToPage(targetPage, 0);
        // Scroll heading into view after render
        setTimeout(() => {
          const card = focusScroll.querySelector(`[data-index="${e.index}"]`);
          if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
      closeTOC();
    });

    tocList.appendChild(item);
  });
}

// ── Mode ──────────────────────────────────────────────────────────────────────

function isMobile() { return window.innerWidth <= 600; }

function setMode(m) {
  if (m === 'scholar' && isMobile()) return;
  state.mode        = m;
  html.dataset.mode = m;

  if (m === 'focus') {
    focusView.removeAttribute('aria-hidden');
    scholarView.setAttribute('aria-hidden', 'true');
    if (!focusScroll.children.length && state.pages.length) {
      renderFocusPage(state.pages[state.page]);
    }
  } else {
    scholarView.removeAttribute('aria-hidden');
    focusView.setAttribute('aria-hidden', 'true');
    renderScholarPage(state.pages[state.page]);
    window.scrollTo(0, 0);
  }
  updatePager();
}

// ── Panels ────────────────────────────────────────────────────────────────────

function openMenu()  {
  mobileMenu.classList.add('open');
  mobileMenu.removeAttribute('aria-hidden');
  btnMenu.setAttribute('aria-expanded', 'true');
}
function closeMenu() {
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  btnMenu.setAttribute('aria-expanded', 'false');
}

function openSettings()  {
  settingsPanel.classList.add('open');
  btnSettings.setAttribute('aria-expanded', 'true');
}
function closeSettings() {
  settingsPanel.classList.remove('open');
  btnSettings.setAttribute('aria-expanded', 'false');
}
function openTOC() {
  tocPanel.classList.add('open');
  tocPanel.removeAttribute('aria-hidden');
  tocBackdrop.classList.add('visible');
}
function closeTOC() {
  tocPanel.classList.remove('open');
  tocPanel.setAttribute('aria-hidden', 'true');
  tocBackdrop.classList.remove('visible');
}
// ── Bookmarks ─────────────────────────────────────────────────────────────────

function loadBookmarks() {
  try { return JSON.parse(localStorage.getItem('mv-bookmarks') || '[]'); }
  catch { return []; }
}

function saveBookmarks(bms) {
  localStorage.setItem('mv-bookmarks', JSON.stringify(bms));
}

function isBookmarked(book, index) {
  return loadBookmarks().some(b => b.book === book && b.index === index);
}

function toggleBookmark(book, index, faText, enText) {
  const bms = loadBookmarks();
  const i   = bms.findIndex(b => b.book === book && b.index === index);
  if (i >= 0) {
    bms.splice(i, 1);
  } else {
    bms.unshift({ book, index, fa: faText, en: enText, savedAt: Date.now() });
  }
  saveBookmarks(bms);
  refreshBookmarkButtons();
  if (bookmarkPanel.classList.contains('open')) renderBookmarkPanel();
}

function refreshBookmarkButtons() {
  const bms = loadBookmarks();
  document.querySelectorAll('.bm-btn').forEach(btn => {
    const card  = btn.closest('[data-index]');
    const index = parseInt(card?.dataset.index);
    const on    = bms.some(b => b.book === state.book && b.index === index);
    btn.classList.toggle('bm-active', on);
    btn.setAttribute('aria-label', on ? 'Remove bookmark' : 'Bookmark this verse');
  });
}

function renderBookmarkPanel() {
  const bms = loadBookmarks();
  bookmarkList.innerHTML = '';
  if (!bms.length) {
    const empty = document.createElement('p');
    empty.className   = 'bm-empty';
    empty.textContent = 'No bookmarks yet.';
    bookmarkList.appendChild(empty);
    return;
  }
  const frag = document.createDocumentFragment();
  bms.forEach(b => {
    const item = document.createElement('div');
    item.className = 'bm-item';
    item.role      = 'listitem';

    const body = document.createElement('button');
    body.className = 'bm-body';
    body.addEventListener('click', async () => {
      closeBookmarkPanel();
      if (b.book !== state.book) await switchBook(b.book);
      const pg = state.pages.findIndex(page => page.some(e => e.index === b.index));
      if (pg >= 0) goToPage(pg, 0);
    });

    const label = document.createElement('span');
    label.className   = 'bm-book-label';
    label.textContent = `Book ${b.book}`;

    const fa = document.createElement('span');
    fa.className = 'bm-fa';
    fa.lang      = 'fa';
    fa.dir       = 'rtl';
    fa.textContent = b.fa || '';

    const en = document.createElement('span');
    en.className   = 'bm-en';
    en.textContent = b.en ? b.en.slice(0, 80) + (b.en.length > 80 ? '…' : '') : '';

    body.appendChild(label);
    body.appendChild(fa);
    body.appendChild(en);

    const del = document.createElement('button');
    del.className      = 'bm-delete';
    del.setAttribute('aria-label', 'Remove bookmark');
    del.innerHTML      = '&times;';
    del.addEventListener('click', e => {
      e.stopPropagation();
      const all = loadBookmarks();
      const idx = all.findIndex(x => x.book === b.book && x.index === b.index);
      if (idx >= 0) all.splice(idx, 1);
      saveBookmarks(all);
      refreshBookmarkButtons();
      renderBookmarkPanel();
    });

    item.appendChild(body);
    item.appendChild(del);
    frag.appendChild(item);
  });
  bookmarkList.appendChild(frag);
}

function openBookmarkPanel() {
  renderBookmarkPanel();
  bookmarkPanel.classList.add('open');
  bookmarkPanel.removeAttribute('aria-hidden');
  bookmarkBackdrop.classList.add('visible');
  btnBookmarks.setAttribute('aria-expanded', 'true');
}

function closeBookmarkPanel() {
  bookmarkPanel.classList.remove('open');
  bookmarkPanel.setAttribute('aria-hidden', 'true');
  bookmarkBackdrop.classList.remove('visible');
  btnBookmarks.setAttribute('aria-expanded', 'false');
}

// ── Highlights ────────────────────────────────────────────────────────────────

let _hlTarget = null;  // { book, index, part }

function loadHighlights() {
  try { return JSON.parse(localStorage.getItem('mv-highlights') || '[]'); }
  catch { return []; }
}

function saveHighlights(hls) {
  localStorage.setItem('mv-highlights', JSON.stringify(hls));
}

function getHighlight(book, index, part) {
  return loadHighlights().find(h => h.book === book && h.index === index && h.part === part);
}

function setHighlight(book, index, part, color) {
  const hls = loadHighlights();
  const i   = hls.findIndex(h => h.book === book && h.index === index && h.part === part);
  if (!color) {
    if (i >= 0) hls.splice(i, 1);
  } else {
    if (i >= 0) hls[i].color = color;
    else hls.push({ book, index, part, color });
  }
  saveHighlights(hls);
}

function applyHighlights(cardEl, entry) {
  const spans = cardEl.querySelectorAll('.verse-fa span');
  spans.forEach((span, i) => {
    const part = `fa${i}`;
    const hl   = getHighlight(state.book, entry.index, part);
    span.dataset.hl = hl ? hl.color : '';
  });
  const enEl = cardEl.querySelector('.verse-en');
  if (enEl) {
    const hl = getHighlight(state.book, entry.index, 'en');
    enEl.dataset.hl = hl ? hl.color : '';
  }
}

function showPicker(anchorEl, book, index, part) {
  _hlTarget = { book, index, part };

  // Mark current highlight in picker
  const current = getHighlight(book, index, part);
  hlPicker.querySelectorAll('.hl-swatch').forEach(btn => {
    btn.classList.toggle('hl-swatch--active', btn.dataset.hlColor === (current?.color || ''));
  });

  // Position above the anchor element
  const rect = anchorEl.getBoundingClientRect();
  const pickerW = 196;
  let left = rect.left + rect.width / 2 - pickerW / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - pickerW - 8));
  const top  = rect.top - 52;

  hlPicker.style.left = left + 'px';
  hlPicker.style.top  = (top < 8 ? rect.bottom + 8 : top) + 'px';
  hlPicker.classList.add('open');
  hlPicker.removeAttribute('aria-hidden');
}

function hidePicker() {
  hlPicker.classList.remove('open');
  hlPicker.setAttribute('aria-hidden', 'true');
  _hlTarget = null;
}

// Picker swatch clicks
hlPicker.addEventListener('click', e => {
  const btn = e.target.closest('[data-hl-color]');
  if (!btn || !_hlTarget) return;
  const { book, index, part } = _hlTarget;
  const color = btn.dataset.hlColor;
  setHighlight(book, index, part, color);
  // Re-apply to visible card
  const card = document.querySelector(`.verse-unit[data-index="${index}"]`);
  if (card) {
    const spans = card.querySelectorAll('.verse-fa span');
    spans.forEach((span, i) => { span.dataset.hl = getHighlight(book, index, `fa${i}`)?.color || ''; });
    const enEl = card.querySelector('.verse-en');
    if (enEl) enEl.dataset.hl = getHighlight(book, index, 'en')?.color || '';
  }
  hidePicker();
});

document.addEventListener('click', e => {
  if (!hlPicker.contains(e.target)) hidePicker();
}, true);  // capture so it fires before the span click handler

function openSearch() {
  searchPanel.classList.add('open');
  searchOverlay.classList.add('open');
  searchPanel.removeAttribute('aria-hidden');
  // Focus input on next frame (panel may still be animating in)
  requestAnimationFrame(() => searchInput.focus());
}
function closeSearch() {
  searchPanel.classList.remove('open');
  searchOverlay.classList.remove('open');
  searchPanel.setAttribute('aria-hidden', 'true');
  searchInput.value  = '';
  searchResults.innerHTML = '';
}

// ── Search logic — verse number lookup ───────────────────────────────────────

function runSearch(raw) {
  searchResults.innerHTML = '';
  const n = parseInt(raw.trim(), 10);
  if (!n || n < 1) return;

  const entry = state.entries.find(e => e.type === 'verse' && e.number === n);

  if (!entry) {
    const empty = document.createElement('div');
    empty.className   = 'search-empty';
    empty.textContent = `Verse ${n} not found in Book ${state.book}`;
    searchResults.appendChild(empty);
    return;
  }

  const item = document.createElement('div');
  item.className = 'search-result-item';

  const num = document.createElement('div');
  num.className   = 'search-result-num';
  num.textContent = `Verse ${entry.number}`;

  const fa = document.createElement('div');
  fa.className   = 'search-result-fa';
  fa.textContent = entry.farsi || '';

  const en = document.createElement('div');
  en.className   = 'search-result-en';
  en.textContent = entry.english || '';

  item.appendChild(num);
  item.appendChild(fa);
  item.appendChild(en);

  item.addEventListener('click', () => {
    closeSearch();
    const targetPage = state.pages.findIndex(pg => pg.some(pe => pe.index === entry.index));
    if (targetPage === -1) return;
    if (state.mode !== 'focus') setMode('focus');
    goToPage(targetPage, 0);
    requestAnimationFrame(() => {
      const card = focusScroll.querySelector(`[data-index="${entry.index}"]`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  searchResults.appendChild(item);
}

// ── Events ────────────────────────────────────────────────────────────────────

bookTabs.forEach(t => t.addEventListener('click', () => switchBook(parseInt(t.dataset.book))));

btnMode.addEventListener('click', () => setMode(state.mode === 'focus' ? 'scholar' : 'focus'));

btnMenu.addEventListener('click', e => {
  e.stopPropagation();
  mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
});

mobileMenu.addEventListener('click', e => {
  if (e.target.closest('.book-tab')) closeMenu();
});

btnSettings.addEventListener('click', e => {
  e.stopPropagation();
  settingsPanel.classList.contains('open') ? closeSettings() : openSettings();
});

btnThemeToggle.addEventListener('click', () => {
  const cycle = { light: 'dark', dark: 'kaghaz', kaghaz: 'light' };
  setTheme(cycle[state.theme] || 'light');
});

fontOpts.addEventListener('click', e => {
  const btn = e.target.closest('[data-font]');
  if (btn) setFont(btn.dataset.font);
});

enFontOpts.addEventListener('click', e => {
  const btn = e.target.closest('[data-en-font]');
  if (btn) setEnFont(btn.dataset.enFont);
});

faColorOpts.addEventListener('click', e => {
  const btn = e.target.closest('[data-fa-color]');
  if (btn) setFaColor(btn.dataset.faColor);
});


enColorOpts.addEventListener('click', e => {
  const btn = e.target.closest('[data-en-color]');
  if (btn) setEnColor(btn.dataset.enColor);
});


sizeUpBtn.addEventListener('click',   sizeUp);
sizeDownBtn.addEventListener('click', sizeDown);

pagerPrevBtn.addEventListener('click', () => goToPage(state.page - 1, -1));
pagerNextBtn.addEventListener('click', () => goToPage(state.page + 1,  1));

// Arrow-key page navigation when not in a text input
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'ArrowRight' && state.mode === 'focus') goToPage(state.page + 1,  1);
  if (e.key === 'ArrowLeft'  && state.mode === 'focus') goToPage(state.page - 1, -1);
  if (e.key === 'Escape') { closeSearch(); closeTOC(); closeSettings(); closeMenu(); closeBookmarkPanel(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
});

btnSearch.addEventListener('click', openSearch);
searchOverlay.addEventListener('click', closeSearch);
searchInput.addEventListener('input', e => runSearch(e.target.value));

document.getElementById('site-logo').addEventListener('click', e => {
  e.preventDefault();
  tocPanel.classList.contains('open') ? closeTOC() : openTOC();
});

navBookPill.addEventListener('click', () => {
  mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
});
tocBackdrop.addEventListener('click', closeTOC);

btnBookmarks.addEventListener('click', () => {
  bookmarkPanel.classList.contains('open') ? closeBookmarkPanel() : openBookmarkPanel();
});
bookmarkBackdrop.addEventListener('click', closeBookmarkPanel);

document.addEventListener('click', e => {
  if (!settingsPanel.contains(e.target) && e.target !== btnSettings) closeSettings();
  if (!mobileMenu.contains(e.target) && e.target !== btnMenu && e.target !== navBookPill) closeMenu();
  if (!bookmarkPanel.contains(e.target) && e.target !== btnBookmarks) closeBookmarkPanel();
});

focusScroll.addEventListener('scroll',  updateProgress, { passive: true });
scholarGrid.addEventListener('scroll',  updateProgress, { passive: true });

// ── Bottom tab bar ────────────────────────────────────────────────────────────

function updateTabBar() {
  const booksActive     = mobileMenu.classList.contains('open');
  const searchActive    = searchPanel.classList.contains('open');
  const bookmarksActive = bookmarkPanel.classList.contains('open');
  const settingsActive  = settingsPanel.classList.contains('open');
  const anyOpen = booksActive || searchActive || bookmarksActive || settingsActive;
  tabBooks.classList.toggle('active',     booksActive || !anyOpen);
  tabSearch.classList.toggle('active',    searchActive);
  tabBookmarks.classList.toggle('active', bookmarksActive);
  tabSettings.classList.toggle('active',  settingsActive);
}

tabBooks.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.contains('open');
  closeSearch(); closeSettings(); closeBookmarkPanel();
  isOpen ? closeMenu() : openMenu();
  updateTabBar();
});

tabSearch.addEventListener('click', () => {
  const isOpen = searchPanel.classList.contains('open');
  closeMenu(); closeSettings(); closeBookmarkPanel();
  isOpen ? closeSearch() : openSearch();
  updateTabBar();
});

tabBookmarks.addEventListener('click', () => {
  const isOpen = bookmarkPanel.classList.contains('open');
  closeMenu(); closeSettings(); closeSearch();
  isOpen ? closeBookmarkPanel() : openBookmarkPanel();
  updateTabBar();
});

tabSettings.addEventListener('click', () => {
  const isOpen = settingsPanel.classList.contains('open');
  closeMenu(); closeSearch(); closeBookmarkPanel();
  isOpen ? closeSettings() : openSettings();
  updateTabBar();
});

// Force focus mode if window shrinks to mobile while in scholar view
window.addEventListener('resize', () => {
  if (isMobile() && state.mode === 'scholar') setMode('focus');
}, { passive: true });

// ── Boot ──────────────────────────────────────────────────────────────────────

(async function boot() {
  initTheme();
  initFont();

  const lastBook = parseInt(localStorage.getItem('mv-last-book')) || 1;
  const lastPage = parseInt(localStorage.getItem('mv-last-page')) || 0;

  await switchBook(lastBook);

  if (lastPage > 0 && lastPage < state.pages.length) {
    goToPage(lastPage, 0);
  }
})();
