import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
files = ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html']

TRUE_SCALES = {
    'ajam.html':    [0,2,4,5,7,9,11,12],
    'nahawand.html':[0,2,3,5,7,8,11,12],
    'nikriz.html':  [0,2,3,6,7,9,10,12],
    'rast.html':    [0,2,3.5,5,7,9,10.5,12],
    'segah.html':   [0,1.5,3.5,5.5,7,8.5,10.5,12],
}

ST_PX = 36
CHROM_KEY_W = 20

all_ok = True
for fname in files:
    path = os.path.join(base, fname)
    with open(path, encoding='utf-8') as f:
        src = f.read()

    wk_m = re.search(r'const WHITE_KEYS\s*=\s*\[([\s\S]*?)\];', src)
    bk_m = re.search(r'const BLACK_KEYS\s*=\s*\[([\s\S]*?)\];', src)
    
    wk_offsets = [float(x) for x in re.findall(r'offset:(\d+(?:\.\d+)?)', wk_m.group(1))]
    bk_offsets = [float(x) for x in re.findall(r'offset:(\d+(?:\.\d+)?)', bk_m.group(1))]
    wk_leftPx  = [int(x) for x in re.findall(r'leftPx:(-?\d+)', wk_m.group(1))]
    bk_leftPx  = [int(x) for x in re.findall(r'leftPx:(-?\d+)', bk_m.group(1))]
    wk_widthPx = [int(x) for x in re.findall(r'widthPx:(\d+)', wk_m.group(1))]
    wk_labels  = re.findall(r"label:'([^']+)'", wk_m.group(1))
    
    true_scale = TRUE_SCALES[fname]
    int_scale = [o for o in true_scale if isinstance(o, int) or o == int(o)]
    
    print(f'=== {fname} ===')
    
    # Check white key offsets match integer scale degrees
    if wk_offsets == int_scale:
        print(f'  ✅ WHITE_KEYS offsets = integer scale degrees')
    else:
        print(f'  ❌ WHITE_KEYS mismatch: got {wk_offsets}, expected {int_scale}')
        all_ok = False
    
    # Check positions are proportional
    pos_ok = all(abs(lp - round(o*ST_PX)) <= 1 for o, lp in zip(wk_offsets, wk_leftPx))
    if pos_ok:
        print(f'  ✅ leftPx values are proportional (×{ST_PX}px/semitone)')
    else:
        for o, lp in zip(wk_offsets, wk_leftPx):
            expected = round(o*ST_PX)
            if abs(lp - expected) > 1:
                print(f'  ❌ leftPx mismatch: offset={o}, got={lp}, expected={expected}')
        all_ok = False
    
    # Check widths match intervals
    print(f'  Scale key widths:')
    for i, (o, w, lbl) in enumerate(zip(wk_offsets, wk_widthPx, wk_labels)):
        next_o = wk_offsets[i+1] if i+1 < len(wk_offsets) else 12
        expected_w = max(24, round((next_o - o) * ST_PX))
        match = '✅' if abs(w - expected_w) <= 2 else '⚠️'
        print(f'    {match} [{lbl}] off={o}, w={w}px (interval={next_o-o}st, expected≈{expected_w}px)')
    
    # Chromatic keys
    all_chrom = [1,2,3,4,5,6,7,8,9,10,11]
    expected_chrom = [o for o in all_chrom if o not in int_scale]
    if bk_offsets == expected_chrom:
        print(f'  ✅ BLACK_KEYS = chromatic fillers')
    else:
        print(f'  ❌ BLACK_KEYS mismatch: got {bk_offsets}, expected {expected_chrom}')
        all_ok = False
    
    # Check renderer patch
    if "el.style.left=k.leftPx+'px'; el.style.width=k.widthPx+'px';" in src:
        print(f'  ✅ WHITE renderer patched (leftPx + widthPx)')
    else:
        print(f'  ❌ WHITE renderer NOT patched')
        all_ok = False
    
    if f"el.style.left=k.leftPx+'px'; el.style.width={CHROM_KEY_W}+'px';" in src:
        print(f'  ✅ CHROM renderer patched (leftPx + {CHROM_KEY_W}px)')
    else:
        print(f'  ❌ CHROM renderer NOT patched')
        all_ok = False
    
    print()

print('═══ OVERALL:', '✅ ALL OK' if all_ok else '❌ ISSUES FOUND', '═══')
