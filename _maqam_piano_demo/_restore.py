import os, shutil

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
files = ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html']

for f in files:
    bak = os.path.join(base, f + '.bak_keysfix_20260813')
    dst = os.path.join(base, f)
    if os.path.exists(bak):
        shutil.copy2(bak, dst)
        size = os.path.getsize(dst)
        print(f'Restored: {f}  ({size} bytes)')
    else:
        print(f'NO BACKUP: {f}')
