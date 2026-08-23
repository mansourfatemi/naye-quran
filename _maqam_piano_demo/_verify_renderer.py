import re, os

files = ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html']
base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'

for f in files:
    path = os.path.join(base, f)
    with open(path, encoding='utf-8') as fh:
        lines = fh.readlines()
    print(f'=== {f} ===')
    for i, l in enumerate(lines):
        if 'leftPx' in l or 'doubleW' in l:
            print(f'  L{i+1}: {l.rstrip()}')
    print()
