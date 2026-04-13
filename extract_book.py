"""
Masnavi PDF Extractor — v3
Extracts Farsi + English verses from bilingual PDF into structured JSON.

PDF layout (612×792):
  Farsi column   x < 232  (RTL, hemistichs may be 1 or 2 per block)
  English column x ≥ 238  (LTR, full couplet in one block)
  Verse markers  x ≈ 220-245, digit string, every 5 verses
  Headings       wide-spanning blocks or small-x English blocks

Ligature artifacts (2009 InDesign PDF):
  Primary:  U+0627 U+0627 U+0644  →  U+0627 U+0644 U+0627  (اال → الا)
  Word map: residual cases (Plato, spheres, السلام, etc.)
"""

import fitz
import json
import unicodedata
import re

# ── Farsi correction ──────────────────────────────────────────────────────────

_ARTIFACT_RE = re.compile('\u0627\u0627\u0644')

_WORD_FIX = {
    'افالطون':  'افلاطون',
    'افالك':    'افلاک',
    'افالكش':   'افلاکش',
    'السالم':   'السلام',
    'والسالم':  'والسلام',
    'جاللى':    'جلالی',
    'جالل':     'جلال',
}

def fix_farsi(text):
    text = _ARTIFACT_RE.sub('\u0627\u0644\u0627', text)
    for wrong, right in _WORD_FIX.items():
        text = text.replace(wrong, right)
    return text

# ── helpers ───────────────────────────────────────────────────────────────────

_ARROW = '↵'

def raw_to_text(raw):
    """Convert raw PDF block text: newlines → space, NFKC, collapse whitespace."""
    text = unicodedata.normalize("NFKC", raw)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def clean_output(text):
    """Strip ↵ markers, raw newlines, and extra whitespace from final strings."""
    if not text:
        return text
    text = text.replace(_ARROW, ' ').replace('\n', ' ')
    text = re.sub(r'\s{2,}', ' ', text).strip()
    return text

def has_arabic(text):
    return any('\u0600' <= c <= '\u06FF' for c in text)

def has_latin(text):
    return bool(re.search(r'[a-zA-Z]', text))

def split_hemistichs(text):
    """Split a Farsi block that may contain >1 hemistich (separated by \\n or |)."""
    parts = re.split(r'\s*[\n|]\s*', text.strip())
    return [p.strip() for p in parts if p.strip()]

def split_mixed(raw):
    """Split 'English … | Farsi …' block → (english, farsi) at first Arabic char."""
    for i, c in enumerate(raw):
        if '\u0600' <= c <= '\u06FF':
            eng = re.sub(r'[\n|]+$', '', raw[:i]).strip()
            far = fix_farsi(raw[i:].strip())
            return eng, far
    return raw, ''

def extract_digit(text):
    """Extract a pure digit string from text, stripping any whitespace/newlines."""
    return re.sub(r'\D', '', text)

# ── block classifier ──────────────────────────────────────────────────────────

def classify_blocks(page):
    """
    Returns:
      verse_markers  : [(y, number), ...]
      farsi_items    : [(y, raw_text, kind), ...]   kind='verse'|'heading'
      english_items  : [(y, raw_text, kind), ...]
    """
    blocks        = page.get_text("blocks")
    verse_markers = []
    farsi_items   = []
    english_items = []

    for block in blocks:
        x0, y0, x1, y1, raw, *_ = block
        raw  = raw.strip()
        text = raw_to_text(raw)
        if not text:
            continue

        # ── page numbers (bottom strip) ──
        if y0 > 720:
            continue

        # ── book-title banner at very top ──
        if y0 < 65 and x0 > 240 and ('مثنوی' in text or 'دفتر' in text):
            continue

        # ── verse markers: digit-only block at x≈220-245 ──
        digits = extract_digit(text)
        if 215 <= x0 <= 240 and x1 <= 248 and digits and len(digits) <= 4:
            verse_markers.append((y0, int(digits)))
            continue

        arabic = has_arabic(raw)
        latin  = has_latin(raw)

        # ── Farsi column (x_max ≤ 232) ──
        if x1 <= 232 and arabic:
            farsi_items.append((y0, fix_farsi(raw), 'verse'))
            continue

        # ── English column (x_min ≥ 238, no Arabic) ──
        if x0 >= 238 and not arabic:
            # verse: starts near expected indent (~246); heading: indented differently
            kind = 'verse' if x0 <= 262 else 'heading'
            english_items.append((y0, raw, kind))
            continue

        # ── Wide / spanning blocks ──
        if arabic and latin:
            eng, far = split_mixed(raw)
            if eng:
                english_items.append((y0, eng, 'verse'))
            if far:
                farsi_items.append((y0, far, 'verse'))
        elif arabic:
            farsi_items.append((y0, fix_farsi(raw), 'heading'))
        elif latin:
            english_items.append((y0, raw, 'heading'))

    return sorted(verse_markers), sorted(farsi_items), sorted(english_items)

