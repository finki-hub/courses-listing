import { type JSX } from '@solidjs/web';
import { For, Show } from 'solid-js';

import { ArrowLeft, ArrowRight, ChevronRight } from '@/components/ui/icons';
import { useCourseNames } from '@/lib/course-names-context';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { type GraphCourse } from '@/lib/prerequisite-graph';

// Deeper steps start folded, so a first-year course doesn't list half the
// curriculum at once.
const OPEN_LAYERS = 1;

type PrerequisiteMapProps = {
  focus: GraphCourse;
  onFocus: (name: string) => void;
  onOpenDetails: () => void;
  requires: GraphCourse[][];
  unlocks: GraphCourse[][];
};

const CourseNode = (props: {
  course: GraphCourse;
  onFocus: (name: string) => void;
}) => {
  const { t } = useLanguage();
  const names = useCourseNames();
  return (
    <li>
      <button
        class="bg-card hover:border-primary hover:bg-muted focus-visible:ring-ring group flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        onClick={() => {
          props.onFocus(props.course.name);
        }}
        type="button"
      >
        <span class="min-w-0 flex-1 font-medium">
          {names().courseName(props.course.name)}
        </span>
        <Show when={props.course.semester > 0}>
          <span class="text-muted-foreground shrink-0 text-xs tabular-nums">
            {t().common.semesterShort} {props.course.semester}
          </span>
        </Show>
        <ChevronRight
          aria-hidden="true"
          class="text-muted-foreground group-hover:text-foreground h-4 w-4 shrink-0"
        />
      </button>
    </li>
  );
};

const Layer = (props: {
  courses: GraphCourse[];
  depth: number;
  onFocus: (name: string) => void;
}) => {
  const { t } = useLanguage();
  const label = () =>
    props.depth === 1
      ? t().prerequisites.direct
      : interpolate(t().prerequisites.stepsAway, { count: props.depth });
  const list = () => (
    <ul class="space-y-1.5">
      <For each={props.courses}>
        {(course) => (
          <CourseNode
            course={course}
            onFocus={props.onFocus}
          />
        )}
      </For>
    </ul>
  );
  return (
    <Show
      fallback={
        <details>
          <summary class="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium">
            {label()} · {props.courses.length}
          </summary>
          <div class="mt-2">{list()}</div>
        </details>
      }
      when={props.depth <= OPEN_LAYERS}
    >
      <div class="space-y-2">
        <p class="text-muted-foreground text-xs font-medium">
          {label()} · {props.courses.length}
        </p>
        {list()}
      </div>
    </Show>
  );
};

const MapColumn = (props: {
  empty: string;
  icon: JSX.Element;
  layers: GraphCourse[][];
  onFocus: (name: string) => void;
  title: string;
}) => (
  <section
    aria-label={props.title}
    class="space-y-3"
  >
    <h3 class="flex items-center gap-2 text-sm font-semibold">
      {props.icon}
      {props.title}
    </h3>
    <Show
      fallback={<p class="text-muted-foreground text-sm">{props.empty}</p>}
      when={props.layers.length > 0}
    >
      <div class="space-y-4">
        <For each={props.layers}>
          {(courses, index) => (
            <Layer
              courses={courses}
              depth={index() + 1}
              onFocus={props.onFocus}
            />
          )}
        </For>
      </div>
    </Show>
  </section>
);

// One course in the middle, what it requires on one side and what it
// unlocks on the other. Any course on the map can become the middle.
export const PrerequisiteMap = (props: PrerequisiteMapProps) => {
  const { t } = useLanguage();
  const names = useCourseNames();
  return (
    <div
      aria-label={interpolate(t().prerequisites.mapLabel, {
        course: names().courseName(props.focus.name),
      })}
      class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start"
      role="region"
    >
      <div class="bg-card border-primary space-y-3 rounded-xl border-2 p-4 lg:sticky lg:top-[calc(var(--tabbar-h,0px)+1rem)] lg:order-2">
        <div class="space-y-1">
          <h3 class="text-lg leading-snug font-semibold">
            {names().courseName(props.focus.name)}
          </h3>
          <Show when={props.focus.semester > 0}>
            <p class="text-muted-foreground text-sm">
              {t().common.semester} {props.focus.semester}
            </p>
          </Show>
        </div>
        <div class="space-y-1">
          <p class="text-muted-foreground text-xs font-medium">
            {t().common.prerequisite}
          </p>
          <p class="text-sm">
            {props.focus.prerequisite === undefined
              ? t().detail.noPrerequisites
              : names().prerequisiteText(props.focus.prerequisite)}
          </p>
        </div>
        <button
          class="hover:bg-muted focus-visible:ring-ring inline-flex min-h-9 items-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => {
            props.onOpenDetails();
          }}
          type="button"
        >
          {t().prerequisites.courseDetails}
        </button>
      </div>

      <div class="lg:order-1">
        <MapColumn
          empty={t().prerequisites.noRequires}
          icon={
            <ArrowLeft
              aria-hidden="true"
              class="text-muted-foreground h-4 w-4"
            />
          }
          layers={props.requires}
          onFocus={props.onFocus}
          title={t().prerequisites.requires}
        />
      </div>

      <div class="lg:order-3">
        <MapColumn
          empty={t().prerequisites.noUnlocks}
          icon={
            <ArrowRight
              aria-hidden="true"
              class="text-muted-foreground h-4 w-4"
            />
          }
          layers={props.unlocks}
          onFocus={props.onFocus}
          title={t().prerequisites.unlocks}
        />
      </div>
    </div>
  );
};
