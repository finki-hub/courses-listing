import { createSignal } from 'solid-js';

import { useLanguage } from '@/lib/LanguageProvider';
import { type Accreditation } from '@/types/course';

import { ProgramFields } from './program-fields';

type SimulatorSetupProps = {
  accreditation: Accreditation;
  /** Starts the simulator with the chosen program. */
  onStart: (program: string) => void;
  onSwitchAccreditation: (accreditation: Accreditation) => void;
};

// The first visit: what the simulator does, and the one choice it needs
// before any course makes sense. Nothing is preselected, so the program is
// always the student's own choice.
export const SimulatorSetup = (props: SimulatorSetupProps) => {
  const { t } = useLanguage();
  const [program, setProgram] = createSignal<null | string>(null);

  return (
    <div class="space-y-5">
      <p class="text-muted-foreground max-w-prose text-sm">
        {t().pageIntro.simulator}
      </p>
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
          <p class="text-sm">{t().simulator.setup.description}</p>
        </div>
        <ProgramFields
          accreditation={props.accreditation}
          onSwitchAccreditation={(accreditation) => {
            // Each accreditation has its own programs.
            setProgram(null);
            props.onSwitchAccreditation(accreditation);
          }}
          onSwitchProgram={setProgram}
          placeholder={t().simulator.setup.choose}
          program={program()}
        />
        <button
          class="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring disabled:bg-muted disabled:text-muted-foreground inline-flex min-h-10 w-full items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed sm:w-auto"
          disabled={program() === null}
          onClick={() => {
            const chosen = program();
            if (chosen !== null) props.onStart(chosen);
          }}
          type="button"
        >
          {t().simulator.setup.start}
        </button>
      </section>
    </div>
  );
};
