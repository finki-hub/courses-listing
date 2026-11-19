import { For, Show } from 'solid-js';

import { linkPrerequisiteText } from '@/lib/course-detail';

type PrerequisiteTextProps = {
  courseNames: string[];
  onOpenCourse?: (name: string) => void;
  text: string;
};

// The source prerequisite text, with each known course as a button that opens
// that course's details.
export const PrerequisiteText = (props: PrerequisiteTextProps) => {
  const segments = () =>
    props.onOpenCourse
      ? linkPrerequisiteText(props.text, props.courseNames)
      : [{ text: props.text }];

  return (
    <For each={segments()}>
      {(segment) => (
        <Show
          fallback={segment.text}
          when={segment.course}
        >
          {(course) => (
            <button
              class="text-primary hover:text-primary/80 cursor-pointer rounded-sm font-medium underline underline-offset-2"
              onClick={() => {
                props.onOpenCourse?.(course());
              }}
              type="button"
            >
              {segment.text}
            </button>
          )}
        </Show>
      )}
    </For>
  );
};
