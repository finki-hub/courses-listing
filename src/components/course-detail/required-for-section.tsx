import { createMemo, createSignal, For, Show } from 'solid-js';

import { DetailSection } from '@/components/course-detail/accreditation-sections';
import { capture } from '@/lib/analytics-client';
import {
  type AccreditationDetails,
  getAccreditationDetails,
  groupDetailValues,
  indexCoursesByName,
} from '@/lib/course-detail';
import { useCourseNames } from '@/lib/course-names-context';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { buildRequiredFor } from '@/lib/required-for';
import { type Accreditation, type CourseRaw } from '@/types/course';

const ACCREDITATIONS: readonly Accreditation[] = ['2023', '2018'];
// How many courses show before the rest are folded away.
const COLLAPSED_COUNT = 8;
const NAME_SEPARATOR = '\n';

type RequiredForSectionProps = {
  course: CourseRaw;
  courses: readonly CourseRaw[];
  onOpenCourse: (course: CourseRaw) => void;
};

// One list of the courses that need this one: the first few, then the rest
// behind a button.
const RequiredForList = (props: {
  names: readonly string[];
  onOpen: (name: string) => void;
}) => {
  const { t } = useLanguage();
  const courseNames = useCourseNames();
  const [expanded, setExpanded] = createSignal(false);
  const shown = () =>
    expanded() ? props.names : props.names.slice(0, COLLAPSED_COUNT);
  const foldable = () => props.names.length > COLLAPSED_COUNT + 1;

  return (
    <div class="space-y-1.5">
      <ul class="flex flex-wrap gap-x-3 gap-y-1 text-sm">
        <For each={foldable() ? shown() : props.names}>
          {(name) => (
            <li>
              <button
                class="text-primary hover:text-primary/80 cursor-pointer rounded-sm font-medium underline underline-offset-2"
                onClick={() => {
                  props.onOpen(name);
                }}
                type="button"
              >
                {courseNames().courseName(name)}
              </button>
            </li>
          )}
        </For>
      </ul>
      <Show when={foldable()}>
        <button
          aria-expanded={expanded()}
          class="text-muted-foreground hover:text-foreground cursor-pointer text-xs underline underline-offset-2"
          onClick={() => {
            setExpanded((value) => !value);
          }}
          type="button"
        >
          {expanded()
            ? t().detail.showFewerRequired
            : interpolate(t().detail.showAllRequired, {
                count: props.names.length,
              })}
        </button>
      </Show>
    </div>
  );
};

// The courses whose prerequisites name this course, per accreditation, with
// identical lists shown once.
export const RequiredForSection = (props: RequiredForSectionProps) => {
  const { t } = useLanguage();
  const indexes = createMemo(
    () =>
      new Map(
        ACCREDITATIONS.map((accreditation) => [
          accreditation,
          {
            byName: indexCoursesByName([...props.courses], accreditation),
            requiredFor: buildRequiredFor(props.courses, accreditation),
          },
        ]),
      ),
  );
  const details = createMemo(() =>
    ACCREDITATIONS.flatMap((accreditation) => {
      const entry = getAccreditationDetails(props.course, accreditation);
      return entry ? [entry] : [];
    }),
  );
  const namesIn = (entry: AccreditationDetails): string[] => [
    ...(indexes()
      .get(entry.accreditation)
      ?.requiredFor.get(entry.name ?? props.course.name) ?? []),
  ];
  const lists = createMemo(() =>
    groupDetailValues(details(), (entry) =>
      namesIn(entry).join(NAME_SEPARATOR),
    ),
  );

  return (
    <Show when={lists().length > 0}>
      <DetailSection title={t().detail.requiredFor}>
        <div class="space-y-3">
          <For each={lists()}>
            {(list) => {
              const accreditation = () => list.accreditations[0] ?? '2023';
              return (
                <div class="space-y-1.5">
                  <Show when={lists().length > 1}>
                    <p class="text-muted-foreground text-xs font-medium">
                      {list.accreditations.join(', ')}
                    </p>
                  </Show>
                  <RequiredForList
                    names={list.value.split(NAME_SEPARATOR)}
                    onOpen={(name) => {
                      const course = indexes()
                        .get(accreditation())
                        ?.byName.get(name);
                      if (!course) return;
                      capture('related_course_opened', {
                        // eslint-disable-next-line camelcase -- PostHog event props are snake_case
                        result_id: name,
                        source: 'required_for',
                      });
                      props.onOpenCourse(course);
                    }}
                  />
                </div>
              );
            }}
          </For>
        </div>
      </DetailSection>
    </Show>
  );
};
