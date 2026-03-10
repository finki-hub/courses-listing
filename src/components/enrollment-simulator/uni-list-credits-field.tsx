import { createMemo } from 'solid-js';

import { clampUniListCredits, UNI_LIST_CREDITS_MAX } from '@/lib/simulator';

type UniListCreditsFieldProps = {
  onChange: (credits: number) => void;
  value: number;
};

export const UniListCreditsField = (props: UniListCreditsFieldProps) => {
  const inputValue = createMemo(() => String(props.value));

  return (
    <div class="ml-auto inline-flex items-center gap-2">
      <label
        class="text-muted-foreground whitespace-nowrap text-xs uppercase tracking-wide"
        for="uni-list-credits"
      >
        Уни. листа
      </label>
      <input
        class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-14 rounded-md border px-2 text-center text-sm [appearance:textfield] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        id="uni-list-credits"
        max={UNI_LIST_CREDITS_MAX}
        min="0"
        onBlur={(event) => {
          props.onChange(
            clampUniListCredits(Number(event.currentTarget.value)),
          );
        }}
        onInput={(event) => {
          props.onChange(
            clampUniListCredits(Number(event.currentTarget.value)),
          );
        }}
        step="1"
        type="number"
        value={inputValue()}
      />
      <span class="text-muted-foreground whitespace-nowrap text-xs">
        / {UNI_LIST_CREDITS_MAX}
      </span>
    </div>
  );
};
