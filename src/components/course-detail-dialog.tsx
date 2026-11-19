import { ArrowLeft, Network } from 'lucide-solid';
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  Show,
  untrack,
} from 'solid-js';

import {
  AccreditationSections,
  DetailSection,
  DiscordLink,
  Fact,
} from '@/components/course-detail/accreditation-sections';
import { EnrollmentHistorySection } from '@/components/course-detail/enrollment-history-section';
import { MasterProgramsSection } from '@/components/course-detail/master-programs-section';
import { RequiredForSection } from '@/components/course-detail/required-for-section';
import { SaveButton } from '@/components/saved-courses-ui';
import { Sheet } from '@/components/ui/sheet';
import { type MasterListing } from '@/components/use-master-listing';
import { getLatestEnrollmentYears } from '@/lib/course-facts';
import { getOffering } from '@/lib/course-offering';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { isMasterCourse } from '@/lib/master-programs';
import { useSavedCourses } from '@/lib/saved-courses-store';
import {
  type Accreditation,
  type CourseRaw,
  getCourseName,
  hasChannel,
} from '@/types/course';

type CourseDetailDialogProps = {
  accreditation: Accreditation | null;
  course: CourseRaw | null;
  // All courses, so prerequisites can open the courses they name.
  courses?: CourseRaw[];
  /** Programs for master's courses, which have no accreditations. */
  masters?: MasterListing;
  onOpenChange: (open: boolean) => void;
  onOpenCourse?: (course: CourseRaw) => void;
  /** Centres the prerequisite map on the course; no button without it. */
  onShowPrerequisites?: (course: CourseRaw) => void;
  open: boolean;
};

const splitNames = (value: string | undefined) =>
  value?.split('\n').filter(Boolean) ?? [];

const StaffList = (props: { names: string[]; title: string }) => (
  <Show when={props.names.length > 0}>
    <div class="space-y-1.5">
      <h4 class="text-muted-foreground text-xs font-medium">{props.title}</h4>
      <ul class="space-y-1 text-sm">
        <For each={props.names}>{(name) => <li>{name}</li>}</For>
      </ul>
    </div>
  </Show>
);

// The panel's own actions: save the course, and show it on the map.
const PanelActions = (props: {
  course: CourseRaw;
  name: string;
  onShowPrerequisites?: (course: CourseRaw) => void;
}) => {
  const { t } = useLanguage();
  const saved = useSavedCourses();
  return (
    <div class="flex items-center gap-2">
      <Show when={!isMasterCourse(props.course) && props.onShowPrerequisites}>
        {(show) => (
          <button
            class="hover:bg-muted focus-visible:ring-ring inline-flex min-h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            onClick={() => {
              show()(props.course);
            }}
            type="button"
          >
            <Network
              aria-hidden="true"
              class="h-4 w-4"
            />
            {t().detail.showMap}
          </button>
        )}
      </Show>
      <SaveButton
        class="border"
        courseName={props.name}
        onToggle={() => {
          saved.toggle(props.course);
        }}
        saved={saved.isSaved(props.course)}
      />
    </div>
  );
};

// An undergraduate course's accreditations, and the courses that need it.
const UndergraduateSections = (props: {
  course: CourseRaw;
  courses?: CourseRaw[];
  onOpenCourse?: (course: CourseRaw) => void;
}) => (
  <>
    <AccreditationSections
      course={props.course}
      courses={props.courses}
      onOpenCourse={props.onOpenCourse}
    />
    <Show when={props.onOpenCourse && props.courses}>
      {(courses) => (
        <RequiredForSection
          course={props.course}
          courses={courses()}
          onOpenCourse={(next) => {
            props.onOpenCourse?.(next);
          }}
        />
      )}
    </Show>
  </>
);

const StaffSection = (props: { course: CourseRaw }) => {
  const { t } = useLanguage();
  return (
    <Show
      when={
        splitNames(props.course.professors).length > 0 ||
        splitNames(props.course.assistants).length > 0
      }
    >
      <DetailSection title={t().detail.staff}>
        <div class="grid gap-4 sm:grid-cols-2">
          <StaffList
            names={splitNames(props.course.professors)}
            title={t().detail.professors}
          />
          <StaffList
            names={splitNames(props.course.assistants)}
            title={t().detail.assistants}
          />
        </div>
      </DetailSection>
    </Show>
  );
};

