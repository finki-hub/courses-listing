import { For } from 'solid-js';

import { PROGRAM_STATE_BADGE_CLASSES } from '@/components/enrollment-simulator/course-styles';
import { Badge } from '@/components/ui/badge';
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
            <Badge
              class={`px-1.5 py-0 text-[11px] leading-4 font-medium ${PROGRAM_STATE_BADGE_CLASSES[group.kind]}`}
              variant="outline"
            >
              {t().programState[group.kind]}
            </Badge>
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
