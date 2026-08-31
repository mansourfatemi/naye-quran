import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
files = ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html']

for fname in files:
    path = os.path.join(base, fname)
    with open(path, encoding='utf-8') as f:
        src = f.read()
    wk = re.search(r'const WHITE_KEYS\s*=\s*\[([\s\S]*?)\];', src)
    bk = re.search(r'const BLACK_KEYS\s*=\s*\[([\s\S]*?)\];', src)
    cn = re.search(r'const CHROM_NAMES\s*=\s*\[([^\]]+)\]', src)
    print(f'=== {fname} ===')
    print(f'  CHROM_NAMES: {cn.group(1)[:80] if cn else "?"}')
    print(f'  WHITE: {re.findall(r"offset:(\d+)[^}]*label:\'([^\']+)\'", wk.group(1))}')
    print(f'  BLACK: {re.findall(r"offset:(\d+)[^}]*label:\'([^\']+)\'", bk.group(1))}')
    print()
