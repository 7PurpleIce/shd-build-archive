# English data audit — 1 October 2026

Source: https://github.com/div2hub/game-data/tree/9c9ff25552439aabe9f995f4ed66897040ac0cc0

## Coverage

| Site data | Checked | Result |
|---|---:|---|
| Brands and sets | 65 entries / 195 bonuses | Compared with brand_sets.csv / gear_sets.csv |
| Talent descriptions including perfect and set upgrades | 345 | Compared with gear_talents.csv / weapon_talents.csv |
| Gear core/minor maxima | 15 ordinary + 15 prototype | English uses range_max / proto_max directly |
| Gear Mods | 17 | English uses gear/gear_mods.csv |
| Augments | 9 × 10 levels | English uses min_value, fidelity, max_value; descriptions use source templates |
| Weapon stats | 281 | All seven retained CSVs match snapshot; regenerated JSON |
| Weapon attachments | 252 | Source matches; now exposed by compatible weapon slot |

## Changes / discrepancies

- English prototype armor-regeneration: 7387.5 → 7388
- English prototype health: 28402.5 → 28403
- English prototype skill-haste: 18 → 15
- English Gear Mods: Freeze Resistance replaced with Disrupt Resistance (10%).

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

## Russian reconciliation requested during this audit

Russian values now follow the same ordinary/prototype maxima and Gear Mod values. `ru-numeric-overrides.json` records the reviewed before/after edits: 29 talent descriptions, 48 plain brand/set bonus fields (including formatting/label alignment), and two Foundry Bulwark upgrade descriptions. The latter had chest/backpack mechanics reversed. Striker loss thresholds were also aligned to 51–100 and 101–200 stacks.

Examples: Gunslinger 20→23%; Soft Spot 27→19% and 10→15 seconds; Perfect Soft Spot 32→24%; Alternating Current 3→2.5%; Tech Support 20→25 seconds; Transfusion bonus armor 50→200%. Separate PvP values absent from the English source are retained. This is a reconciliation to the requested community dataset, not independent in-game validation.

### Source ambiguities requiring confirmation

- Perfect Protected Reload says both 0–30% ally armor and a maximum of 18% in the same description. The English source is retained verbatim; the Russian 0–30% description is not arbitrarily replaced with 18%.
- Tamper Proof / Perfect Tamper Proof descriptions both end `Cooldown per skill: 10 seconds.(8s)`. The source does not explicitly label those alternatives. Existing Russian regular 10s / perfect 8s values are retained pending clarification.
- Source weapon slot references for Bluescreen transpose the muzzle/underbarrel names. The normalized weapon data resolves them to their attachment categories. A leading space in The Bighorn's fixed grip reference is trimmed. Raw source files remain unchanged for these two normalization fixes.

## Weapon attachment calculation

Optics, magazine, muzzle and underbarrel selectors filter by the source compatibility tokens. Fixed attachments auto-apply and cannot be exchanged. Changing weapons clears manual choices; incompatible values are rejected in the calculation as well as the UI. Signed penalties are preserved. Flat magazine rounds are added before percentage magazine bonuses. Reload speed and handling affect reload duration; crit, headshot, weapon damage and fire rate affect the relevant calculation groups. Accuracy, stability, optimal range, swap speed and melee modifiers are displayed but do not alter this ideal bullet-DPS model.
