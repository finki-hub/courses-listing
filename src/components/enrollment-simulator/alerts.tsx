import { Show } from 'solid-js';

import { ALERT_STYLES } from '@/lib/simulator';

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
  diplomaPassed: boolean;
  missingMandatory3yr: string[];
  missingMandatory4yr: string[];
  totalCredits: number;
};

export const GraduationAlert = (props: GraduationAlertProps) => {
  const credits3yr = () => props.totalCredits >= 174;
  const credits4yr = () => props.totalCredits >= 234;
  const canGrad3yr = () =>
    credits3yr() && props.missingMandatory3yr.length === 0;
  const canGrad4yr = () =>
    credits4yr() && props.missingMandatory4yr.length === 0;
  const graduated3yr = () => canGrad3yr() && props.diplomaPassed;
  const graduated4yr = () => canGrad4yr() && props.diplomaPassed;
  const showAlert = () => credits3yr() || credits4yr() || props.diplomaPassed;

  return (
    <Show when={showAlert()}>
      <div class="space-y-2">
        <Show when={graduated3yr() || graduated4yr()}>
          <div class={ALERT_STYLES.successBold}>
            🎉 Честитки дипломирање!
          </div>
        </Show>
        <Show when={canGrad3yr()}>
          <div class={ALERT_STYLES.success}>
            🎓 Ги исполнувате условите за дипломирање со 3 годишни студии (≥ 174
            кредити и сите задолжителни предмети положени)
          </div>
        </Show>
        <Show when={credits3yr() && !canGrad3yr()}>
          <div class={ALERT_STYLES.warning}>
            ℹ️ Имате ≥ 174 кредити, но за 3 годишни студии ви недостасуваат
            следните задолжителни предмети:{' '}
            <span class="font-medium">
              {props.missingMandatory3yr.join(', ')}
            </span>
          </div>
        </Show>
        <Show when={canGrad4yr()}>
          <div class={ALERT_STYLES.success}>
            🎓 Ги исполнувате условите за дипломирање со 4 годишни студии (≥ 234
            кредити и сите задолжителни предмети положени)
          </div>
        </Show>
        <Show when={credits4yr() && !canGrad4yr()}>
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
