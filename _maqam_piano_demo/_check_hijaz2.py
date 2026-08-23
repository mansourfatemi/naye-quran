import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
fname = 'index.html'
path = os.path.join(base, fname)
with open(path, encoding='utf-8') as f:
    lines = f.readlines()

# Find WHITE_KEYS and BLACK_KEYS blocks
for i, l in enumerate(lines):
    if re.search(r'WHITE_KEYS|BLACK_KEYS|CHROM_NAMES|NOTE_FREQ', l):
        print(f'L{i+1}: {l.rstrip()}')
