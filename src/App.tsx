import {
  ArrowLeftRight,
  Library,
  ListChecks,
  type LucideProps,
  Network,
} from 'lucide-solid';
import { siGithub } from 'simple-icons';
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  Match,
  onCleanup,
  Switch,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { CourseEquivalencies } from '@/components/course-equivalencies';
import { CourseTable } from '@/components/course-table';
import { EnrollmentSimulator } from '@/components/enrollment-simulator';
import { LanguageSelect } from '@/components/language-select';
import { PrerequisiteExplorer } from '@/components/prerequisite-explorer';
import { ThemeToggle } from '@/components/theme-toggle';
import { IconLink } from '@/components/ui/icon-controls';
import { PageHeader } from '@/components/ui/page-header';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useCourses } from '@/data/use-courses';
import { ALERT_STYLES } from '@/lib/alert-styles';
import { useLanguage } from '@/lib/LanguageProvider';
import {
  COURSE_QUERY_PARAM,
  LISTING_FILTER_PARAMS,
  replaceUrlParams,
} from '@/lib/listing-url-state';
import { isMasterCourse } from '@/lib/master-programs';
import { PAGE_QUERY_PARAM, SIMULATOR_SHARE_PARAM } from '@/lib/simulator-share';

type Page = 'equivalencies' | 'listing' | 'prerequisites' | 'simulator';

const PAGE_VALUES: ReadonlySet<string> = new Set([
  'equivalencies',
  'listing',
  'prerequisites',
  'simulator',
]);

const isPage = (value: string): value is Page => PAGE_VALUES.has(value);

const PAGE_ICONS: Record<Page, (props: LucideProps) => JSX.Element> = {
  equivalencies: ArrowLeftRight,
  listing: Library,
  prerequisites: Network,
  simulator: ListChecks,
};

// Tabs whose course detail dialog is linked through `?course=`.
const COURSE_LINK_PAGES: ReadonlySet<Page> = new Set([
  'listing',
  'prerequisites',
]);

const githubPath = siGithub.path;

const getInitialPage = (): Page => {
  const url = new URL(location.href);
  const queryPage = url.searchParams.get(PAGE_QUERY_PARAM);
  if (queryPage && isPage(queryPage)) return queryPage;
  if (url.searchParams.has(SIMULATOR_SHARE_PARAM)) return 'simulator';
  const linksListing = [COURSE_QUERY_PARAM, ...LISTING_FILTER_PARAMS].some(
    (param) => url.searchParams.has(param),
  );
  if (linksListing) return 'listing';
  const storedPage = localStorage.getItem('active-page') ?? '';
  return isPage(storedPage) ? storedPage : 'listing';
};

// Publishes the sticky tab bar's height as --tabbar-h, so content that sticks
// below it (such as the simulator's progress header) can sit right under it.
const trackTabBarHeight = (element: HTMLElement) => {
  const update = () => {
    document.documentElement.style.setProperty(
      '--tabbar-h',
      `${String(element.getBoundingClientRect().height)}px`,
    );
  };
  const observer = new ResizeObserver(update);
  observer.observe(element);
  onCleanup(() => {
    observer.disconnect();
  });
};

