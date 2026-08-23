import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
files = [
    ('ajam.html',     'AJAM_SCALE'),
    ('nahawand.html', 'NAHAWAND_SCALE'),
    ('nikriz.html',   'NIKRIZ_SCALE'),
    ('rast.html',     'RAST_SCALE'),
    ('segah.html',    'SIKAH_SCALE'),
]

for fname, sname in files:
    path = os.path.join(base, fname)
    with open(path, encoding='utf-8') as fh:
        lines = fh.readlines()
    in_block = False
    print(f'=== {fname} — {sname} ===')
    for i, l in enumerate(lines):
        if f'const {sname}' in l:
            in_block = True
        if in_block:
            print(f'  {i+1}: {l}', end='')
        if in_block and '];' in l:
            in_block = False
    print()
