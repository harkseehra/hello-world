#!/usr/bin/env python3
"""
Download Steingass SQLite, look up target words from all 6 book JSONs,
produce data/vocab.json  { "Persian_word": "short English gloss", ... }
"""
import sqlite3, json, re, urllib.request, os
from collections import Counter
import glob

DB_PATH = '/tmp/entries_slim.sqlite'

if not os.path.exists(DB_PATH):
    print('Downloading Steingass DB…')
    urllib.request.urlretrieve(
        'https://raw.githubusercontent.com/theodore-s-beers/steingass-scraper/main/entries_slim.sqlite',
        DB_PATH
    )
    print('Downloaded.')
else:
    print('Using cached Steingass DB.')

# ── Persian normalizer ──────────────────────────────────────────────────────
TASHKEEL = re.compile(
    r'[\u064B-\u065F\u0610-\u061A\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]'
)

def normalize(t):
    if not t:
        return ''
    t = TASHKEEL.sub('', t)           # strip diacritics / tashkeel
    t = re.sub(r'[آأإٱ]', 'ا', t)    # alef variants → ا
    t = t.replace('\u064A', '\u06CC') # Arabic ya (ي) → Farsi ya (ی)
    t = t.replace('\u0643', '\u06A9') # Arabic kaf (ك) → Farsi kaf (ک)
    t = t.replace('\u0640', '')       # kashida / tatweel
    return t.strip()

# ── Collect words from books ────────────────────────────────────────────────
word_freq = Counter()
for path in sorted(glob.glob('/home/user/hello-world/data/book*.json')):
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    sections = data.get('sections', []) if isinstance(data, dict) else data
    for section in sections:
        for entry in section.get('entries', []):
            farsi = entry.get('farsi', '') or ''
            for w in farsi.replace(' / ', ' ').split():
                w_clean = re.sub(r'[^\u0600-\u06FF]', '', w)
                if len(w_clean) > 1:
                    word_freq[normalize(w_clean)] += 1

# Keep words appearing 10+ times
targets = {w for w, c in word_freq.items() if c >= 10 and w}
print(f'Target words (freq ≥10): {len(targets)}')

# ── Heuristic verb filter ──────────────────────────────────────────────────
# Classical Persian infinitives and common verb conjugation endings to skip
VERB_ENDINGS = (
    'یدن', 'ستن', 'ختن', 'فتن', 'ندن', 'ردن', 'ادن',  # infinitives
    'ییدن', 'اندن',
)
targets = {w for w in targets if not any(w.endswith(e) for e in VERB_ENDINGS)}
print(f'After verb filter: {len(targets)}')

# ── Stop-words: function words that need no gloss ──────────────────────────
# (normalized forms — after running through normalize())
FA_STOP = {
    # pronouns
    'من', 'تو', 'او', 'ما', 'شما', 'انها', 'این', 'ان', 'اینها', 'خود', 'خویش',
    # prepositions / postpositions
    'از', 'به', 'در', 'بر', 'با', 'تا', 'برای', 'پس', 'پیش',
    'بی', 'جز', 'مگر', 'الا', 'نه', 'نی',
    # conjunctions / particles
    'که', 'و', 'یا', 'اما', 'ولی', 'چون', 'چه', 'هم', 'هر',
    'اگر', 'چو', 'چنان', 'چنین', 'همچو', 'همچون', 'همچنان',
    'پس', 'زیرا', 'لیک', 'لیکن',
    # copulas / auxiliary verbs (conjugated forms)
    'است', 'بود', 'شد', 'شود', 'باشد', 'باشی', 'بودم', 'بودی',
    'هست', 'نیست', 'نبود', 'گشت', 'گشت',
    # common verb roots / frequent conjugations
    'گفت', 'گوید', 'کرد', 'کن', 'کند', 'کنی', 'کنم', 'کنند',
    'رفت', 'امد', 'داد', 'بگفت', 'بکرد',
    # common short particles
    'را', 'هم', 'هر', 'نه', 'نی', 'می', 'بی', 'ای', 'ا',
    # relative / question
    'کی', 'کجا', 'چرا', 'چگونه',
}
targets = {w for w in targets if w not in FA_STOP}
print(f'After stop-word filter: {len(targets)}')

# ── Steingass lookup ────────────────────────────────────────────────────────
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Pre-build a normalized lookup index from Steingass for speed
print('Building Steingass lookup index…')
cur.execute('SELECT headword_persian, definitions FROM entries WHERE headword_persian != ""')
rows = cur.fetchall()
conn.close()

steingass_index = {}
for hw, defn in rows:
    key = normalize(hw)
    if key and key not in steingass_index:
        steingass_index[key] = defn

print(f'Steingass index: {len(steingass_index)} entries')

def shorten(defn):
    """Return a short gloss from a Steingass definition."""
    defn = re.sub(r'\s+', ' ', defn or '').strip()
    # Remove parenthetical notes at start (e.g. "(P)" for Persian)
    defn = re.sub(r'^\([^)]+\)\s*', '', defn)
    # Cut at first semicolon, em-dash, or parenthesis to keep it short
    for sep in [';', '—', '(']:
        idx = defn.find(sep)
        if 0 < idx < 90:
            defn = defn[:idx]
            break
    return defn.strip(' ,;')[:120]