const App = () => {
  const { language, setLanguage, t } = useLanguage();
  const tabs = (): Array<{ label: string; value: Page }> => [
    { label: t().nav.listing, value: 'listing' },
    { label: t().nav.simulator, value: 'simulator' },
    { label: t().nav.prerequisites, value: 'prerequisites' },
    { label: t().nav.equivalencies, value: 'equivalencies' },
  ];
  const [courses] = useCourses();
  const [page, setPage] = createSignal<Page>(getInitialPage());
  let previousPage: Page | undefined;

  // Each tab's title and what it is for.
  const pageHeader = () => {
    const strings = t();
    // The simulator describes each of its views itself, under its view switch.
    const headers: Record<Page, { description?: string; title: string }> = {
      equivalencies: {
        description: strings.equivalencies.description,
        title: strings.equivalencies.heading,
      },
      listing: {
        description: strings.pageIntro.listing,
        title: strings.nav.listing,
      },
      prerequisites: {
        description: strings.prerequisites.description,
        title: strings.nav.prerequisites,
      },
      simulator: {
        title: strings.nav.simulator,
      },
    };
    return headers[page()];
  };

  createEffect(() => {
    const staticActivePage = page();
    language();
    localStorage.setItem('active-page', staticActivePage);

    const pageChanged =
      previousPage !== undefined && previousPage !== staticActivePage;
    previousPage = staticActivePage;
    replaceUrlParams((params) => {
      params.set(PAGE_QUERY_PARAM, staticActivePage);
      if (staticActivePage !== 'simulator') {
        params.delete(SIMULATOR_SHARE_PARAM);
      }
      if (staticActivePage !== 'listing') {
        for (const param of LISTING_FILTER_PARAMS) params.delete(param);
      }
      // A course link belongs to the tab it was opened on, if that tab has one.
      if (pageChanged || !COURSE_LINK_PAGES.has(staticActivePage)) {
        params.delete(COURSE_QUERY_PARAM);
      }
    });
  });

  return (
    <>
      <header class="bg-card border-b">
        <div class="container mx-auto flex min-h-16 items-center gap-3 py-2">
          <img
            alt={t().brand}
            class="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
            src="/logo.png"
          />
          <h1 class="min-w-0 flex-1 text-[15px] leading-tight font-bold tracking-tight wrap-break-word sm:text-lg">
            {t().appTitle}
          </h1>
          <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <IconLink
              href="https://github.com/finki-hub/courses-listing"
              rel="noopener noreferrer"
              target="_blank"
              title="GitHub"
            >
              <svg
                aria-hidden="true"
                class="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d={githubPath} />
              </svg>
            </IconLink>
            <LanguageSelect
              label={t().language}
              language={language()}
              setLanguage={setLanguage}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <nav
        aria-label={t().nav.label}
        class="bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-40 border-b backdrop-blur"
        data-app-tabbar
        ref={trackTabBarHeight}
      >
        <div class="container mx-auto grid grid-cols-4 sm:flex sm:gap-1">
          <For each={tabs()}>
            {(tab) => {
              const active = () => page() === tab.value;
              return (
                <button
                  aria-current={active() ? 'page' : undefined}
                  class={`focus-visible:ring-ring relative flex min-w-0 flex-col items-center gap-1 px-1 pt-2.5 pb-2 text-[11px] leading-tight font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset sm:flex-row sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
                    active()
                      ? 'text-foreground after:bg-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full sm:after:inset-x-3'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-page={tab.value}
                  onClick={() => {
                    setPage(tab.value);
                  }}
                  type="button"
                >
                  <Dynamic
                    aria-hidden="true"
                    class={`h-5 w-5 shrink-0 sm:h-4 sm:w-4 ${active() ? 'text-primary' : ''}`}
                    component={PAGE_ICONS[tab.value]}
                  />
                  <span class="max-w-full truncate">{tab.label}</span>
                </button>
              );
            }}
          </For>
        </div>
      </nav>

      <main class="container mx-auto space-y-5 py-5 sm:space-y-6 sm:py-8">
        <PageHeader
          description={pageHeader().description}
          title={pageHeader().title}
        />

        <Switch>
          <Match when={courses.loading}>
            <PageSkeleton
              label={t().common.loading}
              variant={page() === 'listing' ? 'listing' : 'page'}
            />
          </Match>
          <Match when={courses.error !== undefined}>
            <div class={ALERT_STYLES.error}>{t().common.loadError}</div>
          </Match>
          <Match when={courses()}>
            {(data) => {
              // Only the listing shows master's courses; the other tabs work
              // on the undergraduate curriculum.
              const undergraduate = createMemo(() =>
                data().filter((course) => !isMasterCourse(course)),
              );
              return (
                <Switch>
                  <Match when={page() === 'listing'}>
                    <CourseTable courses={data()} />
                  </Match>
                  <Match when={page() === 'simulator'}>
                    <EnrollmentSimulator courses={undergraduate()} />
                  </Match>
                  <Match when={page() === 'prerequisites'}>
                    <PrerequisiteExplorer courses={undergraduate()} />
                  </Match>
                  <Match when={page() === 'equivalencies'}>
                    <CourseEquivalencies courses={undergraduate()} />
                  </Match>
                </Switch>
              );
            }}
          </Match>
        </Switch>
      </main>
    </>
  );
};

export default App;
