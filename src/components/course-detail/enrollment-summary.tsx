import { ArrowDown, ArrowUp, Minus } from 'lucide-solid';
import { Show } from 'solid-js';

import {
  type EnrollmentMetrics,
  formatEnrollmentDelta,
  formatEnrollmentDeltaPercent,
  formatEnrollmentValue,
} from '@/lib/course-enrollment';

import { EnrollmentSparkline } from './enrollment-sparkline';
import { EnrollmentStatCard } from './enrollment-stat-card';

const ENROLLMENT_TREND_UP_CLASS =
  'h-3.5 w-3.5 text-green-700 dark:text-green-400';

const ENROLLMENT_TREND_DOWN_CLASS =
  'h-3.5 w-3.5 text-red-700 dark:text-red-400';

const ENROLLMENT_TREND_NEUTRAL_CLASS = 'h-3.5 w-3.5 text-muted-foreground';

type EnrollmentSummaryProps = {
  metrics: EnrollmentMetrics;
};

export const EnrollmentSummary = (props: EnrollmentSummaryProps) => (
  <div class="mb-3 space-y-3">
    <div class="rounded-lg border bg-muted/20 p-3">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div class="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
            Насока
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <span class="text-lg font-semibold">
              {props.metrics.trend.label}
            </span>
            <span
              class={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${props.metrics.trend.className}`}
            >
              <Show when={props.metrics.trend.direction === 'up'}>
                <ArrowUp class={ENROLLMENT_TREND_UP_CLASS} />
              </Show>
              <Show when={props.metrics.trend.direction === 'down'}>
                <ArrowDown class={ENROLLMENT_TREND_DOWN_CLASS} />
              </Show>
              <Show
                when={
                  props.metrics.trend.direction === 'flat' ||
                  props.metrics.trend.direction === 'none'
                }
              >
                <Minus class={ENROLLMENT_TREND_NEUTRAL_CLASS} />
              </Show>
              {formatEnrollmentDelta(props.metrics.trend.delta)}
              <Show when={props.metrics.trend.percent !== null}>
                <span class="opacity-80">
                  {formatEnrollmentDeltaPercent(props.metrics.trend.percent)}
                </span>
              </Show>
            </span>
          </div>
          <div class="text-muted-foreground mt-1 text-xs">
            {props.metrics.trend.periodLabel}
          </div>
          <Show when={props.metrics.entries.length === 1}>
            <div class="text-muted-foreground mt-2 text-xs">
              Достапна е само една година, па трендот е информативен.
            </div>
          </Show>
        </div>

        <Show when={props.metrics.sparkline}>
          {(sparkline) => (
            <div class="border-border/60 bg-background/70 rounded-md border px-3 py-2">
              <EnrollmentSparkline sparkline={sparkline()} />
            </div>
          )}
        </Show>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <EnrollmentStatCard
        label="Последно"
        meta={props.metrics.latestEntry?.year}
        value={formatEnrollmentValue(
          props.metrics.latestEntry?.enrollment ?? null,
        )}
      />
      <EnrollmentStatCard
        label="Просек"
        meta={`${props.metrics.entries.length} години`}
        value={formatEnrollmentValue(props.metrics.averageEnrollment)}
      />
      <EnrollmentStatCard
        label="Максимум"
        meta={props.metrics.peakEntry?.year}
        value={formatEnrollmentValue(
          props.metrics.peakEntry?.enrollment ?? null,
        )}
      />
      <EnrollmentStatCard
        label="Минимум"
        meta={props.metrics.lowestEntry?.year}
        value={formatEnrollmentValue(
          props.metrics.lowestEntry?.enrollment ?? null,
        )}
      />
    </div>
  </div>
);