// A course's details in a panel beside the list (a sheet on phones).
// Following a prerequisite opens that course in place, with a way back.
export const CourseDetailDialog = (props: CourseDetailDialogProps) => {
  const { language, t } = useLanguage();
  const [history, setHistory] = createSignal<CourseRaw[]>([]);
  // The last course shown, kept while the panel closes so it always has a
  // title and content.
  const [lastCourse, setLastCourse] = createSignal<CourseRaw | null>(null);
  const shownCourse = () => props.course ?? lastCourse();
  let body: HTMLDivElement | undefined;
  // A move the panel itself asked for: forward to a prerequisite, or back.
  const pending: { move?: { course: CourseRaw; kind: 'back' | 'forward' } } =
    {};

  const latestYears = createMemo(() =>
    getLatestEnrollmentYears(props.courses ?? []),
  );
  // Undergraduate courses only: master's courses have no enrollment data.
  const offeringOf = (value: CourseRaw) =>
    isMasterCourse(value) || !props.courses
      ? undefined
      : getOffering(value, latestYears());

  const nameOf = (value: CourseRaw) =>
    getCourseName(value, props.accreditation, language());

  createEffect(() => {
    if (props.course) setLastCourse(props.course);
  });

  // History changes only once the course has actually changed: forward
  // pushes the course left, back pops it, and anything else starts over.
  let lastSeen = untrack(() => props.course);
  createEffect(
    on(
      () => props.course,
      (current) => {
        const left = lastSeen;
        lastSeen = current;
        const { move } = pending;
        pending.move = undefined;
        const asked = current !== null && move?.course === current;
        if (asked && move.kind === 'back') {
          setHistory((list) => list.slice(0, -1));
        } else if (asked && left) {
          setHistory((list) => [...list, left]);
        } else {
          setHistory([]);
        }
        // The clicked link is gone: start the new course at the top and keep
        // focus in the panel.
        body?.scrollTo({ top: 0 });
        body?.focus({ preventScroll: true });
      },
      { defer: true },
    ),
  );
  createEffect(() => {
    if (props.open) return;
    pending.move = undefined;
    setHistory([]);
  });

  const openFromPanel = (next: CourseRaw) => {
    pending.move = { course: next, kind: 'forward' };
    props.onOpenCourse?.(next);
  };

  const goBack = () => {
    const previous = history().at(-1);
    if (!previous) return;
    pending.move = { course: previous, kind: 'back' };
    props.onOpenCourse?.(previous);
  };

  const alternateName = (course: CourseRaw) =>
    [course.name, course['2023-name'], course['2018-name']].find(
      (name) => name !== undefined && name !== '' && name !== nameOf(course),
    );

  return (
    <Sheet
      bodyRef={(element) => {
        body = element;
      }}
      class="h-[96dvh] max-h-[96dvh] sm:h-dvh sm:max-h-none sm:w-[min(42rem,96vw)]"
      description={(() => {
        const shown = shownCourse();
        return shown ? alternateName(shown) : undefined;
      })()}
      onOpenChange={props.onOpenChange}
      open={props.open}
      title={(() => {
        const shown = shownCourse();
        return shown ? nameOf(shown) : '';
      })()}
    >
      <Show when={shownCourse()}>
        {(course) => (
          <div class="space-y-5">
            <Show when={history().at(-1)}>
              {(previous) => (
                <button
                  class="text-muted-foreground hover:text-foreground focus-visible:ring-ring -mt-1 inline-flex items-center gap-1.5 rounded-md text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  onClick={goBack}
                  type="button"
                >
                  <ArrowLeft
                    aria-hidden="true"
                    class="h-4 w-4"
                  />
                  {interpolate(t().detail.back, {
                    course: nameOf(previous()),
                  })}
                </button>
              )}
            </Show>

            <PanelActions
              course={course()}
              name={nameOf(course())}
              onShowPrerequisites={props.onShowPrerequisites}
            />

            <Show
              fallback={
                <UndergraduateSections
                  course={course()}
                  courses={props.courses}
                  onOpenCourse={props.onOpenCourse ? openFromPanel : undefined}
                />
              }
              when={isMasterCourse(course()) && props.masters}
            >
              {(masters) => (
                <>
                  <Show
                    when={
                      masters().getCredits(course()) !== undefined ||
                      hasChannel(course())
                    }
                  >
                    <DetailSection title={t().detail.overview}>
                      <dl class="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                        <Show when={masters().getCredits(course())}>
                          {(credits) => (
                            <Fact label={t().detail.credits}>{credits()}</Fact>
                          )}
                        </Show>
                        <Show when={hasChannel(course())}>
                          <Fact label={t().common.channel}>
                            <DiscordLink />
                          </Fact>
                        </Show>
                      </dl>
                    </DetailSection>
                  </Show>
                  <DetailSection title={t().masters.programs}>
                    <MasterProgramsSection
                      entries={masters().entries(course())}
                      error={masters().error()}
                      loading={masters().loading()}
                      programTitle={masters().programTitle}
                    />
                  </DetailSection>
                </>
              )}
            </Show>

            <StaffSection course={course()} />

            <DetailSection title={t().enrollment.heading}>
              <EnrollmentHistorySection
                course={course()}
                offering={offeringOf(course())}
              />
            </DetailSection>
          </div>
        )}
      </Show>
    </Sheet>
  );
};
