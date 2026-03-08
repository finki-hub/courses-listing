import { type Accreditation } from '@/types/course';

import { ButtonGroup } from './ui/button-group';

const ACCREDITATION_ITEMS = [
  { label: '2023', value: '2023' },
  { label: '2018', value: '2018' },
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