# ── verse number assignment ───────────────────────────────────────────────────

def assign_verse_numbers(english_items, verse_markers):
    """
    Interpolate verse numbers across English verse blocks using every-5 markers.
    """
    verse_blocks   = [(y, t, k) for y, t, k in english_items if k == 'verse']
    heading_blocks = [(y, t, k) for y, t, k in english_items if k != 'verse']

    if not verse_markers or not verse_blocks:
        return [(y, t, None, k) for y, t, k in english_items]

    vb      = sorted(verse_blocks,  key=lambda b: b[0])
    anchors = sorted(verse_markers, key=lambda a: a[0])

    anchor_map = {}
    for ay, anum in anchors:
        closest = min(range(len(vb)), key=lambda i: abs(vb[i][0] - ay))
        anchor_map[closest] = anum

    nums = [None] * len(vb)
    for idx, num in anchor_map.items():
        nums[idx] = num

    # forward pass
    last_n = last_i = None
    for i in range(len(vb)):
        if nums[i] is not None:
            last_n, last_i = nums[i], i
        elif last_n is not None:
            nums[i] = last_n + (i - last_i)

    # backward pass
    next_n = next_i = None
    for i in range(len(vb) - 1, -1, -1):
        if nums[i] is not None:
            next_n, next_i = nums[i], i
        elif next_n is not None:
            nums[i] = next_n - (next_i - i)

    results = [(y, t, nums[i], k) for i, (y, t, k) in enumerate(vb)]
    for y, t, k in heading_blocks:
        results.append((y, t, None, k))
    return sorted(results, key=lambda r: r[0])

# ── Farsi couplet grouping ────────────────────────────────────────────────────

def group_farsi_couplets(farsi_items):
    """
    Pair Farsi hemistichs into couplets.

    Rules:
      - Each block may contain 1, 2, or (rarely) 3 hemistichs separated by \\n
      - Expand all hemistichs into a flat list, assign synthetic sequential y
      - Walk the list: fill groups of exactly 2; if a new hemistich is > 60 px
        from the last item in the current group (and group has 1), flush and
        start fresh. This handles the 3-hemistich page-straddle artifact.
    """
    verse_blocks   = [(y, t) for y, t, k in farsi_items if k == 'verse']
    heading_blocks = [(y, t) for y, t, k in farsi_items if k != 'verse']

    # Expand
    expanded = []
    for y, raw in sorted(verse_blocks):
        parts = split_hemistichs(raw)
        for j, part in enumerate(parts):
            expanded.append((y + j * 0.1, part, y))  # (synth_y, text, orig_y)

    couplets = []
    group    = []

    def flush():
        if not group:
            return
        # Use MAX orig_y so cross-block couplets align with their English partner
        # (the last hemistich is spatially closest to the English verse block)
        y_ref = max(g[2] for g in group)
        text  = ' / '.join(g[1].strip() for g in group if g[1].strip())
        couplets.append((y_ref, text, 'verse'))
        group.clear()

    for item in expanded:
        synth_y, text, orig_y = item

        if len(group) >= 2:
            flush()

        if group:
            last_orig_y = group[-1][2]
            gap = orig_y - last_orig_y
            if gap > 120:
                flush()

        group.append(item)

    flush()

    for y, t in heading_blocks:
        couplets.append((y, t, 'heading'))

    return sorted(couplets, key=lambda c: c[0])

# ── pair Farsi + English ──────────────────────────────────────────────────────

