
SCALES = {
    'ajam':    {'root':'Bb', 'start':10, 'intervals':[2,2,1,2,2,2,1]},
    'nahawand':{'root':'C',  'start':0,  'intervals':[2,1,2,2,1,3,1]},
    'nikriz':  {'root':'C',  'start':0,  'intervals':[2,1,3,1,2,1,2]},
    'rast':    {'root':'C',  'start':0,  'intervals':[2,1.5,1.5,2,2,1.5,1.5]},
    'segah':   {'root':'Eb', 'start':3,  'intervals':[1.5,2,2,1.5,1.5,2,1.5]},
}

# semitone from C (0=C4, 12=C5, 22=Bb4/As4 etc.)
NOTES = {
    0:('C4','دو','white'),   1:('Cs4','دو#','black'),
    2:('D4','ر','white'),    3:('Ds4','میبمل','black'),
    4:('E4','می','white'),   5:('F4','فا','white'),
    6:('Fs4','فا#','black'), 7:('G4','سل','white'),
    8:('Gs4','لابمل','black'),9:('A4','لا','white'),
    10:('As4','سیبمل','black'),11:('B4','سی','white'),
    12:('C5','دو','white'),  13:('Cs5','دو#','black'),
    14:('D5','ر','white'),   15:('Ds5','میبمل','black'),
    16:('E5','می','white'),  17:('F5','فا','white'),
    18:('Fs5','فا#','black'),19:('G5','سل','white'),
    20:('Gs5','لابمل','black'),21:('A5','لا','white'),
    22:('As5','سیبمل','black'),
}

for mname, info in SCALES.items():
    pos = info['start']
    ivs = info['intervals']
    root = info['root']
    print(f'\n=== {mname} (از {root}) ===')
    
    scale = []
    for i, iv in enumerate(ivs):
        key = NOTES.get(int(pos) if pos==int(pos) else -1, ('?','QT','quarter'))
        scale.append((i+1, pos, key))
        print(f'  درجه {i+1}: {key[1]:10} ({key[0]:5}) [{key[2]}]  → {iv} پرده')
        pos += iv
    key = NOTES.get(int(pos), ('?','?','?'))
    scale.append((8, pos, key))
    print(f'  درجه 8: {key[1]:10} ({key[0]:5}) [{key[2]}]')
    
    first = scale[0][2][0]
    last  = scale[-1][2][0]
    print(f'  محدوده پیانو: {first} → {last}')
    blacks_in_scale = [(d,k[1],k[0]) for d,p,k in scale if k[2]=='black']
    print(f'  درجات روی کلید سیاه: {blacks_in_scale}')
