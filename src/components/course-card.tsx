import { Check } from 'lucide-solid';
import { For, Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { getTagLabel } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  type Accreditation,
  type CourseRaw,
  getAccLabel,
  getCourseName,
  getCourseTags,
  hasChannel,
} from '@/types/course';

type CourseCardProps = {
  accreditation: Accreditation | null;
  course: CourseRaw;
  onClick: () => void;
};

export const CourseCard = (props: CourseCardProps) => {
  const { t } = useLanguage();
  return (
    <button
      class="hover:bg-muted/50 w-full rounded-lg border p-3 text-left transition-colors"
      onClick={() => {
        props.onClick();
      }}
      type="button"
    >
      <div class="mb-1.5 font-medium">
        {getCourseName(props.course, props.accreditation)}
      </div>

      <div class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span>{getAccLabel(props.course)}</span>

        <Show when={hasChannel(props.course)}>
          <span class="text-primary inline-flex items-center gap-0.5">
            <Check class="h-3 w-3" />
            {t().common.channel}
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
                {getTagLabel(tag, t())}
              </Badge>
            )}
          </For>
        </div>
      </Show>
    </button>
  );
};
