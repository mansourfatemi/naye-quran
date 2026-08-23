import re, os

files = ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html']
base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'

for f in files:
    path = os.path.join(base, f)
    with open(path, encoding='utf-8') as fh:
        lines = fh.readlines()
    print(f'=== {f} ===')
    in_block = False
    for i, l in enumerate(lines):
        if re.search(r'const (WHITE_KEYS|BLACK_KEYS)\s*=', l):
            in_block = True
        if in_block:
            print(f'  {i+1}: {l}', end='')
        if in_block and '];' in l:
            in_block = False
            print()
    # Also check leftPx renderer patch
    for i, l in enumerate(lines):
        if 'leftPx' in l and 'bEl.style' in l:
            print(f'  Renderer L{i+1}: {l.strip()}')
        if 'doubleW' in l and 'bEl.style' in l:
            print(f'  DoubleW L{i+1}: {l.strip()}')
    print()
