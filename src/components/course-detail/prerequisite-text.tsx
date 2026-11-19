import { For, Show } from 'solid-js';

import { linkPrerequisiteText } from '@/lib/course-detail';
import { useCourseNames } from '@/lib/course-names-context';

type PrerequisiteTextProps = {
  courseNames: string[];
  onOpenCourse?: (name: string) => void;
  text: string;
};

// The source prerequisite text, with each known course as a button that opens
// that course's details. Where course names are translated, the courses and
// the words between them are shown in the language.
export const PrerequisiteText = (props: PrerequisiteTextProps) => {
  const names = useCourseNames();
  const courseLabel = (course: string, written: string) => {
    const shown = names().courseName(course);
    return shown === course ? written : shown;
  };
  const segments = () =>
    props.onOpenCourse
      ? linkPrerequisiteText(props.text, props.courseNames)
      : [{ text: names().prerequisiteText(props.text) }];

  return (
    <For each={segments()}>
      {(segment) => (
        <Show
          fallback={names().prerequisiteConnectors(segment.text)}
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
              {courseLabel(course(), segment.text)}
            </button>
          )}
        </Show>
      )}
    </For>
  );
};
