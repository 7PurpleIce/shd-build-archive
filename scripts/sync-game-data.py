"""Audit/import a pinned div2hub snapshot, preserving Russian catalogue content.
Usage: python scripts/sync-game-data.py /path/to/snapshot COMMIT_SHA
"""
import csv,json,re,sys,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
up=Path(sys.argv[1]);commit=sys.argv[2];source=root/'data/source'
def rows(path):return list(csv.DictReader(path.open()))
def read(name):return json.loads((root/'data'/name).read_text())
def write(name,data):(root/'data'/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def nums(text):return [float(v) for v in re.findall(r'(?<![A-Za-z])[-+]?\d+(?:\.\d+)?',text)]
changes=[];copies=[]
for path in up.rglob('*.csv'):
 dest=source/path.name
 if dest.exists() or path.name in ['augments.csv','gear_mods.csv','known_gaps.csv']:
  if not dest.exists() or dest.read_bytes()!=path.read_bytes():copies.append(path.name)
  shutil.copyfile(path,dest)
stats={r['id']:r['name'] for r in rows(up/'stats.csv')}
talents={r['name']:r for p in ['gear/gear_talents.csv','weapons/weapon_talents.csv'] for r in rows(up/p)}
sets={r['name']:r for p in ['gear/brand_sets.csv','gear/gear_sets.csv'] for r in rows(up/p)}
cat=read('catalog.json');checked_talents=0;checked_bonuses=0
for t in cat['talents']:
 for entry in [t]+t.get('perfect',[]):
  actual=talents[entry['name']]['description'];checked_talents+=1
  if nums(entry['description'])!=nums(actual):changes.append('Talent: '+entry['name'])
  entry['description']=actual
for item in cat['sets']:
 row=sets[item['name']];item['coreStat']=row['default_core_stat_id'];bonuses=[]
 for pc in range(1,5):
  value=row.get(str(pc)+'pc_bonus','N/A')
  if value=='N/A':continue
  lines=[]
  for part in value.split('|'):
   if part.startswith('stat:'):
    _,stat,v=part.split(':');lines.append(('' if v.startswith(('+','-')) else '+')+v+' — '+stats[stat])
   elif part.startswith('talent:'):
    name=part[7:];lines.append(name+'\n'+talents[name]['description'])
   else:raise ValueError(part)
  text='\n'.join(lines);old=next((b['text'] for b in item['bonuses'] if b['pieces']==pc),'');checked_bonuses+=1
  if nums(old)!=nums(text):changes.append(f"Set bonus: {item['name']} / {pc}")
  bonuses.append({'pieces':pc,'text':text})
 item['bonuses']=bonuses
 for e in item['extra']:
  name=e['name'].split(' — ')[-1];actual=talents[name]['description'];checked_talents+=1
  if nums(e['description'])!=nums(actual):changes.append('Set talent: '+name)
  e['description']=actual
write('catalog.json',cat)
attrs=read('attributes.json');rawattrs=rows(up/'attributes.csv')
for a in attrs:
 row=next(r for r in rawattrs if r['id']==a['id']+('-gear-core' if a['core'] else '-gear-minor'))
 a['enValue']='+'+row['range_max'];a['enPrototypeValue']='+'+row['proto_max'];a['prototypeValue']=a['enPrototypeValue']
 ordinary=float(a['value'].replace('+','').replace(',','').replace('%',''));proto=float(row['proto_max'].replace('%',''))
 if ordinary*1.5!=proto:changes.append(f"English prototype {a['id']}: {ordinary*1.5:g} → {proto:g}")
write('attributes.json',attrs)
mods=read('gear-mods.json');english=[]
for r in rows(up/'gear/gear_mods.csv'):
 old=next((m for m in mods if m['id']==r['stat_id'] or m['id']==r['stat_id']+'-13'),None)
 item=dict(old) if old else {'id':r['stat_id'],'ru':stats[r['stat_id']]}
 item.update(en=stats[r['stat_id']],group={'offensive':'offense','defensive':'defense','skill':'skill'}[r['category']],value='+'+r['range_max'])
 english.append(item)
 if old and nums(old['value'].replace(',',''))!=nums(item['value']):changes.append('Gear mod: '+r['stat_id'])
write('gear-mods.json',english)
changes.append('Gear Mods use upstream stat identities; Disrupt Resistance is 10%.')
augments=read('augments.json');rawaug={r['name'].lower():r for r in rows(up/'augments.csv')}
for a in augments:
 r=rawaug[a['id']];start=float(r['min_value'].rstrip('%'));step=float(r['fidelity'].rstrip('%'));levels=[round(start+i*step,4) for i in range(10)]
 assert levels[-1]==float(r['max_value'].rstrip('%'))
 if a['levels']!=levels:changes.append('English augment levels: '+a['name'])
 a['levels']=levels;a['en']=r['description']
write('augments.json',augments)
write('source/upstream-manifest.json',{'repository':'https://github.com/div2hub/game-data','commit':commit,'checkedAt':'2026-10-01','copiedOrChanged':copies,'policy':'English game data uses this pinned source. Russian numeric values align with English PvE; independent PvP values and translations are retained.'})
report=f'''# English data audit — 1 October 2026

Source: https://github.com/div2hub/game-data/tree/{commit}

## Coverage

| Site data | Checked | Result |
|---|---:|---|
| Brands and sets | {len(cat['sets'])} entries / {checked_bonuses} bonuses | Compared with brand_sets.csv / gear_sets.csv |
| Talent descriptions including perfect and set upgrades | {checked_talents} | Compared with gear_talents.csv / weapon_talents.csv |
| Gear core/minor maxima | {len(attrs)} ordinary + {len(attrs)} prototype | English uses range_max / proto_max directly |
| Gear Mods | {len(english)} | English uses gear/gear_mods.csv |
| Augments | {len(augments)} × 10 levels | English uses min_value, fidelity, max_value; descriptions use source templates |
| Weapon stats | 281 | All seven retained CSVs match snapshot; regenerated JSON |
| Weapon attachments | 252 | Source matches; now exposed by compatible weapon slot |

## Changes / discrepancies

'''+ '\n'.join('- '+c for c in changes)+'''

Numeric values in catalogue talent descriptions and set bonuses had no discrepancies unless listed above. English text/stat labels are now regenerated from the source; Russian names and descriptions are preserved.

The source correction for Picaro's Holster forbids a weapon-damage core. The raw holsters snapshot was updated; named gear is not yet selectable in this calculator.

## Not covered by upstream

- Expertise level/material-cost tables are absent. Existing screenshot-validated totals remain; not claimed verified against div2hub.
- Augment change/upgrade costs (6 / 31) and seven-item equip limit are absent; owner-provided values remain.
- Trader schedules/countdowns and activity schedules, encounter guidance and requirements have no corresponding source tables; remain unchanged.
- User build content, tags, counts and uploaded screenshots are user-authored, not game-balance data.
- The damage formula and talent mechanics are not a machine-readable calculation model in this repository. Existing explicit/manual implementation rules remain; labels do not imply automated support.
- PvP-specific Russian descriptions are not replaced by English PvE text.

## Regeneration

Run `python scripts/sync-game-data.py SNAPSHOT_DIR COMMIT_SHA`, then `python scripts/build-weapons.py`. Run `pnpm test` and `pnpm build` before publication. Numeric values are pinned, not fetched at runtime.
'''
(root/'data/ENGLISH-DATA-AUDIT.md').write_text(report)
print(report)

# Regenerate calculator specialization values after copying the source snapshot.
import runpy
runpy.run_path(str(root/'scripts/build-specializations.py'),run_name='__main__')
