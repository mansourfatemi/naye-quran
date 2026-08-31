import os, re, math

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
C4 = 261.626

FILES = {
    'ajam.html':    {'tonic_semi':10, 'tonic_freq':233.082, 'tonic_name':'Bb3'},
    'nahawand.html':{'tonic_semi':0,  'tonic_freq':261.626, 'tonic_name':'C4'},
    'nikriz.html':  {'tonic_semi':0,  'tonic_freq':261.626, 'tonic_name':'C4'},
    'rast.html':    {'tonic_semi':0,  'tonic_freq':261.626, 'tonic_name':'C4'},
    'segah.html':   {'tonic_semi':3,  'tonic_freq':311.127, 'tonic_name':'Eb4'},
}

PIANO = {
    0:'C4/دو', 1:'Cs4/دو#', 2:'D4/ر', 3:'Ds4/میبمل', 4:'E4/می',
    5:'F4/فا', 6:'Fs4/فا#', 7:'G4/سل', 8:'Gs4/لابمل', 9:'A4/لا',
    10:'As4/سیبمل', 11:'B4/سی', 12:'C5/دو',
    13:'Cs5/دو#', 14:'D5/ر', 15:'Ds5/میبمل', 16:'E5/می',
    17:'F5/فا', 18:'Fs5/فا#', 19:'G5/سل', 20:'Gs5/لابمل',
    21:'A5/لا', 22:'As5/سیبمل',
}

for fname, info in FILES.items():
    fpath = os.path.join(base, fname)
    with open(fpath, encoding='utf-8') as f:
        src = f.read()

    tonic_semi = info['tonic_semi']
    tonic_freq = info['tonic_freq']

    print(f'\n{"="*60}')
    print(f'{fname}')

    # For each combo offset array, check what piano keys it maps to
    offset_arrays = re.findall(r'const\s+(\w+_OFFSETS)\s*=\s*\[([^\]]+)\]', src)

    for arr_name, arr_str in offset_arrays:
        offsets = [float(x.strip()) for x in arr_str.split(',')]
        print(f'\n  {arr_name}: {offsets}')

        for o in offsets:
            # Freq calculated by combo system: tonic_freq * 2^(o/12)
            combo_freq = tonic_freq * (2 ** (o/12))
            # Semitone from C4
            semi_from_c4 = round(math.log2(combo_freq / C4) * 12, 2)
            # What piano key does this land on?
            semi_int = round(semi_from_c4)
            piano_key = PIANO.get(semi_int, f'?({semi_int})')
            is_quarter = abs(semi_from_c4 - semi_int) > 0.1

            if is_quarter:
                lo = PIANO.get(int(semi_from_c4), '?')
                hi = PIANO.get(int(semi_from_c4)+1, '?')
                print(f'    offset={o:5.1f} → {combo_freq:.1f}Hz → semi={semi_from_c4:.1f} → 1⁄4پرده بین {lo} و {hi}')
            else:
                # Is this key in our piano range (tonic_semi to tonic_semi+12)?
                in_range = tonic_semi <= semi_int <= tonic_semi + 12
                range_ok = '✅' if in_range else f'❌ خارج از محدوده پیانو ({tonic_semi}→{tonic_semi+12})'
                print(f'    offset={o:5.1f} → {combo_freq:.1f}Hz → semi={semi_int} → {piano_key} {range_ok}')
