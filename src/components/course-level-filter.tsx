import { ButtonGroup } from '@/components/ui/button-group';
import { useLanguage } from '@/lib/LanguageProvider';
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

export const CourseLevelFilter = (props: CourseLevelFilterProps) => {
  const { t } = useLanguage();
  return (
    <ButtonGroup
      aria-label={t().common.courseLevel}
      class={`w-full sm:w-auto ${props.class ?? ''}`}
      items={LEVEL_ITEMS}
      onSelect={(level) => {
        props.onSelect(props.value === level ? null : level);
      }}
      value={props.value ?? undefined}
    />
  );
};
