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

// The simulator's three views, with one line on what the current one is for.
export const SimulatorModeSwitch = (props: SimulatorModeSwitchProps) => {
  const { t } = useLanguage();
  const items = () =>
    SIMULATOR_MODES.map((mode) => ({
      label: t().simulator.modes[mode],
      value: mode,
    }));
  return (
    <div class="space-y-2">
      <SegmentedControl
        aria-label={t().simulator.modeLabel}
        class="w-full sm:w-auto"
        items={items()}
        onSelect={props.onSelect}
        value={props.mode}
      />
      <p class="text-muted-foreground max-w-prose text-sm">
        {props.description}
      </p>
    </div>
  );
};
