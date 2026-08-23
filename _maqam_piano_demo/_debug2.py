import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
fname = 'ajam.html'
path = os.path.join(base, fname)
with open(path, encoding='utf-8') as f:
    src = f.read()

# Extract AJAM_SCALE offsets and labels
scale_m = re.search(r'const AJAM_SCALE\s*=\s*\[([\s\S]*?)\];', src)
print('AJAM_SCALE entries:')
entries = re.findall(r'\{deg:(\d+),\s*offset:([\d.]+),\s*label:\'([^\']+)\'', scale_m.group(1))
for deg, off, lbl in entries:
    print(f'  deg={deg} offset={off} label={lbl}')

# Extract WHITE_KEYS
wk_m = re.search(r'const WHITE_KEYS\s*=\s*\[([\s\S]*?)\];', src)
print('\nWHITE_KEYS offsets:')
wk_offsets = re.findall(r'offset:(\d+(?:\.\d+)?)', wk_m.group(1))
print(' ', wk_offsets)

# Check: which WHITE_KEYS offsets are in AJAM_SCALE?
scale_offsets = [off for _, off, _ in entries]
print('\nMatch check:')
for wo in wk_offsets:
    match = wo in scale_offsets
    print(f'  WHITE offset={wo} → in AJAM_SCALE? {match}')
