import { type Accessor, createMemo } from 'solid-js';

import { capture } from '@/lib/analytics-client';
import {
  getSimulatorShareUrl,
  type SharedSimulatorConfig,
} from '@/lib/simulator-share';

type SimulatorShareParams = {
  accreditation: Accessor<SharedSimulatorConfig['accreditation']>;
  courses: Accessor<SharedSimulatorConfig['courses']>;
  hpcCompleted: Accessor<SharedSimulatorConfig['hpcCompleted']>;
  ignorePrerequisites: Accessor<SharedSimulatorConfig['ignorePrerequisites']>;
  plan: Accessor<SharedSimulatorConfig['plan']>;
  program: Accessor<SharedSimulatorConfig['program']>;
  seasonFilter: Accessor<SharedSimulatorConfig['seasonFilter']>;
  showOnlyEnabled: Accessor<SharedSimulatorConfig['showOnlyEnabled']>;
  statuses: Accessor<SharedSimulatorConfig['statuses']>;
  uniListCredits: Accessor<SharedSimulatorConfig['uniListCredits']>;
};

export const useSimulatorShare = (params: SimulatorShareParams) => {
  const shareConfig = createMemo<SharedSimulatorConfig>(() => ({
    accreditation: params.accreditation(),
    courses: params.courses(),
    hpcCompleted: params.hpcCompleted(),
    ignorePrerequisites: params.ignorePrerequisites(),
    plan: params.plan(),
    program: params.program(),
    seasonFilter: params.seasonFilter(),
    showOnlyEnabled: params.showOnlyEnabled(),
    statuses: params.statuses(),
    uniListCredits: params.uniListCredits(),
  }));

  const copyShareUrl = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(getSimulatorShareUrl(shareConfig()));
      capture('simulator_shared');
      return true;
    } catch {
      return false;
    }
  };

  return { copyShareUrl };
};
