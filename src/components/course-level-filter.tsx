import { SegmentedControl } from '@/components/ui/segmented-control';
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

// Labelled by the surrounding FilterGroup.
export const CourseLevelFilter = (props: CourseLevelFilterProps) => {
  const { t } = useLanguage();
  return (
    <SegmentedControl
      allLabel={t().common.all}
      class={`w-full sm:w-auto ${props.class ?? ''}`}
      items={LEVEL_ITEMS}
      onClear={() => {
        props.onSelect(null);
      }}
      onSelect={props.onSelect}
      value={props.value}
    />
  );
};
