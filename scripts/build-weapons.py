"""Normalize the checked-in div2hub snapshot; run from any directory."""
import csv
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
classes = {'assault_rifles': 'assault-rifle', 'smgs': 'smg', 'lmgs': 'lmg',
           'rifles': 'rifle', 'mmrs': 'marksman-rifle', 'shotguns': 'shotgun', 'pistols': 'pistol'}
weapons = []
for file, kind in classes.items():
    with (root / 'data/source' / (file + '.csv')).open() as source:
        for row in csv.DictReader(source):
            weapons.append({'id': kind + ':' + row['name'], 'name': row['name'], 'type': kind,
                            'damage': float(row['base_damage']), 'rpm': float(row['base_rpm']),
                            'mag': float(row['base_mag_size']), 'reload': float(row['base_reload_time']),
                            'hsd': float(row['hsd']), 'exotic': row['is_exotic'] == 'TRUE',
                            'named': row['is_named'] == 'TRUE'})
assert len({w['id'] for w in weapons}) == len(weapons)
assert all(w['damage'] >= 0 and w['rpm'] > 0 and w['mag'] > 0 and w['reload'] >= 0 for w in weapons)
(root / 'data/weapons.json').write_text(json.dumps(weapons, ensure_ascii=False, indent=2) + '\n')
print(f'Normalized {len(weapons)} weapons.')
