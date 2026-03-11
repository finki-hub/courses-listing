import { siGithub } from 'simple-icons';
import { For, Match, Switch } from 'solid-js';

import { CourseTable } from '@/components/course-table';
import { EnrollmentSimulator } from '@/components/enrollment-simulator';
import { PrerequisiteExplorer } from '@/components/prerequisite-explorer';
import { ThemeToggle } from '@/components/theme-toggle';
import { IconLink } from '@/components/ui/icon-controls';
import { useCourses } from '@/data/use-courses';
import { ALERT_STYLES } from '@/lib/alert-styles';
import { usePersistedSignal } from '@/lib/use-persisted-signal';

type Page = 'listing' | 'prerequisites' | 'simulator';

const isPage = (value: string): value is Page =>
  value === 'listing' || value === 'prerequisites' || value === 'simulator';

const TABS: Array<{ label: string; value: Page }> = [
  { label: 'Предмети', value: 'listing' },
  { label: 'Симулатор', value: 'simulator' },
  { label: 'Предуслови', value: 'prerequisites' },
];

const githubPath = siGithub.path;

const App = () => {
  const [courses] = useCourses();
  const [page, setPage] = usePersistedSignal<Page>(
    'active-page',
    'listing',
    isPage,
  );

  return (
    <>
      <div class="border-b">
        <div class="container mx-auto flex h-14 items-center px-3 sm:h-16 sm:px-4">
          <img
            alt="ФИНКИ Хаб"
            class="mr-2 h-8 w-8 sm:h-10 sm:w-10"
            src="/logo.png"
          />
          <h1 class="truncate text-base font-bold sm:text-xl">
            ФИНКИ Хаб / Предмети
          </h1>
          <div class="ml-auto flex shrink-0 items-center gap-2">
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
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div class="container mx-auto py-4 sm:py-8">
        <nav class="-mx-3 mb-4 flex gap-1 overflow-x-auto overflow-y-hidden border-b px-3 sm:mx-0 sm:mb-6 sm:px-0">
          <For each={TABS}>
            {(tab) => (
              <button
                class={`whitespace-nowrap px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                  page() === tab.value
                    ? 'border-primary text-primary -mb-px border-b-2'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
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
              <div class="text-muted-foreground text-sm">Се вчитува...</div>
            </div>
          </Match>
          <Match when={courses.error !== undefined}>
            <div class={ALERT_STYLES.error}>
              Грешка при вчитување: {String(courses.error)}
            </div>
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
              </Switch>
            )}
          </Match>
        </Switch>
      </div>
    </>
  );
};

export default App;
