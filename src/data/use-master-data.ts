import { createEffect, createSignal } from 'solid-js';

import {
  degreeProgramsSchema,
  MASTER_CYCLE,
  type MasterData,
  programCoursesSchema,
} from '@/lib/master-programs';

const ITEMS_URL = 'https://data.finki-hub.com/items';

const PROGRAMS_QUERY = new URLSearchParams({
  fields: 'code,title,title_en,cycle,ects',
  limit: '-1',
  sort: 'code',
});

// Only the master's courses: the undergraduate curricula are not shown here.
const PROGRAM_COURSES_QUERY = new URLSearchParams({
  fields:
    'program.code,course.name,course.degree_cycle,kind,semester,group,group_name,credits,code',
  'filter[course][degree_cycle][_eq]': MASTER_CYCLE,
  limit: '-1',
  sort: 'id',
});

const fetchItems = async (
  collection: string,
  query: URLSearchParams,
): Promise<unknown> => {
  const response = await fetch(`${ITEMS_URL}/${collection}?${String(query)}`);
  if (!response.ok)
    throw new Error(`Failed to fetch ${collection}: ${response.statusText}`);
  return response.json();
};

const fetchMasterData = async (): Promise<MasterData> => {
  const [programs, programCourses] = await Promise.all([
    fetchItems('degree_programs', PROGRAMS_QUERY),
    fetchItems('degree_program_courses', PROGRAM_COURSES_QUERY),
  ]);
  return {
    programCourses: programCoursesSchema.parse(programCourses),
    programs: degreeProgramsSchema.parse(programs),
  };
};

// Loaded the first time the master's view is shown, then kept.
export const useMasterData = () => {
  const [requested, setRequested] = createSignal(false);
  const [data, setData] = createSignal<MasterData>();
  const [error, setError] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  let started = false;

  createEffect(
    () => requested(),
    (isRequested) => {
      if (!isRequested || started) return;
      started = true;
      setLoading(true);
      void (async () => {
        try {
          const value = await fetchMasterData();
          setData(value);
        } catch {
          setError(true);
        } finally {
          setLoading(false);
        }
      })();
    },
  );

  return {
    data,
    error,
    loading,
    request: () => {
      setRequested(true);
    },
  };
};
