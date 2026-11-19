import { Sparkles } from 'lucide-solid';
import { For, type JSX, Show } from 'solid-js';

import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { useCourseNames } from '@/lib/course-names-context';
import {
  formatCount,
  formatNumber,
  getTagLabel,
  interpolate,
} from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { type NextCourse, type Season } from '@/lib/next-courses';
import { getProgramStateKind } from '@/lib/simulator';
import { type AcademicYear, getCourseTags } from '@/types/course';

import { PROGRAM_STATE_TONES, ROW_ACTION_CLASS } from './course-styles';

type NextCoursesPanelProps = {
  /** Extra actions per course, after "mark as enrolled". */
  actions?: (item: NextCourse) => JSX.Element;
  /** Whether the season is the default upcoming one, not a chosen filter. */
  isUpcoming: boolean;
  items: NextCourse[];
  onMarkListened: (name: string) => void;
  season: Season;
  year: AcademicYear | undefined;
};

// The courses the student can take in the chosen semester, best first.
export const NextCoursesPanel = (props: NextCoursesPanelProps) => {
  const { language, t } = useLanguage();
  const names = useCourseNames();

  const details = (item: NextCourse) =>
    [
      interpolate(t().simulator.semesterTitle, {
        semester: item.course.semester,
      }),
      interpolate(t().nextCourses.credits, { credits: item.course.credits }),
      item.enrollment > 0 && props.year
        ? interpolate(t().nextCourses.enrolled, {
            count: formatNumber(item.enrollment, language()),
            year: props.year,
          })
        : undefined,
    ].filter(Boolean);

  const title = () =>
    props.isUpcoming
      ? `${t().nextCourses.forSeason[props.season]} ${t().nextCourses.upcoming}`
      : t().nextCourses.forSeason[props.season];

  return (
    <Show
      fallback={
        <EmptyState
          icon={<Sparkles />}
          title={t().nextCourses.empty}
        />
      }
      when={props.items.length > 0}
    >
      <section class="bg-card overflow-hidden rounded-xl border">
        <SectionHeader
          class="border-b px-3 py-3 sm:px-4"
          meta={formatCount(t().listing.resultCount, {
            count: props.items.length,
            language: language(),
          })}
          title={title()}
        />
        <ul class="divide-y">
          <For each={props.items}>
            {(item) => {
              const kind = () => getProgramStateKind(item.course.programState);
              return (
                <li class="grid gap-x-4 gap-y-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-4">
                  <div class="min-w-0 space-y-1">
                    <div class="text-sm font-medium leading-snug">
                      {names().courseName(item.course.name)}
                    </div>
                    <div class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <Show when={kind()}>
                        {(k) => (
                          <StatusBadge tone={PROGRAM_STATE_TONES[k()]}>
                            {t().programState[k()]}
                          </StatusBadge>
                        )}
                      </Show>
                      <For each={details(item)}>
                        {(detail) => <span>{detail}</span>}
                      </For>
                      <For each={getCourseTags(item.course.raw)}>
                        {(tag) => (
                          <StatusBadge tone="neutral">
                            {getTagLabel(tag, t())}
                          </StatusBadge>
                        )}
                      </For>
                    </div>
                  </div>
                  <div class="flex gap-1.5">
                    <button
                      aria-label={`${t().nextCourses.markListened}: ${names().courseName(item.course.name)}`}
                      class={ROW_ACTION_CLASS}
                      onClick={() => {
                        props.onMarkListened(item.course.name);
                      }}
                      type="button"
                    >
                      {t().nextCourses.markListened}
                    </button>
                    {props.actions?.(item)}
                  </div>
                </li>
              );
            }}
          </For>
        </ul>
      </section>
    </Show>
  );
};
