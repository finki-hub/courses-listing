# FINKI Hub Courses Design System

## 1. Atmosphere & Identity

FINKI Hub is a compact academic utility for FCSE students: find a course, understand where it sits in a curriculum, and plan what to take. It is direct, information-dense and calm. The FINKI Hub green is the only accent and marks what is active or chosen; everything else is carried by surfaces, borders and type.

Principles:

- **Controls look like controls.** Every option sits in a visible container (a segmented track, a chip, a field) at rest, not only once selected.
- **Content before configuration.** Each tab opens with a title and one line on what it is for; common filters stay visible and rarer ones sit behind a disclosure.
- **Status has one vocabulary.** Required, elective, faculty list, passed, enrolled and locked always use the same color and wording.
- **Labels are sentence case.** No all-caps labels or tracked-out eyebrows.

## 2. Color

All UI colors use the semantic tokens declared in `src/index.css` (HSL triples in `:root` and `[data-kb-theme="dark"]`, exposed as Tailwind colors). Feature components do not introduce raw colors.

### Surfaces

The page carries a faint green cast from the accent so panels read as panels in both themes.

| Level | Token | Light | Dark | Usage |
| --- | --- | --- | --- | --- |
| Page | `background` | `120 12% 97%` | `150 10% 6%` | Page behind everything |
| Panel | `card` | `0 0% 100%` | `150 8% 9%` | Tables, cards, fields, header, filter panels |
| Raised | `raised` | `0 0% 100%` | `150 6% 22%` | Selected segment, raised stat tiles |
| Overlay | `popover` (`overlay`) | `0 0% 100%` | `150 8% 12%` | Popovers, menus |
| Muted | `muted` | `140 10% 93%` | `150 7% 14%` | Segmented tracks, hover, skeletons |
| Scrim | `scrim` | `150 30% 3% / 0.6` | same | Behind dialogs and sheets |

### Text, lines and accent

| Role | Token | Light | Dark |
| --- | --- | --- | --- |
| Text | `foreground` | `150 10% 8%` | `140 8% 94%` |
| Secondary text | `muted-foreground` | `150 6% 35%` | `145 6% 68%` |
| Border | `border` | `140 8% 86%` | `150 6% 19%` |
| Field border | `input` | `150 5% 55%` | `150 5% 46%` |
| Accent | `primary` / `ring` | `142 70% 29%` | `142 70% 45%` |
| Destructive | `destructive` | `0 74% 45%` | `0 84% 60%` |

### Status

Each status has a text color, a soft background and a border (`text-<status>`, `bg-<status>-soft`, `border-<status>-border`). Text on its soft background meets 4.5:1 in both themes. Use them through `StatusBadge`, `STATUS_TONE_CLASSES` or `ALERT_STYLES`.

| Status | Token | Hue | Meaning |
| --- | --- | --- | --- |
| Required | `required` | violet 262 | Required in the program |
| Elective | `elective` | amber | Elective in the program |
| Faculty list | `faculty` | slate | On the faculty-wide list |
| Passed | `passed` | green 142 | Passed; success alerts and positive trends |
| Enrolled | `enrolled` | blue 214 | Enrolled (listened) |
| Locked | `locked` | neutral | Unavailable until prerequisites are met |
| Warning | `warning` | orange | At a limit, plan issues |
| Info | `info` | blue 214 | Informational alerts |
| Danger | `danger` | red | Errors, over a limit, negative trends |

## 3. Typography

Inter for everything, JetBrains Mono for course codes. Weights: 400 body, 500 controls, 600 headings, 700 for the app name.

| Role | Utility | Size / line height |
| --- | --- | --- |
| Page title | `text-page font-semibold` | 24 / 32, -0.015em |
| Section title | `text-section font-semibold` | 16 / 24 |
| Body | `text-sm` (or `text-body`) | 14 / 22 |
| Meta | `text-meta` or `text-xs`, muted | 12 / 16 |
| Code | `font-mono text-xs` | 12 / 16 |

Descriptions stay under 80 characters per line (`max-w-prose`).

## 4. Spacing, Radius & Layout

- Base unit 4px. Page sections stack at 20px (mobile) and 24px (desktop); controls inside a group are 2px to 8px apart.
- Radii: `rounded-md` for controls and fields, `rounded-lg` for panels and tracks, `rounded-xl` for sheets, `rounded-full` for chips and badges.
- Content width: fluid container capped at 1280px, with 12px mobile and 24px desktop gutters.
- The header scrolls away; the tab bar is sticky. On phones the four tabs share the width, icon over label.
- The document owns vertical scrolling. The shared table wrapper may own horizontal overflow only as a last-resort safeguard. At 375px nothing forces horizontal page scroll.

## 5. Components

All shared components live in `src/components/ui`.

- **SegmentedControl**: one choice among a few options, as a muted track with the selected option raised. Optional `allLabel` adds an explicit "All" option for filters where none means all. `role="radiogroup"`, arrow keys, Home and End move the selection, and only the selected option is tabbable. Phones lay options out in up to four even columns.
- **ToggleChip**: one option of a multi-select set (tags). A pill with a border at rest, the accent border, tint and a check when on, `aria-pressed`. `TagChips` renders every course tag; the row scrolls sideways on phones.
- **Select**: a styled native select with a chevron and an optional empty option, sharing `FIELD_CLASS` with text fields and `SearchInput` (which adds a search icon).
- **Sheet**: a side panel on desktop and a bottom sheet on phones (Kobalte dialog), with a title, optional description, close button, scrolling body and footer.
- **PageHeader / SectionHeader**: a tab's title with one line on its purpose, and the heading of a group within a page.
- **EmptyState**: icon, title, short text and an optional action; tells the person what to do next.
- **Skeleton / ListingSkeleton**: placeholders while data loads; the pulse respects reduced motion.
- **StatusBadge**: a short status label in its semantic tone.
- **InfoTip**: a small muted info icon that opens a popover; it stays quiet until hovered or focused.
- **Alerts**: `ALERT_STYLES` (error, info, success, warning) on the status tokens.

## 6. Motion & Interaction

- 150ms to 200ms color transitions on interactive controls; sheets slide and fade in 200ms and appear instantly under reduced motion.
- No decorative entrance animation.
- Search and filtering update results immediately without moving focus.

## 7. Depth & Surface

Depth comes from the surface ladder and borders. Shadows are limited to the selected segment (`shadow-sm`), popovers and dialogs (`shadow-md` to `shadow-xl`). No glass or gradient decoration; the sticky tab bar uses a translucent page color with a light blur only so content stays legible under it.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- Target WCAG 2.2 AA with visible keyboard focus and native form semantics; axe (WCAG 2 A and AA) reports no violations on every tab in both themes at 1440px and 390px.
- Body text contrast is at least 4.5:1; non-text UI contrast is at least 3:1.
- Disabled simulator rows keep full-contrast text and signal their state with a lock icon and dashed controls instead of reduced opacity.
- The page remains readable at 200% zoom and 375px width without primary-content horizontal scrolling.
- Empty and missing states are expressed in text.

### Accepted Debt

- The mobile listing sort row still uses its own pill buttons; the listing redesign replaces it.
- `Sheet` is not wired to any screen yet; the listing filters and course detail move into it next.
