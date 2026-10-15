# FINKI Hub / Courses Listing

A course browser and enrollment simulator for FCSE.

## Features

- **Course listing** — searchable, sortable table of all FINKI courses with tag filtering
- **Enrollment simulator** — plan your semester with prerequisite validation, credit tracking, and per-level credit limits (2018 & 2023 accreditations)
- **Persistent state** — enrollment selections saved to localStorage per accreditation

## Getting Started

```sh
npm install
npm run dev
```

## License

This project is licensed under the terms of the MIT license.

## Translations

The interface supports Macedonian (`mk`, the default), English (`en`), Albanian
(`sq`) and Turkish (`tr`). The header language selector matches the homepage and
thesis browser. A selection is saved under `finki-hub-lang` in localStorage for
this site's origin; languages do not change URLs or simulator share links.

Translation dictionaries live in `src/lib/locales/` and share the English
structure through `Translations` in `src/lib/i18n.ts`. Add each key to all four
dictionaries, preserve named placeholders such as `{count}`, and use `t()` from
`useLanguage()` in reactive expressions. Use `interpolate`, `formatCount` and the
locale-aware number helpers for dynamic text. Page metadata uses the same
dictionaries, with Macedonian defaults rendered by Vite before JavaScript runs.

Course names, people, codes, official study-program abbreviations and source
prerequisite text remain as supplied by the catalog. Prerequisite parsing and
simulator state use the original values; translate their display messages only.

Run `npm test`, `npm run check`, `npm run lint` and `npm run build` to validate
changes. Localization tests check dictionary and placeholder coverage, formatting,
metadata, prerequisite explanations and simulator share compatibility.
