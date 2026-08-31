import re
from datetime import datetime

# Bump SW cache version to force fresh install on all devices
with open(r'C:\Users\sayefate\Desktop\naye-quran-pwa\sw.js', 'r', encoding='utf-8') as f:
    sw = f.read()

now = datetime.now().strftime('%Y%m%d%H%M%S')
new_cache = f"const CACHE='mt-mq-v{now}';"
sw = re.sub(r"const CACHE='mt-mq-v\d+';" , new_cache, sw, count=1)

with open(r'C:\Users\sayefate\Desktop\naye-quran-pwa\sw.js', 'w', encoding='utf-8') as f:
    f.write(sw)

print(f"SW cache bumped to: mt-mq-v{now}")

# Verify install banner is in index.html
with open(r'C:\Users\sayefate\Desktop\naye-quran-pwa\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

checks = ['pwa-install-banner', 'beforeinstallprompt', 'triggerInstall']
for c in checks:
    print(f"  {'OK' if c in html else 'MISSING'}: {c}")
