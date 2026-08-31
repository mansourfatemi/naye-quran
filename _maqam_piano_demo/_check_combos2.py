import os, re, math

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'

PIANO = {
    0:'دو', 1:'دو#', 2:'ر', 3:'میبمل', 4:'می',
    5:'فا', 6:'فا#', 7:'سل', 8:'لابمل', 9:'لا',
    10:'سیبمل', 11:'سی', 12:'دو', 13:'دو#', 14:'ر',
    15:'میبمل', 16:'می', 17:'فا', 18:'فا#', 19:'سل',
    20:'لابمل', 21:'لا', 22:'سیبمل',
}

C4_FREQ = 261.626

FILES = {
    'ajam.html':    10,
    'nahawand.html':0,
    'nikriz.html':  0,
    'rast.html':    0,
    'segah.html':   3,
}

def note(semi):
    if semi != int(semi):
        lo = PIANO.get(int(semi),'?')
        hi = PIANO.get(int(semi)+1,'?')
        return f'1⁄4({lo}~{hi})'
    return PIANO.get(int(semi), f'?{semi}')

def freq_for_offset(tonic_semi, offset):
    return C4_FREQ * (2 ** ((tonic_semi + offset) / 12))

for fname, tonic in FILES.items():
    fpath = os.path.join(base, fname)
    with open(fpath, encoding='utf-8') as f:
        src = f.read()

    print(f'\n{"="*60}')
    print(f'{fname}  (تونیک: {PIANO[tonic]} = {tonic} نیمپرده از C4)')
    print(f'{"="*60}')

    # Find all *_OFFSETS = [...]
    offset_arrays = re.findall(r'const\s+(\w+_OFFSETS)\s*=\s*\[([^\]]+)\]', src)
    # Find all combo names
    combo_names = re.findall(r'name\s*:\s*[\'"]([^\'"]{3,})[\'"]', src)

    # Find freqFromOffset function to understand freq calculation
    freq_fn = re.search(r'function freqFromOffset\(([^)]+)\)\s*\{([^}]+)\}', src)
    if freq_fn:
        print(f'  freqFromOffset: {freq_fn.group(2).strip()}')

    # Find NOTE_FREQ_D4
    nf = re.search(r'NOTE_FREQ_D4\s*=\s*([\d.]+)', src)
    if nf:
        nf_val = float(nf.group(1))
        actual_tonic = round(math.log2(nf_val / C4_FREQ) * 12, 1)
        print(f'  NOTE_FREQ_D4={nf_val}Hz → نت {PIANO.get(int(actual_tonic),"?")} ({actual_tonic} نیمپرده از C4)')
        ok = '✅' if abs(actual_tonic - tonic) < 0.1 else f'❌ باید {tonic} باشد!'
        print(f'  تونیک: {ok}')

    if offset_arrays:
        print(f'\n  آرایههای offset:')
        for arr_name, arr_str in offset_arrays:
            offsets = [float(x.strip()) for x in arr_str.split(',')]
            notes_str = '  '.join([note(tonic + o) for o in offsets])
            intervals = [round(offsets[i+1]-offsets[i], 2) for i in range(len(offsets)-1)]
            print(f'  {arr_name}: {offsets}')
            print(f'    نتها: {notes_str}')
            print(f'    فواصل: {intervals}')

            # Validation: last offset should be 12
            last_ok = '✅' if offsets[-1] == 12 else f'❌ آخر={offsets[-1]}'
            first_ok = '✅' if offsets[0] == 0 else f'❌ اول={offsets[0]}'
            print(f'    شروع از صفر: {first_ok}  پایان در ۱۲: {last_ok}')
            print()