def pair_verses(farsi_couplets, english_numbered):
    """
    Positional pairing: both languages are in the same top-to-bottom order on
    every page, so pair the i-th Farsi couplet with the i-th English verse.
    Much more robust than y-distance matching when multi-hemistich blocks
    produce couplets with identical y-refs.
    """
    fa_verses = sorted([(y, t) for y, t, k in farsi_couplets if k == 'verse'])
    fa_heads  = [(y, t) for y, t, k in farsi_couplets if k != 'verse']

    en_verses  = sorted([(y, t, n) for y, t, n, k in english_numbered if k == 'verse'])
    en_heads   = [(y, t) for y, t, n, k in english_numbered if k != 'verse']

    entries = []
    fi = 0
    for ey, et, enum in en_verses:
        if fi < len(fa_verses):
            fy, ft = fa_verses[fi]
            entries.append({'type': 'verse', 'y': ey, 'number': enum,
                            'farsi': ft, 'english': et})
            fi += 1
        else:
            entries.append({'type': 'verse', 'y': ey, 'number': enum,
                            'farsi': None, 'english': et})

    for y, t in en_heads:
        entries.append({'type': 'heading', 'y': y, 'english': t, 'farsi': None})
    for y, t in fa_heads:
        entries.append({'type': 'heading', 'y': y, 'farsi': t, 'english': None})

    return sorted(entries, key=lambda e: e['y'])

# ── merge adjacent heading entries ────────────────────────────────────────────

def merge_headings(entries, tol=65):
    """
    Merge consecutive heading entries (Farsi-only + English-only) within tol px
    into one combined heading.
    """
    merged = []
    i = 0
    while i < len(entries):
        e = entries[i]
        if e['type'] != 'heading':
            merged.append(e)
            i += 1
            continue
        fa = e.get('farsi') or ''
        en = e.get('english') or ''
        y0 = e['y']
        j  = i + 1
        while j < len(entries):
            nxt = entries[j]
            if nxt['type'] != 'heading':
                break
            if abs(nxt['y'] - y0) > tol:
                break
            nfa = nxt.get('farsi') or ''
            nen = nxt.get('english') or ''
            fa  = (fa + ' ' + nfa).strip() if nfa else fa
            en  = (en + ' ' + nen).strip() if nen else en
            j  += 1
        merged.append({'type': 'heading', 'y': y0,
                        'farsi': fa or None, 'english': en or None})
        i = j
    return merged

# ── main extractor ────────────────────────────────────────────────────────────

def extract_book(pdf_path, book_number=1,
                 book_title_fa='دفتر اول', book_title_en='Book One',
                 max_pages=None):

    doc   = fitz.open(pdf_path)
    total = min(len(doc), max_pages) if max_pages else len(doc)

    all_entries = []
    flags       = []

    for page_num in range(total):
        page = doc[page_num]

        markers, farsi_items, english_items = classify_blocks(page)
        farsi_couplets   = group_farsi_couplets(farsi_items)
        english_numbered = assign_verse_numbers(english_items, markers)
        paired = pair_verses(farsi_couplets, english_numbered)
        paired = merge_headings(paired)

        verse_entries = [e for e in paired if e['type'] == 'verse']
        unmatched     = [e for e in verse_entries
                         if e['farsi'] is None or e['english'] is None]
        if len(unmatched) > max(2, len(verse_entries) * 0.25) and verse_entries:
            flags.append({'page': page_num + 1,
                          'issue': f"{len(unmatched)}/{len(verse_entries)} unpaired"})

        for e in paired:
            e['page'] = page_num + 1
        all_entries.extend(paired)

    doc.close()

    # ── Build sections ────────────────────────────────────────────────────────
    sections          = []
    current_section   = None
    masnavi_started   = False   # flip on first actual verse

    for entry in all_entries:
        etype = entry['type']
        raw_fa = clean_output(entry.get('farsi') or '')
        raw_en = clean_output(entry.get('english') or '')

        if etype == 'heading':
            # Skip ALL headings before the first verse (preface region)
            if not masnavi_started:
                continue
            if current_section:
                sections.append(current_section)
            current_section = {
                'type':     'section',
                'title_fa': raw_fa,
                'title_en': raw_en,
                'entries':  [],
            }

        elif etype == 'verse':
            masnavi_started = True
            if current_section is None:
                current_section = {
                    'type':     'section',
                    'title_fa': '',
                    'title_en': 'Opening',
                    'entries':  [],
                }
            current_section['entries'].append({
                'type':    'verse',
                'number':  entry.get('number'),
                'farsi':   raw_fa or None,
                'english': raw_en or None,
            })

    if current_section:
        sections.append(current_section)

    return {
        'book':             book_number,
        'title_fa':         book_title_fa,
        'title_en':         book_title_en,
        'extraction_flags': flags,
        'sections':         sections,
    }

