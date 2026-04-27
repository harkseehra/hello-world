/* ── Masnavi Admin JS ── */

'use strict';

/* ─────────────────────────────────────────────
   Current data — mirrors what's in the actual files
   ───────────────────────────────────────────── */

const EXISTING_FA_COLOURS = [
  { key: 'irozumi', label: 'Ink',         light: '#3C3D3E', dark: '#E0E1E0' },
  { key: 'nila',    label: 'Lapis',        light: '#2C3A8C', dark: '#7EA8E8' },
  { key: 'qahwa',   label: 'Coffee',       light: '#6F4E37', dark: '#C4956A' },
  { key: 'sorkh',   label: 'Persian Red',  light: '#CC3333', dark: '#E07878' },
];

const EXISTING_EN_COLOURS = [
  { key: 'asagao',  label: 'Asa-Gao',  light: '#1747B0', dark: '#7EB0E8' },
  { key: 'konpeki', label: 'Kon-Peki', light: '#0077CC', dark: '#56C0FF' },
  { key: 'noir',    label: 'Noir',     light: '#1C1C1E', dark: '#E8E8F2' },
];

const EXISTING_FA_FONTS = [
  { key: 'vazir',   name: 'Vazirmatn', family: "'Vazirmatn', sans-serif",  url: 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap', scale: 1.0 },
  { key: 'arial',   name: 'Arial',     family: 'Arial, sans-serif',         url: '',  scale: 1.2 },
  { key: 'nazanin', name: 'Nazanin',   family: "'BNazanin', serif",          url: '',  scale: 1.0 },
];

const EXISTING_EN_FONTS = [
  { key: 'sans',  name: 'Schibsted Grotesk', family: "'Schibsted Grotesk', system-ui, sans-serif", url: 'https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600&display=swap' },
  { key: 'serif', name: 'Amiri',             family: "'Amiri', Georgia, serif",                     url: 'https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap' },
];

/* ─────────────────────────────────────────────
   Auth
   ───────────────────────────────────────────── */

const PASSWORD = 'Qwerty@1';

const authGate  = document.getElementById('auth-gate');
const dashboard = document.getElementById('dashboard');
const authForm  = document.getElementById('auth-form');
const authInput = document.getElementById('auth-input');
const authError = document.getElementById('auth-error');
const btnLogout = document.getElementById('btn-logout');

function unlock() {
  authGate.style.display = 'none';
  dashboard.hidden = false;
  sessionStorage.setItem('mv-admin', '1');
}

if (sessionStorage.getItem('mv-admin') === '1') unlock();

authForm.addEventListener('submit', e => {
  e.preventDefault();
  if (authInput.value === PASSWORD) {
    unlock();
  } else {
    authError.hidden = false;
    authInput.value = '';
    authInput.focus();
  }
});

btnLogout.addEventListener('click', () => {
  sessionStorage.removeItem('mv-admin');
  dashboard.hidden = true;
  authGate.style.display = '';
  authInput.value = '';
  authError.hidden = true;
});

/* ─────────────────────────────────────────────
   Section navigation
   ───────────────────────────────────────────── */

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('section-' + btn.dataset.section).classList.add('active');
    closeSidebar();
  });
});

/* ── Mobile sidebar ── */
const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const btnHamburger   = document.getElementById('btn-hamburger');

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
  btnHamburger.setAttribute('aria-expanded', 'true');
}
function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
  btnHamburger.setAttribute('aria-expanded', 'false');
}

btnHamburger.addEventListener('click', () =>
  sidebar.classList.contains('open') ? closeSidebar() : openSidebar()
);
sidebarOverlay.addEventListener('click', closeSidebar);

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function hexValid(h) { return /^#[0-9A-Fa-f]{6}$/.test(h); }

function syncColorPair(pickerId, hexId) {
  const picker = document.getElementById(pickerId);
  const hex    = document.getElementById(hexId);
  picker.addEventListener('input', () => { hex.value = picker.value.toUpperCase(); updatePreviews(); });
  hex.addEventListener('input', () => {
    const v = hex.value.trim();
    if (hexValid(v)) { picker.value = v; updatePreviews(); }
  });
}

function showToast(msg = '✓ Synced to reader') {
  let t = document.getElementById('admin-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'admin-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(t._hide);
  t._hide = setTimeout(() => t.classList.remove('visible'), 2000);
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy All'; btn.classList.remove('copied'); }, 1800);
  });
}

