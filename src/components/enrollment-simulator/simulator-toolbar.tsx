import { AccreditationSwitch } from '@/components/accreditation-switch';
import { ButtonGroup } from '@/components/ui/button-group';
import { LabeledCheckbox } from '@/components/ui/labeled-checkbox';
import { HPC_CREDITS, type SeasonFilter } from '@/lib/simulator';
import {
  type Accreditation,
  getStudyPrograms,
  STUDY_PROGRAM_LABELS,
} from '@/types/course';

import { ScreenshotButton } from './screenshot-button';

const isSeasonFilter = (v: string): v is 'summer' | 'winter' =>
  v === 'summer' || v === 'winter';

type SimulatorToolbarProps = {
  accreditation: Accreditation;
  hpcCompleted: boolean;
  onReset: () => void;
  onScreenshot: () => Promise<boolean>;
  onSetSeason: (s: SeasonFilter) => void;
  onSwitchAccreditation: (acc: Accreditation) => void;
  onSwitchProgram: (p: string) => void;
  onToggleFilter: () => void;
  onToggleHpc: () => void;
  program: string;
  seasonFilter: SeasonFilter;
  showOnlyEnabled: boolean;
  totalCourses: { enrolled: number; passed: number };
  totalCredits: number;
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
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <div class="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
          <AccreditationSwitch
            accreditation={props.accreditation}
            onSelect={props.onSwitchAccreditation}
          />
        </div>

        <div class="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
          <ButtonGroup
            items={programItems()}
            onSelect={props.onSwitchProgram}
            value={props.program}
          />
        </div>

        <div class="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
          <ButtonGroup
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

      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <div class="bg-muted inline-flex items-center gap-1.5 rounded-md px-2.5 py-1">
            <span class="text-muted-foreground">Кредити</span>
            <span class="font-bold">{props.totalCredits}</span>
          </div>
          <div class="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2.5 py-1 text-blue-700 dark:text-blue-400">
            <span class="opacity-80">Слушани</span>
            <span class="font-bold">{props.totalCourses.enrolled}</span>
          </div>
          <div class="inline-flex items-center gap-1.5 rounded-md bg-green-500/10 px-2.5 py-1 text-green-700 dark:text-green-400">
            <span class="opacity-80">Положени</span>
            <span class="font-bold">{props.totalCourses.passed}</span>
          </div>
        </div>

        <LabeledCheckbox
          checked={props.hpcCompleted}
          onChange={props.onToggleHpc}
        >
          HPC (+{HPC_CREDITS} кредити)
        </LabeledCheckbox>

        <div class="sm:ml-auto" />

        <LabeledCheckbox
          checked={props.showOnlyEnabled}
          onChange={props.onToggleFilter}
        >
          Само достапни
        </LabeledCheckbox>

        <button
          class="text-destructive hover:bg-destructive/10 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
          onClick={() => {
            props.onReset();
          }}
          type="button"
        >
          Ресетирај
        </button>

        <ScreenshotButton onCapture={props.onScreenshot} />
      </div>
    </div>
  );
};
