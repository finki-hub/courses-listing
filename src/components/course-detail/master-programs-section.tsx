import { For, Show } from 'solid-js';

import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  type ElectiveGroup,
  groupProgramEntries,
  type ProgramCourse,
} from '@/lib/master-programs';

import { SECTION_HEADING_CLASS } from './styles';

type MasterProgramsSectionProps = {
  credits: number | undefined;
  entries: readonly ProgramCourse[];
  error: boolean;
  loading: boolean;
  programTitle: (code: string) => string;
};

const SUBHEADING_CLASS = 'text-foreground text-sm font-medium';

// Which master's programs list the course: mandatory placements first, then
// the elective lists that offer it.
export const MasterProgramsSection = (props: MasterProgramsSectionProps) => {
  const { t } = useLanguage();
  const grouped = () => groupProgramEntries(props.entries);

  const groupLabel = (group: ElectiveGroup): string =>
    group.kind === 'named'
      ? (group.name ?? t().masters.electiveGroups.other)
      : t().masters.electiveGroups[group.kind];

  const placement = (entry: ProgramCourse): string =>
    [
      entry.semester === null
        ? ''
        : interpolate(t().listing.semesterValue, { value: entry.semester }),
      entry.code ?? '',
    ]
      .filter((part) => part !== '')
      .join(' · ');

  return (
    <section class="space-y-3 rounded-lg border p-4">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h4 class={SECTION_HEADING_CLASS}>{t().masters.programs}</h4>
        <Show when={props.credits}>
          {(credits) => (
            <span class="text-sm tabular-nums">
              {interpolate(t().listing.creditsValue, { value: credits() })}
            </span>
          )}
        </Show>
      </div>

      <Show when={props.loading}>
        <p class="text-muted-foreground text-sm">{t().masters.loading}</p>
      </Show>
      <Show when={props.error}>
        <p
          class="text-destructive text-sm"
          role="alert"
        >
          {t().masters.loadError}
        </p>
      </Show>
      <Show when={!props.loading && !props.error && props.entries.length === 0}>
        <p class="text-muted-foreground text-sm">{t().masters.noPrograms}</p>
      </Show>

      <Show when={grouped().mandatory.length > 0}>
        <div class="space-y-1">
          <h5 class={SUBHEADING_CLASS}>{t().masters.mandatory}</h5>
          <ul class="space-y-1 text-sm">
            <For each={grouped().mandatory}>
              {(entry) => (
                <li>
                  {props.programTitle(entry.program)}{' '}
                  <span class="text-muted-foreground">
                    ({entry.program}
                    {placement(entry) === '' ? '' : ` · ${placement(entry)}`})
                  </span>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>

      <For each={grouped().electives}>
        {(group) => (
          <div class="space-y-1">
            <h5 class={SUBHEADING_CLASS}>{groupLabel(group)}</h5>
            <ul class="flex flex-wrap gap-x-2 gap-y-1 text-xs">
              <For each={group.entries}>
                {(entry) => (
                  <li title={props.programTitle(entry.program)}>
                    {entry.program}
                    <span class="sr-only">
                      : {props.programTitle(entry.program)}
                    </span>
                  </li>
                )}
              </For>
            </ul>
          </div>
        )}
      </For>
    </section>
  );
};
