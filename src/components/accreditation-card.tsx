import { ExternalLink } from 'lucide-solid';
import { Show } from 'solid-js';

import type { Accreditation, AccreditationInfo } from '@/types/course';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { interpolate, type Translations } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';

const FINKI_SUBJECT_BASE = 'https://www.finki.ukim.mk/mk/subject/';

const getChannelLabel = (
  t: Translations,
  channel?: string,
): string | undefined => {
  if (channel === undefined || channel === '') return undefined;
  if (channel === '1' || channel === 'TRUE') return t.common.yes;
  return channel === '0' || channel === 'FALSE' ? t.common.no : channel;
};

type AccreditationCardProps = {
  info: AccreditationInfo;
  year: Accreditation;
};

export const AccreditationCard = (props: AccreditationCardProps) => {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base">
            {interpolate(t().detail.accreditationYear, { year: props.year })}
          </CardTitle>
          <Show when={props.info.code}>
            <a
              class="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-medium"
              href={`${FINKI_SUBJECT_BASE}${props.info.code}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t().common.link}
              <ExternalLink class="h-3 w-3" />
            </a>
          </Show>
        </div>
      </CardHeader>
      <CardContent>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Show when={props.info.name}>
            <dt class="text-muted-foreground col-span-2">{t().common.name}</dt>
            <dd class="col-span-2">{props.info.name}</dd>
          </Show>
          <Show when={props.info.code}>
            <dt class="text-muted-foreground">{t().common.code}</dt>
            <dd class="font-mono text-xs">{props.info.code}</dd>
          </Show>
          <Show when={props.info.level}>
            <dt class="text-muted-foreground">{t().common.level}</dt>
            <dd>{props.info.level}</dd>
          </Show>
          <Show when={props.info.semester}>
            <dt class="text-muted-foreground">{t().common.semester}</dt>
            <dd>{props.info.semester}</dd>
          </Show>
          <Show when={getChannelLabel(t(), props.info.channel)}>
            <dt class="text-muted-foreground">{t().common.channel}</dt>
            <dd>{getChannelLabel(t(), props.info.channel)}</dd>
          </Show>
          <Show when={props.info.prerequisite}>
            <dt class="text-muted-foreground col-span-2">
              {t().common.prerequisite}
            </dt>
            <dd class="col-span-2 text-xs">{props.info.prerequisite}</dd>
          </Show>
        </dl>
      </CardContent>
    </Card>
  );
};
