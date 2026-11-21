import { Show } from 'solid-js';

import { SaveButton } from '@/components/saved-courses-ui';
import { ChevronRight } from '@/components/ui/icons';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  type Accreditation,
  type CourseRaw,
  getCourseName,
  getCourseTags,
  hasChannel,
} from '@/types/course';

import {
  type CourseRowFacts,
  CourseSecondLine,
  CourseTags,
  DiscordMark,
  hasOfferingNote,
  hasUnknownStudents,
  PopularityBar,
  StudentCount,
} from './course-table-row';

type CourseCardProps = {
  accreditation: Accreditation | null;
  course: CourseRaw;
  facts: CourseRowFacts;
  onClick: () => void;
  onToggleSaved: () => void;
  saved: boolean;
};

// A result on narrow screens, with the same hierarchy as a table row.
export const CourseCard = (props: CourseCardProps) => {
  const { language, t } = useLanguage();
  return (
    <div class="bg-card hover:bg-muted/50 flex w-full items-center rounded-lg border transition-colors">
      <button
        class="focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 rounded-lg p-3 text-left focus-visible:ring-2 focus-visible:outline-none"
        onClick={() => {
          props.onClick();
        }}
        type="button"
      >
        <span class="min-w-0 flex-1 space-y-1.5">
          <span class="block font-medium">
            {getCourseName(props.course, props.accreditation, language())}
          </span>
          <CourseSecondLine facts={props.facts} />

          <span class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <Show when={props.facts.semester}>
              {(semester) => (
                <span>
                  {interpolate(t().listing.semesterValue, {
                    value: semester(),
                  })}
                </span>
              )}
            </Show>
            <Show when={props.facts.credits}>
              {(credits) => (
                <span>
                  {interpolate(t().listing.creditsValue, { value: credits() })}
                </span>
              )}
            </Show>
            <span class="inline-flex items-center gap-1.5">
              <span class="tabular-nums">
                <StudentCount facts={props.facts} />
              </span>
              <Show when={!hasOfferingNote(props.facts)}>
                {t().enrollment.students.toLowerCase()}
              </Show>
              <Show when={!hasUnknownStudents(props.facts)}>
                <PopularityBar share={props.facts.share} />
              </Show>
            </span>
            <Show when={hasChannel(props.course)}>
              <DiscordMark />
            </Show>
          </span>

          <Show when={getCourseTags(props.course).length > 0}>
            <CourseTags course={props.course} />
          </Show>
        </span>
        <ChevronRight
          aria-hidden="true"
          class="text-muted-foreground h-4 w-4 shrink-0"
        />
      </button>
      <SaveButton
        class="mr-2"
        courseName={getCourseName(
          props.course,
          props.accreditation,
          language(),
        )}
        onToggle={props.onToggleSaved}
        saved={props.saved}
      />
    </div>
  );
};
