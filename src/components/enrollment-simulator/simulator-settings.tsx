import { createSignal } from 'solid-js';

import { GraduationCap } from '@/components/ui/icons';
import { InfoTip } from '@/components/ui/info-tip';
import { LabeledCheckbox } from '@/components/ui/labeled-checkbox';
import { Sheet } from '@/components/ui/sheet';
import { getStudyProgramName, interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { HPC_CREDITS } from '@/lib/simulator';
import { type Accreditation } from '@/types/course';

import { formatProgram, ProgramFields } from './program-fields';
import { UniListCreditsField } from './uni-list-credits-field';

type SimulatorSettingsProps = {
  accreditation: Accreditation;
  hpcCompleted: boolean;
  ignorePrerequisites: boolean;
  onSwitchAccreditation: (accreditation: Accreditation) => void;
  onSwitchProgram: (program: string) => void;
  onToggleHpc: () => void;
  onToggleIgnorePrerequisites: () => void;
  onUniListCreditsChange: (credits: number) => void;
  program: string;
  uniListCredits: number;
};

// The chosen accreditation and program as a chip; it opens a panel with the
// settings that rarely change: those two and the credits from outside the
// course list.
export const SimulatorSettings = (props: SimulatorSettingsProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = createSignal(false);
  const summary = () =>
    `${props.accreditation} · ${formatProgram(
      props.program,
      getStudyProgramName(props.program, t()),
    )}`;

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label={`${t().simulator.settings.edit}: ${summary()}`}
        class="bg-muted hover:bg-raised focus-visible:ring-ring inline-flex min-h-9 max-w-full min-w-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        onClick={() => setOpen(true)}
        title={t().simulator.settings.edit}
        type="button"
      >
        <GraduationCap
          aria-hidden="true"
          class="text-primary h-4 w-4 shrink-0"
        />
        <span class="truncate">{summary()}</span>
      </button>
      <Sheet
        description={t().simulator.settings.description}
        onOpenChange={setOpen}
        open={open()}
        title={t().simulator.settings.title}
      >
        <div class="space-y-6">
          <ProgramFields
            accreditation={props.accreditation}
            onSwitchAccreditation={props.onSwitchAccreditation}
            onSwitchProgram={props.onSwitchProgram}
            program={props.program}
          />
          <fieldset class="space-y-3 border-t pt-5">
            <legend class="text-sm font-medium">
              {t().simulator.settings.extras}
            </legend>
            <div class="flex items-center gap-1.5">
              <LabeledCheckbox
                checked={props.hpcCompleted}
                onChange={props.onToggleHpc}
              >
                HPC (+{HPC_CREDITS})
              </LabeledCheckbox>
              <InfoTip
                text={interpolate(t().simulator.hpcInfo, {
                  credits: HPC_CREDITS,
                })}
              />
            </div>
            <UniListCreditsField
              onChange={props.onUniListCreditsChange}
              value={props.uniListCredits}
            />
          </fieldset>
          <fieldset class="space-y-3 border-t pt-5">
            <legend class="text-sm font-medium">
              {t().simulator.settings.expert}
            </legend>
            <div class="flex items-center gap-1.5">
              <LabeledCheckbox
                checked={props.ignorePrerequisites}
                onChange={props.onToggleIgnorePrerequisites}
              >
                {t().simulator.settings.ignorePrerequisites}
              </LabeledCheckbox>
              <InfoTip text={t().simulator.settings.ignorePrerequisitesInfo} />
            </div>
          </fieldset>
        </div>
      </Sheet>
    </>
  );
};
