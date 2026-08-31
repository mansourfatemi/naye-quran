import os, re, math

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
C4 = 261.626

PIANO = {
    0:'C4/دو', 1:'Cs4/دو#', 2:'D4/ر', 3:'Ds4/میبمل', 4:'E4/می',
    5:'F4/فا', 6:'Fs4/فا#', 7:'G4/سل', 8:'Gs4/لابمل', 9:'A4/لا',
    10:'As4/سیبمل', 11:'B4/سی', 12:'C5/دو', 13:'Cs5/دو#', 14:'D5/ر',
    15:'Ds5/میبمل', 16:'E5/می', 17:'F5/فا', 18:'Fs5/فا#', 19:'G5/سل',
    20:'Gs5/لابمل', 21:'A5/لا', 22:'As5/سیبمل',
}

# Expected piano range per file: tonic_semi → tonic_semi+12
RANGES = {
    'ajam.html':    (10, 22),   # As4 → As5
    'nahawand.html':(0,  12),   # C4  → C5
    'nikriz.html':  (0,  12),
    'rast.html':    (0,  12),
    'segah.html':   (3,  15),   # Ds4 → Ds5
}

all_ok = True
for fname, (range_lo, range_hi) in RANGES.items():
    fpath = os.path.join(base, fname)
    with open(fpath, encoding='utf-8') as f:
        src = f.read()

    # Read actual tonic freq from file
    freq_match = re.search(r'NOTE_FREQ_\w+\s*=\s*([\d.]+)', src)
    tonic_freq = float(freq_match.group(1)) if freq_match else 261.626
    tonic_semi_actual = round(math.log2(tonic_freq / C4) * 12, 1)

    print(f'\n{"="*55}')
    print(f'{fname}  تونیک={tonic_freq}Hz (semi={tonic_semi_actual}) محدوده:{range_lo}→{range_hi}')
    print(f'{"="*55}')

    offset_arrays = re.findall(r'const\s+(\w+_OFFSETS)\s*=\s*\[([^\]]+)\]', src)
    combo_names   = re.findall(r"name\s*:\s*'([^']{3,})'", src)

    for idx, (arr_name, arr_str) in enumerate(offset_arrays):
        offsets = [float(x.strip()) for x in arr_str.split(',')]
        cname = combo_names[idx] if idx < len(combo_names) else '?'
        print(f'\n  {arr_name} [{cname}]:')
        file_ok = True
        for o in offsets:
            freq = tonic_freq * (2 ** (o/12))
            semi = round(math.log2(freq/C4)*12, 2)
            semi_int = round(semi)
            is_quarter = abs(semi - semi_int) > 0.1
            in_range = range_lo <= semi_int <= range_hi

            if is_quarter:
                lo_note = PIANO.get(int(semi), '?')
                hi_note = PIANO.get(int(semi)+1, '?')
                print(f'    off={o:5.1f} → 1⁄4پرده ({lo_note}~{hi_note}) ✅')
            else:
                note = PIANO.get(semi_int, f'?({semi_int})')
                status = '✅' if in_range else '❌'
                if not in_range:
                    file_ok = False
                    all_ok = False
                print(f'    off={o:5.1f} → semi={semi_int} → {note} {status}')
        if file_ok:
            print(f'  → همه کلیدها در محدوده پیانو ✅')

print(f'\n{"="*55}')
print(f'نتیجه کلی: {"✅ همه درست" if all_ok else "❌ مشکلاتی وجود دارد"}')
