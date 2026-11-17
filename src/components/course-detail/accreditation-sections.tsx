import { ExternalLink } from 'lucide-solid';
import { createMemo, For, type JSX, Show } from 'solid-js';

import { PrerequisiteText } from '@/components/course-detail/prerequisite-text';
import { ProgramStates } from '@/components/course-detail/program-states';
import { SectionHeader } from '@/components/ui/page-header';
import {
  type AccreditationDetails,
  type DetailValue,
  getAccreditationDetails,
  groupDetailValues,
  indexCoursesByName,
} from '@/lib/course-detail';
import { getTagLabel, interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  type Accreditation,
  type CourseRaw,
  getCourseTags,
} from '@/types/course';

const ACCREDITATIONS: readonly Accreditation[] = ['2023', '2018'];

const FINKI_SUBJECT_BASE = 'https://www.finki.ukim.mk/mk/subject/';
// The FINKI Hub server; the course data says whether a course has a channel
// there, not the channel itself.
export const FINKI_HUB_DISCORD_URL =
  'https://discord.gg/finki-studenti-810997107376914444';

export const EXTERNAL_LINK_CLASS =
  'text-primary hover:text-primary/80 inline-flex w-fit items-center gap-1 underline-offset-2 hover:underline';

// A titled block of the course panel.
export const DetailSection = (props: {
  children: JSX.Element;
  title: string;
}) => (
  <section class="space-y-3 border-t pt-5 first:border-t-0 first:pt-0">
    <SectionHeader title={props.title} />
    {props.children}
  </section>
);

// One fact of the overview grid.
export const Fact = (props: { children: JSX.Element; label: string }) => (
  <div class="min-w-0 space-y-0.5">
    <dt class="text-muted-foreground text-xs">{props.label}</dt>
    <dd class="text-sm font-medium">{props.children}</dd>
  </div>
);

// A value both accreditations agree on, or each value with its year.
const GroupedValue = (props: { many: boolean; value: DetailValue }) => (
  <span class="block">
    {props.value.value}
    <Show when={props.many}>
      <span class="text-muted-foreground font-normal">
        {' '}
        ({props.value.accreditations.join(', ')})
      </span>
    </Show>
  </span>
);

const GroupedFact = (props: {
  details: readonly AccreditationDetails[];
  label: string;
  pick: (entry: AccreditationDetails) => number | string | undefined;
}) => {
  const values = () => groupDetailValues(props.details, props.pick);
  return (
    <Show when={values().length > 0}>
      <Fact label={props.label}>
        <For each={values()}>
          {(value) => (
            <GroupedValue
              many={values().length > 1}
              value={value}
            />
          )}
        </For>
      </Fact>
    </Show>
  );
};

export const DiscordLink = () => {
  const { t } = useLanguage();
  return (
    <a
      class={EXTERNAL_LINK_CLASS}
      href={FINKI_HUB_DISCORD_URL}
      rel="noopener noreferrer"
      target="_blank"
    >
      {t().detail.discordChannel}
      <ExternalLink
        aria-hidden="true"
        class="h-3 w-3"
      />
    </a>
  );
};

export const TagList = (props: { course: CourseRaw }) => {
  const { t } = useLanguage();
  return (
    <Show when={getCourseTags(props.course).length > 0}>
      <Fact label={t().common.tags}>
        <span class="flex flex-wrap gap-1">
          <For each={getCourseTags(props.course)}>
            {(tag) => (
              <span class="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-normal">
                {getTagLabel(tag, t())}
              </span>
            )}
          </For>
        </span>
      </Fact>
    </Show>
  );
};

type AccreditationSectionsProps = {
  course: CourseRaw;
  courses?: CourseRaw[];
  onOpenCourse?: (course: CourseRaw) => void;
};

