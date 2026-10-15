import { Show } from 'solid-js';

import { ALERT_STYLES } from '@/lib/alert-styles';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { type GraduationEligibility } from '@/lib/simulator';

type CreditLimitWarningProps = {
  levelLimits: Record<number, number>;
  levels: number[];
};

export const CreditLimitWarning = (props: CreditLimitWarningProps) => {
  const { t } = useLanguage();
  return (
    <Show when={props.levels.length > 0}>
      <div class={ALERT_STYLES.error}>
        {interpolate(t().simulator.overLimit, {
          levels: props.levels
            .map(
              (level) =>
                `L${String(level)} (${String(props.levelLimits[level] ?? 0)})`,
            )
            .join(', '),
        })}
      </div>
    </Show>
  );
};

type GraduationAlertProps = {
  eligibility: GraduationEligibility;
  missingMandatory3yr: string[];
  missingMandatory4yr: string[];
};

export const GraduationAlert = (props: GraduationAlertProps) => {
  const { t } = useLanguage();

  const e = () => props.eligibility;
  const showAlert = () =>
    e().credits3yr || e().credits4yr || e().graduated3yr || e().graduated4yr;

  return (
    <Show when={showAlert()}>
      <div class="space-y-2">
        <Show when={e().graduated3yr || e().graduated4yr}>
          <div class={ALERT_STYLES.successBold}>{t().simulator.graduated}</div>
        </Show>
        <Show when={e().canGrad3yr && !e().canGrad4yr && !e().graduated3yr}>
          <div class={ALERT_STYLES.success}>{t().simulator.eligible3yr}</div>
        </Show>
        <Show when={e().credits3yr && !e().canGrad3yr}>
          <div class={ALERT_STYLES.warning}>
            {interpolate(t().simulator.missing3yr, {
              courses: props.missingMandatory3yr.join(', '),
            })}
          </div>
        </Show>
        <Show when={e().canGrad4yr && !e().graduated4yr}>
          <div class={ALERT_STYLES.success}>{t().simulator.eligible4yr}</div>
        </Show>
        <Show when={e().credits4yr && !e().canGrad4yr}>
          <div class={ALERT_STYLES.warning}>
            {interpolate(t().simulator.missing4yr, {
              courses: props.missingMandatory4yr.join(', '),
            })}
          </div>
        </Show>
      </div>
    </Show>
  );
};
