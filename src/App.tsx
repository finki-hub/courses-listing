import { createSignal, Match, Switch } from 'solid-js';

import { CourseTable } from '@/components/course-table';
import { EnrollmentSimulator } from '@/components/enrollment-simulator';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCourses } from '@/data/use-courses';

type Page = 'listing' | 'simulator';

const App = () => {
  const [courses] = useCourses();
  const [page, setPage] = createSignal<Page>('listing');

  return (
    <div class="container mx-auto py-8">
      <div class="mb-6 flex items-start justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">ФИНКИ ПРЕДМЕТИ</h1>
          <p class="text-muted-foreground mt-1">
            Преглед на сите предмети, запишувања и акредитации
          </p>
        </div>
        <ThemeToggle />
      </div>

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
          Запишување
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
  );
};

export default App;
