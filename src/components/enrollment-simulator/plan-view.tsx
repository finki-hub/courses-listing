import { For, Show } from 'solid-js';

import { ALERT_STYLES } from '@/lib/alert-styles';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { type SimulatorCourse } from '@/lib/simulator';
import {
  getPlanOptions,
  type PlanEvaluation,
  STANDARD_SEMESTER_CREDITS,
  type StudyPlan,
} from '@/lib/study-plan';

import { PlanCourseRow } from './plan-course-row';

type PlanViewProps = {
  /** Courses not taken or planned yet that match the simulator filters. */
  candidates: SimulatorCourse[];
  evaluation: PlanEvaluation;
  onSetSemester: (name: string, semester: number | undefined) => void;
  plan: StudyPlan;
  start: number;
};

// The study plan: projected graduation, the planned semesters and the
// courses still to place.
export const PlanView = (props: PlanViewProps) => {
  const { t } = useLanguage();

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

  return (
    <div class="space-y-4">
      <div class={`${ALERT_STYLES.info} space-y-1`}>
        <div>
          {t().planner.graduation3yr}{' '}
          <span class="font-semibold">{graduationText('threeYear')}</span>
        </div>
        <div>
          {t().planner.graduation4yr}{' '}
          <span class="font-semibold">{graduationText('fourYear')}</span>
        </div>
        <Show when={props.evaluation.unplannedRequired.length > 0}>
          <details>
            <summary class="cursor-pointer">
              {interpolate(t().planner.unplannedRequired, {
                count: props.evaluation.unplannedRequired.length,
              })}
            </summary>
            <p class="mt-1">
              {props.evaluation.unplannedRequired
                .map((course) => course.name)
                .join(', ')}
            </p>
          </details>
        </Show>
      </div>

      <For each={props.evaluation.semesters}>
        {(entry) => (
          <section class="space-y-1.5">
            <div class="flex flex-wrap items-baseline gap-x-3">
              <h3 class="text-sm font-semibold">
                {interpolate(t().simulator.semesterTitle, {
                  semester: entry.semester,
                })}
              </h3>
              <span class="text-muted-foreground text-xs">
                {interpolate(t().planner.semesterCredits, {
                  credits: entry.credits,
                  standard: STANDARD_SEMESTER_CREDITS,
                  total: entry.cumulativeCredits,
                })}
              </span>
            </div>
            <Show
              fallback={
                <p class="text-muted-foreground text-xs">
                  {t().planner.emptySemester}
                </p>
              }
              when={entry.courses.length > 0}
            >
              <ul class="space-y-1.5">
                <For each={entry.courses}>{row}</For>
              </ul>
            </Show>
          </section>
        )}
      </For>

      <section class="space-y-1.5">
        <h3 class="text-sm font-semibold">{t().planner.toPlan}</h3>
        <Show
          fallback={
            <p class="text-muted-foreground text-xs">{t().common.noResults}</p>
          }
          when={props.candidates.length > 0}
        >
          <ul class="space-y-1.5">
            <For each={props.candidates}>{row}</For>
          </ul>
        </Show>
      </section>
    </div>
  );
};
