import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'

# Fix SCALE array labels for enharmonic corrections
# Nahawand: deg3 offset3 ر# → میبمل, deg6 offset8 سل# → لابمل
# Nikriz:   deg3 offset3 ر# → میبمل, deg7 offset10 لا# → سیبمل

fixes = {
    'nahawand.html': [
        # In NAHAWAND_SCALE, deg3 offset:3
        (r"(\{deg:3,\s*offset:3,\s*label:')(ر#)(')",                         'میبمل'),
        # In NAHAWAND_SCALE, deg6 offset:8
        (r"(\{deg:6,\s*offset:8,\s*label:')(سل#)(')",                        'لابمل'),
    ],
    'nikriz.html': [
        # In NIKRIZ_SCALE, deg3 offset:3
        (r"(\{deg:3,\s*offset:3,\s*label:')(ر#)(')",                         'میبمل'),
        # In NIKRIZ_SCALE, deg7 offset:10
        (r"(\{deg:7,\s*offset:10,\s*label:')(لا#)(')",                       'سیبمل'),
    ],
}

for fname, flist in fixes.items():
    fpath = os.path.join(base, fname)
    with open(fpath, encoding='utf-8') as f:
        src = f.read()
    
    changed = False
    for pattern, replacement in flist:
        new_src, n = re.subn(pattern, lambda m, r=replacement: m.group(1) + r + m.group(3), src)
        if n > 0:
            print(f'  {fname}: replaced {n}x pattern → {replacement}')
            src = new_src
            changed = True
        else:
            # Try to find the actual text for debugging
            # Look for deg:3 or deg:7 lines
            deg_num = re.search(r'deg:(\d+)', pattern).group(1)
            offset_num = re.search(r'offset:(\d+)', pattern).group(1)
            lines = src.split('\n')
            for i, l in enumerate(lines):
                if f'deg:{deg_num},' in l and f'offset:{offset_num},' in l:
                    print(f'  {fname}: DEBUG deg{deg_num} off{offset_num} → line: {l.strip()}')
            print(f'  {fname}: NO MATCH for deg{deg_num} offset{offset_num}')
    
    if changed:
        tmp = fpath + '.tmp_enh2'
        with open(tmp, 'w', encoding='utf-8') as f:
            f.write(src)
        with open(tmp, encoding='utf-8') as f:
            verify = f.read()
        if verify == src:
            os.replace(tmp, fpath)
            print(f'  ✓ {fname} saved')
        else:
            print(f'  ERROR: round-trip failed for {fname}')
            os.unlink(tmp)

print('Done.')