/* ─────────────────────────────────────────────
   Current lists
   ───────────────────────────────────────────── */

function renderColourList(containerId, items) {
  const el = document.getElementById(containerId);
  if (!items.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="list-title">Existing colours</div>
    <div class="list-items">${items.map(c => `
      <div class="list-chip">
        <span class="list-chip-dot" style="background:${c.light}"></span>
        <span class="list-chip-dot" style="background:${c.dark}"></span>
        <span class="list-chip-key">${c.key}</span>
        <span class="list-chip-label">${c.label}</span>
      </div>`).join('')}
    </div>`;
}

function renderFontList(containerId, items) {
  const el = document.getElementById(containerId);
  if (!items.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="list-title">Existing fonts</div>
    <div class="list-items">${items.map(f => `
      <div class="list-chip">
        <span class="list-chip-key">${f.key}</span>
        <span class="list-chip-label">${f.name}</span>
      </div>`).join('')}
    </div>`;
}

renderColourList('fa-colour-list', EXISTING_FA_COLOURS);
renderColourList('en-colour-list', EXISTING_EN_COLOURS);
renderFontList('fa-font-list',   EXISTING_FA_FONTS);
renderFontList('en-font-list',   EXISTING_EN_FONTS);

/* ─────────────────────────────────────────────
   Farsi Colour section
   ───────────────────────────────────────────── */

syncColorPair('fa-light', 'fa-light-hex');
syncColorPair('fa-dark',  'fa-dark-hex');

function updatePreviews() {
  const lHex = document.getElementById('fa-light-hex').value.trim() || '#2D6A4F';
  const dHex = document.getElementById('fa-dark-hex').value.trim()  || '#52B788';
  document.getElementById('fa-preview-light').style.color = hexValid(lHex) ? lHex : '';
  document.getElementById('fa-preview-dark').style.color  = hexValid(dHex) ? dHex : '';

  const elHex = document.getElementById('en-light-hex').value.trim() || '#1A7A4A';
  const edHex = document.getElementById('en-dark-hex').value.trim()  || '#52D68A';
  document.getElementById('en-preview-light').style.color = hexValid(elHex) ? elHex : '';
  document.getElementById('en-preview-dark').style.color  = hexValid(edHex) ? edHex : '';
}

syncColorPair('en-light', 'en-light-hex');
syncColorPair('en-dark',  'en-dark-hex');

document.getElementById('btn-gen-fa-colour').addEventListener('click', () => {
  const key   = document.getElementById('fa-key').value.trim().toLowerCase().replace(/\s+/g, '-');
  const label = document.getElementById('fa-label').value.trim();
  const light = document.getElementById('fa-light-hex').value.trim() || document.getElementById('fa-light').value;
  const dark  = document.getElementById('fa-dark-hex').value.trim()  || document.getElementById('fa-dark').value;

  if (!key || !label || !hexValid(light) || !hexValid(dark)) {
    alert('Please fill in all fields with valid hex colours.');
    return;
  }

  const cssSnippet =
`[data-theme="light"][data-fa-color="${key}"],
[data-theme="kaghaz"][data-fa-color="${key}"] { --c-text-fa: ${light}; }
[data-theme="dark"][data-fa-color="${key}"]   { --c-text-fa: ${dark}; }`;

  const htmlSnippet =
`<button class="settings-opt color-swatch" data-fa-color="${key}" aria-label="${label}">
  <span class="swatch-light" style="background:${light}"></span>
  <span class="swatch-dark"  style="background:${dark}"></span>
</button>`;

  document.getElementById('code-fa-colour-css').textContent  = cssSnippet;
  document.getElementById('code-fa-colour-html').textContent = htmlSnippet;
  document.getElementById('out-fa-colour').hidden = false;
});

document.getElementById('copy-fa-colour').addEventListener('click', function () {
  const text = document.getElementById('code-fa-colour-css').textContent + '\n\n' +
               document.getElementById('code-fa-colour-html').textContent;
  copyText(text, this);
});

/* ─────────────────────────────────────────────
   English Colour section
   ───────────────────────────────────────────── */

document.getElementById('btn-gen-en-colour').addEventListener('click', () => {
  const key   = document.getElementById('en-key').value.trim().toLowerCase().replace(/\s+/g, '-');
  const label = document.getElementById('en-label').value.trim();
  const light = document.getElementById('en-light-hex').value.trim() || document.getElementById('en-light').value;
  const dark  = document.getElementById('en-dark-hex').value.trim()  || document.getElementById('en-dark').value;

  if (!key || !label || !hexValid(light) || !hexValid(dark)) {
    alert('Please fill in all fields with valid hex colours.');
    return;
  }

  const cssSnippet =
`[data-theme="light"][data-en-color="${key}"],
[data-theme="kaghaz"][data-en-color="${key}"] { --c-text-en: ${light}; }
[data-theme="dark"][data-en-color="${key}"]   { --c-text-en: ${dark}; }`;

  const htmlSnippet =
`<button class="settings-opt color-swatch" data-en-color="${key}" aria-label="${label}">
  <span class="swatch-light" style="background:${light}"></span>
  <span class="swatch-dark"  style="background:${dark}"></span>
</button>`;

  document.getElementById('code-en-colour-css').textContent  = cssSnippet;
  document.getElementById('code-en-colour-html').textContent = htmlSnippet;
  document.getElementById('out-en-colour').hidden = false;
});

document.getElementById('copy-en-colour').addEventListener('click', function () {
  const text = document.getElementById('code-en-colour-css').textContent + '\n\n' +
               document.getElementById('code-en-colour-html').textContent;
  copyText(text, this);
});

/* ─────────────────────────────────────────────
   Farsi Font section
   ───────────────────────────────────────────── */

document.getElementById('btn-gen-fa-font').addEventListener('click', () => {
  const key    = document.getElementById('ff-key').value.trim().toLowerCase().replace(/\s+/g, '-');
  const name   = document.getElementById('ff-name').value.trim();
  const family = document.getElementById('ff-family').value.trim();
  const url    = document.getElementById('ff-url').value.trim();
  const scale  = parseFloat(document.getElementById('ff-scale').value) || 1.0;

  if (!key || !name || !family) {
    alert('Please fill in key, name, and font family.');
    return;
  }

  const linkSnippet = url
    ? `<link href="${url}" rel="stylesheet">`
    : '(no Google Fonts link needed — self-hosted or system font)';

  const htmlSnippet =
`<button class="settings-opt" data-font="${key}">${name}</button>`;

  const cssVarLine  = `  --font-fa-${key}: ${family};`;
  const cssTogLine  = `[data-font="${key}"]    { --font-fa: var(--font-fa-${key}); }`;
  const cssSnippet  = `/* In :root block */\n${cssVarLine}\n\n/* In font toggles block */\n${cssTogLine}`;

  const jsSnippet   =
`/* Add to SIZE_FA_V (or create a new SIZE_FA_${key.toUpperCase().slice(0,1)} table) in applySizes() */
// Scale multiplier: ${scale}
// e.g. if base sizes are [20,22,24,27,30,33]:
// SIZE_FA_${key.toUpperCase()} = SIZE_FA_V.map(s => Math.round(s * ${scale}));
// Then in applySizes():
//   if (font === '${key}') sizes = SIZE_FA_${key.toUpperCase()};`;

  document.getElementById('code-fa-font-link').textContent = linkSnippet;
  document.getElementById('code-fa-font-html').textContent = htmlSnippet;
  document.getElementById('code-fa-font-css').textContent  = cssSnippet;
  document.getElementById('code-fa-font-js').textContent   = jsSnippet;
  document.getElementById('out-fa-font').hidden = false;
});

document.getElementById('copy-fa-font').addEventListener('click', function () {
  const text = [
    document.getElementById('code-fa-font-link').textContent,
    document.getElementById('code-fa-font-html').textContent,
    document.getElementById('code-fa-font-css').textContent,
    document.getElementById('code-fa-font-js').textContent,
  ].join('\n\n/* ── */\n\n');
  copyText(text, this);
});

/* ─────────────────────────────────────────────
   English Font section
   ───────────────────────────────────────────── */

document.getElementById('btn-gen-en-font').addEventListener('click', () => {
  const key    = document.getElementById('ef-key').value.trim().toLowerCase().replace(/\s+/g, '-');
  const name   = document.getElementById('ef-name').value.trim();
  const family = document.getElementById('ef-family').value.trim();
  const url    = document.getElementById('ef-url').value.trim();

  if (!key || !name || !family) {
    alert('Please fill in key, name, and font family.');
    return;
  }

  const linkSnippet = url
    ? `<link href="${url}" rel="stylesheet">`
    : '(no Google Fonts link needed — self-hosted or system font)';

  const htmlSnippet =
`<button class="settings-opt" data-en-font="${key}">${name}</button>`;

  const cssVarLine = `  --font-en-${key}: ${family};`;
  const cssTogLine = `[data-en-font="${key}"] { --font-en: var(--font-en-${key}); }`;
  const cssSnippet = `/* In :root block */\n${cssVarLine}\n\n/* In font toggles block */\n${cssTogLine}`;

  document.getElementById('code-en-font-link').textContent = linkSnippet;
  document.getElementById('code-en-font-html').textContent = htmlSnippet;
  document.getElementById('code-en-font-css').textContent  = cssSnippet;
  document.getElementById('out-en-font').hidden = false;
});

document.getElementById('copy-en-font').addEventListener('click', function () {
  const text = [
    document.getElementById('code-en-font-link').textContent,
    document.getElementById('code-en-font-html').textContent,
    document.getElementById('code-en-font-css').textContent,
  ].join('\n\n/* ── */\n\n');
  copyText(text, this);
});

/* ─────────────────────────────────────────────
   Translations section
   ───────────────────────────────────────────── */

let trState = {
  book:    1,
  verses:  [],
  filter:  'pending',
  changes: {},
};

const trBookTabs    = document.querySelectorAll('.tr-book-tab');
const trVerseList   = document.getElementById('tr-verse-list');
const trVerseCount  = document.getElementById('tr-verse-count');
const trProgressFill= document.getElementById('tr-progress-bar-fill');
const trProgressText= document.getElementById('tr-progress-text');
const trApproveAll  = document.getElementById('tr-approve-all');
const trCopyPatch   = document.getElementById('tr-copy-patch');
const trPatchOutput = document.getElementById('tr-patch-output');
const trPatchPre    = document.getElementById('tr-patch-pre');
const trGenerate    = document.getElementById('tr-generate');
const trApiKeyInput = document.getElementById('tr-api-key');
const trSaveKey     = document.getElementById('tr-save-key');
const trKeyStatus   = document.getElementById('tr-key-status');

/* ── API key ── */

function trLoadApiKey() {
  const k = localStorage.getItem('mv-admin-api-key') || '';
  if (k) {
    trApiKeyInput.value = '•'.repeat(20);
    trKeyStatus.textContent = 'Key loaded — ready to generate';
    trKeyStatus.className = 'ok';
  } else {
    trKeyStatus.textContent = 'Paste your key and tap Save — stored locally, never leaves your device';
    trKeyStatus.className = '';
  }
}

trSaveKey.addEventListener('click', () => {
  const k = trApiKeyInput.value.trim();
  if (!k || k.startsWith('•')) { trKeyStatus.textContent = 'Key already saved'; trKeyStatus.className = 'ok'; return; }
  localStorage.setItem('mv-admin-api-key', k);
  trApiKeyInput.value = '•'.repeat(20);
  trKeyStatus.textContent = 'Key saved permanently on this device';
  trKeyStatus.className = 'ok';
});

trLoadApiKey();

/* ── Load book ── */

async function trLoadBook(bookNum) {
  trState.book    = bookNum;
  trState.changes = {};
  trVerseList.innerHTML = '<div class="tr-no-data">Loading…</div>';
  try {
    const res  = await fetch(`data/book${bookNum}.json`);
    const data = await res.json();
    trState.verses = [];
    for (const section of data.sections) {
      for (const entry of section.entries) {
        if (entry.type === 'verse') trState.verses.push(entry);
      }
    }
    trRenderFiltered();
  } catch (e) {
    trVerseList.innerHTML = `<div class="tr-no-data">Could not load Book ${bookNum}. Try refreshing.</div>`;
  }
}

/* ── Progress ── */

function trUpdateProgress() {
  const total    = trState.verses.length;
  const approved = trState.verses.filter(v => {
    const ch = trState.changes[v.number];
    return ch ? ch.status === 'approved' : v.punjabi_status === 'approved';
  }).length;
  const pct = total ? (approved / total * 100).toFixed(1) : 0;
  trProgressFill.style.width = pct + '%';
  trProgressText.textContent = `${approved} / ${total} approved (${pct}%)`;
}

/* ── Helpers ── */

function trGetStatus(verse) {
  const ch = trState.changes[verse.number];
  return ch ? ch.status : (verse.punjabi_status || 'none');
}

function trGetPunjabi(verse) {
  const ch = trState.changes[verse.number];
  return ch ? ch.punjabi : (verse.punjabi || '');
}

/* ── Shared API call ── */

async function trCallAPI(messages, maxTokens = 1024) {
  const apiKey = localStorage.getItem('mv-admin-api-key');
  if (!apiKey) throw new Error('No API key saved.');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: maxTokens, messages }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }
  return (await res.json()).content?.[0]?.text || '';
}

