import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
fname = 'rast.html'
path = os.path.join(base, fname)
with open(path, encoding='utf-8') as f:
    lines = f.readlines()

# Find CSS block (between <style> and </style>)
in_style = False
for i, l in enumerate(lines):
    if '<style>' in l:
        in_style = True
    if in_style:
        print(f'{i+1}: {l}', end='')
    if '</style>' in l and in_style:
        in_style = False
        break