# ── CLI ───────────────────────────────────────────────────────────────────────

BOOKS = [
    (1, 'دفتر اول',  'Book One'),
    (2, 'دفتر دوم',  'Book Two'),
    (3, 'دفتر سوم',  'Book Three'),
    (4, 'دفتر چهارم','Book Four'),
    (5, 'دفتر پنجم', 'Book Five'),
    (6, 'دفتر ششم',  'Book Six'),
]

PDF_DIR = '/home/user/hello-world/project files'
OUT_DIR = '/home/user/hello-world'

if __name__ == '__main__':
    import sys, os
    args = sys.argv[1:]

    # Single-book mode: python3 extract_book.py 4
    single_book = None
    if args and args[0].isdigit():
        single_book = int(args[0])
        args = args[1:]

    preview = '--all' not in args and single_book is None

    if single_book is not None:
        # Extract one book only
        book_row = next((b for b in BOOKS if b[0] == single_book), None)
        if book_row is None:
            print(f"Unknown book number {single_book}. Must be 1–6.")
            sys.exit(1)
        num, fa, en = book_row
        pdf = f'{PDF_DIR}/masnavi {num} faen.pdf'
        print(f'Extracting Book {num}…', end=' ', flush=True)
        result = extract_book(pdf, book_number=num,
                              book_title_fa=fa, book_title_en=en)
        os.makedirs(f'{OUT_DIR}/data', exist_ok=True)
        out = f'{OUT_DIR}/data/book{num}.json'
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        total_verses = sum(
            sum(1 for e in s['entries'] if e['type'] == 'verse')
            for s in result['sections']
        )
        single_fa = sum(
            sum(1 for e in s['entries']
                if e['type'] == 'verse' and '/' not in (e.get('farsi') or ''))
            for s in result['sections']
        )
        flags = result['extraction_flags']
        print(f"{total_verses} verses, {single_fa} single-hemistich, "
              f"{len(flags)} flagged pages"
              + (f" ← REVIEW" if flags else " ✓"))
        print(f"Saved → {out}")

    elif preview:
        # Preview: first 8 pages of Book 1
        pdf  = f'{PDF_DIR}/masnavi 1 faen.pdf'
        print('Extracting preview (first 8 pages of Book 1)…')
        result = extract_book(pdf, book_number=1, max_pages=8)

        print('\n' + '='*70)
        print('PREVIEW — FIRST 25 VERSES')
        print('='*70)
        count = 0
        for sec in result['sections']:
            print(f"\n── {sec['title_en']}")
            if sec['title_fa']:
                print(f"   {sec['title_fa']}")
            for e in sec['entries']:
                if e['type'] == 'verse' and count < 25:
                    print(f"\n  [{e['number']}]")
                    print(f"  FA: {e['farsi']}")
                    print(f"  EN: {e['english']}")
                    count += 1

        print(f"\nFlags: {result['extraction_flags']}")
        out = f'{OUT_DIR}/preview_book1.json'
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"Saved → {out}")

    else:
        # Full extraction: all 6 books
        os.makedirs(f'{OUT_DIR}/data', exist_ok=True)
        for num, fa, en in BOOKS:
            pdf = f'{PDF_DIR}/masnavi {num} faen.pdf'
            print(f'Extracting Book {num}…', end=' ', flush=True)
            result = extract_book(pdf, book_number=num,
                                  book_title_fa=fa, book_title_en=en)
            out = f'{OUT_DIR}/data/book{num}.json'
            with open(out, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            total_verses = sum(
                sum(1 for e in s['entries'] if e['type'] == 'verse')
                for s in result['sections']
            )
            flags = result['extraction_flags']
            print(f"{total_verses} verses, {len(flags)} flagged pages"
                  + (f" ← REVIEW" if flags else " ✓"))
        print('\nDone. JSON files in data/')
