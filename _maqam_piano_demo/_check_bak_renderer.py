import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
path = os.path.join(base, 'ajam.html.bak_keysfix_20260813')
with open(path, encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'WHITE_KEYS.forEach' in l or 'BLACK_KEYS.forEach' in l or 'piano.appendChild' in l or 'container.appendChild' in l:
        print(f'L{i+1}: {l.rstrip()}')
