import { Show } from 'solid-js';

import { AccreditationCard } from '@/components/accreditation-card';
import { type CourseRaw, getAccreditationInfo } from '@/types/course';

type AccreditationCardsGridProps = {
  course: CourseRaw;
};

export const AccreditationCardsGrid = (props: AccreditationCardsGridProps) => {
  const acc2023 = () => getAccreditationInfo(props.course, '2023');
  const acc2018 = () => getAccreditationInfo(props.course, '2018');

  return (
    <div class="grid gap-4 sm:grid-cols-2">
      <Show when={acc2023()}>
        {(info) => (
          <AccreditationCard
            info={info()}
            year="2023"
          />
        )}
      </Show>
      <Show when={acc2018()}>
        {(info) => (
          <AccreditationCard
            info={info()}
            year="2018"
          />
        )}
      </Show>
    </div>
  );
};
