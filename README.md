# FINKI Hub / Courses Listing

A course browser and enrollment simulator for FCSE.

## Features

- **Course listing**: a searchable, sortable table of all FINKI courses, found by name, abbreviation, code or staff, with accreditation, season, level and tag filters
- **Course details**: staff, accreditation details and enrollment history per course
- **Enrollment simulator**: plan your studies with prerequisite validation, credit tracking and per-level credit limits (2018 and 2023 accreditations)
- **Prerequisite explorer**: see which courses require a given course
- **Equivalencies**: course equivalencies between the 2018 and 2023 accreditations
- **Shareable links**: listing filters and the open course (`?course=<code>`) live in the URL, and simulator progress can be shared as a link
- **Persistent state**: simulator selections are saved to localStorage per accreditation

## Getting Started

```sh
npm install
npm run dev
```

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

Course names, people, codes and official study-program abbreviations remain as
supplied by the catalog. In English, every tab shows a course by its official
English name (`name-en` in `courses.json`, from FINKI's English subject pages)
when it has one, and prerequisites show those names with "and", "or" and
"credits" in English; search matches both names. Prerequisite parsing, saved
simulator progress and share links use the original Macedonian names, which
`src/lib/CourseNamesProvider.tsx` translates for display only.

Run `npm test`, `npm run check`, `npm run lint` and `npm run build` to validate
changes. Localization tests check dictionary and placeholder coverage, formatting,
metadata, prerequisite explanations and simulator share compatibility.

`npm run test:e2e` builds the app and drives it in Chromium at desktop and phone
sizes with Playwright (run `npx playwright install chromium` once first). The
tests serve the course data from `e2e/fixtures`, a trimmed snapshot of the
published files, so they do not depend on the network. Refresh the snapshot when
the data's shape changes.

## License

This project is licensed under the terms of the MIT license.
