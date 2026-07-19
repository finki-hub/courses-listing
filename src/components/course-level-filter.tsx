import { ButtonGroup } from '@/components/ui/button-group';
import {
  COURSE_LEVELS,
  type CourseLevelFilter as CourseLevelFilterValue,
} from '@/types/course';

const LEVEL_ITEMS = COURSE_LEVELS.map((level) => ({
  label: `L${String(level)}`,
  value: level,
}));

type CourseLevelFilterProps = {
  readonly class?: string;
  readonly onSelect: (level: CourseLevelFilterValue) => void;
  readonly value: CourseLevelFilterValue;
};

export const CourseLevelFilter = (props: CourseLevelFilterProps) => (
  <div class={`flex items-center gap-2 ${props.class ?? ''}`}>
    <span class="text-muted-foreground text-sm">Ниво:</span>
    <ButtonGroup
      aria-label="Ниво на предмет"
      class="flex-1 sm:w-auto sm:flex-none"
      items={LEVEL_ITEMS}
      onSelect={(level) => {
        props.onSelect(props.value === level ? null : level);
      }}
      value={props.value ?? undefined}
    />
  </div>
);
