import { useLanguage } from '@/lib/LanguageProvider';
import { type Accreditation } from '@/types/course';

import { SegmentedControl } from './ui/segmented-control';

const ACCREDITATION_ITEMS = [
  { label: '2023', value: '2023' },
  { label: '2018', value: '2018' },
] as const;

type AccreditationSwitchProps = {
  accreditation: Accreditation | null;
  /** Shows an explicit "All" option that clears the accreditation. */
  onClear?: () => void;
  onSelect: (accreditation: Accreditation) => void;
};

export const AccreditationSwitch = (props: AccreditationSwitchProps) => {
  const { t } = useLanguage();
  return (
    <SegmentedControl
      allLabel={props.onClear ? t().common.all : undefined}
      items={ACCREDITATION_ITEMS}
      onClear={props.onClear}
      onSelect={props.onSelect}
      value={props.accreditation}
    />
  );
};
