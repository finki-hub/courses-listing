import { TriangleAlert } from 'lucide-solid';
import { For, Show } from 'solid-js';

import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { getProgramStateKind, type SimulatorCourse } from '@/lib/simulator';
import { type PlanIssue } from '@/lib/study-plan';

import { PROGRAM_STATE_TONES } from './course-styles';

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

  // A stored semester outside the course's options still shows, so the
  // select never claims a different value than the plan holds.
  const options = () => {
    const semesters =
      props.semester === undefined || props.options.includes(props.semester)
        ? props.options
        : [props.semester, ...props.options];
    return semesters.map((semester) => ({
      label: semesterLabel(semester),
      value: String(semester),
    }));
  };

  return (
    <li class="grid gap-x-4 gap-y-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center sm:px-4">
      <div class="min-w-0 space-y-1">
        <div class="text-sm font-medium leading-snug">{props.course.name}</div>
        <div class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <Show when={kind()}>
            {(k) => (
              <StatusBadge tone={PROGRAM_STATE_TONES[k()]}>
                {t().programState[k()]}
              </StatusBadge>
            )}
          </Show>
          <span>
            {interpolate(t().planner.recommended, {
              semester: props.course.semester,
            })}
          </span>
          <span>
            {interpolate(t().nextCourses.credits, {
              credits: props.course.credits,
            })}
          </span>
        </div>
        <For each={props.issues}>
          {(issue) => (
            <p class="text-warning flex items-center gap-1.5 text-xs font-medium">
              <TriangleAlert
                aria-hidden="true"
                class="h-3.5 w-3.5 shrink-0"
              />
              {t().planner.issues[issue]}
            </p>
          )}
        </For>
      </div>
      <Select
        aria-label={`${t().planner.planFor}: ${props.course.name}`}
        emptyLabel={t().planner.notPlanned}
        onChange={(value) => {
          const semester = Number.parseInt(value, 10);
          props.onSetSemester(Number.isNaN(semester) ? undefined : semester);
        }}
        options={options()}
        value={props.semester === undefined ? null : String(props.semester)}
      />
    </li>
  );
};
