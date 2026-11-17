import { ExternalLink } from 'lucide-solid';
import { For, type JSX, Show } from 'solid-js';

import type { Accreditation } from '@/types/course';

import { PrerequisiteText } from '@/components/course-detail/prerequisite-text';
import { ProgramStates } from '@/components/course-detail/program-states';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type AccreditationDetails } from '@/lib/course-detail';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';

const FINKI_SUBJECT_BASE = 'https://www.finki.ukim.mk/mk/subject/';
// The FINKI Hub server; the course data says whether a course has a channel
// there, not the channel itself.
const FINKI_HUB_DISCORD_URL =
  'https://discord.gg/finki-studenti-810997107376914444';

const EXTERNAL_LINK_CLASS =
  'text-primary hover:text-primary/80 underline-offset-2 hover:underline';

type AccreditationCardProps = {
  // One accreditation, or several that share every field but the code.
  details: AccreditationDetails[];
  getCourseNames?: (accreditation: Accreditation) => string[];
  onOpenCourse?: (accreditation: Accreditation, name: string) => void;
};

const DetailRow = (props: {
  children: JSX.Element;
  label: string;
  wide?: boolean;
}) => (
  <>
    <dt class={`text-muted-foreground ${props.wide ? 'col-span-2' : ''}`}>
      {props.label}
    </dt>
    <dd class={props.wide ? 'col-span-2' : ''}>{props.children}</dd>
  </>
);

export const AccreditationCard = (props: AccreditationCardProps) => {
  const { t } = useLanguage();
  const primary = () => props.details[0];
  const merged = () => props.details.length > 1;
  const codes = () =>
    props.details
      .map((entry) => entry.code)
      .filter((code): code is string => Boolean(code));
  const title = () =>
    merged()
      ? interpolate(t().detail.accreditationYears, {
          years: props.details.map((d) => d.accreditation).join(', '),
        })
      : interpolate(t().detail.accreditationYear, {
          year: primary()?.accreditation ?? '',
        });
  const openCourse = (name: string) => {
    const details = primary();
    if (details) props.onOpenCourse?.(details.accreditation, name);
  };

  return (
    <Show when={primary()}>
      {(details) => (
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base">{title()}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Show when={details().name}>
                {(name) => (
                  <DetailRow
                    label={t().common.name}
                    wide
                  >
                    {name()}
                  </DetailRow>
                )}
              </Show>
              <Show when={codes().length > 0}>
                <DetailRow label={t().common.code}>
                  <span class="flex flex-col gap-0.5">
                    <For each={codes()}>
                      {(code) => (
                        <a
                          class={`${EXTERNAL_LINK_CLASS} inline-flex w-fit items-center gap-1 font-mono text-xs`}
                          href={`${FINKI_SUBJECT_BASE}${code}`}
                          rel="noopener noreferrer"
                          target="_blank"
                          title={t().detail.subjectPage}
                        >
                          {code}
                          <span class="sr-only">
                            , {t().detail.subjectPage}
                          </span>
                          <ExternalLink
                            aria-hidden="true"
                            class="h-3 w-3"
                          />
                        </a>
                      )}
                    </For>
                  </span>
                </DetailRow>
              </Show>
              <Show when={details().level}>
                <DetailRow label={t().common.level}>
                  {details().level}
                </DetailRow>
              </Show>
              <Show when={details().semester}>
                <DetailRow label={t().common.semester}>
                  {details().semester}
                </DetailRow>
              </Show>
              <DetailRow label={t().detail.credits}>
                {details().credits}
              </DetailRow>
              <DetailRow label={t().common.channel}>
                <Show
                  fallback={t().common.no}
                  when={details().channel}
                >
                  <a
                    class={EXTERNAL_LINK_CLASS}
                    href={FINKI_HUB_DISCORD_URL}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t().detail.discordChannel}
                    <ExternalLink
                      aria-hidden="true"
                      class="ml-1 inline h-3 w-3 align-[-1px]"
                    />
                  </a>
                </Show>
              </DetailRow>
              <Show when={details().prerequisite}>
                {(prerequisite) => (
                  <DetailRow
                    label={t().common.prerequisite}
                    wide
                  >
                    <span class="text-xs">
                      <PrerequisiteText
                        courseNames={
                          props.getCourseNames?.(details().accreditation) ?? []
                        }
                        onOpenCourse={
                          props.onOpenCourse ? openCourse : undefined
                        }
                        text={prerequisite()}
                      />
                    </span>
                  </DetailRow>
                )}
              </Show>
              <For each={props.details.filter((d) => d.programGroups.length)}>
                {(entry) => (
                  <DetailRow
                    label={
                      merged()
                        ? `${t().detail.programs} (${entry.accreditation})`
                        : t().detail.programs
                    }
                    wide
                  >
                    <ProgramStates groups={entry.programGroups} />
                  </DetailRow>
                )}
              </For>
            </dl>
          </CardContent>
        </Card>
      )}
    </Show>
  );
};
