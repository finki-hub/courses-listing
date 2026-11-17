import { InfoTip } from '@/components/ui/info-tip';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useLanguage } from '@/lib/LanguageProvider';

export type SimulatorMode = 'checklist' | 'next' | 'plan';

export const SIMULATOR_MODES: readonly SimulatorMode[] = [
  'checklist',
  'next',
  'plan',
];

type SimulatorModeSwitchProps = {
  /** What the current view shows. */
  description: string;
  mode: SimulatorMode;
  onSelect: (mode: SimulatorMode) => void;
};

// Switches between the simulator's views. On narrow screens the view's
// description sits behind an info button to keep the toolbar short.
export const SimulatorModeSwitch = (props: SimulatorModeSwitchProps) => {
  const { t } = useLanguage();
  const items = () =>
    SIMULATOR_MODES.map((mode) => ({
      label: t().simulator.modes[mode],
      value: mode,
    }));
  return (
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <SegmentedControl
          aria-label={t().simulator.modeLabel}
          class="flex-1 sm:flex-none"
          items={items()}
          onSelect={props.onSelect}
          value={props.mode}
        />
        <InfoTip
          class="sm:hidden"
          text={props.description}
        />
      </div>
      <p class="text-muted-foreground hidden text-sm sm:block">
        {props.description}
      </p>
    </div>
  );
};
