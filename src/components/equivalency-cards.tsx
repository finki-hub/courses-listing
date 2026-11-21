import { type JSX } from '@solidjs/web';
import { For, Show } from 'solid-js';

import {
  type SimilarCourse,
  type SimilarEquivalency,
} from '@/data/course-similar-equivalencies';
import { useCourseNames } from '@/lib/course-names-context';
import { type EquivalencyPair } from '@/lib/equivalencies';
import { interpolate, type Translations } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageProvider';
import { cn } from '@/lib/utils';
import { type Accreditation } from '@/types/course';

export type OpenEquivalencyCourse = (
  accreditation: Accreditation,
  code: string | undefined,
) => void;

const CARD_CLASS = 'bg-card flex flex-col gap-3 rounded-lg border p-4';

const TAG_CLASS =
  'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium';

const CourseButton = (props: {
  accreditation: Accreditation;
  code: string | undefined;
  name: string;
  onOpen: OpenEquivalencyCourse;
}) => {
  const names = useCourseNames();
  return (
    <button
      class="focus-visible:ring-ring hover:text-primary w-fit rounded-sm text-left font-medium text-pretty break-words underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
      onClick={() => {
        props.onOpen(props.accreditation, props.code);
      }}
      type="button"
    >
      {names().courseName(props.name)}
    </button>
  );
};

// A course's name as the accreditation wrote it, under its translation, so a
// rename still shows when both names translate the same.
const WrittenName = (props: { name: string }) => {
  const names = useCourseNames();
  return (
    <Show when={names().courseName(props.name) !== props.name}>
      <span
        class="text-muted-foreground text-xs text-pretty"
        lang="mk"
      >
        {props.name}
      </span>
    </Show>
  );
};

const Code = (props: { code: string | undefined }) => (
  <Show when={props.code}>
    {(code) => (
      <span class="text-muted-foreground font-mono text-xs break-all">
        {code()}
      </span>
    )}
  </Show>
);

const AccreditationLabel = (props: { children: JSX.Element }) => (
  <span class="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
    {props.children}
  </span>
);

const Side = (props: {
  accreditation: Accreditation;
  code: string | undefined;
  name: string;
  onOpen: OpenEquivalencyCourse;
}) => (
  <div class="flex min-w-0 flex-col gap-1">
    <AccreditationLabel>{props.accreditation}</AccreditationLabel>
    <CourseButton {...props} />
    <WrittenName name={props.name} />
    <Code code={props.code} />
  </div>
);

// A renamed course: both names side by side, so the change stands out.
const RenamedCard = (props: {
  onOpen: OpenEquivalencyCourse;
  pair: EquivalencyPair;
}) => {
  const { t } = useLanguage();
  return (
    <article class={cn(CARD_CLASS, 'border-warning-border')}>
      <span class={cn(TAG_CLASS, 'bg-warning-soft text-warning')}>
        {t().equivalencies.renamed}
      </span>
      <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-start">
        <Side
          accreditation="2018"
          code={props.pair.accreditation2018.code}
          name={props.pair.accreditation2018.name}
          onOpen={props.onOpen}
        />
        <span
          aria-hidden="true"
          class="text-primary text-lg font-semibold sm:pt-4"
        >
          <span class="sm:hidden">↓</span>
          <span class="hidden sm:inline">→</span>
        </span>
        <Side
          accreditation="2023"
          code={props.pair.accreditation2023.code}
          name={props.pair.accreditation2023.name}
          onOpen={props.onOpen}
        />
      </div>
    </article>
  );
};

// A course with the same name in both: the name once, then both codes.
const UnchangedCard = (props: {
  onOpen: OpenEquivalencyCourse;
  pair: EquivalencyPair;
}) => {
  const { t } = useLanguage();
  return (
    <article class={CARD_CLASS}>
      <span class={cn(TAG_CLASS, 'bg-muted text-muted-foreground')}>
        {t().equivalencies.unchanged}
      </span>
      <CourseButton
        accreditation="2023"
        code={props.pair.accreditation2023.code}
        name={props.pair.accreditation2023.name}
        onOpen={props.onOpen}
      />
      <dl class="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1">
        <dt>
          <AccreditationLabel>2018</AccreditationLabel>
        </dt>
        <dd>
          <Code code={props.pair.accreditation2018.code} />
        </dd>
        <dt>
          <AccreditationLabel>2023</AccreditationLabel>
        </dt>
        <dd>
          <Code code={props.pair.accreditation2023.code} />
        </dd>
      </dl>
    </article>
  );
};

export const PairCard = (props: {
  onOpen: OpenEquivalencyCourse;
  pair: EquivalencyPair;
}) => (
  <Show
    fallback={<UnchangedCard {...props} />}
    when={props.pair.renamed}
  >
    <RenamedCard {...props} />
  </Show>
);

const RuleCourses = (props: {
  accreditation: Accreditation;
  courses: readonly SimilarCourse[];
  onOpen: OpenEquivalencyCourse;
}) => (
  <ul class="flex min-w-0 flex-col gap-2">
    <For each={props.courses}>
      {(course) => (
        <li class="flex min-w-0 flex-col gap-0.5">
          <CourseButton
            accreditation={props.accreditation}
            code={course.code}
            name={course.name}
            onOpen={props.onOpen}
          />
          <Code code={course.code} />
        </li>
      )}
    </For>
  </ul>
);

const ruleLabel = (rule: SimilarEquivalency, t: Translations): string => {
  if (rule.kind === 'related') return t.equivalencies.related;
  return rule.kind === 'combination'
    ? t.equivalencies.combination
    : t.equivalencies.directional;
};

// A rule within one accreditation: related courses, or sources to targets.
export const RuleCard = (props: {
  onOpen: OpenEquivalencyCourse;
  rule: SimilarEquivalency;
}) => {
  const { t } = useLanguage();
  const sources = () =>
    props.rule.kind === 'related' ? props.rule.courses : props.rule.sources;
  const targets = () =>
    props.rule.kind === 'related' ? [] : props.rule.targets;
  return (
    <article class={CARD_CLASS}>
      <div class="flex flex-wrap items-center gap-2">
        <span class={cn(TAG_CLASS, 'bg-primary/6 text-primary')}>
          {ruleLabel(props.rule, t())}
        </span>
        <span class="text-muted-foreground text-xs">
          {interpolate(t().equivalencies.withinAccreditation, {
            accreditation: props.rule.accreditation,
          })}
        </span>
      </div>
      <Show
        fallback={
          <RuleCourses
            accreditation={props.rule.accreditation}
            courses={sources()}
            onOpen={props.onOpen}
          />
        }
        when={targets().length > 0}
      >
        <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-start">
          <RuleCourses
            accreditation={props.rule.accreditation}
            courses={sources()}
            onOpen={props.onOpen}
          />
          <span
            aria-label={
              props.rule.kind === 'combination'
                ? t().equivalencies.sourcesToTargets
                : t().equivalencies.sourceToTarget
            }
            class="text-primary text-lg font-semibold"
            role="img"
          >
            <span class="sm:hidden">↓</span>
            <span class="hidden sm:inline">→</span>
          </span>
          <RuleCourses
            accreditation={props.rule.accreditation}
            courses={targets()}
            onOpen={props.onOpen}
          />
        </div>
      </Show>
    </article>
  );
};
