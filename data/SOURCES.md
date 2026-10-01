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

## SHD masthead emblem

SHD phoenix emblem (Ubisoft / Massive), sourced from The Division Zone: https://division.zone/the-division-shd/ . Original image: https://division.zone/wp-content/uploads/2014/08/strategic-homeland-division-shd-logo-300x300.png . Transparent PNG derivative in public/shd-phoenix.png; background removed with the built-in image tool. Original embedded source retained in public/shd-phoenix.svg.

## Attributes reference — 1 October 2026

All 61 distinct stat IDs from div2hub/game-data `stats.csv` (blob 6fa841f026f6eae73be23567cd35e81afa24b633), CC BY 4.0. `attributes.csv` (blob 3e0d6ad619e8245f3a2b425a0b17377bfc4e6c05) retained for equipment context. Original snapshots retained in data/source. Display names expanded for DTOC and Health Damage; Russian labels are editorial translations, not a claim of verbatim official localization. Grouping is editorial, and only Weapon Damage, Armor and Skill Tier are presented as gear core attributes. The remaining list includes weapon, mod and bonus stats, not just recalibratable gear attributes; skill-variant-specific parameters and talent mechanics are not an exhaustive part of this upstream stat registry. No roll maxima or caps are asserted.

## Attributes scope correction — 1 October 2026

The owner's screenshot image(20261001-153459).png supersedes the broad stats registry for the Attributes page. Display exactly 3 gear cores and 12 secondary gear attributes, in screenshot order, with its normal maximum values and Russian labels (including «Эргономичность», «Навыки ремонта», «Убыстрение»). Armor regeneration is per second. Weapon/mod/brand-only stats are excluded from this page. Raw upstream snapshots remain archived as references.

## Gear mods — 1 October 2026

The Attributes page's Gear Mods / Вставки subsection reproduces the owner's screenshot image(20261001-154301).png: 17 entries with supplied values. Per the owner’s follow-up, Protection from Elites +12% is omitted; only +13% is displayed. The screenshot's «Сопротивление заморозке» is retained as supplied and translated literally as Freeze Resistance; these labels are not asserted to be official English localization. No database changes.

## Prototype comparisons — 1 October 2026

At the owner's request, all 15 gear core/secondary values show a purple prototype comparison using exactly base × 1.5. Fractional flat results are retained (4,925 → 7,387.5; 18,935 → 28,402.5), without rounding to a whole number. This is the supplied formula, not independent verification of in-game prototype rolls. Gear Mods are outside the supplied screenshot and retain their original values.
