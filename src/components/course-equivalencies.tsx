import { createMemo, createSignal, For, Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { LabeledCheckbox } from '@/components/ui/labeled-checkbox';
import { SearchInput } from '@/components/ui/search-input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  resolveSimilarEquivalencies,
  type SimilarCourse,
  type SimilarEquivalency,
} from '@/data/course-similar-equivalencies';
import { normalizeSearchText } from '@/lib/search-normalization';
import { type CourseRaw, getAccreditationInfo } from '@/types/course';

type CourseEquivalenciesProps = {
  readonly courses: CourseRaw[];
};

type EquivalencyCourse = {
  readonly code: string | undefined;
  readonly name: string;
};

type EquivalencyRow = {
  readonly accreditation2018: EquivalencyCourse | undefined;
  readonly accreditation2023: EquivalencyCourse | undefined;
  readonly isDifferent: boolean;
  readonly searchText: string;
};

type UnifiedRule =
  | { kind: 'one-to-one'; row: EquivalencyRow }
  | { kind: 'similar'; rule: SimilarEquivalency };

const NAME_COLLATOR = new Intl.Collator('mk');

const CourseCell = (props: {
  readonly course: EquivalencyCourse | undefined;
}) => (
  <Show
    fallback={<span class="text-muted-foreground italic">Нема предмет</span>}
    when={props.course}
  >
    {(course) => (
      <div class="min-w-0 space-y-1">
        <div class="text-pretty break-words font-medium">{course().name}</div>
        <Show when={course().code}>
          {(code) => (
            <div class="text-muted-foreground font-mono text-xs break-all">
              {code()}
            </div>
          )}
        </Show>
      </div>
    )}
  </Show>
);

const OneToOneRelationship = (props: { row: EquivalencyRow }) => (
  <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
    <CourseCell course={props.row.accreditation2018} />
    <span
      aria-label="еквивалентен помеѓу акредитациите 2018 и 2023"
      class="text-primary text-center text-lg font-semibold"
    >
      <span aria-hidden="true">↔</span>
      <span class="sr-only">е еквивалентен со</span>
    </span>
    <CourseCell course={props.row.accreditation2023} />
  </div>
);

const SimilarCourseList = (props: { courses: SimilarCourse[] }) => (
  <div class="space-y-2">
    <For each={props.courses}>
      {(course) => (
        <div class="min-w-0">
          <div class="text-pretty break-words font-medium">{course.name}</div>
          <div class="text-muted-foreground font-mono text-xs break-all">
            {course.code}
          </div>
        </div>
      )}
    </For>
  </div>
);

