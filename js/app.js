// ── Masnavi.ca · app.js ──────────────────────────────────────────────────────
'use strict';

// ── Size tables ───────────────────────────────────────────────────────────────
const SIZE_STEPS  = 6;
const SIZE_EN     = [16, 18, 20, 22, 24, 26];
const SIZE_FA     = [20, 22, 24, 26, 28, 30];     // Naskh (Vazirmatn)
const SIZE_FA_N   = [20, 22, 24, 26, 28, 30];     // IranSans (same metrics as Naskh)
const LH_FA       = [2.10, 2.10, 2.10, 2.10, 2.15, 2.20];
const LH_FA_N     = [2.10, 2.10, 2.10, 2.10, 2.15, 2.20];
const LH_EN       = [1.80, 1.80, 1.80, 1.80, 1.85, 1.85];

const VERSES_PER_PAGE = 10;

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  book:     1,
  mode:     'focus',
  font:     'naskh',
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
const tocPanel       = document.getElementById('toc-panel');
const tocList        = document.getElementById('toc-list');
const pager          = document.getElementById('pager');
const pagerPrevBtn   = document.getElementById('pager-prev');
const pagerNextBtn   = document.getElementById('pager-next');
const pagerInfo      = document.getElementById('pager-info');

// ── Init ──────────────────────────────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('mv-theme');
  const auto  = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(saved || auto);
}

function initFont() {
  const savedFont    = localStorage.getItem('mv-font');
  if (savedFont)    setFont(savedFont, false);

  const savedEnFont  = localStorage.getItem('mv-en-font');
  if (savedEnFont)  setEnFont(savedEnFont, false);

  const savedFaColor = localStorage.getItem('mv-fa-color');
  if (savedFaColor) setFaColor(savedFaColor, false);

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
  // Keep toggle aria-label in sync with current state
  btnThemeToggle.setAttribute('aria-label', t === 'dark' ? 'Switch to day mode' : 'Switch to dark mode');
  btnThemeToggle.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
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
  const s        = state.sizeStep;
  const iransans = state.font === 'iransans';
  const serif    = html.dataset.enFont === 'serif';

  html.style.setProperty('--fz-fa', (iransans ? SIZE_FA_N[s] : SIZE_FA[s]) + 'px');
  html.style.setProperty('--lh-fa',  iransans ? LH_FA_N[s]  : LH_FA[s]);
  html.style.setProperty('--fz-en', (SIZE_EN[s] + (serif ? 2 : 0)) + 'px');
  html.style.setProperty('--lh-en',  LH_EN[s]);

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

  if (state.mode === 'focus') {
    renderFocusPage(state.pages[state.page]);
    focusScroll.scrollTop = 0;
  } else {
    renderScholarPage(state.pages[state.page]);
    window.scrollTo(0, 0);
  }
  updatePager();

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

    (entry.farsi || '').split(' / ').forEach(h => {
      const span = document.createElement('span');
      span.textContent = h.trim();
      faWrap.appendChild(span);
    });

    const enEl = document.createElement('p');
    enEl.className   = 'verse-en';
    enEl.textContent = entry.english || '';

    const numEl = document.createElement('span');
    numEl.className   = 'verse-num';
    numEl.textContent = entry.number || '';

    el.appendChild(faWrap);
    el.appendChild(enEl);
    el.appendChild(numEl);
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
function openTOC()  { tocPanel.classList.add('open');    tocPanel.removeAttribute('aria-hidden'); }
function closeTOC() { tocPanel.classList.remove('open'); tocPanel.setAttribute('aria-hidden', 'true'); }
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
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
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
  if (e.key === 'Escape') { closeSearch(); closeTOC(); closeSettings(); closeMenu(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
});

btnSearch.addEventListener('click', openSearch);
searchOverlay.addEventListener('click', closeSearch);
searchInput.addEventListener('input', e => runSearch(e.target.value));

document.getElementById('site-logo').addEventListener('click', e => {
  e.preventDefault();
  tocPanel.classList.contains('open') ? closeTOC() : openTOC();
});

document.addEventListener('click', e => {
  if (!settingsPanel.contains(e.target) && e.target !== btnSettings) closeSettings();
  if (!mobileMenu.contains(e.target) && e.target !== btnMenu) closeMenu();
});

focusScroll.addEventListener('scroll',  updateProgress, { passive: true });
scholarGrid.addEventListener('scroll',  updateProgress, { passive: true });

// Force focus mode if window shrinks to mobile while in scholar view
window.addEventListener('resize', () => {
  if (isMobile() && state.mode === 'scholar') setMode('focus');
}, { passive: true });

// ── Boot ──────────────────────────────────────────────────────────────────────

(async function boot() {
  initTheme();
  initFont();
  await switchBook(1);
})();
