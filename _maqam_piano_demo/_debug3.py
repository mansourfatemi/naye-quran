import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
fname = 'ajam.html'
path = os.path.join(base, fname)
with open(path, encoding='utf-8') as f:
    lines = f.readlines()

# Show wkey CSS and renderer lines in context
for i, l in enumerate(lines):
    if '.wkey' in l or 'widthPx' in l or ("style.left=k" in l and 'width' in l):
        print(f'L{i+1}: {l.rstrip()}')
