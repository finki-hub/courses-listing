import { ChevronDown } from 'lucide-solid';
import {
  createSignal,
  createUniqueId,
  For,
  type JSX,
  Show,
  untrack,
} from 'solid-js';

import { EmptyState } from '@/components/ui/empty-state';
import { formatCount, interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  type CurriculumGroup,
  type CurriculumSemester,
  isLongGroup,
} from '@/lib/master-curriculum';
import { type ProgramCourse } from '@/lib/master-programs';
import { type CourseRaw, getCourseName } from '@/types/course';

const ROW_CLASS =
  'flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm';

type CourseLineProps = {
  readonly course: CourseRaw | undefined;
  readonly entry: ProgramCourse;
  readonly onOpen: (course: CourseRaw) => void;
};

// A course of the program; it opens the course's details when it is known.
const CourseLine = (props: CourseLineProps) => {
  const { language, t } = useLanguage();
  const name = () =>
    props.course === undefined
      ? props.entry.course
      : getCourseName(props.course, null, language());
  const content = (): JSX.Element => (
    <>
      <span class="min-w-0 font-medium wrap-break-word">{name()}</span>
      <span class="text-muted-foreground shrink-0 text-right text-xs tabular-nums">
        {[
          props.entry.credits === null
            ? ''
            : interpolate(t().listing.creditsValue, {
                value: props.entry.credits,
              }),
          props.entry.code ?? '',
        ]
          .filter((part) => part !== '')
          .join(' · ')}
      </span>
    </>
  );
  return (
    <li>
      <Show
        fallback={<div class={ROW_CLASS}>{content()}</div>}
        when={props.course}
      >
        {(course) => (
          <button
            class={`${ROW_CLASS} hover:bg-muted/50 focus-visible:ring-ring cursor-pointer transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset`}
            onClick={() => {
              props.onOpen(course());
            }}
            type="button"
          >
            {content()}
          </button>
        )}
      </Show>
    </li>
  );
};

type CourseListProps = {
  readonly entries: readonly ProgramCourse[];
  readonly findCourse: (entry: ProgramCourse) => CourseRaw | undefined;
  readonly onOpen: (course: CourseRaw) => void;
};

const CourseList = (props: CourseListProps) => (
  <ul class="divide-y">
    <For each={props.entries}>
      {(entry) => (
        <CourseLine
          course={props.findCourse(entry)}
          entry={entry}
          onOpen={props.onOpen}
        />
      )}
    </For>
  </ul>
);

type GroupProps = CourseListProps & {
  readonly group: CurriculumGroup;
};

// One elective list with its size. The long faculty-wide lists are a
// disclosure that starts closed.
const ElectiveGroupBlock = (props: GroupProps) => {
  const { language, t } = useLanguage();
  const [open, setOpen] = createSignal(
    !untrack(() => isLongGroup(props.group)),
  );
  const bodyId = createUniqueId();
  const label = () =>
    props.group.kind === 'named'
      ? (props.group.name ?? t().masters.electiveGroups.other)
      : t().masters.electiveGroups[props.group.kind];
  const count = () =>
    formatCount(t().masters.curriculum.courseCount, {
      count: props.group.entries.length,
      language: language(),
    });

  return (
    <div class="border-t first:border-t-0">
      <h5>
        <button
          aria-controls={bodyId}
          aria-expanded={open()}
          class="hover:bg-muted/50 focus-visible:ring-ring flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
          onClick={() => {
            setOpen((value) => !value);
          }}
          type="button"
        >
          <span class="min-w-0 wrap-break-word">
            {label()}
            <span class="text-muted-foreground font-normal"> · {count()}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            class={`text-muted-foreground h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none ${open() ? 'rotate-180' : ''}`}
          />
        </button>
      </h5>
      <div
        class="border-t"
        hidden={!open()}
        id={bodyId}
      >
        <CourseList
          entries={props.group.entries}
          findCourse={props.findCourse}
          onOpen={props.onOpen}
        />
      </div>
    </div>
  );
};

type SemesterProps = Omit<CourseListProps, 'entries'> & {
  readonly semester: CurriculumSemester;
};

const SemesterSection = (props: SemesterProps) => {
  const { t } = useLanguage();
  const title = () =>
    props.semester.semester === null
      ? t().masters.curriculum.unplaced
      : interpolate(t().listing.semesterValue, {
          value: props.semester.semester,
        });
  const headingId = createUniqueId();

  return (
    <section
      aria-labelledby={headingId}
      class="bg-card overflow-hidden rounded-lg border"
    >
      <h4
        class="bg-muted/40 border-b px-3 py-2.5 text-base font-semibold"
        id={headingId}
      >
        {title()}
      </h4>
      <Show when={props.semester.mandatory.length > 0}>
        <div class="border-b">
          <h5 class="text-muted-foreground px-3 pt-2.5 text-xs font-semibold tracking-wide uppercase">
            {t().masters.mandatory}
          </h5>
          <CourseList
            entries={props.semester.mandatory}
            findCourse={props.findCourse}
            onOpen={props.onOpen}
          />
        </div>
      </Show>
      <For each={props.semester.electives}>
        {(group) => (
          <ElectiveGroupBlock
            entries={group.entries}
            findCourse={props.findCourse}
            group={group}
            onOpen={props.onOpen}
          />
        )}
      </For>
    </section>
  );
};

type MasterCurriculumProps = {
  readonly ects: null | number;
  /** Shown in place of semesters when there are none. */
  readonly empty?: JSX.Element;
  readonly findCourse: (entry: ProgramCourse) => CourseRaw | undefined;
  readonly onOpen: (course: CourseRaw) => void;
  readonly semesters: readonly CurriculumSemester[];
  readonly title: string;
};

// A master's program by semester: the title and size, then each semester's
// mandatory courses and elective lists.
export const MasterCurriculum = (props: MasterCurriculumProps) => {
  const { t } = useLanguage();
  return (
    <div class="space-y-3">
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 class="text-section min-w-0 font-semibold wrap-break-word">
          {props.title}
        </h3>
        <Show when={props.ects}>
          {(ects) => (
            <p class="text-muted-foreground text-sm">
              {interpolate(t().masters.curriculum.ects, { ects: ects() })}
            </p>
          )}
        </Show>
      </div>
      <Show
        fallback={
          props.empty ?? <EmptyState title={t().masters.curriculum.noCourses} />
        }
        when={props.semesters.length > 0}
      >
        <For each={props.semesters}>
          {(semester) => (
            <SemesterSection
              findCourse={props.findCourse}
              onOpen={props.onOpen}
              semester={semester}
            />
          )}
        </For>
      </Show>
    </div>
  );
};
