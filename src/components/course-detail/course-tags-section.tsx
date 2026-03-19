import { For, Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { type CourseRaw, getCourseTags, getTagLabel } from '@/types/course';

import { SECTION_HEADING_CLASS } from './styles';

type CourseTagsSectionProps = {
  course: CourseRaw;
};

export const CourseTagsSection = (props: CourseTagsSectionProps) => {
  const tags = () => getCourseTags(props.course);

  return (
    <Show when={tags().length > 0}>
      <div>
        <h4 class={SECTION_HEADING_CLASS}>Тагови</h4>
        <div class="flex flex-wrap gap-1">
          <For each={tags()}>
            {(tag) => <Badge variant="secondary">{getTagLabel(tag)}</Badge>}
          </For>
        </div>
      </div>
    </Show>
  );
};
