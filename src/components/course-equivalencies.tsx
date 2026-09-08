import { createMemo, createSignal, For, Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent } from '@/components/ui/card';
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

const NAME_COLLATOR = new Intl.Collator('mk');
const ONE_TO_ONE_VIEW = 'one-to-one' as const;

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
        <div class="flex flex-wrap items-center gap-2">
          <Badge
            class="md:hidden"
            variant="outline"
          >
            Акредитација {props.rule.accreditation}
          </Badge>
          <Badge variant="secondary">Поврзани</Badge>
        </div>
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
      <div class="flex flex-wrap items-center gap-2">
        <Badge
          class="md:hidden"
          variant="outline"
        >
          Акредитација {props.rule.accreditation}
        </Badge>
        <Badge variant="secondary">
          {props.rule.kind === 'combination' ? 'Комбинација' : 'Насочена'}
        </Badge>
      </div>
      <Show when={props.rule.kind === 'combination'}>
        <div
          class="bg-muted/40 rounded-md border px-3 py-2 text-xs"
          role="note"
        >
          Условот важи само за изворните предмети: најмалку еден изворен предмет
          мора да е положен, а сите останати изворни предмети мора да се
          слушани/запишани. Целните предмети се признатиот исход на ова правило
          и не се условени со овој услов.
        </div>
      </Show>
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

/* eslint-disable max-lines-per-function -- this page owns both intentionally parallel responsive views */
export const CourseEquivalencies = (props: CourseEquivalenciesProps) => {
  const [search, setSearch] = createSignal('');
  const [view, setView] = createSignal<'similar' | typeof ONE_TO_ONE_VIEW>(
    ONE_TO_ONE_VIEW,
  );

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

  return (
    <section
      aria-labelledby="equivalencies-heading"
      class="space-y-4"
    >
      <div class="space-y-1">
        <h2
          class="text-lg font-semibold"
          id="equivalencies-heading"
        >
          <Show
            fallback="Сродни еквиваленции"
            when={view() === ONE_TO_ONE_VIEW}
          >
            1:1 еквиваленции
          </Show>
        </h2>
        <p class="text-muted-foreground text-sm">
          <Show
            fallback="Истражете ги поврзаните и насочените правила во секоја акредитација."
            when={view() === ONE_TO_ONE_VIEW}
          >
            Споредете ги предметите од акредитациите 2018 и 2023.
          </Show>
        </p>
      </div>

      <Show when={view() === ONE_TO_ONE_VIEW}>
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span>
            <strong>{equivalencies().renamedCount}</strong>{' '}
            <span class="text-muted-foreground">преименувани предмети</span>
          </span>
          <span>
            <strong>{equivalencies().oneSidedCount}</strong>{' '}
            <span class="text-muted-foreground">
              предмети само во една акредитација
            </span>
          </span>
        </div>
      </Show>

      <ButtonGroup
        aria-label="Поглед на еквиваленции"
        items={[
          { label: '1:1 еквиваленции', value: ONE_TO_ONE_VIEW },
          { label: 'Сродни еквиваленции', value: 'similar' },
        ]}
        onSelect={setView}
        value={view()}
      />

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

      <div class="flex flex-wrap items-center justify-between gap-3">
        <p
          aria-live="polite"
          class="text-muted-foreground text-sm"
        >
          <Show
            fallback={`Прикажани ${similarRules().length} правила`}
            when={view() === ONE_TO_ONE_VIEW}
          >
            Прикажани {filteredRows().length} од{' '}
            {
              equivalencies().rows.filter(
                (row) => row.accreditation2018 && row.accreditation2023,
              ).length
            }
          </Show>
        </p>
      </div>

      <Show
        fallback={
          <div class="space-y-3">
            <div class="hidden rounded-md border md:block">
              <Table class="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead>Правило</TableHead>
                    <TableHead>Предмети</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <For each={similarRules()}>
                    {(rule) => (
                      <TableRow>
                        <TableCell class="w-32 align-top">
                          <Badge variant="outline">{rule.accreditation}</Badge>
                        </TableCell>
                        <TableCell>
                          <SimilarRule rule={rule} />
                        </TableCell>
                      </TableRow>
                    )}
                  </For>
                </TableBody>
              </Table>
            </div>
            <div class="grid gap-3 md:hidden">
              <For each={similarRules()}>
                {(rule) => (
                  <Card>
                    <CardContent class="p-4">
                      <SimilarRule rule={rule} />
                    </CardContent>
                  </Card>
                )}
              </For>
            </div>
            <Show when={similarRules().length === 0}>
              <div class="rounded-md border p-8 text-center text-sm">
                Нема резултати.
              </div>
            </Show>
          </div>
        }
        when={view() === ONE_TO_ONE_VIEW}
      >
        <div class="rounded-md border">
          <Table class="table-fixed">
            <TableHeader>
              <TableRow class="hover:bg-transparent transition-none">
                <TableHead
                  class="w-1/2 border-r"
                  scope="col"
                >
                  Акредитација 2018
                </TableHead>
                <TableHead
                  class="w-1/2"
                  scope="col"
                >
                  Акредитација 2023
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Show
                fallback={
                  <TableRow class="hover:bg-transparent transition-none">
                    <TableCell
                      class="h-24 text-center"
                      colSpan={2}
                    >
                      Нема резултати.
                    </TableCell>
                  </TableRow>
                }
                when={filteredRows().length > 0}
              >
                <For each={filteredRows()}>
                  {(row) => (
                    <TableRow class="even:bg-muted/20 hover:bg-transparent even:hover:bg-muted/20 transition-none">
                      <TableCell class="min-w-0 border-r align-top whitespace-normal">
                        <CourseCell course={row.accreditation2018} />
                      </TableCell>
                      <TableCell class="min-w-0 align-top whitespace-normal">
                        <CourseCell course={row.accreditation2023} />
                      </TableCell>
                    </TableRow>
                  )}
                </For>
              </Show>
            </TableBody>
          </Table>
        </div>
      </Show>
    </section>
  );
};
/* eslint-enable max-lines-per-function -- end equivalencies page */