/* ── Regenerate a single verse ── */

async function trRegenerateVerse(num, card) {
  const verse = trState.verses.find(v => v.number === num);
  if (!verse) return;

  const btn = card.querySelector('.tr-btn-regen');
  btn.textContent = '↻…';
  btn.disabled    = true;

  const prompt = `Translate this single Persian couplet from Rumi's Masnavi into Punjabi Gurmukhi script.
- Natural flowing Punjabi, not word-for-word
- Keep Perso-Arabic loanwords in Gurmukhi: ਇਸ਼ਕ, ਰੂਹ, ਦਰਦ, ਫ਼ਨਾ, ਹੱਕ etc.
- Separate the two hemistichs with  /
- Respond ONLY with valid JSON, no other text

Verse: ${JSON.stringify({ number: verse.number, farsi: verse.farsi })}

Format: {"number": ${verse.number}, "punjabi": "ਪਹਿਲੀ ਸਤਰ / ਦੂਜੀ ਸਤਰ", "confidence": "green"}`;

  try {
    const text = await trCallAPI([{ role: 'user', content: prompt }]);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const t = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    verse.punjabi            = t.punjabi;
    verse.punjabi_confidence = t.confidence || 'green';
    verse.punjabi_status     = 'pending';

    if (!trState.changes[num]) trState.changes[num] = {};
    trState.changes[num].punjabi = t.punjabi;
    trState.changes[num].status  = 'pending';

    const ta = card.querySelector('.tr-punjabi-input');
    if (ta) ta.value = t.punjabi;

    const conf      = t.confidence || 'green';
    const confLabel = conf === 'green' ? '🟢 confident' : conf === 'yellow' ? '🟡 uncertain' : '🔴 difficult';
    const badge     = card.querySelector('.tr-confidence');
    if (badge) { badge.className = `tr-confidence ${conf}`; badge.textContent = confLabel; }

    card.className = 'tr-verse';
    showToast('↻ New draft ready');
  } catch(err) {
    showToast('Error: ' + err.message);
  } finally {
    btn.textContent = '↻ Regen';
    btn.disabled    = false;
  }
}

