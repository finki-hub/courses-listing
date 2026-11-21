import { type JSX } from '@solidjs/web';
import { createSignal, createUniqueId, For } from 'solid-js';

import { ChevronDown, RotateCcw } from '@/components/ui/icons';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  GRADUATION_CREDITS_3YR,
  GRADUATION_CREDITS_4YR,
} from '@/lib/simulator';
import { type SimulatorProgress } from '@/lib/simulator-setup';
import { trackHeight } from '@/lib/track-height';
import { cn } from '@/lib/utils';

import { SIMULATOR_ACTION_CLASS } from './course-styles';
import { Meter } from './meter';
import { ShareButton } from './share-button';

type ProgressHeaderProps = {
  counts: { enrolled: number; passed: number };
  onReset: () => void;
  onShare: () => Promise<boolean>;
  progress: SimulatorProgress;
  /** The program chip that opens the settings. */
  settings: JSX.Element;
};

// The student's standing at a glance, kept in view while scrolling: credits
// toward both degrees, enrolled and passed counts and the elective limits.
// On phones the counts and limits fold behind "Details".
export const ProgressHeader = (props: ProgressHeaderProps) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = createSignal(false);
  const detailsId = createUniqueId();

  const degreeMarkers = () => [
    {
      at: props.progress.threeYearMark,
      label: `${t().simulator.progress.degree3}: ${String(GRADUATION_CREDITS_3YR)}`,
    },
  ];

  return (
    <section
      aria-label={t().simulator.progress.label}
      class="bg-card sticky top-[calc(var(--tabbar-h,0px)+4px)] z-30 space-y-3 rounded-xl border p-3 shadow-md sm:px-4"
      ref={(element) => {
        trackHeight(element, '--sticky-progress-h');
      }}
    >
      <div class="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div class="min-w-0 flex-1 lg:max-w-sm lg:flex-none">
          {props.settings}
        </div>
        <div class="flex gap-2 lg:order-last">
          <ShareButton onShare={props.onShare} />
          <button
            aria-label={t().simulator.reset}
            class={cn(
              SIMULATOR_ACTION_CLASS,
              'bg-card text-danger hover:bg-danger-soft',
            )}
            onClick={() => {
              props.onReset();
            }}
            title={t().simulator.reset}
            type="button"
          >
            <RotateCcw
              aria-hidden="true"
              class="h-4 w-4"
            />
            <span class="hidden sm:inline">{t().simulator.reset}</span>
          </button>
        </div>

        <div class="flex w-full items-center gap-3 sm:gap-4 lg:w-auto lg:flex-1">
          <p class="shrink-0 text-sm">
            <span class="text-section font-semibold tabular-nums">
              {props.progress.credits}
            </span>{' '}
            <span class="text-muted-foreground">{t().simulator.credits}</span>
          </p>
          <div class="min-w-0 flex-1 space-y-1">
            <Meter
              label={`${interpolate(t().simulator.progress.credits, {
                credits: props.progress.credits,
              })}: ${t().simulator.progress.degree3} ${String(GRADUATION_CREDITS_3YR)}, ${t().simulator.progress.degree4} ${String(GRADUATION_CREDITS_4YR)}`}
              markers={degreeMarkers()}
              max={GRADUATION_CREDITS_4YR}
              value={props.progress.credits}
            />
            <div class="text-muted-foreground relative h-4 text-[11px] sm:text-xs">
              {/* Ends at its marker, so it never runs into the 4-year label. */}
              <span
                class="absolute -translate-x-full pr-1 whitespace-nowrap"
                style={{ left: `${String(props.progress.threeYearMark)}%` }}
              >
                {GRADUATION_CREDITS_3YR}
                <span class="hidden sm:inline">
                  {' '}
                  ({t().simulator.progress.degree3Short})
                </span>
              </span>
              <span class="absolute right-0 whitespace-nowrap">
                {GRADUATION_CREDITS_4YR}
                <span class="hidden sm:inline">
                  {' '}
                  ({t().simulator.progress.degree4Short})
                </span>
              </span>
            </div>
          </div>
          <button
            aria-controls={detailsId}
            aria-expanded={expanded() ? 'true' : 'false'}
            class="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none sm:hidden"
            onClick={() => setExpanded((value) => !value)}
            type="button"
          >
            {t().simulator.progress.details}
            <ChevronDown
              aria-hidden="true"
              class={cn(
                'h-4 w-4 transition-transform motion-reduce:transition-none',
                expanded() && 'rotate-180',
              )}
            />
          </button>
        </div>
      </div>

      <div
        class={cn(
          'flex-wrap items-center gap-x-6 gap-y-3 border-t pt-3 text-sm sm:flex',
          expanded() ? 'flex' : 'hidden',
        )}
        id={detailsId}
      >
        <span class="text-enrolled">
          {t().simulator.attendedPlural}{' '}
          <span class="font-semibold tabular-nums">
            {props.counts.enrolled}
          </span>
        </span>
        <span class="text-passed">
          {t().simulator.passedPlural}{' '}
          <span class="font-semibold tabular-nums">{props.counts.passed}</span>
        </span>
        <For each={props.progress.levels}>
          {(level) => {
            const name = () =>
              interpolate(t().simulator.progress.levelMeter, {
                level: level.level,
              });
            const value = () =>
              interpolate(t().simulator.progress.limitValue, {
                credits: level.credits,
                limit: level.limit,
              });
            return (
              <div class="flex min-w-36 flex-1 items-center gap-2 sm:max-w-56">
                <span class="text-muted-foreground shrink-0 text-xs">
                  {name()}
                </span>
                <Meter
                  class="flex-1"
                  label={`${name()}: ${value()}`}
                  max={level.limit}
                  overflow
                  size="sm"
                  value={level.credits}
                />
                <span class="shrink-0 text-xs tabular-nums">{value()}</span>
              </div>
            );
          }}
        </For>
      </div>
    </section>
  );
};
