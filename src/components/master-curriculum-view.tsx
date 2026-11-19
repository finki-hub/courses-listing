import { GraduationCap } from 'lucide-solid';
import { Show } from 'solid-js';

import { MasterCurriculum } from '@/components/master-curriculum';
import { EmptyState } from '@/components/ui/empty-state';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { capture } from '@/lib/analytics-client';
import { useLanguage } from '@/lib/LanguageProvider';
import { type ListingView } from '@/lib/listing-url-state';
import { filterCurriculum } from '@/lib/master-curriculum';
import { type ProgramCourse } from '@/lib/master-programs';
import { type CourseRaw } from '@/types/course';

import { NoResults } from './listing-filter-frames';
import { stackedLabel } from './listing-filter-panel';
import { type MasterListing } from './use-master-listing';

type MasterViewSwitchProps = {
  readonly onSelect: (view: ListingView) => void;
  readonly value: ListingView;
};

// Chooses between the master's course list and a program's curriculum.
export const MasterViewSwitch = (props: MasterViewSwitchProps) => {
  const { t } = useLanguage();
  return (
    <SegmentedControl
      aria-label={stackedLabel(t().masters.curriculum.label)}
      class="w-full sm:w-auto"
      items={[
        { label: t().masters.curriculum.list, value: 'list' as const },
        {
          label: t().masters.curriculum.curriculum,
          value: 'curriculum' as const,
        },
      ]}
      onSelect={(view) => {
        props.onSelect(view);
        capture('master_layout_changed', { layout: view });
      }}
      size="sm"
      value={props.value}
    />
  );
};

type MasterCurriculumViewProps = {
  readonly canClear: boolean;
  /** Whether a program row's course passes the listing's filters. */
  readonly keep: (entry: ProgramCourse) => boolean;
  readonly masters: MasterListing;
  readonly onClear: () => void;
  readonly onOpen: (course: CourseRaw) => void;
  readonly program: null | string;
};

// The selected program's curriculum, or a prompt to select one.
export const MasterCurriculumView = (props: MasterCurriculumViewProps) => {
  const { t } = useLanguage();
  return (
    <Show
      fallback={
        <EmptyState
          icon={<GraduationCap />}
          text={t().masters.curriculum.chooseProgramText}
          title={t().masters.curriculum.chooseProgramTitle}
        />
      }
      when={props.program}
    >
      {(program) => (
        <Show
          fallback={
            <Show when={!props.masters.error()}>
              <p
                class="text-muted-foreground py-12 text-center text-sm"
                role="status"
              >
                {t().masters.loading}
              </p>
            </Show>
          }
          when={props.masters.loaded()}
        >
          <MasterCurriculum
            ects={props.masters.programEcts(program())}
            empty={
              props.masters.curriculum(program()).length === 0 ? undefined : (
                <NoResults
                  canClear={props.canClear}
                  onClear={props.onClear}
                />
              )
            }
            findCourse={props.masters.findCourse}
            onOpen={props.onOpen}
            semesters={filterCurriculum(
              props.masters.curriculum(program()),
              props.keep,
            )}
            title={props.masters.programTitle(program())}
          />
        </Show>
      )}
    </Show>
  );
};
