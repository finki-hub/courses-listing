import { For } from 'solid-js';

import { PROGRAM_STATE_TONES } from '@/components/enrollment-simulator/course-styles';
import { StatusBadge } from '@/components/ui/status-badge';
import { type ProgramStateGroup } from '@/lib/course-detail';
import { useLanguage } from '@/lib/LanguageProvider';

type ProgramStatesProps = {
  groups: ProgramStateGroup[];
};

// How each study program offers the course: one row per kind, listing the
// programs; the source wording stays available on hover.
export const ProgramStates = (props: ProgramStatesProps) => {
  const { t } = useLanguage();
  return (
    <ul class="space-y-1.5">
      <For each={props.groups}>
        {(group) => (
          <li class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge tone={PROGRAM_STATE_TONES[group.kind]}>
              {t().programState[group.kind]}
            </StatusBadge>
            <span class="text-xs">
              <For each={group.programs}>
                {(program, index) => (
                  <>
                    <span title={program.state}>{program.label}</span>
                    {index() < group.programs.length - 1 ? ', ' : ''}
                  </>
                )}
              </For>
            </span>
          </li>
        )}
      </For>
    </ul>
  );
};
