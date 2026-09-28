# Game catalog sources

- Data: https://github.com/div2hub/game-data, snapshot 0c2ec0b (2026-09-26), CC BY 4.0. Original CSVs and license retained in source/. Converted to JSON, bonuses translated to Russian, perfect versions paired with base talents. Community-maintained values, not publisher verified.
- Brand/set and common talent icons: https://prototrack.gg/division2-sets.php, https://prototrack.gg/gear-talents.php, https://prototrack.gg/weapon-talents.php.
- Additional talent icons: https://hi-dep.github.io/division2/ (asset map snapshot 2026-09-03).
- Game artwork and game text belong to Ubisoft/Massive Entertainment. Fan reference project; not affiliated with Ubisoft.

Reimport retained CSV data: python scripts/import-catalog.py.

Missing exact icon assets are explicitly marked in the interface. Detailed talent descriptions remain in the original English. No claim of patch-perfect completeness is made.

## Russian text
Russian names and factual game descriptions are transcribed from the community reference [База данных vk.com/game_thedivision, Г8С3](https://docs.google.com/spreadsheets/d/1MGToAiLMT6r2dtFyY7Yv9AeJ8Vxbz-r1qkzs4OXKuic/htmlview), retrieved 27 September 2026; source update range 1–17 September 2026. Per-entry source tab, row and URL are retained in `data/source/ru-catalogue.json`. This is a community reference, not a claim of official localization. No explicit reuse license was found; the English dataset's CC BY license does not extend to the Russian source or game artwork. Game content belongs to Ubisoft/Massive.

English and Russian descriptions remain independent source snapshots, including different PvP values. Missing Russian entries retain English text with an explicit label. No game descriptions were automatically translated. Bewildered retains its English talent name because the source only provides a Russian description.

## Icon and Russian-name corrections — 28 September 2026
Missing exotic equipment icons were matched to the item and talent names in hi-dep's `items_web.json.gz`. The first Eagle's Strike and You can look… icon is used for combined weapon talents. Unique gear-set chest/backpack talents use their parent set emblem (the reference uses slot/set emblems for these mechanics). Per-talent provenance is retained in `data/source/icon-provenance.json`.

The owner supplied the in-game Russian names «Встряска» for Shakedown and «Сумятица» for Bewildered. These corrections override the community reference, including the repeated Shakedown name inside its description. Russian per-card source links are hidden at the owner's request; provenance is preserved here and in the source data.

## Augment and expertise calculators
The augment level table, Russian effect summaries, seven-item limit and prototype-core costs (6 maximum change cost; 31 to upgrade one augment from level 1 to 10) follow the three reference screenshots supplied by the owner on 28 September 2026. Percentages are added independently per effect; different effects are never added into one misleading percentage.

Expertise material costs for levels 1–30 are extracted from hi-dep's `data/items_web.json.gz`, table `items_grade_cost`, snapshot 24 September 2026. The full-range weapon, gear and skill totals exactly match the owner's third screenshot. The calculator sums rows strictly above the current level through the target level, inclusive, once per item. `tests/calculators.test.mjs` checks the reference totals and range boundaries.
