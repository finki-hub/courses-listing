import { Show } from 'solid-js';

import type { CourseRaw } from '@/types/course';

import { buildEnrollmentMetrics } from '@/lib/course-enrollment';
import { type Offering } from '@/lib/course-offering';
import { interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';

import { EnrollmentHistoryTable } from './enrollment-history-table';
import { EnrollmentSummary } from './enrollment-summary';

type EnrollmentHistorySectionProps = {
  course: CourseRaw;
  /** Whether the course had students in the latest year, if known. */
  offering?: Offering;
};

export const EnrollmentHistorySection = (
  props: EnrollmentHistorySectionProps,
) => {
  const { t } = useLanguage();

  const metrics = () => buildEnrollmentMetrics(props.course, t());

  return (
    <div>
      <Show when={props.offering}>
        {(offering) => (
          <Show when={offering().kind !== 'current'}>
            <p class="mb-3 text-sm font-medium">
              {(() => {
                const value = offering();
                return value.kind === 'last'
                  ? interpolate(t().enrollment.lastOffered, {
                      year: value.year,
                    })
                  : t().enrollment.notOfferedYet;
              })()}
            </p>
          </Show>
        )}
      </Show>
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
