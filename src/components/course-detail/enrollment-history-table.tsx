import { ArrowDown, ArrowUp, Minus } from 'lucide-solid';
import { For, Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ENROLLMENT_TREND_DOWN_CLASS,
  ENROLLMENT_TREND_NEUTRAL_CLASS,
  ENROLLMENT_TREND_UP_CLASS,
  type EnrollmentMetrics,
  formatEnrollmentDelta,
  formatEnrollmentDeltaPercent,
  getEnrollmentDeltaClass,
} from '@/lib/course-enrollment';
import { ACADEMIC_YEARS } from '@/types/course';

const ENROLLMENT_VALUE_CLASS =
  'inline-flex min-w-14 items-center justify-center rounded-md px-2 py-1 text-sm font-medium tabular-nums';

const ENROLLMENT_DELTA_CLASS =
  'inline-flex min-w-18 flex-col items-center justify-center rounded-md px-2 py-1 text-xs font-medium leading-none tabular-nums';

type EnrollmentHistoryTableProps = {
  metrics: EnrollmentMetrics;
};

export const EnrollmentHistoryTable = (props: EnrollmentHistoryTableProps) => (
  <div class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Академска година</TableHead>
          <TableHead class="hidden text-center md:table-cell">
            Промена
          </TableHead>
          <TableHead class="text-right">Слушачи</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <For each={ACADEMIC_YEARS}>
          {(year) => {
            const entry = () =>
              props.metrics.entries.find((item) => item.year === year);

            return (
              <TableRow>
                <TableCell class="whitespace-nowrap">
                  <div class="flex items-center gap-1.5">
                    <span>{year}</span>
                    <Show when={entry()?.isPeak}>
                      <Badge
                        class="hidden px-1.5 py-0 text-[10px] sm:inline-flex"
                        title="Година со највисок број на слушачи"
                        variant="default"
                      >
                        Макс.
                      </Badge>
                    </Show>
                    <Show when={entry()?.isLowest}>
                      <Badge
                        class="hidden px-1.5 py-0 text-[10px] sm:inline-flex"
                        title="Година со најнизок број на слушачи"
                        variant="outline"
                      >
                        Мин.
                      </Badge>
                    </Show>
                  </div>
                </TableCell>
                <TableCell class="hidden text-center md:table-cell">
                  <Show when={entry()}>
                    {(current) => (
                      <span
                        class={`${ENROLLMENT_DELTA_CLASS} ${getEnrollmentDeltaClass(current().delta)}`}
                      >
                        <span>{formatEnrollmentDelta(current().delta)}</span>
                        <span class="mt-0.5 text-[10px] opacity-80">
                          {formatEnrollmentDeltaPercent(current().deltaPercent)}
                        </span>
                      </span>
                    )}
                  </Show>
                </TableCell>
                <TableCell class="whitespace-nowrap text-right">
                  <Show
                    fallback={<span class="text-muted-foreground">—</span>}
                    when={entry()}
                  >
                    {(current) => (
                      <div class="flex items-center justify-end gap-3">
                        <div class="bg-muted hidden h-2 w-28 overflow-hidden rounded-full md:block">
                          <div
                            class="bg-primary h-full rounded-full"
                            style={{
                              opacity: current().opacity,
                              width: `${current().barWidth}%`,
                            }}
                          />
                        </div>
                        <Badge
                          class={ENROLLMENT_VALUE_CLASS}
                          style={{ opacity: current().opacity }}
                          variant="default"
                        >
                          {current().enrollment}
                        </Badge>
                        <Show
                          fallback={
                            <span title="Нема претходна година за споредба">
                              <Minus class={ENROLLMENT_TREND_NEUTRAL_CLASS} />
                            </span>
                          }
                          when={current().previousEnrollment !== null}
                        >
                          <Show
                            fallback={
                              <Show
                                fallback={
                                  <span title="Ист број на слушачи како претходната година">
                                    <Minus
                                      class={ENROLLMENT_TREND_NEUTRAL_CLASS}
                                    />
                                  </span>
                                }
                                when={current().direction === 'down'}
                              >
                                <span title="Помал број на слушачи од претходната година">
                                  <ArrowDown
                                    class={ENROLLMENT_TREND_DOWN_CLASS}
                                  />
                                </span>
                              </Show>
                            }
                            when={current().direction === 'up'}
                          >
                            <span title="Поголем број на слушачи од претходната година">
                              <ArrowUp class={ENROLLMENT_TREND_UP_CLASS} />
                            </span>
                          </Show>
                        </Show>
                      </div>
                    )}
                  </Show>
                </TableCell>
              </TableRow>
            );
          }}
        </For>
      </TableBody>
    </Table>
  </div>
);
