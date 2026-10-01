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
                            'named': row['is_named'] == 'TRUE',
                            'talentSlot': row['talent_slot'],
                            'attributes': {slot: row[slot] for slot in ['core_1','core_2','core_3','minor_1','minor_2','minor_3']},
                            'slots': {slot: ('fixed:'+row[slot][6:].strip() if row[slot].startswith('fixed:') else row[slot]) for slot in ['optics','magazine','muzzle','underbarrel']}})
# Upstream Bluescreen muzzle/underbarrel references are transposed; use attachment categories.
for weapon in weapons:
    if weapon['name'] == 'Bluescreen':
        weapon['slots']['muzzle'], weapon['slots']['underbarrel'] = weapon['slots']['underbarrel'], weapon['slots']['muzzle']
assert len({w['id'] for w in weapons}) == len(weapons)
assert all(w['damage'] >= 0 and w['rpm'] > 0 and w['mag'] > 0 and w['reload'] >= 0 for w in weapons)
(root / 'data/weapons.json').write_text(json.dumps(weapons, ensure_ascii=False, indent=2) + '\n')
print(f'Normalized {len(weapons)} weapons.')

with (root / 'data/source/weapon_mods.csv').open() as source:
    mods = list(csv.DictReader(source))
(root / 'data/weapon-mods.json').write_text(json.dumps(mods, ensure_ascii=False, indent=2) + '\n')
for weapon in weapons:
    for slot, spec in weapon['slots'].items():
        if spec.startswith('fixed:'):
            assert any(m['name'] == spec[6:] and m['category'] == slot for m in mods), (weapon['name'], spec)
print(f'Normalized {len(mods)} attachments; fixed slots verified.')

with (root / 'data/source/attributes.csv').open() as source:
    attributes = list(csv.DictReader(source))
(root / 'data/weapon-attributes.json').write_text(json.dumps(attributes, ensure_ascii=False, indent=2) + '\n')
for weapon in weapons:
    for spec in weapon['attributes'].values():
        if spec.startswith('fixed:'):
            assert any(a['id'] == spec.split(':')[1] for a in attributes), spec
print('Weapon attribute references verified.')

# Named chest/backpack talent bindings let the calculator select the correct brand.
catalog = json.loads((root / 'data/catalog.json').read_text())
brand_ids = {s['name']: s['id'] for s in catalog['sets']}
bindings = []
for file, kind in [('chests', 'chest'), ('backpacks', 'backpack')]:
    with (root / 'data/source' / (file + '.csv')).open() as source:
        for row in csv.DictReader(source):
            if row['is_named'] == 'TRUE' and row['talent_slot'].startswith('fixed:'):
                bindings.append({'name': row['name'], 'kind': kind, 'talent': row['talent_slot'][6:], 'brand': brand_ids[row['brand_set']]})
(root / 'data/named-talent-gear.json').write_text(json.dumps(bindings, ensure_ascii=False, indent=2) + '\n')
print(f'Normalized {len(bindings)} named gear talent bindings.')
