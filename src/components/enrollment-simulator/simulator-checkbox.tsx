type CheckboxProps = {
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
};

export const Checkbox = (props: CheckboxProps) => (
  <input
    checked={props.checked}
    class={`ring-offset-background focus-visible:ring-ring h-5 w-5 shrink-0 appearance-none rounded-sm border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
      props.checked
        ? 'bg-primary border-primary accent-primary'
        : 'border-foreground/40 bg-background'
    } ${
      props.disabled
        ? 'cursor-not-allowed opacity-50'
        : 'cursor-pointer hover:border-foreground'
    }`}
    disabled={props.disabled}
    onChange={() => {
      props.onToggle();
    }}
    type="checkbox"
  />
);
