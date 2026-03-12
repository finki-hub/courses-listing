import { AccreditationSwitch } from '@/components/accreditation-switch';
import { ButtonGroup } from '@/components/ui/button-group';
import { type SeasonFilter } from '@/lib/simulator';
import {
  type Accreditation,
  getStudyPrograms,
  STUDY_PROGRAM_LABELS,
} from '@/types/course';

import { SimulatorStats } from './simulator-stats';
import { SimulatorToolbarControls } from './simulator-toolbar-controls';

const isSeasonFilter = (v: string): v is 'summer' | 'winter' =>
  v === 'summer' || v === 'winter';

type SimulatorToolbarProps = {
  accreditation: Accreditation;
  hpcCompleted: boolean;
  onReset: () => void;
  onSetSeason: (s: SeasonFilter) => void;
  onShare: () => Promise<boolean>;
  onSwitchAccreditation: (acc: Accreditation) => void;
  onSwitchProgram: (p: string) => void;
  onToggleFilter: () => void;
  onToggleHpc: () => void;
  onUniListCreditsChange: (credits: number) => void;
  program: string;
  seasonFilter: SeasonFilter;
  showOnlyEnabled: boolean;
  totalCourses: { enrolled: number; passed: number };
  totalCredits: number;
  uniListCredits: number;
};

const SEASON_ITEMS = [
  { label: 'Зимски', value: 'winter' },
  { label: 'Летен', value: 'summer' },
] as const;

export const SimulatorToolbar = (props: SimulatorToolbarProps) => {
  const programItems = () => {
    const list = getStudyPrograms(props.accreditation);
    return [...list].map((p) => ({
      label: STUDY_PROGRAM_LABELS[p] ?? p,
      value: p,
    }));
  };

  return (
    <div class="space-y-3">
      <div class="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
        <div>
          <AccreditationSwitch
            accreditation={props.accreditation}
            onSelect={props.onSwitchAccreditation}
          />
        </div>

        <div>
          <ButtonGroup
            class="w-full sm:w-auto"
            items={programItems()}
            onSelect={props.onSwitchProgram}
            value={props.program}
          />
        </div>

        <div>
          <ButtonGroup
            class="w-full sm:w-auto"
            items={SEASON_ITEMS}
            onSelect={(v) => {
              props.onSetSeason(
                props.seasonFilter === v || !isSeasonFilter(v) ? null : v,
              );
            }}
            value={props.seasonFilter ?? ''}
          />
        </div>
      </div>

      <div class="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <SimulatorStats
          totalCourses={props.totalCourses}
          totalCredits={props.totalCredits}
        />

        <SimulatorToolbarControls
          hpcCompleted={props.hpcCompleted}
          onReset={props.onReset}
          onShare={props.onShare}
          onToggleFilter={props.onToggleFilter}
          onToggleHpc={props.onToggleHpc}
          onUniListCreditsChange={props.onUniListCreditsChange}
          showOnlyEnabled={props.showOnlyEnabled}
          uniListCredits={props.uniListCredits}
        />
      </div>
    </div>
  );
};
