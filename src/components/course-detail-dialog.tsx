import { ArrowDown, ArrowUp, Minus } from 'lucide-solid';
import { For, Show } from 'solid-js';

import { AccreditationCard } from '@/components/accreditation-card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ACADEMIC_YEARS,
  type CourseRaw,
  getAccreditationInfo,
  getCourseTags,
  getEnrollmentForYear,
  getTagLabel,
} from '@/types/course';

const SECTION_HEADING_CLASS =
  'text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide';

const ENROLLMENT_VALUE_CLASS =
  'inline-flex min-w-14 items-center justify-center rounded-md px-2 py-1 text-sm font-medium tabular-nums';

const ENROLLMENT_TREND_UP_CLASS =
  'h-3.5 w-3.5 text-green-700 dark:text-green-400';

const ENROLLMENT_TREND_DOWN_CLASS =
  'h-3.5 w-3.5 text-red-700 dark:text-red-400';

const ENROLLMENT_TREND_NEUTRAL_CLASS = 'h-3.5 w-3.5 text-muted-foreground';

const getEnrollmentRange = (course: CourseRaw) => {
  const values = ACADEMIC_YEARS.map((year) =>
    getEnrollmentForYear(course, year),
  ).filter((value) => value > 0);

  if (values.length === 0) {
    return { max: 0, min: 0 };
  }

  return {
    max: Math.max(...values),
    min: Math.min(...values),
  };
};

const getEnrollmentScale = (
  enrollment: number,
  range: ReturnType<typeof getEnrollmentRange>,
) => {
  if (enrollment <= 0) return 0;
  if (range.max === range.min) return 0.6;
  return (enrollment - range.min) / (range.max - range.min);
};

const getEnrollmentOpacity = (
  enrollment: number,
  range: ReturnType<typeof getEnrollmentRange>,
) => {
  const min = 0.3;
  const max = 1;
  return min + getEnrollmentScale(enrollment, range) * (max - min);
};

const getPreviousEnrollment = (
  course: CourseRaw,
  year: (typeof ACADEMIC_YEARS)[number],
) => {
  const yearIndex = ACADEMIC_YEARS.indexOf(year);
  if (yearIndex === -1 || yearIndex === ACADEMIC_YEARS.length - 1) return null;

  const previousYear = ACADEMIC_YEARS[yearIndex + 1];
  if (!previousYear) return null;

  const previousEnrollment = getEnrollmentForYear(course, previousYear);
  return previousEnrollment > 0 ? previousEnrollment : null;
};

type CourseDetailDialogProps = {
  course: CourseRaw | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export const CourseDetailDialog = (props: CourseDetailDialogProps) => (
  <Dialog
    onOpenChange={props.onOpenChange}
    open={props.open}
  >
    <DialogPortal>
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <Show when={props.course}>
          {(course) => {
            const acc2023 = () => getAccreditationInfo(course(), '2023');
            const acc2018 = () => getAccreditationInfo(course(), '2018');
            const enrollmentRange = () => getEnrollmentRange(course());

            return (
              <>
                <DialogHeader>
                  <DialogTitle>{course().name}</DialogTitle>
                  <DialogDescription>
                    Детални информации за предметот
                  </DialogDescription>
                </DialogHeader>

                <div class="space-y-4">
                  {/* Professors & Assistants */}
                  <div class="flex flex-wrap gap-4">
                    <div class="flex-1">
                      <h4 class={SECTION_HEADING_CLASS}>Професори</h4>
                      <div class="flex flex-wrap gap-1">
                        <For
                          each={course().professors.split('\n').filter(Boolean)}
                        >
                          {(prof) => <Badge variant="secondary">{prof}</Badge>}
                        </For>
                      </div>
                    </div>
                    <Show when={course().assistants}>
                      <div class="flex-1">
                        <h4 class={SECTION_HEADING_CLASS}>Асистенти</h4>
                        <div class="flex flex-wrap gap-1">
                          <For
                            each={course()
                              .assistants?.split('\n')
                              .filter(Boolean)}
                          >
                            {(asst) => <Badge variant="outline">{asst}</Badge>}
                          </For>
                        </div>
                      </div>
                    </Show>
                  </div>

                  {/* Tags */}
                  <Show when={getCourseTags(course()).length > 0}>
                    <div>
                      <h4 class={SECTION_HEADING_CLASS}>Тагови</h4>
                      <div class="flex flex-wrap gap-1">
                        <For each={getCourseTags(course())}>
                          {(tag) => (
                            <Badge variant="secondary">
                              {getTagLabel(tag)}
                            </Badge>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  {/* Accreditation info */}
                  <div class="grid gap-4 sm:grid-cols-2">
                    <Show when={acc2023()}>
                      {(info) => (
                        <AccreditationCard
                          info={info()}
                          year="2023"
                        />
                      )}
                    </Show>
                    <Show when={acc2018()}>
                      {(info) => (
                        <AccreditationCard
                          info={info()}
                          year="2018"
                        />
                      )}
                    </Show>
                  </div>

                  {/* Enrollment history */}
                  <div>
                    <h4 class={`${SECTION_HEADING_CLASS} mb-2`}>
                      Број на запишани студенти
                    </h4>
                    <div class="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Академска година</TableHead>
                            <TableHead class="text-right">Запишани</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <For each={ACADEMIC_YEARS}>
                            {(year) => {
                              const enrollment = () =>
                                getEnrollmentForYear(course(), year);
                              const previousEnrollment = () =>
                                getPreviousEnrollment(course(), year);
                              return (
                                <TableRow>
                                  <TableCell class="whitespace-nowrap">
                                    {year}
                                  </TableCell>
                                  <TableCell class="whitespace-nowrap text-right">
                                    <Show
                                      fallback={
                                        <span class="text-muted-foreground">
                                          —
                                        </span>
                                      }
                                      when={enrollment() > 0}
                                    >
                                      <span class="inline-flex items-center justify-end gap-1.5">
                                        <Badge
                                          class={ENROLLMENT_VALUE_CLASS}
                                          style={{
                                            opacity: getEnrollmentOpacity(
                                              enrollment(),
                                              enrollmentRange(),
                                            ),
                                          }}
                                          variant="default"
                                        >
                                          {enrollment()}
                                        </Badge>
                                        <Show
                                          fallback={
                                            <Minus
                                              class={
                                                ENROLLMENT_TREND_NEUTRAL_CLASS
                                              }
                                            />
                                          }
                                          when={previousEnrollment() !== null}
                                        >
                                          <Show
                                            fallback={
                                              <Show
                                                when={
                                                  enrollment() <
                                                  (previousEnrollment() ?? 0)
                                                }
                                              >
                                                <ArrowDown
                                                  class={
                                                    ENROLLMENT_TREND_DOWN_CLASS
                                                  }
                                                />
                                              </Show>
                                            }
                                            when={
                                              enrollment() >
                                              (previousEnrollment() ?? 0)
                                            }
                                          >
                                            <ArrowUp
                                              class={ENROLLMENT_TREND_UP_CLASS}
                                            />
                                          </Show>
                                        </Show>
                                      </span>
                                    </Show>
                                  </TableCell>
                                </TableRow>
                              );
                            }}
                          </For>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </>
            );
          }}
        </Show>
      </DialogContent>
    </DialogPortal>
  </Dialog>
);
