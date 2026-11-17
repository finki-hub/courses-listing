import { For, Show } from 'solid-js';

import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/page-header';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { type CourseStatus } from '@/lib/prerequisite';
import {
  getExclusiveProjectBlocker,
  isRequired,
  type SimulatorCourse,
} from '@/lib/simulator';
import {
  type BulkStatus,
  type CourseStatusValue,
  getBulkTargets,
  getCourseStatusValue,
  type SemesterGroup,
  summarizeSemester,
} from '@/lib/simulator-view';
import { STANDARD_SEMESTER_CREDITS } from '@/lib/study-plan';

import { CourseStatusRow } from './course-status-row';
import { ROW_ACTION_CLASS } from './course-styles';
import { Meter } from './meter';

type SimulatorTableProps = {
  /** Every course, for the semester totals and bulk actions. */
  courses: SimulatorCourse[];
  enabledMap: Record<string, boolean>;
  fullLevels: Set<number>;
  groups: SemesterGroup[];
  onBulkMark: (semester: number, target: BulkStatus) => void;
  onSetStatus: (name: string, status: CourseStatusValue) => void;
  overLimitSet: Set<string>;
  reasonMap: Record<string, string>;
  statuses: Record<string, CourseStatus>;
};

const BULK_TARGETS: readonly BulkStatus[] = ['listened', 'passed'];

// The checklist: one card per semester with its passed credits and quick
// actions for its required courses, then a row per course.
export const SimulatorTable = (props: SimulatorTableProps) => {
  const { t } = useLanguage();

  const semesterCourses = (semester: number) =>
    props.courses.filter((course) => course.semester === semester);

  const rowProps = (course: SimulatorCourse) => ({
    get atLimit() {
      return (
        !props.statuses[course.name]?.passed &&
        !isRequired(course.programState) &&
        props.fullLevels.has(course.level)
      );
    },
    course,
    get enabled() {
      return props.enabledMap[course.name] ?? true;
    },
    get exclusiveBlocker() {
      return getExclusiveProjectBlocker(props.statuses, course.name);
    },
    onSetStatus: (status: CourseStatusValue) => {
      props.onSetStatus(course.name, status);
    },
    get overLimit() {
      return props.overLimitSet.has(course.name);
    },
    get reason() {
      return props.reasonMap[course.name] ?? '';
    },
    get status() {
      return getCourseStatusValue(props.statuses[course.name]);
    },
  });

  const SemesterCard = (cardProps: { group: SemesterGroup }) => {
    const values = () => ({ semester: cardProps.group.semester });
    const all = () => semesterCourses(cardProps.group.semester);
    const passed = () => summarizeSemester(all(), props.statuses).passedCredits;
    const targetCount = (target: BulkStatus) =>
      getBulkTargets(
        all(),
        { enabledMap: props.enabledMap, statuses: props.statuses },
        target,
      ).length;
    const progressText = () =>
      interpolate(t().simulator.semesterProgress, {
        passed: passed(),
        total: STANDARD_SEMESTER_CREDITS,
      });

    return (
      <section class="bg-card overflow-hidden rounded-xl border">
        <div class="space-y-2 border-b px-3 py-3 sm:px-4">
          <SectionHeader
            actions={
              <For each={BULK_TARGETS}>
                {(target) => (
                  <button
                    aria-label={`${t().simulator.bulk[target]}: ${interpolate(t().simulator.bulkLabel[target], values())}`}
                    class={ROW_ACTION_CLASS}
                    disabled={targetCount(target) === 0}
                    onClick={() => {
                      props.onBulkMark(cardProps.group.semester, target);
                    }}
                    title={interpolate(
                      t().simulator.bulkLabel[target],
                      values(),
                    )}
                    type="button"
                  >
                    {t().simulator.bulk[target]}
                  </button>
                )}
              </For>
            }
            meta={progressText()}
            title={interpolate(t().simulator.semesterTitle, values())}
          />
          <Meter
            label={progressText()}
            max={STANDARD_SEMESTER_CREDITS}
            size="sm"
            value={passed()}
          />
        </div>
        <ul class="divide-y">
          <For each={cardProps.group.courses}>
            {(course) => {
              const row = rowProps(course);
              return <CourseStatusRow {...row} />;
            }}
          </For>
        </ul>
      </section>
    );
  };

  return (
    <Show
      fallback={
        <EmptyState
          text={t().common.noResults}
          title={t().common.noResults}
        />
      }
      when={props.groups.length > 0}
    >
      <div class="space-y-4">
        <For each={props.groups}>
          {(group) => <SemesterCard group={group} />}
        </For>
      </div>
    </Show>
  );
};
