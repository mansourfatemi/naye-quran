import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
fname = 'index.html'
path = os.path.join(base, fname)
with open(path, encoding='utf-8') as f:
    src = f.read()

wk = re.search(r'const WHITE_KEYS\s*=\s*\[([\s\S]*?)\];', src)
bk = re.search(r'const BLACK_KEYS\s*=\s*\[([\s\S]*?)\];', src)
cn = re.search(r'const CHROM_NAMES\s*=\s*\[([^\]]+)\]', src)
freq = re.search(r'NOTE_FREQ_D4\s*=\s*([\d.]+)', src)

print(f'Root freq: {freq.group(1) if freq else "?"}')
print(f'CHROM_NAMES: {cn.group(1) if cn else "?"}')
print()
print('WHITE_KEYS:')
for o, l in re.findall(r"offset:(\d+)[^}]*label:'([^']+)'", wk.group(1)):
    print(f'  offset={o}  label={l}')
print()
print('BLACK_KEYS:')
for o, l in re.findall(r"offset:(\d+)[^}]*label:'([^']+)'", bk.group(1)):
    print(f'  offset={o}  label={l}')
