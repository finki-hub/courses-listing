import { ALERT_STYLES } from '@/lib/alert-styles';
import { useLanguage } from '@/lib/LanguageProvider';

const BUTTON_CLASS =
  'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors';

type SharedPreviewBannerProps = {
  onDiscard: () => void;
  onKeep: () => void;
};

// Shown while a shared link is open, so it never replaces saved progress
// unless the student asks for that.
export const SharedPreviewBanner = (props: SharedPreviewBannerProps) => {
  const { t } = useLanguage();
  return (
    <section
      aria-labelledby="shared-preview-title"
      class={`${ALERT_STYLES.info} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
    >
      <div class="space-y-1">
        <h2
          class="font-semibold"
          id="shared-preview-title"
        >
          {t().simulator.sharedTitle}
        </h2>
        <p>{t().simulator.sharedText}</p>
      </div>
      <div class="flex shrink-0 flex-wrap gap-2">
        <button
          class={`${BUTTON_CLASS} bg-card hover:bg-muted text-foreground`}
          onClick={() => {
            props.onDiscard();
          }}
          type="button"
        >
          {t().simulator.sharedDiscard}
        </button>
        <button
          class={`${BUTTON_CLASS} bg-primary text-primary-foreground hover:bg-primary/90 border-transparent`}
          onClick={() => {
            props.onKeep();
          }}
          type="button"
        >
          {t().simulator.sharedKeep}
        </button>
      </div>
    </section>
  );
};
