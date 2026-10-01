"""Preserve the upstream specialization talent values for calculator rules."""
import csv,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
rows=list(csv.DictReader((root/'data/source/specialization_talents.csv').open()))
(root/'data/specialization-talents.json').write_text(json.dumps({r['name']:r['description'] for r in rows},ensure_ascii=False,indent=2)+'\n')
