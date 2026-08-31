import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
files = ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html']

# Maqam scale definitions (true offsets including quarter-tones)
TRUE_SCALES = {
    'ajam.html':    [0,2,4,5,7,9,11,12],
    'nahawand.html':[0,2,3,5,7,8,11,12],
    'nikriz.html':  [0,2,3,6,7,9,10,12],
    'rast.html':    [0,2,3.5,5,7,9,10.5,12],
    'segah.html':   [0,1.5,3.5,5.5,7,8.5,10.5,12],
}

for fname in files:
    path = os.path.join(base, fname)
    with open(path, encoding='utf-8') as f:
        src = f.read()
    
    wk_match = re.search(r'const WHITE_KEYS\s*=\s*\[([\s\S]*?)\];', src)
    bk_match = re.search(r'const BLACK_KEYS\s*=\s*\[([\s\S]*?)\];', src)
    
    wk = re.findall(r'offset:(\d+(?:\.\d+)?),\s*label:\'([^\']+)\'', wk_match.group(1))
    bk = re.findall(r'offset:(\d+(?:\.\d+)?),\s*label:\'([^\']+)\'', bk_match.group(1))
    
    wo = [float(o) for o,_ in wk]
    bo = [float(o) for o,_ in bk]
    wl = [l for _,l in wk]
    bl = [l for _,l in bk]
    
    true_scale = TRUE_SCALES[fname]
    intervals = [true_scale[i+1]-true_scale[i] for i in range(len(true_scale)-1)]
    
    print(f'=== {fname} ===')
    print(f'  TRUE SCALE: {true_scale}')
    print(f'  INTERVALS:  {intervals}  (semitones)')
    print(f'  WHITE keys ({len(wo)}): {list(zip(wo, wl))}')
    print(f'  BLACK keys ({len(bo)}): {list(zip(bo, bl))}')
    
    # Gaps between white keys
    gaps = [(wo[i+1]-wo[i], wo[i], wo[i+1], wl[i], wl[i+1]) for i in range(len(wo)-1)]
    print(f'  WHITE KEY GAPS:')
    for g,a,b,la,lb in gaps:
        fillers = [bl[j] for j,boff in enumerate(bo) if a < boff < b]
        print(f'    [{la}({a}) → {lb}({b})] gap={g}st  fillers={fillers}')
    
    # Check: do white key intervals match scale intervals?
    print(f'  INTERVAL CHECK (scale vs white-key spacing):')
    for i,(g,a,b,la,lb) in enumerate(gaps):
        # Find scale degree for white key 'a'
        if a in true_scale and b in true_scale:
            si = true_scale.index(a)
            sj = true_scale.index(b)
            n_degrees = sj - si
            print(f'    {la}→{lb}: {n_degrees} scale degree(s), {g} semitones gap → {"OK (adjacent)" if n_degrees==1 else f"SKIP {n_degrees-1} degrees"}')
        else:
            print(f'    {la}({a})→{lb}({b}): white key NOT in true scale!')
    print()
