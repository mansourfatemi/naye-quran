import os, re

base = r'C:\Users\sayefate\Desktop\MadreseTelavat_MultiQari\_maqam_piano_demo'

# On a real piano keyboard, the white keys are always: C D E F G A B (دو ر می فا سل لا سی)
# Black keys are always: C# Db / D# Eb / F# Gb / G# Ab / A# Bb
# For each root, map each semitone offset to its CORRECT piano key color and name

# Standard piano: white key semitones from C = 0,2,4,5,7,9,11
# Black key semitones from C = 1,3,6,8,10
WHITE_FROM_C = {0,2,4,5,7,9,11,12}
BLACK_FROM_C = {1,3,6,8,10}

# Root offsets from C:
ROOTS = {'Bb': 10, 'C': 0, 'Eb': 3}

# For each maqam, scale offsets (from tonic), convert to absolute semitone from C
# then determine if it's a white or black key on a real piano

SCALES = {
    'ajam.html':    {'root':'Bb', 'offsets':[0,2,4,5,7,9,11,12]},
    'nahawand.html':{'root':'C',  'offsets':[0,2,3,5,7,8,11,12]},
    'nikriz.html':  {'root':'C',  'offsets':[0,2,3,6,7,9,10,12]},
    'rast.html':    {'root':'C',  'offsets':[0,2,3.5,5,7,9,10.5,12]},
    'segah.html':   {'root':'Eb', 'offsets':[0,1.5,3.5,5.5,7,8.5,10.5,12]},
}

# Note names from C (index = semitone from C)
NOTE_NAMES_FROM_C = ['دو','دو#','ر','ر#','می','فا','فا#','سل','سل#','لا','لا#','سی','دو']
NOTE_WHITE_NAME   = ['دو', 'ر', 'می', 'فا', 'سل', 'لا', 'سی']  # always white
NOTE_BLACK_NAME   = ['دو#','ر#','فا#','سل#','لا#']  # always black (using sharp names)

# For flat names (used when note is in a flat-key context)
FLAT_NAMES_FROM_C = ['دو','ربمل','ر','میبمل','می','فا','سلبمل','سل','لابمل','لا','سیبمل','سی','دو']

for fname, info in SCALES.items():
    root = info['root']
    root_offset = ROOTS[root]
    offsets = info['offsets']
    
    print(f'=== {fname} (root={root}, root_from_C={root_offset}) ===')
    for o in offsets:
        if not (isinstance(o, int) or o == int(o)):
            # quarter-tone — skip for now
            abs_c = (root_offset + o) % 12
            print(f'  offset={o} → abs_from_C={abs_c:.1f} → QUARTER TONE (between {NOTE_NAMES_FROM_C[int(abs_c)]} and {NOTE_NAMES_FROM_C[int(abs_c)+1]})')
            continue
        abs_c = int((root_offset + o) % 12)
        is_white = abs_c in WHITE_FROM_C
        sharp_name = NOTE_NAMES_FROM_C[abs_c]
        flat_name  = FLAT_NAMES_FROM_C[abs_c]
        key_type = 'WHITE ✅' if is_white else 'BLACK ⬛'
        print(f'  offset={int(o):2d} → abs_from_C={abs_c:2d} ({sharp_name}/{flat_name}) → {key_type}')
    print()
