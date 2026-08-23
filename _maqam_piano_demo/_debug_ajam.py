import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
fname = 'ajam.html'
path = os.path.join(base, fname)
with open(path, encoding='utf-8') as f:
    lines = f.readlines()

# Show WHITE_KEYS, BLACK_KEYS, renderer, and findScaleNote
targets = ['WHITE_KEYS', 'BLACK_KEYS', 'findScaleNote', 'style.left', 'style.width', 'widthPx', 'leftPx']
for i, l in enumerate(lines):
    for t in targets:
        if t in l:
            print(f'L{i+1}: {l.rstrip()}')
            break
