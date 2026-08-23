import re, os, json

files = [
    ('ajam.html',    169, 200),
    ('nahawand.html',171, 205),
    ('nikriz.html',  163, 197),
    ('rast.html',    173, 210),
    ('segah.html',   172, 210),
]
base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'

for fname, start, end in files:
    path = os.path.join(base, fname)
    with open(path, encoding='utf-8') as fh:
        lines = fh.readlines()
    print(f'=== {fname} L{start}-L{end} ===')
    for i in range(start-1, min(end, len(lines))):
        print(f'  {i+1}: {lines[i]}', end='')
    print('\n')
