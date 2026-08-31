import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'

# Piano: semitone from C4 → note name
PIANO = {
    0:'دو(C4)', 1:'دو#(Cs4)', 2:'ر(D4)', 3:'میبمل(Ds4)', 4:'می(E4)',
    5:'فا(F4)', 6:'فا#(Fs4)', 7:'سل(G4)', 8:'لابمل(Gs4)', 9:'لا(A4)',
    10:'سیبمل(As4)', 11:'سی(B4)', 12:'دو(C5)', 13:'دو#(Cs5)', 14:'ر(D5)',
    15:'میبمل(Ds5)', 16:'می(E5)', 17:'فا(F5)', 18:'فا#(Fs5)', 19:'سل(G5)',
    20:'لابمل(Gs5)', 21:'لا(A5)', 22:'سیبمل(As5)',
}

FILES = {
    'ajam.html':    {'tonic':10, 'scale_name':'AJAM_SCALE',     'root':'Bb'},
    'nahawand.html':{'tonic':0,  'scale_name':'NAHAWAND_SCALE', 'root':'C'},
    'nikriz.html':  {'tonic':0,  'scale_name':'NIKRIZ_SCALE',   'root':'C'},
    'rast.html':    {'tonic':0,  'scale_name':'RAST_SCALE',     'root':'C'},
    'segah.html':   {'tonic':3,  'scale_name':'SIKAH_SCALE',    'root':'Eb'},
}

# Base frequency C4 = 261.626 Hz
C4 = 261.626

def semi_to_note(semi):
    return PIANO.get(int(semi) if semi == int(semi) else -1, f'QT({semi})')

def freq_to_semi(freq):
    import math
    return round(math.log2(freq / C4) * 12, 2)

for fname, info in FILES.items():
    fpath = os.path.join(base, fname)
    with open(fpath, encoding='utf-8') as f:
        src = f.read()

    tonic = info['tonic']
    print(f'\n{"="*60}')
    print(f'{fname}  (tonic={PIANO[tonic]}, root={info["root"]})')
    print(f'{"="*60}')

    # Extract NOTE_FREQ_D4
    freq_match = re.search(r'NOTE_FREQ_D4\s*=\s*([\d.]+)', src)
    if freq_match:
        note_freq = float(freq_match.group(1))
        actual_semi = freq_to_semi(note_freq)
        print(f'  NOTE_FREQ_D4 = {note_freq} Hz → semitone {actual_semi:.1f} from C4 → {semi_to_note(actual_semi)}')
        match = '✅' if abs(actual_semi - tonic) < 0.1 else f'❌ باید {tonic} باشد (tonic={PIANO[tonic]})'
        print(f'  tonic check: {match}')
    else:
        print('  NOTE_FREQ_D4: not found')

    # Extract COMBOS array — find offsets used
    combos = re.findall(r'name\s*:\s*[\'"]([^\'"]+)[\'"][\s\S]*?offsets\s*:\s*\[([^\]]+)\]', src)
    if not combos:
        # Try alternate pattern
        combos = re.findall(r'[\'"]name[\'"]\s*:\s*[\'"]([^\'"]+)[\'"][\s\S]{0,200}?offsets\s*:\s*\[([^\]]+)\]', src)

    if combos:
        print(f'\n  مقامهای ترکیبی:')
        for cname, coffsets_str in combos[:10]:
            offsets = [float(x.strip()) for x in coffsets_str.split(',')]
            notes = []
            for o in offsets:
                abs_semi = tonic + o
                notes.append(semi_to_note(abs_semi))
            print(f'  [{cname}]: offsets={offsets}')
            print(f'    نتها: {notes}')
    else:
        print('  (combo pattern not found — checking alternate)')
        # Show lines with 'offsets'
        lines = src.split('\n')
        for i, l in enumerate(lines):
            if 'offsets' in l and '[' in l:
                print(f'    L{i+1}: {l.strip()[:80]}')
