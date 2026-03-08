import { type Accreditation } from '@/types/course';

import { ButtonGroup } from './ui/button-group';

const ACCREDITATION_ITEMS = [
  { label: 'Акредитација 2023', value: '2023' as const },
  { label: 'Акредитација 2018', value: '2018' as const },
] as const;

type AccreditationSwitchProps = {
  accreditation: Accreditation;
  onSelect: (accreditation: Accreditation) => void;
};

export const AccreditationSwitch = (props: AccreditationSwitchProps) => (
  <ButtonGroup
    items={ACCREDITATION_ITEMS}
    onSelect={props.onSelect}
    value={props.accreditation}
  />
);
