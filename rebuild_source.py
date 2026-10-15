from pathlib import Path
import csv, hashlib, sys
root=Path(__file__).parent
rows=list(csv.DictReader((root/'MODULE_INDEX.csv').open(encoding='utf-8-sig')))
out=root/'tutien_rebuilt.txt'
h=hashlib.sha256()
with out.open('wb') as w:
    for row in sorted(rows,key=lambda r:int(r['order'])):
        data=(root/row['file']).read_bytes()
        w.write(data); h.update(data)
expected='7c4f0114d6dbc7e4c05e3b0d8adb7ec373fa8f624e0c3ed07d5ac8d152916e4d'
actual=h.hexdigest()
print('Output:',out)
print('SHA256:',actual)
print('Matches original:',actual==expected)
if actual!=expected: sys.exit(1)