// An undergraduate course across its accreditations: one overview that
// shows a shared value once, its programs and its prerequisites.
export const AccreditationSections = (props: AccreditationSectionsProps) => {
  const { t } = useLanguage();
  const details = createMemo(() =>
    ACCREDITATIONS.flatMap((accreditation) => {
      const entry = getAccreditationDetails(props.course, accreditation);
      return entry ? [entry] : [];
    }),
  );
  const many = () => details().length > 1;

  const indexes = createMemo(
    () =>
      new Map(
        ACCREDITATIONS.map((accreditation) => [
          accreditation,
          indexCoursesByName(props.courses ?? [], accreditation),
        ]),
      ),
  );
  const courseNames = (accreditation: Accreditation) => [
    ...(indexes().get(accreditation)?.keys() ?? []),
  ];
  const openCourse = (accreditation: Accreditation, name: string) => {
    const course = indexes().get(accreditation)?.get(name);
    if (course) props.onOpenCourse?.(course);
  };

  const prerequisites = () =>
    groupDetailValues(details(), (entry) => entry.prerequisite);

  return (
    <>
      <DetailSection title={t().detail.overview}>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Fact label={t().common.code}>
            <span class="flex flex-col gap-0.5">
              <For each={details().filter((entry) => entry.code)}>
                {(entry) => (
                  <a
                    class={`${EXTERNAL_LINK_CLASS} font-mono text-xs`}
                    href={`${FINKI_SUBJECT_BASE}${entry.code ?? ''}`}
                    rel="noopener noreferrer"
                    target="_blank"
                    title={t().detail.subjectPage}
                  >
                    {entry.code}
                    <span class="sr-only">, {t().detail.subjectPage}</span>
                    <ExternalLink
                      aria-hidden="true"
                      class="h-3 w-3"
                    />
                  </a>
                )}
              </For>
            </span>
          </Fact>
          <GroupedFact
            details={details()}
            label={t().detail.credits}
            pick={(entry) => entry.credits}
          />
          <GroupedFact
            details={details()}
            label={t().common.semester}
            pick={(entry) => entry.semester}
          />
          <GroupedFact
            details={details()}
            label={t().common.level}
            pick={(entry) => entry.level}
          />
          <Fact label={t().detail.accreditations}>
            {details()
              .map((entry) => entry.accreditation)
              .join(', ')}
          </Fact>
          <Show when={details().some((entry) => entry.channel)}>
            <Fact label={t().common.channel}>
              <DiscordLink />
            </Fact>
          </Show>
        </dl>
        <dl>
          <TagList course={props.course} />
        </dl>
      </DetailSection>

      <Show when={details().some((entry) => entry.programGroups.length > 0)}>
        <DetailSection title={t().detail.programs}>
          <div class="space-y-3">
            <For each={details().filter((entry) => entry.programGroups.length)}>
              {(entry) => (
                <div class="space-y-1.5">
                  <Show when={many()}>
                    <p class="text-muted-foreground text-xs font-medium">
                      {interpolate(t().detail.accreditationYear, {
                        year: entry.accreditation,
                      })}
                    </p>
                  </Show>
                  <ProgramStates groups={entry.programGroups} />
                </div>
              )}
            </For>
          </div>
        </DetailSection>
      </Show>

      <DetailSection title={t().detail.prerequisites}>
        <Show
          fallback={
            <p class="text-muted-foreground text-sm">
              {t().detail.noPrerequisites}
            </p>
          }
          when={prerequisites().length > 0}
        >
          <ul class="space-y-2 text-sm">
            <For each={prerequisites()}>
              {(prerequisite) => {
                const accreditation = () =>
                  prerequisite.accreditations[0] ?? '2023';
                return (
                  <li class="leading-relaxed">
                    <Show when={prerequisites().length > 1}>
                      <span class="text-muted-foreground mr-1.5 text-xs">
                        {prerequisite.accreditations.join(', ')}
                      </span>
                    </Show>
                    <PrerequisiteText
                      courseNames={courseNames(accreditation())}
                      onOpenCourse={
                        props.onOpenCourse
                          ? (name) => {
                              openCourse(accreditation(), name);
                            }
                          : undefined
                      }
                      text={prerequisite.value}
                    />
                  </li>
                );
              }}
            </For>
          </ul>
        </Show>
      </DetailSection>
    </>
  );
};
