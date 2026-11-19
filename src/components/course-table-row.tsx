import { ChevronRight } from 'lucide-solid';
import { siDiscord } from 'simple-icons';
import { For, type JSX, Show } from 'solid-js';

import { SaveButton } from '@/components/saved-courses-ui';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatCompactYear, type Offering } from '@/lib/course-offering';
import { formatNumber, getTagLabel, interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { cn } from '@/lib/utils';
import {
  type Accreditation,
  type CourseRaw,
  getCourseName,
  getCourseTags,
  hasChannel,
} from '@/types/course';

export type CourseColumn = {
  readonly cellClass: string;
  readonly key: CourseColumnKey;
};

export type CourseColumnKey =
  | 'channel'
  | 'credits'
  | 'name'
  | 'open'
  | 'save'
  | 'semester'
  | 'students'
  | 'tags';

// Values shown beside a course: for undergraduate courses by the
// accreditation they are shown by, for master's ones by their programs.
export type CourseRowFacts = {
  /** The course code the accreditation shown gives it, if any. */
  readonly code?: string;
  readonly credits: number | undefined;
  /** The accreditations, or the programs that list a master's course. */
  readonly label: string;
  /** 0 means not offered or not counted that year: shown as a dash. */
  readonly noStudentsAsUnknown?: boolean;
  /** Undergraduate courses: whether they had students in the latest year. */
  readonly offering?: Offering;
  readonly semester: number | undefined;
  /** Students relative to the most popular course shown, from 0 to 1. */
  readonly share: number;
  readonly students: number;
};

export const UNKNOWN_STUDENTS = '\u{2013}';

const VISIBLE_TAGS = 2;

export const hasUnknownStudents = (facts: CourseRowFacts): boolean =>
  facts.noStudentsAsUnknown === true && facts.students === 0;

// Whether a note on when the course last ran stands in for the count.
export const hasOfferingNote = (facts: CourseRowFacts): boolean =>
  hasUnknownStudents(facts) &&
  facts.offering !== undefined &&
  facts.offering.kind !== 'current';

// When a course with no students this year last had some, or that it never
// did. Short, muted and not a number, so it isn't read as a count.
const OfferingNote = (props: { offering: Offering }) => {
  const { t } = useLanguage();
  const visible = () => {
    const { offering } = props;
    return offering.kind === 'last'
      ? interpolate(t().listing.lastOffered, {
          year: formatCompactYear(offering.year),
        })
      : t().listing.notOfferedYet;
  };
  const spoken = () => {
    const { offering } = props;
    return offering.kind === 'last'
      ? interpolate(t().listing.lastOfferedSr, { year: offering.year })
      : t().listing.notOfferedYet;
  };
  return (
    <>
      <span
        aria-hidden="true"
        class="text-muted-foreground text-xs font-normal"
      >
        {visible()}
      </span>
      <span class="sr-only">{spoken()}</span>
    </>
  );
};

// The student count; without students, when the course last had some, or a
// dash read aloud as "not offered or no data" where there is no history.
export const StudentCount = (props: { facts: CourseRowFacts }) => {
  const { language, t } = useLanguage();
  return (
    <Show
      fallback={formatNumber(props.facts.students, language())}
      when={hasUnknownStudents(props.facts)}
    >
      <Show
        fallback={
          <>
            <span aria-hidden="true">{UNKNOWN_STUDENTS}</span>
            <span class="sr-only">{t().masters.noEnrollment}</span>
          </>
        }
        when={props.facts.offering?.kind !== 'current' && props.facts.offering}
      >
        {(offering) => <OfferingNote offering={offering()} />}
      </Show>
    </Show>
  );
};

// A thin bar of the course's popularity among the courses shown.
export const PopularityBar = (props: { share: number }) => (
  <span
    aria-hidden="true"
    class="bg-muted block h-1 w-14 overflow-hidden rounded-full"
  >
    <span
      class="bg-primary/70 block h-full rounded-full"
      style={{ width: `${String(Math.round(props.share * 100))}%` }}
    />
  </span>
);

// The Discord mark, for courses with a channel on the FINKI Hub server.
export const DiscordMark = (props: { class?: string }) => {
  const { t } = useLanguage();
  return (
    <span
      class={cn('text-muted-foreground inline-flex', props.class)}
      title={t().listing.discordAvailable}
    >
      <svg
        aria-hidden="true"
        class="h-4 w-4"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d={siDiscord.path} />
      </svg>
      <span class="sr-only">{t().listing.discordAvailable}</span>
    </span>
  );
};

// A course's first tags, then how many more it has.
export const CourseTags = (props: { course: CourseRaw }) => {
  const { t } = useLanguage();
  const tags = () => getCourseTags(props.course);
  const hidden = () => tags().slice(VISIBLE_TAGS);
  return (
    <span class="flex flex-wrap items-center gap-1">
      <For each={tags().slice(0, VISIBLE_TAGS)}>
        {(tag) => (
          <span class="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
            {getTagLabel(tag, t())}
          </span>
        )}
      </For>
      <Show when={hidden().length > 0}>
        <span
          class="text-muted-foreground text-xs"
          title={hidden()
            .map((tag) => getTagLabel(tag, t()))
            .join(', ')}
        >
          {interpolate(t().listing.moreTags, { count: hidden().length })}
        </span>
      </Show>
    </span>
  );
};

// Under the name: the code and accreditations, or a master's programs.
export const CourseSecondLine = (props: { facts: CourseRowFacts }) => (
  <span class="text-muted-foreground flex flex-wrap items-baseline gap-x-2 text-xs">
    <Show when={props.facts.code}>
      {(code) => <span class="font-mono">{code()}</span>}
    </Show>
    <Show when={props.facts.label}>
      <span>{props.facts.label}</span>
    </Show>
  </span>
);

type CourseTableRowProps = {
  accreditation: Accreditation | null;
  columns: readonly CourseColumn[];
  course: CourseRaw;
  facts: CourseRowFacts;
  onClick: () => void;
  onToggleSaved: () => void;
  saved: boolean;
};

// A result row: the whole row opens the course, and the name is the button
// that keyboards and screen readers use.
export const CourseTableRow = (props: CourseTableRowProps) => {
  const { language } = useLanguage();
  const name = () =>
    getCourseName(props.course, props.accreditation, language());

  const cells: Record<CourseColumnKey, () => JSX.Element> = {
    channel: () => (
      <Show when={hasChannel(props.course)}>
        <DiscordMark />
      </Show>
    ),
    credits: () => <>{props.facts.credits ?? ''}</>,
    name: () => (
      <span class="flex flex-col gap-0.5">
        <button
          class="focus-visible:ring-ring w-fit rounded-sm text-left font-medium focus-visible:ring-2 focus-visible:outline-none"
          type="button"
        >
          {name()}
        </button>
        <CourseSecondLine facts={props.facts} />
      </span>
    ),
    open: () => (
      <ChevronRight
        aria-hidden="true"
        class="text-muted-foreground group-hover:text-foreground ml-auto h-4 w-4 transition-colors"
      />
    ),
    save: () => (
      <SaveButton
        courseName={name()}
        onToggle={props.onToggleSaved}
        saved={props.saved}
      />
    ),
    semester: () => <>{props.facts.semester ?? ''}</>,
    students: () => (
      <span class="flex flex-col items-end gap-1">
        <StudentCount facts={props.facts} />
        <Show when={!hasUnknownStudents(props.facts)}>
          <PopularityBar share={props.facts.share} />
        </Show>
      </span>
    ),
    tags: () => <CourseTags course={props.course} />,
  };

  return (
    <TableRow
      class="group cursor-pointer"
      onClick={() => {
        props.onClick();
      }}
    >
      <For each={props.columns}>
        {(column) => (
          <TableCell class={column.cellClass}>{cells[column.key]()}</TableCell>
        )}
      </For>
    </TableRow>
  );
};
