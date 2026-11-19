import { ArrowLeft, Network } from 'lucide-solid';
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
  untrack,
} from 'solid-js';

import { AccreditationSwitch } from '@/components/accreditation-switch';
import { CourseDetailDialog } from '@/components/course-detail-dialog';
import { PrerequisiteMap } from '@/components/prerequisite-map';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchInput } from '@/components/ui/search-input';
import { useLinkedCourseDialog } from '@/components/use-linked-course-dialog';
import { getCourseIdentityFields } from '@/lib/course-filters';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  findCourseByLinkValue,
  getCourseLinkValue,
  replaceUrlParams,
} from '@/lib/listing-url-state';
import {
  buildPrerequisiteGraph,
  collectLayers,
  type GraphCourse,
  PREREQUISITE_FOCUS_PARAM,
} from '@/lib/prerequisite-graph';
import {
  matchesNormalizedTerm,
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

type PrerequisiteExplorerProps = {
  courses: CourseRaw[];
};

const NAME_COLLATOR = new Intl.Collator('mk');
const ACCREDITATIONS: readonly Accreditation[] = ['2023', '2018'];

// The picker finds a course by its names, abbreviation or codes, like the
// listing search without the staff.
const createPickerMatcher = (
  rawCourses: ReadonlyMap<string, CourseRaw>,
  searchTerm: string,
): ((name: string) => boolean) => {
  const term = normalizeSearchText(searchTerm);
  if (!term) return () => true;
  return (name) => {
    const raw = rawCourses.get(name);
    const fields = raw ? getCourseIdentityFields(raw) : [];
    return [name, ...fields].some((value) =>
      matchesNormalizedTerm(value, term),
    );
  };
};

// The name a course goes by in an accreditation, if it is part of it.
const nameIn = (
  course: CourseRaw,
  accreditation: Accreditation,
): string | undefined => {
  const info = getAccreditationInfo(course, accreditation);
  return info ? (info.name ?? course.name) : undefined;
};

type MapPlace = { accreditation: Accreditation; name: string };

// Where a course sits on the map: the preferred accreditation if it has the
// course, otherwise another one that does.
const findOnMap = (
  course: CourseRaw,
  preferred: Accreditation,
): MapPlace | undefined => {
  for (const accreditation of [preferred, ...ACCREDITATIONS]) {
    const name = nameIn(course, accreditation);
    if (name) return { accreditation, name };
  }
  return undefined;
};

// The course linked through `?focus=`, and the accreditation that has it.
const readLinkedFocus = (
  courses: readonly CourseRaw[],
  preferred: Accreditation,
): MapPlace | undefined => {
  const course = findCourseByLinkValue(
    courses,
    new URL(location.href).searchParams.get(PREREQUISITE_FOCUS_PARAM),
  );
  return course ? findOnMap(course, preferred) : undefined;
};

// Search for a course, with the matches listed until one is chosen.
const CoursePicker = (props: {
  courses: string[];
  onChoose: (name: string) => void;
  onSearch: (value: string) => void;
  open: boolean;
  search: string;
}) => {
  const { t } = useLanguage();
  return (
    <div class="space-y-2">
      <span
        class="text-sm font-medium"
        id="course-search-label"
      >
        {t().prerequisites.chooseCourse}
      </span>
      <SearchInput
        aria-labelledby="course-search-label"
        id="course-search"
        onInput={(e) => {
          props.onSearch(e.currentTarget.value);
        }}
        placeholder={t().prerequisites.searchPlaceholder}
        value={props.search}
      />
      <Show when={props.open}>
        <div class="bg-card max-h-60 overflow-y-auto rounded-lg border">
          <For each={props.courses}>
            {(name) => (
              <button
                class="hover:bg-muted w-full px-3 py-2 text-left text-sm transition-colors"
                onClick={() => {
                  props.onChoose(name);
                }}
                type="button"
              >
                {name}
              </button>
            )}
          </For>
          <Show when={props.search && props.courses.length === 0}>
            <div class="text-muted-foreground px-3 py-2 text-sm">
              {t().common.noResults}
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};

// Before a course is chosen: what choosing one shows.
const PrerequisitesStart = () => {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon={<Network />}
      text={t().prerequisites.emptyText}
      title={t().prerequisites.emptyTitle}
    />
  );
};

export const PrerequisiteExplorer = (props: PrerequisiteExplorerProps) => {
  const { t } = useLanguage();

  const [savedAccreditation, saveAccreditation] =
    usePersistedSignal<Accreditation>(STORAGE_KEY_ACC, '2023', isAccreditation);
  const linked = readLinkedFocus(
    untrack(() => props.courses),
    untrack(savedAccreditation),
  );
  // A link may show another accreditation; only a choice made here is saved.
  const [accreditation, setAccreditation] = createSignal(
    linked?.accreditation ?? untrack(savedAccreditation),
  );

  const [focus, setFocus] = createSignal(linked?.name ?? '');
  // The courses moved away from, for going back along the map.
  const [trail, setTrail] = createSignal<string[]>([]);
  const [search, setSearch] = createSignal(linked?.name ?? '');
  const courseDialog = useLinkedCourseDialog(() => props.courses);
  let mapTop: HTMLDivElement | undefined;

  const rawCourseMap = createMemo(() => {
    const acc = accreditation();
    const map = new Map<string, CourseRaw>();
    for (const raw of props.courses) {
      const name = nameIn(raw, acc);
      if (name) map.set(name, raw);
    }
    return map;
  });

  const accCourses = createMemo(() => {
    const acc = accreditation();
    const courses = new Map<string, GraphCourse>();
    for (const [name, raw] of rawCourseMap()) {
      const info = getAccreditationInfo(raw, acc);
      courses.set(name, {
        name,
        prerequisite: info?.prerequisite,
        semester: info?.semester ? Number.parseInt(info.semester, 10) : 0,
      });
    }
    return courses;
  });

  const graph = createMemo(() =>
    buildPrerequisiteGraph(accCourses().values().toArray()),
  );

  const pickerCourses = createMemo(() =>
    accCourses()
      .keys()
      .toArray()
      .toSorted((a, b) => NAME_COLLATOR.compare(a, b))
      .filter(createPickerMatcher(rawCourseMap(), search())),
  );

  const toLayers = (layers: string[][]): GraphCourse[][] =>
    layers.map((names) =>
      names
        .map((name) => accCourses().get(name))
        .filter((course) => course !== undefined)
        .toSorted(compareBySemesterAndName),
    );

  const focusCourse = () => accCourses().get(focus());
  const requires = createMemo(() =>
    toLayers(collectLayers(focus(), graph().requires)),
  );
  const unlocks = createMemo(() =>
    toLayers(collectLayers(focus(), graph().unlocks)),
  );

  createEffect(() => {
    const raw = rawCourseMap().get(focus());
    replaceUrlParams((params) => {
      if (raw) params.set(PREREQUISITE_FOCUS_PARAM, getCourseLinkValue(raw));
      else params.delete(PREREQUISITE_FOCUS_PARAM);
    });
  });

  const choose = (name: string) => {
    setTrail([]);
    setFocus(name);
    setSearch(name);
  };

  // Moves the map to a course on it, and brings the new middle into view.
  const moveTo = (name: string) => {
    const current = focus();
    if (current) setTrail((previous) => [...previous, current]);
    setFocus(name);
    setSearch(name);
    mapTop?.scrollIntoView({ block: 'nearest' });
  };

  const goBack = () => {
    const previous = trail().at(-1);
    if (previous === undefined) return;
    setTrail((current) => current.slice(0, -1));
    setFocus(previous);
    setSearch(previous);
    mapTop?.scrollIntoView({ block: 'nearest' });
  };

  const handleAccreditationChange = (acc: Accreditation) => {
    setAccreditation(acc);
    saveAccreditation(acc);
    choose('');
  };

  const openDetail = (name: string) => {
    const course = rawCourseMap().get(name);
    if (course) courseDialog.openCourse(course);
  };

  // From the course panel: centre the map on that course.
  const showOnMap = (course: CourseRaw) => {
    const place = findOnMap(course, accreditation());
    if (!place) return;
    courseDialog.setOpen(false);
    if (place.accreditation !== accreditation()) {
      setAccreditation(place.accreditation);
      choose(place.name);
    } else if (place.name !== focus()) {
      moveTo(place.name);
    }
  };

  return (
    <div class="space-y-4">
      <AccreditationSwitch
        accreditation={accreditation()}
        onSelect={handleAccreditationChange}
      />

      <CoursePicker
        courses={pickerCourses()}
        onChoose={choose}
        onSearch={(value) => {
          setSearch(value);
          setFocus('');
          setTrail([]);
        }}
        open={!focusCourse()}
        search={search()}
      />

      <Show
        fallback={<PrerequisitesStart />}
        when={focusCourse()}
      >
        {(course) => (
          <div
            class="scroll-mt-[calc(var(--tabbar-h,0px)+1rem)] space-y-3"
            ref={(element) => {
              mapTop = element;
            }}
          >
            <Show when={trail().at(-1)}>
              {(previous) => (
                <button
                  class="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-md text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  onClick={goBack}
                  type="button"
                >
                  <ArrowLeft
                    aria-hidden="true"
                    class="h-4 w-4"
                  />
                  {interpolate(t().detail.back, { course: previous() })}
                </button>
              )}
            </Show>
            <PrerequisiteMap
              focus={course()}
              onFocus={moveTo}
              onOpenDetails={() => {
                openDetail(course().name);
              }}
              requires={requires()}
              unlocks={unlocks()}
            />
          </div>
        )}
      </Show>

      <CourseDetailDialog
        accreditation={accreditation()}
        course={courseDialog.course()}
        courses={props.courses}
        onOpenChange={courseDialog.setOpen}
        onOpenCourse={courseDialog.openCourse}
        onShowPrerequisites={showOnMap}
        open={courseDialog.open()}
      />
    </div>
  );
};
