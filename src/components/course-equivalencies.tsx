import { createMemo, createSignal, For, Show } from 'solid-js';

import { CourseDetailDialog } from '@/components/course-detail-dialog';
import {
  type OpenEquivalencyCourse,
  PairCard,
  RuleCard,
} from '@/components/equivalency-cards';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchInput } from '@/components/ui/search-input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useLinkedCourseDialog } from '@/components/use-linked-course-dialog';
import { resolveSimilarEquivalencies } from '@/data/course-similar-equivalencies';
import { ALERT_STYLES } from '@/lib/alert-styles';
import { useAppNavigation } from '@/lib/app-navigation';
import { useCourseNames } from '@/lib/course-names-context';
import {
  buildCodeIndex,
  buildEquivalencyPairs,
  EQUIVALENCY_VIEWS,
  type EquivalencyView,
  mergeCombinationRules,
  pairMatchesView,
  ruleMatchesSearch,
} from '@/lib/equivalencies';
import { formatCount, formatNumber, interpolate } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { normalizeSearchText } from '@/lib/search-normalization';
import { type Accreditation, type CourseRaw } from '@/types/course';

type CourseEquivalenciesProps = {
  readonly courses: CourseRaw[];
};

export const CourseEquivalencies = (props: CourseEquivalenciesProps) => {
  const { language, t } = useLanguage();
  const names = useCourseNames();
  const navigation = useAppNavigation();
  const courseDialog = useLinkedCourseDialog(() => props.courses);
  const [dialogAccreditation, setDialogAccreditation] =
    createSignal<Accreditation | null>(null);

  const [search, setSearch] = createSignal('');
  const [view, setView] = createSignal<EquivalencyView | null>(null);

  const pairs = createMemo(() =>
    buildEquivalencyPairs(props.courses, names().courseName),
  );
  const rules = createMemo(() =>
    mergeCombinationRules(resolveSimilarEquivalencies(props.courses)),
  );
  const codeIndex = createMemo(() => buildCodeIndex(props.courses));
  const renamedCount = createMemo(
    () => pairs().filter((pair) => pair.renamed).length,
  );

  const term = createMemo(() => normalizeSearchText(search()));
  const shownPairs = createMemo(() =>
    pairs().filter(
      (pair) =>
        pairMatchesView(pair, view()) &&
        (!term() || pair.searchText.includes(term())),
    ),
  );
  const shownRules = createMemo(() =>
    view() === null || view() === 'rules'
      ? rules().filter((rule) =>
          ruleMatchesSearch(rule, term(), names().courseName),
        )
      : [],
  );
  const shownCount = () => shownPairs().length + shownRules().length;

  const viewLabels = (): Record<EquivalencyView, string> => ({
    renamed: t().equivalencies.viewRenamed,
    rules: t().equivalencies.viewRules,
    unchanged: t().equivalencies.viewUnchanged,
  });

  const openCourse: OpenEquivalencyCourse = (accreditation, code) => {
    const course = code ? codeIndex().get(`${accreditation}:${code}`) : null;
    if (!course) return;
    setDialogAccreditation(accreditation);
    courseDialog.openCourse(course);
  };

  return (
    <section
      aria-label={t().equivalencies.heading}
      class="space-y-4"
    >
      <p class="text-muted-foreground text-sm">
        {interpolate(t().equivalencies.summary, {
          pairs: formatNumber(pairs().length, language()),
          renamed: formatNumber(renamedCount(), language()),
          rules: formatNumber(rules().length, language()),
        })}
      </p>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div class="min-w-0 flex-1 space-y-2">
          <label
            class="text-sm font-medium"
            for="equivalencies-search"
          >
            {t().equivalencies.search}
          </label>
          <SearchInput
            id="equivalencies-search"
            onInput={(event: Event & { currentTarget: HTMLInputElement }) => {
              setSearch(event.currentTarget.value);
            }}
            placeholder={t().equivalencies.searchPlaceholder}
            value={search()}
          />
        </div>
        <SegmentedControl
          allLabel={t().equivalencies.viewAll}
          aria-label={t().equivalencies.view}
          items={EQUIVALENCY_VIEWS.map((value) => ({
            label: viewLabels()[value],
            value,
          }))}
          onClear={() => setView(null)}
          onSelect={setView}
          value={view()}
        />
      </div>

      <p
        aria-live="polite"
        class="text-sm font-medium"
      >
        {formatCount(t().equivalencies.ruleCount, {
          count: shownCount(),
          language: language(),
        })}
      </p>

      <Show
        when={
          view() === 'rules' &&
          shownRules().some((rule) => rule.kind === 'combination')
        }
      >
        <p
          class={ALERT_STYLES.info}
          role="note"
        >
          {t().equivalencies.combinationInfo}
        </p>
      </Show>

      <Show
        fallback={
          <EmptyState
            text={t().equivalencies.emptyText}
            title={t().equivalencies.emptyTitle}
          />
        }
        when={shownCount() > 0}
      >
        <div class="grid gap-3 lg:grid-cols-2">
          <For each={shownPairs()}>
            {(pair) => (
              <PairCard
                onOpen={openCourse}
                pair={pair}
              />
            )}
          </For>
          <For each={shownRules()}>
            {(rule) => (
              <RuleCard
                onOpen={openCourse}
                rule={rule}
              />
            )}
          </For>
        </div>
      </Show>

      <CourseDetailDialog
        accreditation={dialogAccreditation()}
        course={courseDialog.course()}
        courses={props.courses}
        onOpenChange={courseDialog.setOpen}
        onOpenCourse={courseDialog.openCourse}
        onShowPrerequisites={navigation.showPrerequisites}
        open={courseDialog.open()}
      />
    </section>
  );
};
