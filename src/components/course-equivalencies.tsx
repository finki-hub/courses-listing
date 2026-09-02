import { createMemo, createSignal, For, Show } from 'solid-js';

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

export const CourseEquivalencies = (props: CourseEquivalenciesProps) => {
  const [search, setSearch] = createSignal('');
  const [onlyDifferences, setOnlyDifferences] = createSignal(false);

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
        (!onlyDifferences() || row.isDifferent) &&
        (!searchTerm || row.searchText.includes(searchTerm)),
    );
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
          Еквиваленции на предмети
        </h2>
        <p class="text-muted-foreground text-sm">
          Споредете ги предметите од акредитациите 2018 и 2023.
        </p>
      </div>

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
        <LabeledCheckbox
          checked={onlyDifferences()}
          class="rounded-md border px-3 py-2 font-medium"
          onChange={() => {
            setOnlyDifferences((current) => !current);
          }}
        >
          Само различни
        </LabeledCheckbox>
        <p
          aria-live="polite"
          class="text-muted-foreground text-sm"
        >
          Прикажани {filteredRows().length} од {equivalencies().rows.length}
        </p>
      </div>

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
    </section>
  );
};
