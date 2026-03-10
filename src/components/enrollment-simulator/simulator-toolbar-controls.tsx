import { LabeledCheckbox } from '@/components/ui/labeled-checkbox';
import { HPC_CREDITS } from '@/lib/simulator';

import { ScreenshotButton } from './screenshot-button';
import { UniListCreditsField } from './uni-list-credits-field';

type SimulatorToolbarControlsProps = {
  hpcCompleted: boolean;
  onReset: () => void;
  onScreenshot: () => Promise<boolean>;
  onToggleFilter: () => void;
  onToggleHpc: () => void;
  onUniListCreditsChange: (credits: number) => void;
  showOnlyEnabled: boolean;
  uniListCredits: number;
};

export const SimulatorToolbarControls = (
  props: SimulatorToolbarControlsProps,
) => (
  <div class="grid grid-cols-2 gap-2 sm:ml-auto sm:flex sm:flex-wrap sm:items-center sm:gap-3">
    <div class="col-span-2 flex min-h-9 items-center rounded-md border px-3 py-2 text-sm sm:col-span-1 sm:gap-4 sm:border-0 sm:px-0 sm:py-0">
      <LabeledCheckbox
        checked={props.hpcCompleted}
        class="shrink-0 border-r pr-3"
        onChange={props.onToggleHpc}
      >
        HPC (+{HPC_CREDITS})
      </LabeledCheckbox>

      <UniListCreditsField
        onChange={props.onUniListCreditsChange}
        value={props.uniListCredits}
      />
    </div>

    <LabeledCheckbox
      checked={props.showOnlyEnabled}
      class="min-h-9 rounded-md border px-3 sm:border-0 sm:px-0"
      onChange={props.onToggleFilter}
    >
      Само достапни
    </LabeledCheckbox>

    <button
      class="text-destructive hover:bg-destructive/10 min-h-9 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
      onClick={() => {
        props.onReset();
      }}
      type="button"
    >
      Ресетирај
    </button>

    <ScreenshotButton
      class="hidden min-h-9 justify-center sm:inline-flex"
      onCapture={props.onScreenshot}
    />
  </div>
);
