import { type Accessor, createEffect, createMemo } from 'solid-js';

import {
  getSimulatorShareUrl,
  replaceSimulatorShareUrl,
  type SharedSimulatorConfig,
} from '@/lib/simulator-share';

type SimulatorShareParams = {
  accreditation: Accessor<SharedSimulatorConfig['accreditation']>;
  courses: Accessor<SharedSimulatorConfig['courses']>;
  hpcCompleted: Accessor<SharedSimulatorConfig['hpcCompleted']>;
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
    program: params.program(),
    seasonFilter: params.seasonFilter(),
    showOnlyEnabled: params.showOnlyEnabled(),
    statuses: params.statuses(),
    uniListCredits: params.uniListCredits(),
  }));

  createEffect(() => {
    replaceSimulatorShareUrl(shareConfig());
  });

  const copyShareUrl = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(getSimulatorShareUrl(shareConfig()));
      return true;
    } catch {
      return false;
    }
  };

  return { copyShareUrl };
};
