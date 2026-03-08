import { For, Match, Switch } from 'solid-js';

import { CourseTable } from '@/components/course-table';
import { EnrollmentSimulator } from '@/components/enrollment-simulator';
import { PrerequisiteExplorer } from '@/components/prerequisite-explorer';
import { ThemeToggle } from '@/components/theme-toggle';
import { IconLink } from '@/components/ui/icon-controls';
import { GitHubIcon } from '@/components/ui/icons';
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
        <div class="container mx-auto flex h-16 items-center px-4">
          <img
            alt="ФИНКИ Хаб"
            class="mr-2 h-10 w-10"
            src="/logo.png"
          />
          <h1 class="text-xl font-bold tracking-tight">ФИНКИ Хаб / Предмети</h1>
          <div class="ml-auto flex items-center gap-2">
            <IconLink
              href="https://github.com/finki-hub/courses-listing"
              rel="noopener noreferrer"
              target="_blank"
              title="GitHub"
            >
              <GitHubIcon class="h-5 w-5" />
            </IconLink>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div class="container mx-auto py-8">
        <nav class="mb-6 flex gap-1 border-b">
          <For each={TABS}>
            {(tab) => (
              <button
                class={`px-4 py-2 text-sm font-medium transition-colors ${
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
