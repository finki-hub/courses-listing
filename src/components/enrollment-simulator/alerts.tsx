import { Show } from 'solid-js';

import { ALERT_STYLES } from '@/lib/alert-styles';
import { type GraduationEligibility } from '@/lib/simulator';

type CreditLimitWarningProps = {
  levelLimits: Record<number, number>;
  levels: number[];
};

export const CreditLimitWarning = (props: CreditLimitWarningProps) => (
  <Show when={props.levels.length > 0}>
    <div class={ALERT_STYLES.error}>
      ⛔ Надминати се макс. дозволените освоени кредити за{' '}
      {props.levels
        .map(
          (lvl) => `L${String(lvl)} (${String(props.levelLimits[lvl] ?? 0)})`,
        )
        .join(', ')}
      . Кредитите не се избројани.
    </div>
  </Show>
);

type GraduationAlertProps = {
  eligibility: GraduationEligibility;
  missingMandatory3yr: string[];
  missingMandatory4yr: string[];
};

export const GraduationAlert = (props: GraduationAlertProps) => {
  const e = () => props.eligibility;
  const showAlert = () =>
    e().credits3yr || e().credits4yr || e().graduated3yr || e().graduated4yr;

  return (
    <Show when={showAlert()}>
      <div class="space-y-2">
        <Show when={e().graduated3yr || e().graduated4yr}>
          <div class={ALERT_STYLES.successBold}>🎉 Честитки дипломирање!</div>
        </Show>
        <Show when={e().canGrad3yr && !e().canGrad4yr && !e().graduated3yr}>
          <div class={ALERT_STYLES.success}>
            🎓 Ги исполнувате условите за дипломирање со 3 годишни студии (≥ 174
            кредити и сите задолжителни предмети положени, освен Дипломска
            работа)
          </div>
        </Show>
        <Show when={e().credits3yr && !e().canGrad3yr}>
          <div class={ALERT_STYLES.warning}>
            ℹ️ Имате ≥ 174 кредити, но за 3 годишни студии ви недостасуваат
            следните задолжителни предмети:{' '}
            <span class="font-medium">
              {props.missingMandatory3yr.join(', ')}
            </span>
          </div>
        </Show>
        <Show when={e().canGrad4yr && !e().graduated4yr}>
          <div class={ALERT_STYLES.success}>
            🎓 Ги исполнувате условите за дипломирање со 4 годишни студии (≥ 234
            кредити и сите задолжителни предмети положени, освен Дипломска
            работа)
          </div>
        </Show>
        <Show when={e().credits4yr && !e().canGrad4yr}>
          <div class={ALERT_STYLES.warning}>
            ℹ️ Имате ≥ 234 кредити, но за 4 годишни студии ви недостасуваат
            следните задолжителни предмети:{' '}
            <span class="font-medium">
              {props.missingMandatory4yr.join(', ')}
            </span>
          </div>
        </Show>
      </div>
    </Show>
  );
};
