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

const PASSWORD = 'masnavi-admin';

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
  });
});

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
