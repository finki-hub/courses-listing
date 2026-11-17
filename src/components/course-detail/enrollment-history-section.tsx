import { Show } from 'solid-js';

import type { CourseRaw } from '@/types/course';

import { buildEnrollmentMetrics } from '@/lib/course-enrollment';
import { useLanguage } from '@/lib/LanguageProvider';

import { EnrollmentHistoryTable } from './enrollment-history-table';
import { EnrollmentSummary } from './enrollment-summary';

type EnrollmentHistorySectionProps = {
  course: CourseRaw;
};

export const EnrollmentHistorySection = (
  props: EnrollmentHistorySectionProps,
) => {
  const { t } = useLanguage();

  const metrics = () => buildEnrollmentMetrics(props.course, t());

  return (
    <div>
      <Show
        fallback={
          <div class="rounded-lg border border-dashed bg-muted/20 p-4">
            <div class="font-medium">{t().enrollment.noHistory}</div>
            <div class="text-muted-foreground mt-1 text-sm">
              {t().enrollment.noHistoryDescription}
            </div>
          </div>
        }
        when={metrics().entries.length > 0}
      >
        <EnrollmentSummary metrics={metrics()} />
        <EnrollmentHistoryTable metrics={metrics()} />
      </Show>
    </div>
  );
};
