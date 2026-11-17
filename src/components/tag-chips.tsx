import { For } from 'solid-js';

import { ToggleChip } from '@/components/ui/toggle-chip';
import { getTagLabel } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { cn } from '@/lib/utils';
import { ALL_TAGS } from '@/types/course';

type TagChipsProps = {
  class?: string;
  isSelected: (tag: string) => boolean;
  onToggle: (tag: string) => void;
};

// Every course tag as a toggle chip. On narrow screens the row scrolls
// sideways instead of stacking up the page.
export const TagChips = (props: TagChipsProps) => {
  const { t } = useLanguage();
  return (
    <div
      class={cn(
        // The padding keeps focus rings inside the phone scroller.
        '-mx-3 -my-1 flex min-w-0 items-center gap-2 overflow-x-auto px-3 py-1 sm:m-0 sm:flex-wrap sm:overflow-visible sm:p-0',
        props.class,
      )}
    >
      <For each={ALL_TAGS}>
        {(tag) => (
          <ToggleChip
            onToggle={() => {
              props.onToggle(tag);
            }}
            pressed={props.isSelected(tag)}
          >
            {getTagLabel(tag, t())}
          </ToggleChip>
        )}
      </For>
    </div>
  );
};
