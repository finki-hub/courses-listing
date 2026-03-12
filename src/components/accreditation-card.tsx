import { ExternalLink } from 'lucide-solid';
import { Show } from 'solid-js';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Accreditation, type AccreditationInfo } from '@/types/course';

const FINKI_SUBJECT_BASE = 'https://www.finki.ukim.mk/mk/subject/';

const getChannelLabel = (channel?: string): string | undefined => {
  if (channel === undefined || channel === '') return undefined;
  if (channel === '1' || channel === 'TRUE') return 'Има';
  if (channel === '0' || channel === 'FALSE') return 'Нема';
  return channel;
};

type AccreditationCardProps = {
  info: AccreditationInfo;
  year: Accreditation;
};

export const AccreditationCard = (props: AccreditationCardProps) => (
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="text-base">Акредитација {props.year}</CardTitle>
        <Show when={props.info.code}>
          <a
            class="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-medium"
            href={`${FINKI_SUBJECT_BASE}${props.info.code}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            Линк
            <ExternalLink class="h-3 w-3" />
          </a>
        </Show>
      </div>
    </CardHeader>
    <CardContent>
      <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Show when={props.info.code}>
          <dt class="text-muted-foreground">Код</dt>
          <dd class="font-mono text-xs">{props.info.code}</dd>
        </Show>
        <Show when={props.info.name}>
          <dt class="text-muted-foreground">Име</dt>
          <dd>{props.info.name}</dd>
        </Show>
        <Show when={props.info.level}>
          <dt class="text-muted-foreground">Ниво</dt>
          <dd>{props.info.level}</dd>
        </Show>
        <Show when={props.info.semester}>
          <dt class="text-muted-foreground">Семестар</dt>
          <dd>{props.info.semester}</dd>
        </Show>
        <Show when={getChannelLabel(props.info.channel)}>
          <dt class="text-muted-foreground">Канал</dt>
          <dd>{getChannelLabel(props.info.channel)}</dd>
        </Show>
        <Show when={props.info.prerequisite}>
          <dt class="text-muted-foreground col-span-2">Предуслов</dt>
          <dd class="col-span-2 text-xs">{props.info.prerequisite}</dd>
        </Show>
      </dl>
    </CardContent>
  </Card>
);