/* ── Fix romanized loanwords in edited text ── */

async function trFixScript(num, card) {
  const ta  = card.querySelector('.tr-punjabi-input');
  const btn = card.querySelector('.tr-btn-fix');
  if (!ta || !btn) return;

  const original = ta.value;
  btn.textContent = '✦ Fixing…';
  btn.disabled    = true;

  const prompt = `A user edited a Punjabi (Gurmukhi) translation of a Persian verse,
but some words are still in romanized Latin form (e.g. "ishq", "ruh", "Waheguru").
Convert ONLY the romanized Punjabi/Persian words to proper Gurmukhi script.
Leave everything else exactly as-is, including the / hemistich separator.
If you are unsure about a specific word, include it in "uncertain" with 2-3 Gurmukhi options.
Respond ONLY with valid JSON, no other text.

Text: "${original}"

Format: {"corrected": "...", "uncertain": [{"roman": "word", "options": ["ਓਪਸ਼ਨ1", "ਓਪਸ਼ਨ2", "ਓਪਸ਼ਨ3"]}]}`;

  try {
    const text      = await trCallAPI([{ role: 'user', content: prompt }]);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result    = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    ta.value = result.corrected || original;
    if (!trState.changes[num]) trState.changes[num] = {};
    trState.changes[num].punjabi = ta.value;

    // Remove any existing uncertain row
    const oldRow = card.querySelector('.tr-uncertain-row');
    if (oldRow) oldRow.remove();

    if (result.uncertain && result.uncertain.length) {
      const row = document.createElement('div');
      row.className = 'tr-uncertain-row';
      row.innerHTML = '<span class="tr-uncertain-label">Unsure about:</span>' +
        result.uncertain.map(u => `
          <label class="tr-uncertain-chip">
            <span class="tr-uncertain-roman">${esc(u.roman)}</span>
            <select class="tr-uncertain-select" data-roman="${esc(u.roman)}">
              ${u.options.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}
            </select>
          </label>`).join('') +
        '<button class="tr-uncertain-apply btn-secondary">Apply choices</button>';

      row.querySelectorAll('.tr-uncertain-apply').forEach(applyBtn => {
        applyBtn.addEventListener('click', () => {
          let corrected = ta.value;
          row.querySelectorAll('.tr-uncertain-select').forEach(sel => {
            const roman   = sel.dataset.roman;
            const chosen  = sel.value;
            corrected = corrected.replace(new RegExp(roman, 'gi'), chosen);
          });
          ta.value = corrected;
          trState.changes[num].punjabi = corrected;
          row.remove();
          btn.hidden = !/[a-zA-Z]/.test(corrected);
          showToast('✓ Script fixed');
        });
      });

      card.querySelector('.tr-verse-body').appendChild(row);
      showToast('Review uncertain words below');
    } else {
      btn.hidden = !/[a-zA-Z]/.test(ta.value);
      showToast('✓ Script fixed');
    }
  } catch(err) {
    showToast('Error: ' + err.message);
  } finally {
    btn.textContent = '✦ Fix Script';
    btn.disabled    = false;
  }
}

