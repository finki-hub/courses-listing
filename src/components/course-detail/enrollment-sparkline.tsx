import { For } from 'solid-js';

import type { EnrollmentSparkline as EnrollmentSparklineData } from '@/lib/course-enrollment';

type EnrollmentSparklineProps = {
  sparkline: EnrollmentSparklineData;
};

export const EnrollmentSparkline = (props: EnrollmentSparklineProps) => (
  <div class="w-44 shrink-0 sm:w-52">
    <svg
      class="h-12 w-full text-primary"
      fill="none"
      viewBox="0 0 120 36"
    >
      <path
        d={props.sparkline.path}
        opacity="0.2"
        stroke="currentColor"
        stroke-width="6"
      />
      <path
        d={props.sparkline.path}
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2.5"
      />
      <For each={props.sparkline.points}>
        {(point) => (
          <circle
            cx={point.x}
            cy={point.y}
            fill="currentColor"
            r="2.5"
          />
        )}
      </For>
    </svg>
    <div class="text-muted-foreground flex justify-between text-[10px]">
      <span>{props.sparkline.points[0]?.year}</span>
      <span>{props.sparkline.points.at(-1)?.year}</span>
    </div>
  </div>
);
