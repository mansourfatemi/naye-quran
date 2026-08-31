import os

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
path = os.path.join(base, 'index.html')
with open(path, encoding='utf-8') as f:
    lines = f.readlines()

# Print lines 186-230 (WHITE_KEYS, BLACK_KEYS, NOTE_FREQ)
for i in range(185, 230):
    print(f'L{i+1}: {lines[i].rstrip()}')
