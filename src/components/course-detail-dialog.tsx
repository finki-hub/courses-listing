import { For, Show } from 'solid-js';

import { AccreditationCard } from '@/components/accreditation-card';
import { EnrollmentHistorySection } from '@/components/course-detail/enrollment-history-section';
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
  type CourseRaw,
  getAccreditationInfo,
  getCourseTags,
  getTagLabel,
} from '@/types/course';

const SECTION_HEADING_CLASS =
  'text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide';

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

            return (
              <>
                <DialogHeader>
                  <DialogTitle>{course().name}</DialogTitle>
                  <DialogDescription>
                    Детални информации за предметот
                  </DialogDescription>
                </DialogHeader>

                <div class="space-y-4">
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

                  <EnrollmentHistorySection course={course()} />
                </div>
              </>
            );
          }}
        </Show>
      </DialogContent>
    </DialogPortal>
  </Dialog>
);
