import os

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\MadreseTelavat_Android\app\src\main\assets\_maqam_piano_demo'
files = ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html']
for f in files:
    p = os.path.join(base, f)
    if os.path.exists(p):
        mtime = os.path.getmtime(p)
        import datetime
        dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M')
        print(f'✅ {f}  ({dt})')
    else:
        print(f'❌ {f} NOT FOUND')