/* ── Sync approval to localStorage (reader picks this up instantly) ── */

function trSyncToLocalStorage(num, punjabi, status) {
  const lsKey = `mv-pa-b${trState.book}`;
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(lsKey) || '{}'); } catch(e) {}
  if (status === 'approved') {
    stored[num] = { punjabi, status };
  } else {
    delete stored[num];
  }
  localStorage.setItem(lsKey, JSON.stringify(stored));
}

/* ── Render filtered verse list ── */

function trRenderFiltered() {
  const filter = trState.filter;

  const visible = trState.verses.filter(v => {
    const pa     = trGetPunjabi(v);
    const status = trGetStatus(v);
    if (!pa) return filter === 'all' ? false : false;
    if (filter === 'all')      return true;
    if (filter === 'pending')  return status === 'pending' || status === 'none';
    if (filter === 'approved') return status === 'approved';
    if (filter === 'flagged')  return status === 'flagged';
    return true;
  });

  trVerseCount.textContent = visible.length
    ? `Showing ${visible.length} verse${visible.length !== 1 ? 's' : ''}`
    : '';

  if (!visible.length) {
    const msgs = {
      pending:  'No pending translations. Use ⚡ Generate to create drafts, or switch filter.',
      approved: 'No approved translations yet.',
      flagged:  'No flagged translations.',
      all:      'No translations yet. Use ⚡ Generate to create the first batch.',
    };
    trVerseList.innerHTML = `<div class="tr-no-data">${msgs[filter] || 'Nothing to show.'}</div>`;
    trUpdateProgress();
    return;
  }

  trVerseList.innerHTML = visible.map(verse => {
    const status    = trGetStatus(verse);
    const pa        = trGetPunjabi(verse);
    const conf      = verse.punjabi_confidence || 'green';
    const confLabel = conf === 'green' ? '🟢 confident' : conf === 'yellow' ? '🟡 uncertain' : '🔴 difficult';
    const cardClass = status === 'approved' ? 'approved' : status === 'flagged' ? 'flagged' : '';

    const hasLatin = /[a-zA-Z]/.test(pa);
    return `
      <div class="tr-verse ${cardClass}" data-num="${verse.number}">
        <div class="tr-verse-num">#${verse.number}</div>
        <div class="tr-verse-body">
          <div class="tr-farsi">${esc(verse.farsi || '')}</div>
          <textarea class="tr-punjabi-input" data-num="${verse.number}">${esc(pa)}</textarea>
          <div class="tr-verse-actions">
            <button class="tr-btn-approve" data-num="${verse.number}">✓ Approve</button>
            <button class="tr-btn-flag"    data-num="${verse.number}">⚑ Flag</button>
            <button class="tr-btn-regen"   data-num="${verse.number}" title="Regenerate this verse">↻ Regen</button>
            <button class="tr-btn-fix"     data-num="${verse.number}" ${hasLatin ? '' : 'hidden'}>✦ Fix Script</button>
            <span class="tr-confidence ${conf}">${confLabel}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  /* Wire events */
  trVerseList.querySelectorAll('.tr-punjabi-input').forEach(ta => {
    ta.addEventListener('input', () => {
      const num = parseInt(ta.dataset.num);
      if (!trState.changes[num]) trState.changes[num] = { punjabi: ta.value, status: 'pending' };
      trState.changes[num].punjabi = ta.value;
    });
  });

  trVerseList.querySelectorAll('.tr-btn-approve').forEach(btn => {
    btn.addEventListener('click', () => {
      const num  = parseInt(btn.dataset.num);
      const card = btn.closest('.tr-verse');
      const ta   = card.querySelector('.tr-punjabi-input');
      const pa   = ta ? ta.value : trGetPunjabi({ number: num });
      if (!trState.changes[num]) trState.changes[num] = {};
      trState.changes[num].punjabi = pa;
      trState.changes[num].status  = 'approved';
      card.className = 'tr-verse approved';
      trSyncToLocalStorage(num, pa, 'approved');
      trUpdateProgress();
      showToast('✓ Synced to reader');
    });
  });

  trVerseList.querySelectorAll('.tr-btn-flag').forEach(btn => {
    btn.addEventListener('click', () => {
      const num  = parseInt(btn.dataset.num);
      const card = btn.closest('.tr-verse');
      const ta   = card.querySelector('.tr-punjabi-input');
      const pa   = ta ? ta.value : trGetPunjabi({ number: num });
      if (!trState.changes[num]) trState.changes[num] = {};
      trState.changes[num].punjabi = pa;
      trState.changes[num].status  = 'flagged';
      card.className = 'tr-verse flagged';
      trSyncToLocalStorage(num, pa, 'flagged');
      trUpdateProgress();
    });
  });

  /* Regenerate */
  trVerseList.querySelectorAll('.tr-btn-regen').forEach(btn => {
    btn.addEventListener('click', () => {
      trRegenerateVerse(parseInt(btn.dataset.num), btn.closest('.tr-verse'));
    });
  });

  /* Fix Script — show button when textarea has Latin chars */
  trVerseList.querySelectorAll('.tr-punjabi-input').forEach(ta => {
    ta.addEventListener('input', () => {
      const card   = ta.closest('.tr-verse');
      const fixBtn = card.querySelector('.tr-btn-fix');
      if (fixBtn) fixBtn.hidden = !/[a-zA-Z]/.test(ta.value);
    });
  });

  trVerseList.querySelectorAll('.tr-btn-fix').forEach(btn => {
    btn.addEventListener('click', () => {
      trFixScript(parseInt(btn.dataset.num), btn.closest('.tr-verse'));
    });
  });

  trUpdateProgress();
}

/* ── Filter tabs ── */

document.querySelectorAll('.tr-filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tr-filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    trState.filter = tab.dataset.filter;
    trRenderFiltered();
  });
});

/* ── Book tabs ── */

trBookTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    trBookTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    trLoadBook(parseInt(tab.dataset.book));
  });
});

/* ── Approve all visible ── */

trApproveAll.addEventListener('click', () => {
  trVerseList.querySelectorAll('.tr-verse').forEach(card => {
    const num = parseInt(card.dataset.num);
    const ta  = card.querySelector('.tr-punjabi-input');
    if (!ta) return;
    const pa = ta.value;
    if (!trState.changes[num]) trState.changes[num] = {};
    trState.changes[num].punjabi = pa;
    trState.changes[num].status  = 'approved';
    card.className = 'tr-verse approved';
    trSyncToLocalStorage(num, pa, 'approved');
  });
  trUpdateProgress();
});

/* ── Copy patch ── */

trCopyPatch.addEventListener('click', function () {
  if (!Object.keys(trState.changes).length) {
    alert('No changes yet. Approve or edit some verses first.');
    return;
  }
  const patch = {
    book: trState.book,
    changes: Object.entries(trState.changes).map(([num, ch]) => ({
      number:         parseInt(num),
      punjabi:        ch.punjabi,
      punjabi_status: ch.status,
    })),
  };
  const json = JSON.stringify(patch, null, 2);
  trPatchPre.textContent = json;
  trPatchOutput.hidden = false;
  navigator.clipboard.writeText(json).then(() => {
    this.textContent = 'Copied!';
    this.classList.add('copied');
    setTimeout(() => { this.textContent = 'Copy Patch'; this.classList.remove('copied'); }, 2000);
  });
});

/* ── Generate via Anthropic API ── */

trGenerate.addEventListener('click', async () => {
  const apiKey = localStorage.getItem('mv-admin-api-key');
  if (!apiKey) {
    trKeyStatus.textContent = 'Save your API key first (above).';
    trKeyStatus.className = 'err';
    document.getElementById('tr-api-card').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const toGenerate = trState.verses.filter(v => !v.punjabi).slice(0, 20);
  if (!toGenerate.length) {
    alert('All verses in this book already have translations.');
    return;
  }

  trGenerate.textContent = '⏳ Generating…';
  trGenerate.classList.add('generating');

  const prompt = `You are translating verses from Rumi's Masnavi (Persian poetry) into Punjabi Gurmukhi script.

Guidelines:
- Write natural flowing Punjabi, not word-for-word
- Keep shared Perso-Arabic-Punjabi loanwords in Gurmukhi script: ਇਸ਼ਕ (ishq), ਰੂਹ (ruh), ਜੁਦਾਈ (judai), ਦਰਦ (dard), ਮਾਸ਼ੂਕ (mashuq), ਆਸ਼ਿਕ (ashiq), ਅਦਬ (adab), ਫ਼ਨਾ (fana), ਹੱਕ (haq), ਤੌਫ਼ੀਕ (taufiq) etc.
- Use / to separate the two hemistichs of each couplet
- confidence: "green" if translation is clear, "yellow" if uncertain, "red" if very difficult
- Respond ONLY with a valid JSON array, no other text, no markdown

Verses to translate:
${JSON.stringify(toGenerate.map(v => ({ number: v.number, farsi: v.farsi })))}

Required JSON format:
[{"number": 21, "punjabi": "ਪਹਿਲੀ ਸਤਰ / ਦੂਜੀ ਸਤਰ", "confidence": "green"}]`;

  try {
    const text = await trCallAPI([{ role: 'user', content: prompt }], 4096);

    let translations;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      translations = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch(e) {
      throw new Error('Could not parse API response as JSON. Raw: ' + text.slice(0, 200));
    }

    let count = 0;
    translations.forEach(t => {
      const verse = trState.verses.find(v => v.number === t.number);
      if (verse && t.punjabi) {
        verse.punjabi            = t.punjabi;
        verse.punjabi_status     = 'pending';
        verse.punjabi_confidence = t.confidence || 'green';
        count++;
      }
    });

    trKeyStatus.textContent = `Generated ${count} translations. Review below.`;
    trKeyStatus.className = 'ok';

    // Switch to pending filter to show new drafts
    document.querySelectorAll('.tr-filter-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.tr-filter-tab[data-filter="pending"]').classList.add('active');
    trState.filter = 'pending';
    trRenderFiltered();

  } catch(err) {
    trKeyStatus.textContent = 'Error: ' + err.message;
    trKeyStatus.className = 'err';
  } finally {
    trGenerate.textContent = '⚡ Generate Next 20';
    trGenerate.classList.remove('generating');
  }
});

/* ── Auto-load when section opened ── */
document.querySelector('[data-section="translations"]').addEventListener('click', () => {
  if (!trState.verses.length) trLoadBook(1);
});