/* eslint-disable solid/components-return-once, solid/reactivity -- conditional course rule markup must preserve discriminated types */
const SimilarRule = (props: { rule: SimilarEquivalency }) => {
  if (props.rule.kind === 'related') {
    const courses = props.rule.courses;
    return (
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <For each={courses}>
            {(course, index) => (
              <>
                <SimilarCourseList courses={[course]} />
                <Show when={index() < courses.length - 1}>
                  <span
                    aria-hidden="true"
                    class="text-primary text-lg font-semibold"
                  >
                    ↔
                  </span>
                  <span class="sr-only">е еквивалентен со</span>
                </Show>
              </>
            )}
          </For>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-3">
      <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <SimilarCourseList courses={props.rule.sources} />
        <span
          aria-label={
            props.rule.kind === 'combination'
              ? 'изворни предмети кон целни предмети'
              : 'изворен предмет кон целен предмет'
          }
          class="text-primary text-center text-lg font-semibold"
        >
          <span class="sm:hidden">
            {props.rule.kind === 'combination' ? '+ ↓' : '↓'}
          </span>
          <span class="hidden sm:inline">
            {props.rule.kind === 'combination' ? '+ →' : '→'}
          </span>
        </span>
        <SimilarCourseList courses={props.rule.targets} />
      </div>
    </div>
  );
};
/* eslint-enable solid/components-return-once, solid/reactivity -- end conditional rule markup */

const mergeCombinationRules = (
  rules: readonly SimilarEquivalency[],
): SimilarEquivalency[] => {
  const merged: SimilarEquivalency[] = [];
  const combinationIndexes = new Map<string, number>();

  for (const rule of rules) {
    if (rule.kind !== 'combination') {
      merged.push(rule);
      continue;
    }

    const key = `${rule.accreditation}:${rule.sources.map((course) => course.code).join('|')}`;
    const existingIndex = combinationIndexes.get(key);
    const existing =
      existingIndex === undefined ? undefined : merged[existingIndex];
    if (existing?.kind === 'combination') {
      existing.targets.push(...rule.targets);
      continue;
    }

    combinationIndexes.set(key, merged.length);
    merged.push({
      accreditation: rule.accreditation,
      kind: 'combination',
      sources: rule.sources,
      targets: [...rule.targets],
    });
  }

  return merged;
};

/* eslint-disable solid/components-return-once, solid/reactivity -- table cells branch on a discriminated rule entry */
const similarRuleLabel = (rule: SimilarEquivalency): string => {
  if (rule.kind === 'related') return 'Сродни';
  if (rule.kind === 'combination') return 'Комбинација';
  return 'Насочена';
};

const UnifiedTypeCell = (props: { entry: UnifiedRule }) => {
  if (props.entry.kind === 'one-to-one') {
    return (
      <div class="space-y-2">
        <Badge variant="secondary">1:1</Badge>
        <div class="text-muted-foreground text-xs">2018 ↔ 2023</div>
      </div>
    );
  }

  return (
    <div class="space-y-2">
      <Badge variant="secondary">{similarRuleLabel(props.entry.rule)}</Badge>
      <div class="text-muted-foreground text-xs">
        Акредитација {props.entry.rule.accreditation}
      </div>
    </div>
  );
};

const UnifiedRelationshipCell = (props: { entry: UnifiedRule }) => {
  if (props.entry.kind === 'one-to-one') {
    return <OneToOneRelationship row={props.entry.row} />;
  }

  return <SimilarRule rule={props.entry.rule} />;
};
/* eslint-enable solid/components-return-once, solid/reactivity -- end table rule cells */

/* eslint-disable max-lines-per-function -- this page owns both intentionally parallel responsive views */
export const CourseEquivalencies = (props: CourseEquivalenciesProps) => {
  const [search, setSearch] = createSignal('');
  const [showOneToOne, setShowOneToOne] = createSignal(true);
  const [showSimilar, setShowSimilar] = createSignal(true);

  const equivalencies = createMemo(() => {
    const rows: EquivalencyRow[] = [];
    let renamedCount = 0;
    let oneSidedCount = 0;

    for (const course of props.courses) {
      const info2018 = getAccreditationInfo(course, '2018');
      const info2023 = getAccreditationInfo(course, '2023');
      if (!(info2018 || info2023)) continue;

      const accreditation2018 = info2018
        ? { code: info2018.code, name: info2018.name ?? course.name }
        : undefined;
      const accreditation2023 = info2023
        ? { code: info2023.code, name: info2023.name ?? course.name }
        : undefined;
      const isRenamed =
        accreditation2018 !== undefined &&
        accreditation2023 !== undefined &&
        accreditation2018.name !== accreditation2023.name;
      const isOneSided =
        (accreditation2018 === undefined) !== (accreditation2023 === undefined);

      if (isRenamed) renamedCount += 1;
      if (isOneSided) oneSidedCount += 1;

      rows.push({
        accreditation2018,
        accreditation2023,
        isDifferent: isRenamed || isOneSided,
        searchText: normalizeSearchText(
          [
            accreditation2018?.name,
            accreditation2018?.code,
            accreditation2023?.name,
            accreditation2023?.code,
          ]
            .filter((value) => value !== undefined)
            .join(' '),
        ),
      });
    }

    rows.sort((left, right) =>
      NAME_COLLATOR.compare(
        left.accreditation2023?.name ?? left.accreditation2018?.name ?? '',
        right.accreditation2023?.name ?? right.accreditation2018?.name ?? '',
      ),
    );

    return { oneSidedCount, renamedCount, rows };
  });

  const filteredRows = createMemo(() => {
    const searchTerm = normalizeSearchText(search());
    return equivalencies().rows.filter(
      (row) =>
        row.accreditation2018 !== undefined &&
        row.accreditation2023 !== undefined &&
        (!searchTerm || row.searchText.includes(searchTerm)),
    );
  });

  const similarRules = createMemo(() => {
    const term = normalizeSearchText(search());
    return resolveSimilarEquivalencies(props.courses).filter((rule) => {
      const courses =
        rule.kind === 'related'
          ? rule.courses
          : [...rule.sources, ...rule.targets];
      return (
        !term ||
        courses.some((course) =>
          normalizeSearchText(`${course.name} ${course.code}`).includes(term),
        )
      );
    });
  });

  const hasCombinationRules = createMemo(() =>
    resolveSimilarEquivalencies(props.courses).some(
      (rule) => rule.kind === 'combination',
    ),
  );

  const unifiedRules = createMemo<UnifiedRule[]>(() => [
    ...(showOneToOne()
      ? filteredRows().map((row) => ({ kind: 'one-to-one' as const, row }))
      : []),
    ...(showSimilar()
      ? mergeCombinationRules(similarRules()).map((rule) => ({
          kind: 'similar' as const,
          rule,
        }))
      : []),
  ]);

  const combinationRulesEnabled = createMemo(
    () => showSimilar() && hasCombinationRules(),
  );
  const selectedRuleCount = createMemo(
    () =>
      (showOneToOne() ? filteredRows().length : 0) +
      (showSimilar() ? similarRules().length : 0),
  );

  return (
    <section
      aria-labelledby="equivalencies-heading"
      class="space-y-4"
    >
      <h2
        class="text-lg font-semibold"
        id="equivalencies-heading"
      >
        Еквиваленции на предмети
      </h2>

      <div class="flex flex-wrap gap-2">
        <LabeledCheckbox
          checked={showOneToOne()}
          class="rounded-md border px-3 py-2 font-medium"
          onChange={() => setShowOneToOne((current) => !current)}
        >
          1:1 еквиваленции
        </LabeledCheckbox>
        <LabeledCheckbox
          checked={showSimilar()}
          class="rounded-md border px-3 py-2 font-medium"
          onChange={() => setShowSimilar((current) => !current)}
        >
          Сродни еквиваленции
        </LabeledCheckbox>
      </div>

      <div class="space-y-1">
        <p class="text-muted-foreground text-sm">
          Споредете ги предметите од акредитациите 2018 и 2023 или истражете ги
          сродните правила во секоја акредитација.
        </p>
        <p
          aria-live="polite"
          class="text-muted-foreground text-sm"
        >
          Прикажани {selectedRuleCount()} правила · 1:1:{' '}
          {showOneToOne() ? filteredRows().length : 0} · сродни:{' '}
          {showSimilar() ? similarRules().length : 0}
        </p>
      </div>

      <div class="space-y-2">
        <label
          class="text-sm font-medium"
          for="equivalencies-search"
        >
          Пребарувај предмет или код
        </label>
        <SearchInput
          id="equivalencies-search"
          onInput={(event) => {
            setSearch(event.currentTarget.value);
          }}
          placeholder="Пребарувај на кирилица или латиница..."
          value={search()}
        />
      </div>

      <Show when={combinationRulesEnabled()}>
        <div
          class="bg-muted/40 flex gap-3 rounded-md border p-3 text-sm"
          role="note"
        >
          <span
            aria-hidden="true"
            class="text-primary text-lg leading-none"
          >
            ⓘ
          </span>
          <p>
            Комбинациските правила: условот за положување и слушање важи само за
            изворните предмети. Најмалку еден изворен предмет мора да е положен,
            а сите останати мора да се слушани/запишани; целните предмети се
            признатиот исход на правилото.
          </p>
        </div>
      </Show>

      <Show
        fallback={
          <div class="rounded-md border p-8 text-center text-sm">
            Нема резултати.
          </div>
        }
        when={unifiedRules().length > 0}
      >
        <div class="overflow-x-auto rounded-md border">
          <Table class="w-full table-fixed">
            <TableHeader>
              <TableRow class="hover:bg-transparent transition-none">
                <TableHead
                  class="w-28 border-r pr-2 whitespace-normal break-words leading-tight sm:w-36"
                  scope="col"
                >
                  Вид / акредитација
                </TableHead>
                <TableHead
                  class="pl-2 whitespace-normal break-words leading-tight"
                  scope="col"
                >
                  Однос помеѓу предметите
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={unifiedRules()}>
                {(entry) => (
                  <TableRow class="even:bg-muted/20 hover:bg-transparent even:hover:bg-muted/20 transition-none">
                    <TableCell class="border-r align-top pr-2">
                      <UnifiedTypeCell entry={entry} />
                    </TableCell>
                    <TableCell class="min-w-0 align-top whitespace-normal pl-2">
                      <UnifiedRelationshipCell entry={entry} />
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </div>
      </Show>
    </section>
  );
};
/* eslint-enable max-lines-per-function -- end equivalencies page */
