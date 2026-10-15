import { siGithub } from 'simple-icons';
import {
  createEffect,
  createSignal,
  For,
  Match,
  onCleanup,
  Switch,
} from 'solid-js';

import { CourseEquivalencies } from '@/components/course-equivalencies';
import { CourseTable } from '@/components/course-table';
import { EnrollmentSimulator } from '@/components/enrollment-simulator';
import { LanguageSelect } from '@/components/language-select';
import { PrerequisiteExplorer } from '@/components/prerequisite-explorer';
import { ThemeToggle } from '@/components/theme-toggle';
import { IconLink } from '@/components/ui/icon-controls';
import { useCourses } from '@/data/use-courses';
import { ALERT_STYLES } from '@/lib/alert-styles';
import { useLanguage } from '@/lib/LanguageProvider';
import { PAGE_QUERY_PARAM, SIMULATOR_SHARE_PARAM } from '@/lib/simulator-share';

type Page = 'equivalencies' | 'listing' | 'prerequisites' | 'simulator';

const PAGE_VALUES: ReadonlySet<string> = new Set([
  'equivalencies',
  'listing',
  'prerequisites',
  'simulator',
]);

const isPage = (value: string): value is Page => PAGE_VALUES.has(value);

const githubPath = siGithub.path;

const getInitialPage = (): Page => {
  const url = new URL(location.href);
  const queryPage = url.searchParams.get(PAGE_QUERY_PARAM);
  if (queryPage && isPage(queryPage)) return queryPage;
  if (url.searchParams.has(SIMULATOR_SHARE_PARAM)) return 'simulator';
  const storedPage = localStorage.getItem('active-page') ?? '';
  return isPage(storedPage) ? storedPage : 'listing';
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
  let navigationElement: HTMLElement | undefined;

  createEffect(() => {
    const staticActivePage = page();
    language();
    localStorage.setItem('active-page', staticActivePage);

    const url = new URL(location.href);
    url.searchParams.set(PAGE_QUERY_PARAM, staticActivePage);
    if (staticActivePage !== 'simulator') {
      url.searchParams.delete(SIMULATOR_SHARE_PARAM);
    }
    history.replaceState({}, '', url);

    const scrollActivePageIntoView = () => {
      const navigation = navigationElement;
      const activeTab = navigation?.querySelector<HTMLElement>(
        `[data-page="${CSS.escape(staticActivePage)}"]`,
      );
      if (!(navigation && activeTab)) return;

      const navigationRect = navigation.getBoundingClientRect();
      const activeTabRect = activeTab.getBoundingClientRect();
      if (activeTabRect.left < navigationRect.left) {
        navigation.scrollBy({ left: activeTabRect.left - navigationRect.left });
      } else if (activeTabRect.right > navigationRect.right) {
        navigation.scrollBy({
          left: activeTabRect.right - navigationRect.right,
        });
      }
    };

    queueMicrotask(scrollActivePageIntoView);
    const observer = new ResizeObserver(scrollActivePageIntoView);
    if (navigationElement) observer.observe(navigationElement);
    onCleanup(() => {
      observer.disconnect();
    });
  });

  return (
    <>
      <header class="border-b">
        <div class="container mx-auto grid min-h-16 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 py-3 sm:flex sm:h-16 sm:gap-3 sm:py-0">
          <img
            alt={t().brand}
            class="h-12 w-12 shrink-0 object-contain"
            src="/logo.png"
          />
          <h1 class="min-w-0 flex-1 wrap-break-word text-base font-bold leading-tight tracking-tight sm:text-xl">
            {t().appTitle}
          </h1>
          <div class="col-span-2 ml-auto flex shrink-0 items-center gap-2">
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

      <div class="container mx-auto py-4 sm:py-8">
        <nav
          class="-mx-3 mb-4 flex gap-1 overflow-x-auto overflow-y-hidden border-b px-3 sm:mx-0 sm:mb-6 sm:px-0"
          ref={(element) => {
            navigationElement = element;
          }}
        >
          <For each={tabs()}>
            {(tab) => (
              <button
                aria-current={page() === tab.value ? 'page' : undefined}
                class={`whitespace-nowrap px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                  page() === tab.value
                    ? 'border-primary text-primary -mb-px border-b-2'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-page={tab.value}
                onClick={() => {
                  setPage(tab.value);
                }}
                type="button"
              >
                {tab.label}
              </button>
            )}
          </For>
        </nav>

        <Switch>
          <Match when={courses.loading}>
            <div class="flex items-center justify-center py-12">
              <div class="text-muted-foreground text-sm">
                {t().common.loading}
              </div>
            </div>
          </Match>
          <Match when={courses.error !== undefined}>
            <div class={ALERT_STYLES.error}>{t().common.loadError}</div>
          </Match>
          <Match when={courses()}>
            {(data) => (
              <Switch>
                <Match when={page() === 'listing'}>
                  <CourseTable courses={data()} />
                </Match>
                <Match when={page() === 'simulator'}>
                  <EnrollmentSimulator courses={data()} />
                </Match>
                <Match when={page() === 'prerequisites'}>
                  <PrerequisiteExplorer courses={data()} />
                </Match>
                <Match when={page() === 'equivalencies'}>
                  <CourseEquivalencies courses={data()} />
                </Match>
              </Switch>
            )}
          </Match>
        </Switch>
      </div>
    </>
  );
};

export default App;
