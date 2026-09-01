# FINKI Hub Courses Design System

## 1. Atmosphere & Identity

FINKI Hub is a compact academic utility: direct, information-dense, and calm. Its signature is a restrained green accent over neutral light and dark surfaces, with borders and typography carrying hierarchy instead of decorative effects.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
| --- | --- | --- | --- | --- |
| Surface | `background` | `0 0% 100%` | `0 0% 4%` | Page and input backgrounds |
| Surface/card | `card` | `0 0% 99%` | `0 0% 7%` | Grouped content |
| Text/primary | `foreground` | `0 0% 5%` | `0 0% 95%` | Headings and body |
| Text/muted | `muted-foreground` | `0 0% 40%` | `0 0% 60%` | Descriptions, codes, empty values |
| Surface/muted | `muted` | `0 0% 94%` | `0 0% 15%` | Hover and secondary surfaces |
| Accent | `primary` | `142 70% 31%` | `142 70% 45%` | Active tabs, controls, focus |
| Border | `border` | `0 0% 88%` | `0 0% 15%` | Dividers and containers |
| Input border | `input` | `0 0% 58%` | `0 0% 37%` | Form-control boundaries |
| Error | `destructive` | `0 84% 60%` | `0 84% 60%` | Destructive and error states |

All UI colors use the semantic Tailwind tokens declared in `src/index.css`; feature components do not introduce raw colors.

## 3. Typography

- Primary: Inter, system UI, sans-serif.
- Mono: JetBrains Mono, monospace.
- Page heading: `text-base` on narrow screens and `text-xl` from `sm`, bold.
- Body: `text-sm` or `text-base` according to density.
- Metadata and course codes: `text-xs`, muted; course codes use the mono stack.
- Controls and table headers: `text-xs` on narrow screens and `text-sm` from `sm`, medium weight.

## 4. Spacing & Layout

- Base unit: 4px; existing Tailwind spacing steps are the source of truth.
- Content width: fluid container capped at 1280px, with 12px mobile and 24px desktop gutters.
- Page sections use the existing stack rhythm (`space-y-4`); dense rows use 6px to 8px cell padding.
- Controls follow the StyleGallery `wrap-row` pattern, wrapping without changing DOM order: <https://github.com/changeroa/StyleGallery/blob/main/patterns/in-line-grouping/wrap-row.md>.
- Equivalence results follow the StyleGallery `feed` principle: stable repeated rows in document flow with no internal vertical scroll: <https://github.com/changeroa/StyleGallery/blob/main/patterns/stacking/feed.md>.
- The document owns vertical scrolling. The shared table wrapper may own horizontal overflow only as a last-resort safeguard.
- At 375px, the two accreditation columns remain visible and share the available width; names wrap and codes never force viewport overflow.

## 5. Components

### Search input

- **Structure**: labeled text input using the shared `SearchInput` primitive.
- **States**: default, placeholder, focus ring, populated.
- **Accessibility**: persistent visible label; Latin and Cyrillic input match course names and codes.
- **Layout**: full-width stack item.

### Labeled checkbox

- **Structure**: native checkbox inside the shared `LabeledCheckbox` label.
- **States**: unchecked, checked, keyboard focus.
- **Accessibility**: the full label is clickable and the native control remains exposed.
- **Layout**: part of the wrapping controls row.

### Equivalence summary

- **Structure**: short explanatory copy followed by compact counts.
- **Variants**: renamed count and one-sided count.
- **Accessibility**: counts are text, not color-only indicators.
- **Layout**: wrapping cluster with ordinary document flow.

### Equivalence table

- **Structure**: semantic table with one equal-width column per accreditation; each populated cell contains course name then code.
- **States**: populated, one-sided (`Нема предмет`), filtered empty state.
- **Accessibility**: column headers identify accreditation; rows are deliberately non-interactive.
- **Layout**: two-column feed; long names wrap and codes use `overflow-wrap` safeguards.

## 6. Motion & Interaction

- Existing 150ms to 200ms color transitions are retained for interactive controls.
- No decorative animation is added to static equivalence rows.
- Search and filtering update results immediately without changing focus.
- All motion remains color/opacity-based and respects the application’s existing reduced-motion behavior.

## 7. Depth & Surface

The strategy is borders-only. Table and control containment use the semantic border token and existing rounded radii; no new shadows or glass effects are introduced.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- Target WCAG 2.2 AA with visible keyboard focus and native form semantics.
- Body text contrast is at least 4.5:1; non-text UI contrast is at least 3:1.
- Search, filter, tabs, and theme control are keyboard reachable.
- The page remains readable at 200% zoom and 375px width without primary-content horizontal scrolling.
- Empty and missing states are expressed in text.

### Accepted Debt

None for the equivalencies feature.
