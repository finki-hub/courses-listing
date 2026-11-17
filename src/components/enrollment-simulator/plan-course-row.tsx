import { For, Show } from 'solid-js';

import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { getProgramStateKind, type SimulatorCourse } from '@/lib/simulator';
import { type PlanIssue } from '@/lib/study-plan';

type PlanCourseRowProps = {
  course: SimulatorCourse;
  issues: PlanIssue[];
  onSetSemester: (semester: number | undefined) => void;
  options: number[];
  semester: number | undefined;
};

// A course with the semester it is planned for and what the plan still
// lacks for it.
export const PlanCourseRow = (props: PlanCourseRowProps) => {
  const { t } = useLanguage();
  const kind = () => getProgramStateKind(props.course.programState);
  const semesterLabel = (semester: number) =>
    interpolate(t().simulator.semesterTitle, { semester });

  return (
    <li class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card px-3 py-2">
      <div class="min-w-0 flex-1 space-y-0.5">
        <div class="text-sm font-medium">{props.course.name}</div>
        <div class="text-muted-foreground text-xs">
          {[
            interpolate(t().planner.recommended, {
              semester: props.course.semester,
            }),
            interpolate(t().nextCourses.credits, {
              credits: props.course.credits,
            }),
            kind() ? t().programState[kind() ?? 'elective'] : undefined,
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
        <For each={props.issues}>
          {(issue) => (
            <div class="text-xs text-warning">{t().planner.issues[issue]}</div>
          )}
        </For>
      </div>
      <select
        aria-label={`${t().planner.planFor}: ${props.course.name}`}
        class="bg-card border-input min-h-9 rounded-md border px-2 text-sm"
        onChange={(event) => {
          const value = Number.parseInt(event.currentTarget.value, 10);
          props.onSetSemester(Number.isNaN(value) ? undefined : value);
        }}
        value={props.semester === undefined ? '' : String(props.semester)}
      >
        <option value="">{t().planner.notPlanned}</option>
        <Show
          when={
            props.semester !== undefined &&
            !props.options.includes(props.semester)
          }
        >
          <option value={String(props.semester)}>
            {semesterLabel(props.semester ?? 0)}
          </option>
        </Show>
        <For each={props.options}>
          {(semester) => (
            <option value={String(semester)}>{semesterLabel(semester)}</option>
          )}
        </For>
      </select>
    </li>
  );
};
