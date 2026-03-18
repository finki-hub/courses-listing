import { createMemo, createSignal, For, Show } from 'solid-js';

import { AccreditationSwitch } from '@/components/accreditation-switch';
import { CourseDetailDialog } from '@/components/course-detail-dialog';
import { SearchInput } from '@/components/ui/search-input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { buildReverseDependencyMap } from '@/lib/prerequisite';
import {
  matchesNormalizedSearch,
  normalizeSearchText,
} from '@/lib/search-normalization';
import { compareBySemesterAndName, STORAGE_KEY_ACC } from '@/lib/simulator';
import { usePersistedSignal } from '@/lib/use-persisted-signal';
import {
  type Accreditation,
  type CourseRaw,
  getAccreditationInfo,
  isAccreditation,
} from '@/types/course';

type AccCourse = {
  name: string;
  prerequisite: string | undefined;
  semester: number;
};

type PrerequisiteExplorerProps = {
  courses: CourseRaw[];
};

export const PrerequisiteExplorer = (props: PrerequisiteExplorerProps) => {
  const [accreditation, setAccreditation] = usePersistedSignal<Accreditation>(
    STORAGE_KEY_ACC,
    '2023',
    isAccreditation,
  );
  const [selectedCourse, setSelectedCourse] = createSignal<string>('');
  const [selectedModalCourse, setSelectedModalCourse] =
    createSignal<CourseRaw | null>(null);
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [search, setSearch] = createSignal('');

  const accCourses = createMemo<AccCourse[]>(() => {
    const acc = accreditation();
    const courses: AccCourse[] = [];
    for (const raw of props.courses) {
      const info = getAccreditationInfo(raw, acc);
      if (!info) continue;
      const name = info.name ?? raw.name;
      const semester = info.semester ? Number.parseInt(info.semester) : 0;
      courses.push({ name, prerequisite: info.prerequisite, semester });
    }
    courses.sort((a, b) => a.name.localeCompare(b.name, 'mk'));
    return courses;
  });

  const courseNames = createMemo(() => accCourses().map((c) => c.name));

  const reverseMap = createMemo(() =>
    buildReverseDependencyMap(accCourses(), courseNames()),
  );

  const rawCourseMap = createMemo(() => {
    const acc = accreditation();
    const map = new Map<string, CourseRaw>();
    for (const raw of props.courses) {
      const info = getAccreditationInfo(raw, acc);
      if (!info) continue;
      map.set(info.name ?? raw.name, raw);
    }
    return map;
  });

  const coursesWithDependents = createMemo(() => {
    const map = reverseMap();
    return courseNames().filter((n) => (map.get(n)?.length ?? 0) > 0);
  });

  const filteredPickerCourses = createMemo(() => {
    const term = normalizeSearchText(search());
    if (!term) return coursesWithDependents();
    return coursesWithDependents().filter((n) =>
      matchesNormalizedSearch(n, term),
    );
  });

  const dependents = createMemo<AccCourse[]>(() => {
    const sel = selectedCourse();
    if (!sel) return [];
    const list = reverseMap().get(sel) ?? [];
    return [...list].sort(compareBySemesterAndName);
  });

  const handleAccreditationChange = (acc: Accreditation) => {
    setAccreditation(acc);
    setSelectedCourse('');
    setSearch('');
  };

  const openDetail = (name: string) => {
    const course = rawCourseMap().get(name);
    if (!course) return;
    setSelectedModalCourse(course);
    setDialogOpen(true);
  };

  return (
    <div class="space-y-4">
      <p class="text-muted-foreground text-sm">
        Изберете акредитација и предмет за да ги видите сите предмети кои го
        имаат како предуслов.
      </p>

      <AccreditationSwitch
        accreditation={accreditation()}
        onSelect={handleAccreditationChange}
      />

      <div class="space-y-2">
        <span
          class="text-sm font-medium"
          id="course-search-label"
        >
          Изберете предмет
        </span>
        <SearchInput
          aria-labelledby="course-search-label"
          id="course-search"
          onInput={(e) => {
            setSearch(e.currentTarget.value);
            setSelectedCourse('');
          }}
          placeholder="Пребарувај предмети..."
          value={search()}
        />
        <Show when={!selectedCourse()}>
          <div class="max-h-60 overflow-y-auto rounded-md border">
            <For each={filteredPickerCourses()}>
              {(name) => (
                <button
                  class="hover:bg-muted w-full px-3 py-2 text-left text-sm transition-colors"
                  onClick={() => {
                    setSelectedCourse(name);
                    setSearch(name);
                  }}
                  type="button"
                >
                  {name}
                </button>
              )}
            </For>
            <Show when={search() && filteredPickerCourses().length === 0}>
              <div class="text-muted-foreground px-3 py-2 text-sm">
                Нема резултати
              </div>
            </Show>
          </div>
        </Show>
      </div>

      <Show when={selectedCourse()}>
        <div class="text-muted-foreground text-sm">
          {dependents().length} предмети го имаат{' '}
          <span class="text-foreground font-medium">{selectedCourse()}</span>{' '}
          како предуслов
        </div>

        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-15">Сем.</TableHead>
                <TableHead>Предмет</TableHead>
                <TableHead class="hidden sm:table-cell">Предуслов</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={dependents()}>
                {(course) => (
                  <TableRow
                    class="cursor-pointer"
                    onClick={() => {
                      openDetail(course.name);
                    }}
                  >
                    <TableCell class="whitespace-nowrap">
                      {course.semester}
                    </TableCell>
                    <TableCell class="font-medium">{course.name}</TableCell>
                    <TableCell class="text-muted-foreground hidden sm:table-cell">
                      {course.prerequisite ?? '—'}
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </div>
      </Show>

      <CourseDetailDialog
        course={selectedModalCourse()}
        onOpenChange={setDialogOpen}
        open={dialogOpen()}
      />
    </div>
  );
};
