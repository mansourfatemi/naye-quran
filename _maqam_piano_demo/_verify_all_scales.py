
# بررسی دقیق فواصل هر مقام روی پیانو

PIANO = {
    # نوع کلید: W=سفید، B=سیاه
    0:('C4','دو','W'),    1:('Cs4','دو#','B'),
    2:('D4','ر','W'),     3:('Ds4','میبمل','B'),
    4:('E4','می','W'),    5:('F4','فا','W'),
    6:('Fs4','فا#','B'),  7:('G4','سل','W'),
    8:('Gs4','لابمل','B'),9:('A4','لا','W'),
    10:('As4','سیبمل','B'),11:('B4','سی','W'),
    12:('C5','دو','W'),   13:('Cs5','دو#','B'),
    14:('D5','ر','W'),    15:('Ds5','میبمل','B'),
    16:('E5','می','W'),   17:('F5','فا','W'),
    18:('Fs5','فا#','B'), 19:('G5','سل','W'),
    20:('Gs5','لابمل','B'),21:('A5','لا','W'),
    22:('As5','سیبمل','B'),
}

SCALES = {
    'عجم (Bb)':    (10, [2,2,1,2,2,2,1]),
    'نهاوند (C)':  (0,  [2,1,2,2,1,3,1]),
    'نکریز (C)':   (0,  [2,1,3,1,2,1,2]),
    'راست (C)':    (0,  [2,1.5,1.5,2,2,1.5,1.5]),
    'سهگاه (Eb)':  (3,  [1.5,2,2,1.5,1.5,2,1.5]),
}

INTERVAL_NAMES = {1:'1⁄2 پرده', 1.5:'3⁄4 پرده', 2:'۱ پرده', 3:'۱1⁄2 پرده'}

for mname, (tonic, ivs) in SCALES.items():
    print(f'\n{"="*55}')
    print(f'مقام {mname}')
    print(f'{"="*55}')
    
    pos = tonic
    all_ok = True
    for i, iv in enumerate(ivs):
        deg = i + 1
        note = PIANO.get(int(pos) if pos==int(pos) else -1)
        if not note:
            note = ('QT', f'ربعپرده', 'Q')
        
        iv_name = INTERVAL_NAMES.get(iv, str(iv))
        key_sym = '⬜' if note[2]=='W' else ('⬛' if note[2]=='B' else '◯')
        print(f'  درجه {deg}: {note[1]:10} {key_sym}  →  فاصله {iv_name}')
        pos += iv
    
    # درجه ۸
    note8 = PIANO.get(int(pos) if pos==int(pos) else -1, ('?','?','?'))
    key_sym = '⬜' if note8[2]=='W' else '⬛'
    print(f'  درجه ۸: {note8[1]:10} {key_sym}  (اکتاو)')
    
    # بررسی: آیا badgeهای screenshot با این جدول تطابق دارند؟
    print(f'\n  خلاصه:')
    pos2 = tonic
    for i, iv in enumerate(ivs):
        pos2 += iv
    print(f'  تونیک: {PIANO.get(tonic,("?","?","?"))[1]}  →  اکتاو: {PIANO.get(int(pos2),("?","?","?"))[1]}')

print('\n\nبررسی screenshot عجم:')
print('badge ۱ روی سیبمل (As4) ⬛ ✅')
print('badge ۲ روی دو (C5) ⬜ ✅') 
print('badge ۳ روی ر (D5) ⬜ ✅')
print('badge ۴ روی میبمل (Ds5) ⬛ ✅')
print('badge ۵ روی فا (F5) ⬜ ✅')
print('badge ۶ روی سل (G5) ⬜ ✅')
print('badge ۷ روی لا (A5) ⬜ ✅')
print('badge ۸ روی سیبمل (As5) ⬛ ✅')
print()
print('فواصل عجم از Bb:')
pos = 10
ivs = [2,2,1,2,2,2,1]
for i, iv in enumerate(ivs):
    n1 = PIANO[pos][1]
    n2_pos = pos + iv
    n2 = PIANO.get(int(n2_pos) if n2_pos==int(n2_pos) else -1, ('?','QT'))[1]
    print(f'  {n1} → {n2}: {INTERVAL_NAMES[iv]}  {"✅" if iv in [1,2] else "⚠️"}')
    pos += iv
