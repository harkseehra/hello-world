"""
Masnavi Alignment Diagnostic
Finds every page where FA couplet count ≠ EN verse count.
These are the drift sources causing Farsi-English mismatches.

Usage:
  python3 align_diag.py            # all 6 books, summary
  python3 align_diag.py 4          # book 4 only, verbose
  python3 align_diag.py 4 37       # inspect raw blocks on book 4, page 37
"""

import sys
import json
import fitz
from extract_book import (
    classify_blocks, group_farsi_couplets, assign_verse_numbers, PDF_DIR
)

BOOKS = [
    (1, 'Book One'),
    (2, 'Book Two'),
    (3, 'Book Three'),
    (4, 'Book Four'),
    (5, 'Book Five'),
    (6, 'Book Six'),
]


def diagnose_book(book_num, verbose=False):
    pdf_path = f'{PDF_DIR}/masnavi {book_num} faen.pdf'
    doc = fitz.open(pdf_path)

    drift_pages = []
    cumulative  = 0

    for page_num in range(len(doc)):
        page = doc[page_num]
        markers, farsi_items, english_items = classify_blocks(page)
        # No carry passed — diagnose each page independently.
        # A pending carry hemistich counts as +1 FA (it will be completed next page).
        farsi_couplets, pending, _ = group_farsi_couplets(farsi_items, page_num=page_num)
        english_numbered  = assign_verse_numbers(english_items, markers)

        fa_count = (sum(1 for _, _, k in farsi_couplets if k == 'verse')
                    + (1 if pending else 0))
        en_count = sum(1 for _, _, n, k in english_numbered if k == 'verse')

        delta       = fa_count - en_count
        cumulative += delta

        if delta != 0:
            drift_pages.append({
                'page':       page_num + 1,
                'fa':         fa_count,
                'en':         en_count,
                'delta':      delta,
                'cumulative': cumulative,
            })

        if verbose and delta != 0:
            direction = 'FA>EN' if delta > 0 else 'EN>FA'
            print(f"  p{page_num+1:3d}  FA={fa_count:2d}  EN={en_count:2d}"
                  f"  Δ={delta:+d}  cum={cumulative:+d}  {direction}")

    doc.close()
    return drift_pages, cumulative


def inspect_page(book_num, page_num):
    """Print raw grouped blocks for one page — lets us see why counts differ."""
    pdf_path = f'{PDF_DIR}/masnavi {book_num} faen.pdf'
    doc = fitz.open(pdf_path)
    page = doc[page_num - 1]

    markers, farsi_items, english_items = classify_blocks(page)
    farsi_couplets, _, _ = group_farsi_couplets(farsi_items, page_num=page_num - 1)
    english_numbered  = assign_verse_numbers(english_items, markers)

    fa_verses = [(y, t) for y, t, k in farsi_couplets       if k == 'verse']
    en_verses = [(y, t, n) for y, t, n, k in english_numbered if k == 'verse']

    fa_heads  = [(y, t) for y, t, k in farsi_couplets       if k != 'verse']
    en_heads  = [(y, t) for y, t, n, k in english_numbered   if k != 'verse']

    delta = len(fa_verses) - len(en_verses)
    arrow = 'FA>EN ← extra Farsi' if delta > 0 else ('EN>FA ← missing Farsi' if delta < 0 else '✓')

    print(f"\n{'='*70}")
    print(f"  Book {book_num}  /  Page {page_num}  |  FA={len(fa_verses)}  EN={len(en_verses)}"
          f"  Δ={delta:+d}  {arrow}")
    print(f"{'='*70}")

    max_rows = max(len(fa_verses), len(en_verses))
    print(f"\n  {'#':>3}  {'FARSI couplet':<40}  {'#':>4}  ENGLISH verse")
    print(f"  {'-'*3}  {'-'*40}  {'-'*4}  {'-'*38}")
    for i in range(max_rows):
        fa_txt = fa_verses[i][1][:38] if i < len(fa_verses) else '── MISSING ──'
        en_num = f"#{en_verses[i][2]}" if i < len(en_verses) else ''
        en_txt = en_verses[i][1][:38] if i < len(en_verses) else '── MISSING ──'
        marker = ' ◄' if (i >= len(fa_verses) or i >= len(en_verses)) else ''
        print(f"  {i:>3}  {fa_txt:<40}  {en_num:>4}  {en_txt}{marker}")

    if fa_heads:
        print(f"\n  Farsi headings on this page:")
        for y, t in fa_heads:
            print(f"    y={y:.1f}  {t[:60]}")
    if en_heads:
        print(f"\n  English headings on this page:")
        for y, t in en_heads:
            print(f"    y={y:.1f}  {t[:60]}")

    # Also show raw farsi_items to debug hemistich grouping
    print(f"\n  Raw Farsi blocks (before grouping):")
    for y, t, k in sorted(farsi_items):
        print(f"    y={y:5.1f}  [{k}]  {t[:60]}")

    doc.close()


if __name__ == '__main__':
    args = sys.argv[1:]

    # align_diag.py 4 37  → inspect book 4, page 37
    if len(args) == 2 and args[0].isdigit() and args[1].isdigit():
        inspect_page(int(args[0]), int(args[1]))
        sys.exit(0)

    target_book = int(args[0]) if args and args[0].isdigit() else None
    books_to_run = [b for b in BOOKS if target_book is None or b[0] == target_book]
    verbose      = target_book is not None

    print('\n' + '='*65)
    print('MASNAVI ALIGNMENT DIAGNOSTIC')
    print('='*65)

    all_results       = {}
    total_drift_pages = 0

    for book_num, title in books_to_run:
        print(f"\nBook {book_num} — {title}")
        print('-' * 40)
        drift_pages, net_drift = diagnose_book(book_num, verbose=verbose)
        total_drift_pages += len(drift_pages)
        all_results[book_num] = {
            'drift_pages': drift_pages,
            'net_drift':   net_drift,
        }

        if not verbose:
            if drift_pages:
                pages_list = ', '.join(str(d['page']) for d in drift_pages[:12])
                more       = f' +{len(drift_pages)-12} more' if len(drift_pages) > 12 else ''
                print(f"  {len(drift_pages)} drift pages  |  net drift: {net_drift:+d}")
                print(f"  pages: {pages_list}{more}")
            else:
                print('  ✓ Perfect alignment — no drift pages')

    print(f"\n{'='*65}")
    print(f"TOTAL drift pages across all books: {total_drift_pages}")

    out = '/home/user/hello-world/data/alignment_diag.json'
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2)
    print(f"Full results saved → {out}")
