import { For, type JSX, Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
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

import { PROGRAM_STATE_TONES } from './course-styles';

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

  const details = (item: NextCourse) =>
    [
      `${t().common.semesterShort} ${String(item.course.semester)}`,
      interpolate(t().nextCourses.credits, { credits: item.course.credits }),
      item.enrollment > 0 && props.year
        ? interpolate(t().nextCourses.enrolled, {
            count: formatNumber(item.enrollment, language()),
            year: props.year,
          })
        : undefined,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <section class="space-y-3">
      <div class="text-sm">
        <span>
          <span class="font-medium">
            {t().nextCourses.forSeason[props.season]}
          </span>
          <Show when={props.isUpcoming}>
            <span class="text-muted-foreground">
              {' '}
              {t().nextCourses.upcoming}
            </span>
          </Show>
          <span class="text-muted-foreground">
            {': '}
            {formatCount(t().listing.resultCount, {
              count: props.items.length,
              language: language(),
            })}
          </span>
        </span>
      </div>

      <Show
        fallback={
          <div class="text-muted-foreground py-12 text-center text-sm">
            {t().nextCourses.empty}
          </div>
        }
        when={props.items.length > 0}
      >
        <ul class="space-y-1.5">
          <For each={props.items}>
            {(item) => {
              const kind = () => getProgramStateKind(item.course.programState);
              return (
                <li class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card px-3 py-2">
                  <div class="min-w-0 flex-1 space-y-1">
                    <div class="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                      {item.course.name}
                      <Show when={kind()}>
                        {(k) => (
                          <StatusBadge tone={PROGRAM_STATE_TONES[k()]}>
                            {t().programState[k()]}
                          </StatusBadge>
                        )}
                      </Show>
                      <For each={getCourseTags(item.course.raw)}>
                        {(tag) => (
                          <Badge class="px-1.5 py-0 text-[10px] leading-4 font-normal">
                            {getTagLabel(tag, t())}
                          </Badge>
                        )}
                      </For>
                    </div>
                    <div class="text-muted-foreground text-xs">
                      {details(item)}
                    </div>
                  </div>
                  <div class="flex gap-1.5">
                    <button
                      aria-label={`${t().nextCourses.markListened}: ${item.course.name}`}
                      class="bg-card hover:bg-muted rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
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
      </Show>
    </section>
  );
};
