import { For, Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { CheckIcon } from '@/components/ui/icons';
import {
  type CourseRaw,
  getAccLabel,
  getCourseTags,
  getTagLabel,
  hasChannel,
} from '@/types/course';

type CourseCardProps = {
  course: CourseRaw;
  onClick: () => void;
};

export const CourseCard = (props: CourseCardProps) => (
  <button
    class="hover:bg-muted/50 w-full rounded-lg border p-3 text-left transition-colors"
    onClick={() => {
      props.onClick();
    }}
    type="button"
  >
    <div class="mb-1.5 font-medium">{props.course.name}</div>

    <div class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span>{getAccLabel(props.course)}</span>

      <Show when={hasChannel(props.course)}>
        <span class="text-primary inline-flex items-center gap-0.5">
          <CheckIcon class="h-3 w-3" />
          Канал
        </span>
      </Show>
    </div>

    <Show when={getCourseTags(props.course).length > 0}>
      <div class="mt-2 flex flex-wrap gap-1">
        <For each={getCourseTags(props.course)}>
          {(tag) => (
            <Badge
              class="px-1.5 py-0 text-[10px]"
              variant="secondary"
            >
              {getTagLabel(tag)}
            </Badge>
          )}
        </For>
      </div>
    </Show>
  </button>
);
