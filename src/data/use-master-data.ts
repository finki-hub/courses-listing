import { createResource, createSignal } from 'solid-js';

import {
  degreeProgramsSchema,
  type MasterData,
  programCoursesSchema,
} from '@/lib/master-programs';

const DATA_URL = 'https://data.finki-hub.com/legacy';

const fetchJson = async (file: string): Promise<unknown> => {
  const response = await fetch(`${DATA_URL}/${file}`);
  if (!response.ok)
    throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
  return response.json();
};

const fetchMasterData = async (): Promise<MasterData> => {
  const [programs, programCourses] = await Promise.all([
    fetchJson('degree_programs.json'),
    fetchJson('degree_program_courses.json'),
  ]);
  return {
    programCourses: programCoursesSchema.parse(programCourses),
    programs: degreeProgramsSchema.parse(programs),
  };
};

// Loaded the first time the master's view is shown, then kept.
export const useMasterData = () => {
  const [requested, setRequested] = createSignal(false);
  const [data] = createResource(
    () => requested() || undefined,
    fetchMasterData,
  );
  return {
    data,
    request: () => {
      setRequested(true);
    },
  };
};
