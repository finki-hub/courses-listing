import { InfoTip } from '@/components/ui/info-tip';
import { LabeledCheckbox } from '@/components/ui/labeled-checkbox';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { HPC_CREDITS } from '@/lib/simulator';

import { ShareButton } from './share-button';
import { UniListCreditsField } from './uni-list-credits-field';

type SimulatorToolbarControlsProps = {
  hpcCompleted: boolean;
  onReset: () => void;
  onShare: () => Promise<boolean>;
  onToggleHpc: () => void;
  onUniListCreditsChange: (credits: number) => void;
  uniListCredits: number;
};

export const SimulatorToolbarControls = (
  props: SimulatorToolbarControlsProps,
) => {
  const { t } = useLanguage();
  return (
    <div class="grid grid-cols-2 gap-2 sm:ml-auto sm:flex sm:flex-wrap sm:items-center sm:gap-3">
      <div class="col-span-2 flex min-h-9 items-center rounded-md border px-3 py-2 text-sm sm:col-span-1 sm:gap-4 sm:border-0 sm:px-0 sm:py-0">
        <span class="inline-flex shrink-0 items-center gap-1.5 border-r pr-3">
          <LabeledCheckbox
            checked={props.hpcCompleted}
            onChange={props.onToggleHpc}
          >
            HPC (+{HPC_CREDITS})
          </LabeledCheckbox>
          <InfoTip
            text={interpolate(t().simulator.hpcInfo, { credits: HPC_CREDITS })}
          />
        </span>

        <UniListCreditsField
          onChange={props.onUniListCreditsChange}
          value={props.uniListCredits}
        />
      </div>

      <button
        class="bg-card text-destructive hover:bg-destructive/10 hidden min-h-9 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors sm:inline-flex sm:items-center"
        onClick={() => {
          props.onReset();
        }}
        type="button"
      >
        {t().simulator.reset}
      </button>

      <ShareButton
        class="hidden min-h-9 justify-center sm:inline-flex"
        onShare={props.onShare}
      />
    </div>
  );
};
