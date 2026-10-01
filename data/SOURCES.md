# Game catalog sources

- Data: https://github.com/div2hub/game-data, snapshot 0c2ec0b (2026-09-26), CC BY 4.0. Original CSVs and license retained in source/. Converted to JSON, bonuses translated to Russian, perfect versions paired with base talents. Community-maintained values, not publisher verified.
- Brand/set and common talent icons: https://prototrack.gg/division2-sets.php, https://prototrack.gg/gear-talents.php, https://prototrack.gg/weapon-talents.php.
- Additional talent icons: https://hi-dep.github.io/division2/ (asset map snapshot 2026-09-03).
- Game artwork and game text belong to Ubisoft/Massive Entertainment. Fan reference project; not affiliated with Ubisoft.

Reimport a pinned upstream snapshot: `python scripts/sync-game-data.py SNAPSHOT_DIR COMMIT_SHA`, then `python scripts/build-weapons.py`.

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

## Admin damage calculator V1 — 1 October 2026

- `data/weapons.json` is normalized from the seven existing `data/source` weapon CSVs, compiled by div2hub under CC BY 4.0. Regenerate with `python scripts/build-weapons.py`. The remote snapshot checked for weapon research was `9c9ff25552439aabe9f995f4ed66897040ac0cc0`. Values are provisional: weapon-level/patch metadata and shotgun pellet semantics are not explicitly documented by that source.
- Gear stats/mods and brands/set bonuses use the same JSON as the archive. The prototype multiplier is shared with the Attributes page, not independently duplicated.
- The user supplied the transcript of NYL's https://www.youtube.com/watch?v=WIEZ_qC9RgI. Regression tests reproduce the 38,300 base / 119% WD / 8% DTA / 10% DTOOC / 101% CHD example, including separate 50% and 30% amplifiers.
- V1 is a PvE, optimal-range, fixed-buff calculation. Expected damage assumes the same crit chance for body/head hits, capped at 60%. Sustained DPS uses magazine/(magazine/RPS + reload), with continuous-fire cadence and full-magazine reloads. Partial reloads, burst/charge weapons and special firing cycles are not simulated.
- Ordinary static brand/set bonuses are parsed only from exact numeric stat lines. Four-piece talents and set chest/backpack upgrades remain manual. Glass Cannon, Vigilance and Sadist read their actual percentage from the catalogue and require explicit activation; other talents are reference-only and visibly marked manual. No perfect/named/exotic talent automation in V1.
- Weapon core damage, specialization, watch damage and expertise are explicit inputs. Other weapon attributes, attachments, character base CHD and watch crit stats must be entered in Additional stats. No implicit double-counting of those values.
- Standard gear has three mod slots (mask/chest/backpack); improvised gloves/holster/kneepads add one each. Set gear has one minor; brand gear has two. Non-offensive selections do not directly affect bullet damage in V1.
- The navigation, mounted tab and calculator component all require existing `canManage`. Signing out removes the calculator and returns to the public tab. It is lazy-loaded, but GitHub Pages is static hosting: this is an owner-only interface, not server-side secrecy for JavaScript or repository source. No private data is embedded or sent.

## Source policy and full audit — 1 October 2026, later update

Per the owner's latest instruction, https://github.com/div2hub/game-data is the authoritative source for English game data. Snapshot: `9c9ff25552439aabe9f995f4ed66897040ac0cc0` (27 September 2026), checked 1 October. Russian numerical values were also reconciled to matching English effects; independent Russian PvP values remain where upstream has no counterpart. This policy supersedes earlier blanket ×1.5 prototype calculations and screenshot values when an explicit upstream maximum exists. Skill Haste prototype is 15%; flat prototype Armor Regen/Health are 7,388 / 28,403. Disrupt Resistance replaces the earlier screenshot's Freeze Resistance label.

See `ENGLISH-DATA-AUDIT.md` for coverage, exceptions and unresolved contradictory source text, and `source/ru-numeric-overrides.json` for reviewed translation edits. This dataset has no expertise material cost, trader timetable or activity schedule tables, so those sections keep their separately documented sources. Weapon attachments are now separately selectable in the admin calculator; weapon core/minor attributes still use the explicit additional-stat inputs. Calculation mechanics and source normalization fixes are documented in the audit.

## SHD watch controls — 1 October 2026

Separate 0–50 integer point inputs for all 16 watch nodes; each has MAX. Percentages are points / 50 × node maximum. Offense maxima: WD 10%, CHC 10%, CHD 20%, HSD 20%; defense all 10%; skills damage/haste/repair 10%, duration 20%; handling accuracy/stability/reload 10%, reserve ammo 20%. Cross-checked against the watch table in https://buildstation.app/td2/builder/mx/nRnHTUTz and https://www.reddit.com/r/thedivision/comments/qw5daz/shd_watch_max_stats/ . The div2hub snapshot has no watch table, so these are separately sourced. Only WD/CHC/CHD/HSD/reload enter the current bullet-DPS model; reserve ammo does not increase magazine size. Previous default +10% watch WD is represented by 50 WD points. Other watch nodes default to zero.

### PvE calculator automation (1 October 2026)

`build-weapons.py` now retains all six weapon attribute-slot references and the talent-slot reference for every weapon; `weapon-attributes.json` is regenerated from the pinned `attributes.csv`. Standard and prototype limits use the exact source columns, including named exceptions. The existing manual weapon-core field has been replaced, so the core is counted once. Duplicate minor/core stat types are excluded.