vocab = {}
unmatched = []

for word in sorted(targets):
    # 1) Exact match
    if word in steingass_index:
        gloss = shorten(steingass_index[word])
        if gloss:
            vocab[word] = gloss
        continue

    # 2) Try stripping common Persian suffixes (plural ها، possession ش/م، etc.)
    suffixes = ('ها', 'هاى', 'هاي', 'ان', 'ات', 'ی', 'ى', 'م', 'ت', 'ش', 'مان', 'تان', 'شان')
    matched = False
    for suf in suffixes:
        if word.endswith(suf) and len(word) > len(suf) + 1:
            stem = word[:-len(suf)]
            if stem in steingass_index:
                gloss = shorten(steingass_index[stem])
                if gloss:
                    vocab[word] = gloss
                matched = True
                break
    if matched:
        continue

    if word not in vocab:
        unmatched.append(word)

print(f'Matched: {len(vocab)} / {len(targets)}  |  Unmatched: {len(unmatched)}')

# ── Manual overrides (correct known mis-matches from Steingass) ────────────
# These words have legitimate Persian meanings that differ from Steingass's
# primary Arabic-grammar entries, or were simply not found automatically.
MANUAL = {
    # Core Sufi / Masnavi vocabulary
    'عقل':     'Reason, intellect, wisdom',
    'روز':     'Day',
    'خورشید':  'The sun',
    'دنیا':    'The world, this life',
    'اخر':     'The end, the last',
    'اول':     'The first, beginning',
    'نفس':     'The soul, self; breath',
    'امد':     'He came',
    'خیر':     'Good, goodness, blessing',
    'شر':      'Evil, wickedness',
    'صبر':     'Patience, endurance',
    'غم':      'Grief, sorrow',
    'شادی':    'Joy, happiness',
    'مرگ':     'Death',
    'زندگی':   'Life',
    'پرده':    'A curtain, veil',
    'بلبل':    'The nightingale',
    'گل':      'A flower, rose',
    'باغ':     'A garden',
    'بهار':    'Spring, springtime',
    'زمین':    'Earth, ground, land',
    'اسمان':   'Sky, heaven',
    'دریا':    'The sea, ocean',
    'کوه':     'Mountain',
    'شیر':     'Lion; milk',
    'اژدها':   'Dragon, serpent',
    'خرگوش':   'Hare, rabbit',
    'مار':     'Snake, serpent',
    'اسب':     'Horse',
    'شاه':     'King',
    'شاهد':    'Witness; beloved',
    'خادم':    'Servant',
    'قلب':     'Heart; the centre',
    'زبان':    'Tongue, language',
    'گوش':     'Ear',
    'پای':     'Foot, leg',
    'روح':     'Soul, spirit',
    'جسم':     'Body',
    'صورت':    'Form, face, image',
    'معنی':    'Meaning, essence',
    'لطف':     'Grace, kindness, subtlety',
    'کرم':     'Generosity, grace',
    'فضل':     'Grace, virtue, excellence',
    'شوق':     'Longing, ardent desire',
    'وصل':     'Union, connection',
    'هجر':     'Separation, absence',
    'فراق':    'Separation, parting',
    'وصال':    'Union, meeting',
    'طلب':     'Seeking, quest, desire',
    'سفر':     'Journey, travel',
    'مقام':    'Station, abode, position',
    'حال':     'State, condition, spiritual state',
    'وقت':     'Time, moment',
    'زمان':    'Time, age, epoch',
    'عمر':     'Life, lifetime',
    'رنگ':     'Colour',
    'بوی':     'Fragrance, scent',
    'ناز':     'Coquetry, grace, charm',
    'نیاز':    'Need, want, supplication',
    'فنا':     'Annihilation, passing away',
    'بقا':     'Permanence, eternal existence',
    'ذکر':     'Remembrance, mention',
    'فکر':     'Thought, reflection',
    'خیال':    'Imagination, fancy, phantom',
    'وهم':     'Imagination, fancy, illusion',
}

# Apply manual overrides (using normalized key)
for raw_word, gloss in MANUAL.items():
    key = normalize(raw_word)
    vocab[key] = gloss

print(f'After manual overrides: {len(vocab)} entries')

out = '/home/user/hello-world/data/vocab.json'
with open(out, 'w', encoding='utf-8') as f:
    json.dump(vocab, f, ensure_ascii=False, indent=2, sort_keys=True)
print(f'Written → {out}')

# Show top-10 most frequent words with their gloss (sanity check)
print('\nTop-20 frequent words and glosses:')
top = sorted(
    [(word_freq[normalize(w)], w, vocab.get(normalize(w), '(no match)')) for w in
     sorted(word_freq, key=word_freq.get, reverse=True)[:40]
     if normalize(w) in vocab],
    reverse=True
)[:20]
for freq, w, gloss in top:
    print(f'  {w} ({freq}x): {gloss}')
