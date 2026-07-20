import { Show } from 'solid-js';

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
import {
  type Accreditation,
  type CourseRaw,
  getCourseName,
} from '@/types/course';

type CourseDetailDialogProps = {
  accreditation: Accreditation | null;
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
          {(course) => (
            <>
              <DialogHeader>
                <DialogTitle>
                  {getCourseName(course(), props.accreditation)}
                </DialogTitle>
                <DialogDescription>
                  Детални информации за предметот
                </DialogDescription>
              </DialogHeader>

              <div class="space-y-4">
                <div class="flex flex-wrap gap-4">
                  <DetailBadgeSection
                    items={course().professors.split('\n').filter(Boolean)}
                    title="Професори"
                  />
                  <DetailBadgeSection
                    items={
                      course().assistants?.split('\n').filter(Boolean) ?? []
                    }
                    title="Асистенти"
                    variant="outline"
                  />
                </div>

                <CourseTagsSection course={course()} />

                <AccreditationCardsGrid course={course()} />

                <EnrollmentHistorySection course={course()} />
              </div>
            </>
          )}
        </Show>
      </DialogContent>
    </DialogPortal>
  </Dialog>
);
