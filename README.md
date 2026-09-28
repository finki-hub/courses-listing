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

## Analytics linkage

`catalog_search` retains its existing raw `query` and `result_count`. After
500 ms of stable nonempty query/filter/sort state it receives a new opaque
`search_attempt_id`; `search_zero_results` shares that ID when the count is zero.
Filter/sort changes now count as new attempts when a query is nonempty. Counts
therefore describe settled search states, not just text edits.

`result_clicked` retains its existing zero-based `position` and course-name
`result_id`. It receives linkage only for the current settled attempt. Clicks
before debounce, after clearing, or during a changed state remain unlinked.
Returning to an older query creates a new attempt. Tag values and local state
keys are not sent. A click is not a relevance or success label.

Vite bakes GitHub Actions' `GITHUB_SHA` into `VITE_APP_REVISION` at build time.
The existing deployment workflow checks out the triggering commit before the
build. PostHog's final `before_send` hook overwrites caller revision properties
with that value only when it is a full lowercase 40-character hex SHA; otherwise
it removes the property. Local/non-GitHub builds omit it. This is the app build
revision, not a dataset revision. No deployment environment is inferred.

Run `npm test` on Node 24+ for real Solid reactive lifecycle/fake-timer tests and
revision validation (Node's module mocking is experimental), then `npm run check`,
`npm run lint`, and `npm run build`. These checks do not verify production event
delivery, retention, dashboards, or remote replay settings.

### Capture boundary

Only `catalog_search`, `search_zero_results`, and `result_clicked` are sent.
The final SDK hook rebuilds the event and properties from an allowlist, removing
automatic URL/referrer/campaign data, simulator share-state metadata, nested
extras, and top-level `$set`, `$set_once`, and `$unset` updates.

Allowed business properties are raw `query` and `result_count` for searches,
raw `query` for zero results, and zero-based `position` and public course-name
`result_id` for clicks. UUID-shaped `search_attempt_id` links the existing events.
Technical fields retained are the event UUID/timestamp, public ingest token,
SDK name/version, UUID-shaped distinct/device/session/window IDs, constant
`service`, trusted `app_revision`, and a false person-profile processing flag.

Autocapture, automatic exceptions, pageviews/pageleave, replay, performance,
heatmaps, campaign/referrer saving, and remote-config/feature-flag fetching are
disabled locally. External SDK script loading, surveys, tours, conversations,
and person profiles are disabled. Separate log/metric hooks drop those payloads
because they bypass the event hook. SDK opt-out continues to suppress captures.

Raw queries deliberately remain raw (including any sensitive text or URL a user
types into search), and existing SDK identifiers/cookies remain. This is neither
anonymous nor metadata-only collection. Existing local SDK attribution storage
and previously collected data are not purged. Retention, notice/consent, server
enrichment, and project-wide privacy settings remain separate follow-ups.

Tests intercept the real installed SDK's serialized fetch payloads with a fake
key and sentinel study-plan URL; no analytics requests leave the test process.
They verify the payload boundary, disabled replay configuration after a simulated
remote response, and opted-out search behavior. They do not exercise a real DOM
recorder, live ingestion, browser-generated HTTP headers, or production settings.

## License

This project is licensed under the terms of the MIT license.
