import { For, type JSX } from 'solid-js';

import { ToggleChip } from '@/components/ui/toggle-chip';
import { getTagLabel } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { cn } from '@/lib/utils';
import { ALL_TAGS } from '@/types/course';

type TagChipsProps = {
  /** Extra controls after the chips, such as how tags combine. */
  children?: JSX.Element;
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
        '-mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0',
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
      {props.children}
    </div>
  );
};
