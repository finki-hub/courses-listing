import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  Show,
} from 'solid-js';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { parsePrerequisite, type PrereqNode } from '@/lib/prerequisite';
import { type Accreditation, STORAGE_KEY_ACC } from '@/lib/simulator';
import { type CourseRaw, getAccreditationInfo } from '@/types/course';

type AccCourse = {
  name: string;
  prerequisite: string | undefined;
  semester: number;
};

type AccreditationSwitchProps = {
  accreditation: Accreditation;
  onSelect: (accreditation: Accreditation) => void;
};

type PrerequisiteExplorerProps = {
  courses: CourseRaw[];
};

const collectCourseNames = (node: PrereqNode): string[] => {
  switch (node.type) {
    case 'and':
    case 'or':
      return node.children.flatMap(collectCourseNames);
    case 'course':
      return [node.name];
    default:
      return [];
  }
};

const AccreditationSwitch = (props: AccreditationSwitchProps) => (
  <div
    class="inline-flex rounded-md border"
    role="group"
  >
    <button
      class={`rounded-l-md px-4 py-2 text-sm font-medium transition-colors ${
        props.accreditation === '2023'
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted'
      }`}
      onClick={() => {
        props.onSelect('2023');
      }}
      type="button"
    >
      Акредитација 2023
    </button>
    <button
      class={`rounded-r-md px-4 py-2 text-sm font-medium transition-colors ${
        props.accreditation === '2018'
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted'
      }`}
      onClick={() => {
        props.onSelect('2018');
      }}
      type="button"
    >
      Акредитација 2018
    </button>
  </div>
);

export const PrerequisiteExplorer = (props: PrerequisiteExplorerProps) => {
  const savedAcc =
    (localStorage.getItem(STORAGE_KEY_ACC) as Accreditation | null) ?? '2023';

  const [accreditation, setAccreditation] =
    createSignal<Accreditation>(savedAcc);
  const [selectedCourse, setSelectedCourse] = createSignal<string>('');
  const [search, setSearch] = createSignal('');

  createEffect(
    on(accreditation, (acc) => {
      localStorage.setItem(STORAGE_KEY_ACC, acc);
    }),
  );

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

  const reverseMap = createMemo<Map<string, AccCourse[]>>(() => {
    const map = new Map<string, AccCourse[]>();
    const names = courseNames();
    for (const course of accCourses()) {
      const node = parsePrerequisite(course.prerequisite, names);
      const prereqNames = collectCourseNames(node);
      for (const pn of prereqNames) {
        let list = map.get(pn);
        if (!list) {
          list = [];
          map.set(pn, list);
        }
        list.push(course);
      }
    }
    return map;
  });

  const coursesWithDependents = createMemo(() => {
    const map = reverseMap();
    return courseNames().filter((n) => (map.get(n)?.length ?? 0) > 0);
  });

  const filteredPickerCourses = createMemo(() => {
    const term = search().toLowerCase();
    if (!term) return coursesWithDependents();
    return coursesWithDependents().filter((n) =>
      n.toLowerCase().includes(term),
    );
  });

  const dependents = createMemo<AccCourse[]>(() => {
    const sel = selectedCourse();
    if (!sel) return [];
    const list = reverseMap().get(sel) ?? [];
    return [...list].sort(
      (a, b) => a.semester - b.semester || a.name.localeCompare(b.name, 'mk'),
    );
  });

  const handleAccreditationChange = (acc: Accreditation) => {
    setAccreditation(acc);
    setSelectedCourse('');
    setSearch('');
  };

  return (
    <div class="space-y-4">
      <p class="text-muted-foreground text-sm">
        Изберете акредитација и предмет за да ги видите сите предмети кои го
        имаат како предуслов.
      </p>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <AccreditationSwitch
          accreditation={accreditation()}
          onSelect={handleAccreditationChange}
        />
      </div>

      <div class="space-y-2">
        <label
          class="text-sm font-medium"
          for="course-select"
        >
          Изберете предмет
        </label>
        <input
          class="bg-background border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          id="course-search"
          onInput={(e) => {
            setSearch(e.currentTarget.value);
            setSelectedCourse('');
          }}
          placeholder="Пребарувај предмети..."
          type="text"
          value={search()}
        />
        <Show when={search() && !selectedCourse()}>
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
            <Show when={filteredPickerCourses().length === 0}>
              <div class="text-muted-foreground px-3 py-2 text-sm">
                Нема резултати
              </div>
            </Show>
          </div>
        </Show>
        <Show when={!search()}>
          <div class="max-h-60 overflow-y-auto rounded-md border">
            <For each={coursesWithDependents()}>
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
                  <TableRow>
                    <TableCell>{course.semester}</TableCell>
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
    </div>
  );
};
