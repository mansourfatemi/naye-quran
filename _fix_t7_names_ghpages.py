# -*- coding: utf-8 -*-
import shutil, datetime, os

path = r"C:\Users\sayefate\Desktop\naye-quran-pwa\index.html"
backup = path + ".bak_t7namesfix_" + datetime.datetime.now().strftime("%Y%m%d%H%M%S")
shutil.copy2(path, backup)

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

tr20 = "او خدایی است که معبودی جز او نیست؛ دانای آشکار و نهان است، و او رحمان و رحیم است! او خداست"
tr38 = "او خداوند خالق، آفرینندهای بیسابقه، و صورتگر (بینظیر) است"

fixes = {
    19: "او خداست",
    20: tr20,
    21: "معبودی جز او نیست",
    22: "معبودی جز او نیست",
    23: tr20,
    24: "او خدایی است که معبودی جز او نیست",
    25: "معبودی جز او نیست",
    26: "معبودی جز او نیست",
    27: "معبودی جز او نیست؛ دانای آشکار و نهان است، و او رحمان و رحیم است! او خدایی است که معبودی جز او نیست؛ فرمانروای حقیقی است",
    28: "پاک و منزّه است",
    29: "سلامتبخش است",
    30: "امنیتبخش است",
    31: "مراقب و نگهبان همه چیز است",
    32: "شکستناپذیر است",
    33: "قدرتمند است",
    34: "او خدایی است که معبودی جز او نیست؛ فرمانروای حقیقی، پاک و منزّه، سلامتبخش، امنیتبخش، مراقب و نگهبان همه چیز، شکستناپذیر، قدرتمند، و شایسته بزرگی و عظمت است",
    35: "خداوند منزّه است از آنچه (به او) شریک قرار میدهند!",
    37: "او خداوند خالق و آفرینندهای بیسابقه است",
    38: tr38,
    40: tr38,
    41: "برای او نامهای نیک است",
    42: "آنچه در آسمانها و زمین است، تسبیح او میگویند",
    43: "و او عزیز و حکیم است",
}

applied = []
missing = []

for num, new_tr in fixes.items():
    marker = f'audio_t7/{num}.mp3'
    idx = content.find(marker)
    if idx == -1:
        missing.append(num)
        continue
    obj_marker = "{n:" + str(num) + ","
    obj_start = content.rfind(obj_marker, 0, idx)
    if obj_start == -1:
        missing.append(num)
        continue
    obj_end = content.find("},", idx)
    old_block = content[obj_start:obj_end+1]
    tr_start = old_block.find('tr:"') + 4
    tr_end = old_block.find('",m:')
    if tr_start < 4 or tr_end == -1:
        missing.append(num)
        continue
    old_tr = old_block[tr_start:tr_end]
    new_block = old_block[:tr_start] + new_tr + old_block[tr_end:]
    content = content[:obj_start] + new_block + content[obj_end+1:]
    applied.append((num, old_tr[:40], new_tr[:40]))

print("Applied:", len(applied))
if missing:
    print("MISSING:", missing)
for n, old, new in applied:
    print(f"[{n}] OLD: {old} -> NEW: {new}")

tmp = path + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    f.write(content)
with open(tmp, "r", encoding="utf-8") as f:
    check = f.read()
os.replace(tmp, path)
print("\nBACKUP:", backup)
print("DONE")
