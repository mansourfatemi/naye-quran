import os, re
path = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\MadreseTelavat_Android\app\build.gradle'
with open(path, encoding='utf-8') as f:
    src = f.read()
vc = re.search(r'versionCode\s+(\d+)', src)
vn = re.search(r'versionName\s+"([^"]+)"', src)
print(f'versionCode: {vc.group(1)}')
print(f'versionName: {vn.group(1)}')
