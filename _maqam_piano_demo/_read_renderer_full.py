import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
# Read the full piano rendering section from rast.html to understand the structure
fname = 'rast.html'
path = os.path.join(base, fname)
with open(path, encoding='utf-8') as f:
    lines = f.readlines()

# Find WHITE_KEYS.forEach and BLACK_KEYS.forEach blocks
for i, l in enumerate(lines):
    if 'WHITE_KEYS.forEach' in l or 'BLACK_KEYS.forEach' in l or 'piano.appendChild' in l or 'WKEY_W' in l and 'const' not in l:
        start = max(0, i-1)
        end = min(len(lines), i+15)
        print(f'--- L{i+1} ---')
        for j in range(start, end):
            print(f'  {j+1}: {lines[j]}', end='')
        print()
