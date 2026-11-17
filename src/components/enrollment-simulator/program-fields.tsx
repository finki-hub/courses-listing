import { createUniqueId } from 'solid-js';

import { AccreditationSwitch } from '@/components/accreditation-switch';
import { Select } from '@/components/ui/select';
import { getStudyProgramName } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  type Accreditation,
  getStudyPrograms,
  STUDY_PROGRAM_LABELS,
} from '@/types/course';

type ProgramFieldsProps = {
  accreditation: Accreditation;
  onSwitchAccreditation: (accreditation: Accreditation) => void;
  onSwitchProgram: (program: string) => void;
  program: string;
};

/**
 * The program as "КН: Компјутерски науки", or the abbreviation alone when the
 * program has no full name.
 *
 * @param program - The program code
 * @param name - The program's full name, if known
 * @returns The label
 */
export const formatProgram = (program: string, name: string | undefined) => {
  const abbreviation = STUDY_PROGRAM_LABELS[program] ?? program;
  return name === undefined ? abbreviation : `${abbreviation}: ${name}`;
};

// The accreditation and study program, stacked with visible labels: the
// choice the whole simulator depends on, used in setup and in the settings.
export const ProgramFields = (props: ProgramFieldsProps) => {
  const { t } = useLanguage();
  const accreditationId = createUniqueId();
  const programId = createUniqueId();
  const options = () =>
    getStudyPrograms(props.accreditation).map((program) => ({
      label: formatProgram(program, getStudyProgramName(program, t())),
      value: program,
    }));

  return (
    <div class="grid gap-4">
      <div class="grid gap-1.5">
        <span
          class="text-sm font-medium"
          id={accreditationId}
        >
          {t().common.accreditation}
        </span>
        <div
          aria-labelledby={accreditationId}
          role="group"
        >
          <AccreditationSwitch
            accreditation={props.accreditation}
            onSelect={props.onSwitchAccreditation}
          />
        </div>
      </div>
      <div class="grid gap-1.5">
        <label
          class="text-sm font-medium"
          for={programId}
        >
          {t().simulator.setup.program}
        </label>
        <Select
          id={programId}
          onChange={props.onSwitchProgram}
          options={options()}
          value={props.program}
        />
      </div>
    </div>
  );
};
