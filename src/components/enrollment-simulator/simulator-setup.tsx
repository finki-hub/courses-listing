import { useLanguage } from '@/lib/LanguageProvider';
import { type Accreditation } from '@/types/course';

import { ProgramFields } from './program-fields';

type SimulatorSetupProps = {
  accreditation: Accreditation;
  onStart: () => void;
  onSwitchAccreditation: (accreditation: Accreditation) => void;
  onSwitchProgram: (program: string) => void;
  program: string;
};

// The first visit: what the simulator does, and the one choice it needs
// before any course makes sense.
export const SimulatorSetup = (props: SimulatorSetupProps) => {
  const { t } = useLanguage();
  return (
    <section
      aria-labelledby="simulator-setup-title"
      class="bg-card mx-auto max-w-xl space-y-5 rounded-xl border p-5 shadow-sm sm:p-7"
    >
      <div class="space-y-2">
        <h3
          class="text-section font-semibold"
          id="simulator-setup-title"
        >
          {t().simulator.setup.title}
        </h3>
        <p class="text-muted-foreground text-sm">{t().pageIntro.simulator}</p>
        <p class="text-sm">{t().simulator.setup.description}</p>
      </div>
      <ProgramFields
        accreditation={props.accreditation}
        onSwitchAccreditation={props.onSwitchAccreditation}
        onSwitchProgram={props.onSwitchProgram}
        program={props.program}
      />
      <button
        class="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex min-h-10 w-full items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto"
        onClick={() => {
          props.onStart();
        }}
        type="button"
      >
        {t().simulator.setup.start}
      </button>
    </section>
  );
};
