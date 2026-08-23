import os, re, math

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'
C4 = 261.626

# Expected tonic frequencies
EXPECTED = {
    'ajam.html':    ('Bb3', 233.082, 10-12),  # Bb3 = C4 * 2^(-2/12) ... wait
    'nahawand.html':('C4',  261.626, 0),
    'nikriz.html':  ('C4',  261.626, 0),
    'rast.html':    ('C4',  261.626, 0),
    'segah.html':   ('Eb4', 311.127, 3),
}
# Actually Bb3 = 233.082 Hz, Eb4 = 311.127 Hz
# C4 = 261.626, Bb3 = C4 * 2^(-2/12) = 261.626 * 0.8909 = 233.08
# Eb4 = C4 * 2^(3/12) = 261.626 * 1.1892 = 311.13

for fname, (note_name, expected_freq, semi_from_c4) in EXPECTED.items():
    fpath = os.path.join(base, fname)
    with open(fpath, encoding='utf-8') as f:
        src = f.read()

    # Find all NOTE_FREQ_* constants
    freqs = re.findall(r'(NOTE_FREQ_\w+)\s*=\s*([\d.]+)', src)
    print(f'\n=== {fname} ===')
    print(f'  Expected tonic: {note_name} = {expected_freq} Hz (semi {semi_from_c4} from C4)')
    for fname_const, fval in freqs:
        actual_semi = round(math.log2(float(fval) / C4) * 12, 2)
        ok = '✅' if abs(float(fval) - expected_freq) < 1.0 else '❌'
        print(f'  {fname_const} = {fval} Hz → {actual_semi} semitones from C4  {ok}')

    # Also check combo playback: does it use correct base freq?
    combo_play = re.findall(r'NOTE_FREQ_\w+\s*\*\s*Math\.pow\(2,\s*(\w+)/12\)', src)
    if combo_play:
        print(f'  Combo freq formula: NOTE_FREQ_* * 2^({combo_play[0]}/12)')
