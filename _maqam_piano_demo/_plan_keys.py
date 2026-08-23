
# Piano keys from C4 to C5 (one octave, standard layout)
# White: C D E F G A B C  (دو ر می فا سل لا سی دو)
# Black: C# D# F# G# A#   (دو# ر# فا# سل# لا#)
#
# semitone from C: 0  1   2  3   4  5  6   7  8   9  10  11  12
# name:            C  C#  D  D#  E  F  F#  G  G#  A  A#  B   C
# Persian:         دو دو# ر  ر# می فا فا# سل سل# لا لا# سی  دو

PIANO = {
    0:  ('C',  'دو',    'white'),
    1:  ('Cs', 'دو#',   'black'),
    2:  ('D',  'ر',     'white'),
    3:  ('Ds', 'ر#',    'black'),
    4:  ('E',  'می',    'white'),
    5:  ('F',  'فا',    'white'),
    6:  ('Fs', 'فا#',   'black'),
    7:  ('G',  'سل',    'white'),
    8:  ('Gs', 'سل#',   'black'),
    9:  ('A',  'لا',    'white'),
    10: ('As', 'لا#',   'black'),
    11: ('B',  'سی',    'white'),
    12: ('C2', 'دو',    'white'),  # octave
}

# Root semitone from C for each maqam
ROOTS = {
    'ajam.html':    ('Bb', 10, 'سیبمل'),   # Bb = A# = semitone 10
    'nahawand.html':('C',   0, 'دو'),
    'nikriz.html':  ('C',   0, 'دو'),
    'rast.html':    ('C',   0, 'دو'),
    'segah.html':   ('Eb',  3, 'میبمل'),   # Eb = D# = semitone 3
}

# Scale offsets (from tonic)
SCALES = {
    'ajam.html':    [0,2,4,5,7,9,11,12],
    'nahawand.html':[0,2,3,5,7,8,11,12],
    'nikriz.html':  [0,2,3,6,7,9,10,12],
    'rast.html':    [0,2,3.5,5,7,9,10.5,12],
    'segah.html':   [0,1.5,3.5,5.5,7,8.5,10.5,12],
}

print('='*70)
print('PIANO KEY ASSIGNMENT FOR EACH MAQAM')
print('='*70)

for fname in ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html']:
    root_name, root_semi, root_fa = ROOTS[fname]
    offsets = SCALES[fname]
    
    print(f'\n{fname}  (root={root_name}/{root_fa}, starts at semitone {root_semi} from C)')
    print(f'  {"Deg":>3}  {"Offset":>6}  {"Abs(C)":>6}  {"Name":>5}  {"Persian":>10}  {"Key type"}')
    print(f'  {"-"*55}')
    
    for i, o in enumerate(offsets):
        deg = i + 1
        if isinstance(o, float) and o != int(o):
            abs_c = (root_semi + o) % 12
            lo = PIANO[int(abs_c)]
            hi = PIANO[int(abs_c)+1] if int(abs_c)+1 <= 12 else PIANO[0]
            print(f'  {deg:>3}  {o:>6.1f}  {abs_c:>6.1f}  {"QT":>5}  {lo[1]}~{hi[1]:>5}  QUARTER TONE 1⁄4')
        else:
            o = int(o)
            abs_c = int((root_semi + o) % 12)
            if o == 12: abs_c = 12  # octave
            if abs_c in PIANO:
                name, fa, ktype = PIANO[abs_c]
                # Is this a scale degree that falls on a black key?
                flag = ' ← روی کلید سیاه!' if ktype == 'black' else ''
                print(f'  {deg:>3}  {o:>6}  {abs_c:>6}  {name:>5}  {fa:>10}  {ktype}{flag}')

print()
print('='*70)
print('CONCLUSION:')
print('  ajam:    tonic Bb = BLACK KEY → پیانو از Bb شروع میشود (کلید سیاه)')
print('  segah:   tonic Eb = BLACK KEY → پیانو از Eb شروع میشود (کلید سیاه)')
print('  nahawand/nikriz/rast: tonic C = WHITE KEY ✅')
print()
print('  For ajam/segah: tonic is a black key — must show it highlighted as black,')
print('  and the piano display starts on that black key.')
