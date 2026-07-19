import { CourseFilterRow } from '@/components/course-filter-row';
import {
  type Accreditation,
  type CourseLevelFilter as CourseLevelFilterValue,
  type SeasonFilter,
} from '@/types/course';

import { SimulatorStats } from './simulator-stats';
import { SimulatorToolbarControls } from './simulator-toolbar-controls';

type SimulatorToolbarProps = {
  accreditation: Accreditation;
  hpcCompleted: boolean;
  levelFilter: CourseLevelFilterValue;
  onReset: () => void;
  onSetLevel: (level: CourseLevelFilterValue) => void;
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

export const SimulatorToolbar = (props: SimulatorToolbarProps) => (
  <div class="space-y-3">
    <CourseFilterRow
      accreditation={props.accreditation}
      levelFilter={props.levelFilter}
      onSetLevel={props.onSetLevel}
      onSetSeason={props.onSetSeason}
      onSwitchAccreditation={props.onSwitchAccreditation}
      onSwitchProgram={props.onSwitchProgram}
      program={props.program}
      seasonFilter={props.seasonFilter}
    />

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
