import { type JSX } from '@solidjs/web';
import { For, Show } from 'solid-js';

import { EmptyState } from '@/components/ui/empty-state';
import { CalendarRange } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/page-header';
import { useCourseNames } from '@/lib/course-names-context';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { type SimulatorCourse } from '@/lib/simulator';
import {
  getPlanOptions,
  type PlanEvaluation,
  STANDARD_SEMESTER_CREDITS,
  type StudyPlan,
} from '@/lib/study-plan';

import { FillRequired } from './fill-required';
import { Meter } from './meter';
import { PlanCourseRow } from './plan-course-row';

type PlanViewProps = {
  /** Courses not taken or planned yet that match the simulator filters. */
  candidates: SimulatorCourse[];
  evaluation: PlanEvaluation;
  /** Plans the remaining required courses; returns how to undo it. */
  onFillRequired: () => { added: number; undo: () => void };
  onSetSemester: (name: string, semester: number | undefined) => void;
  plan: StudyPlan;
  start: number;
};

const PlanCard = (props: { children: JSX.Element; header: JSX.Element }) => (
  <section class="bg-card overflow-hidden rounded-xl border">
    <div class="space-y-2 border-b px-3 py-3 sm:px-4">{props.header}</div>
    {props.children}
  </section>
);

// The study plan: projected graduation, one card per remaining semester with
// its load against the standard 30 credits, and the courses still to place.
export const PlanView = (props: PlanViewProps) => {
  const { t } = useLanguage();
  const names = useCourseNames();

  const row = (course: SimulatorCourse) => (
    <PlanCourseRow
      course={course}
      issues={props.evaluation.issues[course.name] ?? []}
      onSetSemester={(semester) => {
        props.onSetSemester(course.name, semester);
      }}
      options={getPlanOptions(course, props.start)}
      semester={props.plan[course.name]}
    />
  );

  const graduationText = (degree: 'fourYear' | 'threeYear') => {
    const semester = props.evaluation.graduation[degree];
    return semester === undefined
      ? t().planner.notReached
      : interpolate(t().simulator.semesterTitle, { semester });
  };

  const nothingPlanned = () =>
    props.evaluation.semesters.every((entry) => entry.courses.length === 0);

  return (
    <div class="space-y-4">
      <FillRequired
        onFill={props.onFillRequired}
        remaining={props.evaluation.unplannedRequired.length}
      />
      <section class="bg-card grid gap-3 rounded-xl border p-3 text-sm sm:grid-cols-2 sm:p-4">
        <Show
          fallback={
            <>
              <p>
                <span class="text-muted-foreground">
                  {t().planner.graduation3yr}
                </span>{' '}
                <span class="font-semibold">{graduationText('threeYear')}</span>
              </p>
              <p>
                <span class="text-muted-foreground">
                  {t().planner.graduation4yr}
                </span>{' '}
                <span class="font-semibold">{graduationText('fourYear')}</span>
              </p>
            </>
          }
          when={nothingPlanned()}
        >
          <p class="text-muted-foreground sm:col-span-2">
            {t().planner.emptySummary}
          </p>
        </Show>
        <Show when={props.evaluation.unplannedRequired.length > 0}>
          <details class="text-warning sm:col-span-2">
            <summary class="cursor-pointer font-medium">
              {interpolate(t().planner.unplannedRequired, {
                count: props.evaluation.unplannedRequired.length,
              })}
            </summary>
            <p class="text-foreground mt-1">
              {props.evaluation.unplannedRequired
                .map((course) => names().courseName(course.name))
                .join(', ')}
            </p>
          </details>
        </Show>
      </section>

      <For each={props.evaluation.semesters}>
        {(entry) => {
          const load = () =>
            interpolate(t().planner.semesterCredits, {
              credits: entry.credits,
              standard: STANDARD_SEMESTER_CREDITS,
              total: entry.cumulativeCredits,
            });
          return (
            <PlanCard
              header={
                <>
                  <SectionHeader
                    meta={load()}
                    title={interpolate(t().simulator.semesterTitle, {
                      semester: entry.semester,
                    })}
                  />
                  <Meter
                    label={load()}
                    max={STANDARD_SEMESTER_CREDITS}
                    overflow
                    size="sm"
                    value={entry.credits}
                  />
                </>
              }
            >
              <Show
                fallback={
                  <p class="text-muted-foreground px-3 py-3 text-sm sm:px-4">
                    {t().planner.emptySemester}
                  </p>
                }
                when={entry.courses.length > 0}
              >
                <ul class="divide-y">
                  <For each={entry.courses}>{row}</For>
                </ul>
              </Show>
            </PlanCard>
          );
        }}
      </For>

      <PlanCard header={<SectionHeader title={t().planner.toPlan} />}>
        <Show
          fallback={
            <EmptyState
              class="m-3 border-0"
              icon={<CalendarRange />}
              title={t().common.noResults}
            />
          }
          when={props.candidates.length > 0}
        >
          <ul class="divide-y">
            <For each={props.candidates}>{row}</For>
          </ul>
        </Show>
      </PlanCard>
    </div>
  );
};
