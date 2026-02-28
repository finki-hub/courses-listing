import { createEffect, createSignal, Match, on, Switch } from 'solid-js';

import { CourseTable } from '@/components/course-table';
import { EnrollmentSimulator } from '@/components/enrollment-simulator';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCourses } from '@/data/use-courses';

type Page = 'listing' | 'simulator';

const STORAGE_KEY_PAGE = 'active-page';

const App = () => {
  const [courses] = useCourses();
  const savedPage = localStorage.getItem(STORAGE_KEY_PAGE);
  const [page, setPage] = createSignal<Page>(
    savedPage === 'simulator' ? 'simulator' : 'listing',
  );

  createEffect(
    on(page, (p) => {
      localStorage.setItem(STORAGE_KEY_PAGE, p);
    }),
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
            <a
              class="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href="https://github.com/finki-hub/courses-listing"
              rel="noopener noreferrer"
              target="_blank"
              title="GitHub"
            >
              <svg
                class="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div class="container mx-auto py-8">
        <nav class="mb-6 flex gap-1 border-b">
          <button
            class={`px-4 py-2 text-sm font-medium transition-colors ${
              page() === 'listing'
                ? 'border-primary text-primary -mb-px border-b-2'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setPage('listing')}
            type="button"
          >
            Предмети
          </button>
          <button
            class={`px-4 py-2 text-sm font-medium transition-colors ${
              page() === 'simulator'
                ? 'border-primary text-primary -mb-px border-b-2'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setPage('simulator')}
            type="button"
          >
            Симулатор
          </button>
        </nav>

        <Switch>
          <Match when={courses.loading}>
            <div class="flex items-center justify-center py-12">
              <div class="text-muted-foreground text-sm">Се вчитува...</div>
            </div>
          </Match>
          <Match when={courses.error !== undefined}>
            <div class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
              </Switch>
            )}
          </Match>
        </Switch>
      </div>
    </>
  );
};

export default App;
