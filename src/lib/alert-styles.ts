const ALERT_BASE = 'rounded-lg border p-3 text-sm';

export const ALERT_STYLES = {
  error: `${ALERT_BASE} border-danger-border bg-danger-soft text-danger`,
  info: `${ALERT_BASE} border-info-border bg-info-soft text-info`,
  success: `${ALERT_BASE} border-passed-border bg-passed-soft text-passed`,
  // The degree is within reach: a solid fill, not the soft success tone.
  successBold: `${ALERT_BASE} border-passed bg-passed text-primary-foreground font-semibold`,
  warning: `${ALERT_BASE} border-warning-border bg-warning-soft text-warning`,
} as const;
