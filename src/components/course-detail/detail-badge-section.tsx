import { For, Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';

import { SECTION_HEADING_CLASS } from './styles';

type DetailBadgeSectionProps = {
  items: string[];
  title: string;
  variant?: 'outline' | 'secondary';
};

export const DetailBadgeSection = (props: DetailBadgeSectionProps) => (
  <Show when={props.items.length > 0}>
    <div class="flex-1">
      <h4 class={SECTION_HEADING_CLASS}>{props.title}</h4>
      <div class="flex flex-wrap gap-1">
        <For each={props.items}>
          {(item) => (
            <Badge variant={props.variant ?? 'secondary'}>{item}</Badge>
          )}
        </For>
      </div>
    </div>
  </Show>
);
