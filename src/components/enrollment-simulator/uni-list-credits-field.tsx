import { createMemo } from 'solid-js';

import { InfoTip } from '@/components/ui/info-tip';
import { useLanguage } from '@/lib/LanguageProvider';
import { clampUniListCredits, UNI_LIST_CREDITS_MAX } from '@/lib/simulator';

type UniListCreditsFieldProps = {
  onChange: (credits: number) => void;
  value: number;
};

export const UniListCreditsField = (props: UniListCreditsFieldProps) => {
  const { t } = useLanguage();

  const inputValue = createMemo(() => String(props.value));

  return (
    <div class="ml-auto inline-flex items-center gap-2">
      <span
        class="text-muted-foreground whitespace-nowrap text-xs sm:text-sm"
        id="uni-list-credits-label"
      >
        {t().simulator.universityList}
      </span>
      <input
        aria-labelledby="uni-list-credits-label"
        class="border-input bg-card ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-14 rounded-md border px-2 text-center text-sm [appearance:textfield] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
      <span class="text-muted-foreground inline-flex items-center gap-1 whitespace-nowrap text-xs">
        / {UNI_LIST_CREDITS_MAX}
        <InfoTip text={t().simulator.universityListInfo} />
      </span>
    </div>
  );
};
