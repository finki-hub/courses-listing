import { Match, Show, Switch } from 'solid-js';

import { ALERT_STYLES } from '@/lib/alert-styles';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { type NextCourse } from '@/lib/next-courses';
import { OVERRIDE_CREDITS } from '@/lib/prerequisite';
import { LEVEL_CREDIT_LIMITS } from '@/lib/simulator';
import { getPlanOptions } from '@/lib/study-plan';
import { type CourseRaw } from '@/types/course';

import { CreditLimitWarning, GraduationAlert } from './alerts';
import { ROW_ACTION_CLASS } from './course-styles';
import { NextCoursesPanel } from './next-courses-panel';
import { PlanView } from './plan-view';
import { ProgressHeader } from './progress-header';
import { SimulatorFilters } from './simulator-filters';
import { SimulatorModeSwitch } from './simulator-mode-switch';
import { SimulatorSettings } from './simulator-settings';
import { SimulatorSetup } from './simulator-setup';
import { SimulatorTable } from './simulator-table';
import { useEnrollmentSimulator } from './use-enrollment-simulator';

type EnrollmentSimulatorProps = {
  courses: CourseRaw[];
};

export const EnrollmentSimulator = (props: EnrollmentSimulatorProps) => {
  const { t } = useLanguage();
  const sim = useEnrollmentSimulator(() => props.courses);

  const descriptions = () => ({
    checklist: t().simulator.description,
    next: t().nextCourses.description,
    plan: t().planner.description,
  });

  // "Add to plan" for a suggested course, or where it is already planned.
  const planAction = (item: NextCourse) => {
    const planned = () => sim.plan.plan()[item.course.name];
    return (
      <button
        class={ROW_ACTION_CLASS}
        disabled={
          planned() !== undefined ||
          getPlanOptions(item.course, sim.plan.start()).length === 0
        }
        onClick={() => {
          sim.plan.addToPlan(item.course);
        }}
        type="button"
      >
        {planned() === undefined
          ? t().planner.addToPlan
          : interpolate(t().planner.plannedFor, { semester: planned() ?? 0 })}
      </button>
    );
  };

  return (
    <Show
      fallback={
        <SimulatorSetup
          accreditation={sim.accreditation()}
          onStart={(program) => {
            sim.setProgram(program);
            sim.completeSetup();
          }}
          onSwitchAccreditation={sim.switchAccreditation}
        />
      }
      when={!sim.setupPending()}
    >
      <div class="space-y-4 sm:space-y-5">
        <ProgressHeader
          counts={sim.state.totalCourses()}
          onReset={sim.actions.reset}
          onShare={sim.copyShareUrl}
          progress={sim.progress()}
          settings={
            <SimulatorSettings
              accreditation={sim.accreditation()}
              hpcCompleted={sim.hpcCompleted()}
              onSwitchAccreditation={sim.switchAccreditation}
              onSwitchProgram={sim.setProgram}
              onToggleHpc={() => {
                sim.setHpcCompleted((value) => !value);
              }}
              onUniListCreditsChange={sim.setUniListCredits}
              program={sim.program()}
              uniListCredits={sim.uniListCredits()}
            />
          }
        />

        <sim.actions.UndoNotice message={t().simulator.resetDone} />

        <SimulatorModeSwitch
          description={descriptions()[sim.mode()]}
          mode={sim.mode()}
          onSelect={sim.setMode}
        />

        <SimulatorFilters
          checklistOnlyCount={
            sim.view.listFilterCount() + (sim.showOnlyEnabled() ? 1 : 0)
          }
          courseFilters={sim.mode() !== 'next'}
          level={sim.levelFilter()}
          onClearChecklistFilters={() => {
            sim.view.clearListFilters();
            sim.setShowOnlyEnabled(false);
          }}
          onSearch={sim.view.setSearch}
          onSetLevel={sim.setLevelFilter}
          onSetSeason={sim.setSeasonFilter}
          onSetType={sim.view.setTypeFilter}
          onToggleOnlyEnabled={() => {
            sim.setShowOnlyEnabled((value) => !value);
          }}
          onToggleTag={sim.view.toggleTag}
          search={sim.view.search()}
          season={sim.seasonFilter()}
          showOnlyEnabled={sim.showOnlyEnabled()}
          tags={sim.view.tagFilter()}
          type={sim.view.typeFilter()}
        />

        <CreditLimitWarning
          levelLimits={LEVEL_CREDIT_LIMITS}
          levels={sim.state.overLimitLevels()}
        />

        <Show when={sim.state.totalCredits() >= OVERRIDE_CREDITS}>
          <div class={ALERT_STYLES.info}>{t().simulator.allUnlocked}</div>
        </Show>

        <GraduationAlert
          eligibility={sim.state.graduationEligibility()}
          missingMandatory3yr={sim.state.graduationInfo().missing3yr}
          missingMandatory4yr={sim.state.graduationInfo().missing4yr}
        />

        <Switch>
          <Match when={sim.mode() === 'checklist'}>
            <SimulatorTable
              courses={sim.courses()}
              enabledMap={sim.state.enabledMap()}
              fullLevels={sim.state.fullLevels()}
              groups={sim.view.groups()}
              onBulkMark={sim.actions.bulkMark}
              onSetStatus={sim.actions.setStatus}
              overLimitSet={sim.state.overLimitSet()}
              reasonMap={sim.state.reasonMap()}
              statuses={sim.statuses()}
            />
          </Match>
          <Match when={sim.mode() === 'next'}>
            <NextCoursesPanel
              actions={planAction}
              isUpcoming={sim.next.isUpcoming()}
              items={sim.next.ranked().items}
              onMarkListened={sim.actions.toggleListened}
              season={sim.next.season()}
              year={sim.next.ranked().year}
            />
          </Match>
          <Match when={sim.mode() === 'plan'}>
            <PlanView
              candidates={sim.planCandidates()}
              evaluation={sim.plan.evaluation()}
              onSetSemester={sim.plan.setSemester}
              plan={sim.plan.plan()}
              start={sim.plan.start()}
            />
          </Match>
        </Switch>
      </div>
    </Show>
  );
};
