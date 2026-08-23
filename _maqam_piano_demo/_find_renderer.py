import os

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
f = 'ajam.html'
path = os.path.join(base, f)
with open(path, encoding='utf-8') as fh:
    lines = fh.readlines()

# Find BLACK_KEYS.forEach blocks
for i, l in enumerate(lines):
    if 'BLACK_KEYS.forEach' in l or 'bEl.style.left' in l or 'afterWhiteIdx' in l:
        # Print context: 5 lines around
        start = max(0, i-1)
        end = min(len(lines), i+6)
        print(f'--- Context around L{i+1} ---')
        for j in range(start, end):
            print(f'  {j+1}: {lines[j]}', end='')
        print()