`lib/talent-effects.ts` uses an explicit allowlist of mechanics and extracts their PvE numbers from the shared English descriptions, never Russian PvP parentheticals. Normal and perfect weapon talents resolve via their actual weapon references. Non-conditional bonuses apply automatically; conditional bonuses require activation and current stacks/phase. This is a constant-state bullet-damage model: uptime, shot sequences, ammo refunds, separate explosions/DoTs and four-piece set effects are not simulated. Unsupported effects remain clearly marked. Base character critical damage still requires manual input. Named gear selection is not implemented, so perfect chest/backpack variants are not offered on ordinary brand pieces.

Intimidate stacks use `(1 + perStack/100)^stacks`; mechanic cross-check: https://www.reddit.com/r/Division2/comments/1cklvrh/gruposombra_with_obliterateintimidate/ (numeric values remain from div2hub). Exotics with per-shot effects are evaluated for the chosen active state, not averaged over their buildup/decay. Capacitance uses an explicit total skill-tier input to include specialization bonuses not represented by gear cores.

### Perfect talents and current-shot effects (1 October 2026 follow-up)

Perfect chest/backpack talents are now selectable. Named gear bindings are generated from chests.csv/backpacks.csv into `named-talent-gear.json`; selection applies the named item's brand and changing to an incompatible brand clears its perfect talent. This also corrects inherited catalogue-slot assumptions: Perfect Companion belongs to Henri/chest and Perfect Tamper Proof to Proxy/backpack. Perfect Obliterate uses its own 24-stack cap and adds 24% TWD, whereas regular Obliterate caps at 20. Normal weapon talent choices still exclude perfects; named weapons resolve their actual fixed variant.

The explicit effect model now covers guaranteed headshots/crits, magazine crit phases, head-only amplification, armor-only mark amplification, Adaptive Instincts, stack/target-state exotics, base-magazine expansion and Headhunter's next shot. Guaranteed critical talents can exceed the ordinary 60% CHC cap. Single-shot effects do not inflate repeatable DPS. Headhunter adds min(previous killing damage × 125%/150%, current weapon damage × TWD × target armor/health multiplier × cap); the cap is 800%, or 1250% strictly above 150% HSD. It is not amplified again by crit, headshots, out-of-cover or other amps. Mechanic reference/testing discussion: https://www.reddit.com/r/thedivision/comments/hcu5w2/question_about_headhunters_damage_cap/ . This remains a modeled combat state, not independent in-game validation of all weapon interactions.

Every catalogue talent has an explicit coverage classification in `talentStatus`: automatic, no direct bullet bonus, already included in base stats, transferred to another weapon, firing/reload cycle, separate damage, or special model. The latter categories are not silently converted to a generic amplifier. Separate explosions/DoTs (including Plague of the Outcasts), return-ammo cycles, secondary-weapon transfer and some special equipment interactions are still not implemented. Exotic gear selection remains outside the brand-item editor; its rule definitions are not a claim of complete exotic-item modeling.

## Automatic calculator assembly — 2026-10-01

Removed the free-entry Other bonuses and independent-amplifier panels. Supported talents activate on selection; stack counters start at their source maximum, while combat-specific inputs (previous damage, distance, phase) remain explicit controls. Perfect Obliterate initializes 24 stacks; ordinary Obliterate initializes 20. Conditions can be disabled.

`lib/set-effects.ts` models conditional direct bullet bonuses for 14 sets from the English catalogue: Striker, Heartbreaker, Ongoing Directive, Future Initiative, True Patriot, Concentrated Company, Tipping Scales, Umbra, Negotiator, Breaking Point, Aces, Eclipse, Ortiz Exuro and Tip of the Spear. Requires four equipped pieces. Chest/backpack upgrades follow actual slots. Set conditions default to active and stacks to maximum, explicitly disclosed in the UI. Damage copied to secondary targets, status damage and combat cycles are not simulated; unsupported effects remain visibly marked. Aces applies to the enhanced hit only, not sustained DPS.

Intrinsic character CHD is 25%, separate from gear and watch and retained after reset. This is a character baseline, not an item value in div2hub. Supporting stripped-gear player measurement: https://www.reddit.com/r/thedivision/comments/hhu0ra . Weapon-specific HSD remains sourced from weapon data, without adding a second character HSD baseline.

Gear cards align content at the top, preventing fewer green-set fields from distributing large gaps throughout a stretched card.

## Specializations and per-bullet output — 2026-10-01

Source: `div2hub/game-data/specializations/specialization_talents.csv`, with specialization trees checked for perk ownership. Raw CSV and generated `data/specialization-talents.json` are retained; weekly snapshot sync regenerates the JSON through `scripts/build-specializations.py`.

Replaced the arbitrary specialization damage slider with six specializations and current weapon-class damage node tiers 0–3 (0/5/10/15%). Other personal perks assume full unlock. Sharpshooter's personal +15% HSD only applies to rifles/MMRs. Gunner kill/stationary conditions, Demolitionist armor-kit handling and Technician robot-target damage are explicit toggles. Tactical links are separately received from allies: Sharpshooter HSD, Demolitionist OOC, Survivalist status-target amplification and Firewall proximity amplification. Own tactical links never auto-apply to self. Conditional links default off; same links do not stack. Technician robot damage and Survivalist/Firewall links are modeled as independent conditional multipliers. Coupler's reload cycle, Firewall shield and skill-dependent interactions remain explicitly outside the model.

Results now prominently separate deterministic body, critical-body, head and critical-head hit damage from probability-weighted average damage and DPS. Shotgun output is explicitly a whole shot, not a single pellet.
