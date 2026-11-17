import { createEffect, on, Show } from 'solid-js';

import { AccreditationCardsGrid } from '@/components/course-detail/accreditation-cards-grid';
import { CourseTagsSection } from '@/components/course-detail/course-tags-section';
import { DetailBadgeSection } from '@/components/course-detail/detail-badge-section';
import { EnrollmentHistorySection } from '@/components/course-detail/enrollment-history-section';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  type Accreditation,
  type CourseRaw,
  getCourseName,
} from '@/types/course';

type CourseDetailDialogProps = {
  accreditation: Accreditation | null;
  course: CourseRaw | null;
  // All courses, so prerequisites can open the courses they name.
  courses?: CourseRaw[];
  onOpenChange: (open: boolean) => void;
  onOpenCourse?: (course: CourseRaw) => void;
  open: boolean;
};

export const CourseDetailDialog = (props: CourseDetailDialogProps) => {
  const { language, t } = useLanguage();
  let content: HTMLDivElement | undefined;

  // Following a prerequisite swaps the course in place: start it at the top,
  // and keep focus in the dialog, since the clicked button is gone.
  createEffect(
    on(
      () => props.course,
      () => {
        content?.scrollTo({ top: 0 });
        content?.focus({ preventScroll: true });
      },
      { defer: true },
    ),
  );

  return (
    <Dialog
      onOpenChange={props.onOpenChange}
      open={props.open}
    >
      <DialogPortal>
        <DialogContent
          class="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
          ref={(element: HTMLDivElement) => {
            content = element;
          }}
        >
          <Show when={props.course}>
            {(course) => {
              const primaryName = () =>
                getCourseName(course(), props.accreditation, language());
              const alternateName = () =>
                [
                  course().name,
                  course()['2023-name'],
                  course()['2018-name'],
                ].find(
                  (name) =>
                    name !== undefined && name !== '' && name !== primaryName(),
                );

              return (
                <>
                  <DialogHeader>
                    <div class="space-y-1">
                      <DialogTitle>{primaryName()}</DialogTitle>
                      <Show when={alternateName()}>
                        {(name) => (
                          <p class="text-foreground/80 text-sm font-medium">
                            {name()}
                          </p>
                        )}
                      </Show>
                    </div>
                    <DialogDescription>
                      {t().detail.description}
                    </DialogDescription>
                  </DialogHeader>

                  <div class="space-y-4">
                    <div class="flex flex-wrap gap-4">
                      <DetailBadgeSection
                        items={course().professors.split('\n').filter(Boolean)}
                        title={t().detail.professors}
                      />
                      <DetailBadgeSection
                        items={
                          course().assistants?.split('\n').filter(Boolean) ?? []
                        }
                        title={t().detail.assistants}
                        variant="outline"
                      />
                    </div>

                    <CourseTagsSection course={course()} />

                    <AccreditationCardsGrid
                      course={course()}
                      courses={props.courses}
                      onOpenCourse={props.onOpenCourse}
                    />

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
};
