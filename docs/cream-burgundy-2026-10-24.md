# Cream and burgundy interface update

24 October 2026. Requested from the marked Notes screenshot.

- Warm cream surrounds the Notes editor and pack sidebar, with a burgundy top edge and a lighter writing surface.
- Home, the sample preview, preparation pack and judge guide share the palette. Warm dark surfaces and rose accents support the existing dark-mode switch.
- Green confirmation and amber review states remain distinct. No generation, storage, consent or approval behavior changed.
- Shared palette variables live in `public/organization.css`; shared component color rules live in `public/theme.css`. Browser theme metadata and the app icon use burgundy.

## Verification

All 88 existing automated tests passed. These are behavior regressions, not a visual quality score. CSS delimiters are balanced. Calculated contrast ratios for the selected text/background pairs:

| Pair | Light | Dark |
| --- | ---: | ---: |
| Body text / page | 12.69 | 15.12 |
| Main text / cream frame | 10.75 | 12.03 |
| Secondary text / frame | 4.86 | 7.76 |
| Writing text / input | 13.45 | 14.76 |
| Primary button text / fill | 9.08 | 7.53 |
| Accent links / card | 9.08 | 8.53 |

Ratios describe these pairs only, not a full WCAG audit. Deployed code `2b3641a4339a7e7b15f1d4e25e8d36efe71fc9d7` became live on Render as `dep-dbe7fhbncjis73d9h2j0` at 10:18 WAT. Desktop browser checks at 1363 CSS pixels confirmed the cream Notes framing and near-white editor, matching preparation-pack sidebar, burgundy Home accents, cream judge-guide cards, and the warm dark palette through the existing theme switch. No horizontal page overflow was observed on Notes, the preparation pack, Home/sample anchor or the guide. Existing saved packs remained present. A Notes screenshot was captured for the user. No physical phone test or new model-generation reliability claim is included.
