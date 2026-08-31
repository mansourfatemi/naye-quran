
# مقام عجم = گام ماژور
# فواصل: 1، 1، نیم، 1، 1، 1، نیم  (به پرده)
# هر پرده = 2 نیمپرده

intervals_whole = [1, 1, 0.5, 1, 1, 1, 0.5]  # به پرده
intervals_semi  = [2, 2, 1,   2, 2, 2, 1  ]  # به نیمپرده

# نامهای کروماتیک از Bb
# Bb=0, B=1, C=2, C#=3, D=4, Eb=5, E=6, F=7, F#=8, G=9, Ab=10, A=11, Bb=12

CHROMATIC_FROM_BB = [
    'سیبمل (Bb)', 'سی (B)', 'دو (C)', 'دو# (C#)', 'ر (D)',
    'ر# / میبمل (Eb)', 'می (E)', 'فا (F)', 'فا# (F#)', 'سل (G)',
    'سل# (Ab)', 'لا (A)', 'سیبمل (Bb اکتاو)'
]

print('مقام عجم از سیبمل (Bb):')
print(f'{"درجه":>5}  {"نیمپرده":>8}  {"نت":>20}  {"فاصله تا بعدی"}')
print('-'*60)

pos = 0
for i, interval in enumerate(intervals_semi):
    deg = i + 1
    note = CHROMATIC_FROM_BB[pos]
    print(f'{deg:>5}  {pos:>8}  {note:>20}  → {intervals_whole[i]} پرده')
    pos += interval

# درجه ۸ (اکتاو)
print(f'{"8":>5}  {pos:>8}  {CHROMATIC_FROM_BB[int(pos)]:>20}')

print()
print('کلیدهای سفید پیانو از Bb:')
# روی پیانوی واقعی، کلیدهای سفید: C D E F G A B
# کلیدهای سیاه: C# D# F# G# A#
WHITE_SEMIS_FROM_C = {0,2,4,5,7,9,11,12}  # C D E F G A B C

pos = 0
for i, interval in enumerate(intervals_semi):
    deg = i + 1
    # موقعیت مطلق از C
    abs_from_c = (10 + pos) % 12  # Bb = 10 نیمپرده از C
    is_white = abs_from_c in WHITE_SEMIS_FROM_C
    note = CHROMATIC_FROM_BB[pos]
    key_type = 'سفید ✅' if is_white else 'سیاه ⬛'
    print(f'  درجه {deg}: {note}  →  کلید {key_type}')
    pos += interval

abs_from_c = (10 + pos) % 12
is_white = abs_from_c in WHITE_SEMIS_FROM_C or pos == 12
note = CHROMATIC_FROM_BB[int(pos)]
key_type = 'سفید ✅' if is_white else 'سیاه ⬛'
print(f'  درجه 8: {note}  →  کلید {key_type}')
