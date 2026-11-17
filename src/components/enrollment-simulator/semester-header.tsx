import { For } from 'solid-js';

import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { type CourseStatus } from '@/lib/prerequisite';
import { type SimulatorCourse } from '@/lib/simulator';
import {
  type BulkStatus,
  getBulkTargets,
  summarizeSemester,
} from '@/lib/simulator-view';

type SemesterHeaderProps = {
  /** All of the semester's courses, whatever the filters show. */
  courses: SimulatorCourse[];
  enabledMap: Record<string, boolean>;
  onBulkMark: (target: BulkStatus) => void;
  semester: number;
  statuses: Record<string, CourseStatus>;
};

const BULK_TARGETS: readonly BulkStatus[] = ['listened', 'passed'];

// A semester's title, its credit subtotals and bulk actions for its required
// courses.
export const SemesterHeader = (props: SemesterHeaderProps) => {
  const { t } = useLanguage();
  const values = () => ({ semester: props.semester });
  const summary = () => summarizeSemester(props.courses, props.statuses);
  const targetCount = (target: BulkStatus) =>
    getBulkTargets(
      props.courses,
      { enabledMap: props.enabledMap, statuses: props.statuses },
      target,
    ).length;

  return (
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <h3 class="text-sm font-semibold">
        {interpolate(t().simulator.semesterTitle, values())}
      </h3>
      <span class="text-muted-foreground hidden text-xs sm:inline">
        {interpolate(t().simulator.semesterSummary, {
          listened: summary().listenedCredits,
          passed: summary().passedCredits,
        })}
      </span>
      <div class="ml-auto flex gap-1.5">
        <For each={BULK_TARGETS}>
          {(target) => (
            <button
              aria-label={`${t().simulator.bulk[target]}: ${interpolate(t().simulator.bulkLabel[target], values())}`}
              class="bg-card hover:bg-muted disabled:text-muted-foreground rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed"
              disabled={targetCount(target) === 0}
              onClick={() => {
                props.onBulkMark(target);
              }}
              title={interpolate(t().simulator.bulkLabel[target], values())}
              type="button"
            >
              {t().simulator.bulk[target]}
            </button>
          )}
        </For>
      </div>
    </div>
  );
};
