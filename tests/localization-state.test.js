import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { mock, test } from 'node:test';
import { createRoot, createSignal } from 'solid-js';

import { translations } from '../src/lib/i18n.ts';

registerHooks({
  load(url, context, nextLoad) {
    // Node cannot classify TSX; supply the export shape for the context mock below.
    return new URL(url).pathname.endsWith('/src/lib/LanguageProvider.tsx')
      ? {
          format: 'module',
          shortCircuit: true,
          source: 'export const useLanguage = undefined;',
        }
      : nextLoad(url, context);
  },
  resolve(specifier, context, nextResolve) {
    const extension = specifier === '@/lib/LanguageProvider' ? 'tsx' : 'ts';
    return nextResolve(
      specifier.startsWith('@/')
        ? new URL(`../src/${specifier.slice(2)}.${extension}`, import.meta.url)
            .href
        : specifier,
      context,
    );
  },
});

const languageContext = { t: () => translations.mk };
mock.module('../src/lib/LanguageProvider.tsx', {
  namedExports: { useLanguage: () => ({ t: () => languageContext.t() }) },
});
const { useSimulatorState } =
  await import('../src/components/enrollment-simulator/use-simulator-state.ts');
const { DIPLOMA_THESIS_COURSE_NAME } = await import('../src/lib/simulator.ts');

const requiredCourse = (name, fourthYear = false) => ({
  credits: 6,
  level: 3,
  name,
  prereqNode: { type: 'none' },
  prerequisite: undefined,
  programState: fourthYear ? 'задолжителен (4 г.)' : 'задолжителен',
  raw: { name, professors: 'Професор' },
  rawPrereqNode: { type: 'none' },
  semester: fourthYear ? 7 : 1,
});

test('live language changes preserve simulator statuses, credit totals and graduation eligibility', (t) => {
  const threeYear = Array.from({ length: 29 }, (_, index) =>
    requiredCourse(`Предмет ${index}`),
  );
  const fourthYear = Array.from({ length: 10 }, (_, index) =>
    requiredCourse(`Четврта година ${index}`, true),
  );
  const thesis = requiredCourse(DIPLOMA_THESIS_COURSE_NAME, true);
  const courses = [...threeYear, ...fourthYear, thesis];
  const passed = { listened: true, passed: true };
  let state;
  let setStatuses;
  let setLanguage;
  let statuses;
  const dispose = createRoot((cleanup) => {
    [statuses, setStatuses] = createSignal(
      Object.fromEntries(threeYear.map((course) => [course.name, passed])),
    );
    const [language, changeLanguage] = createSignal('mk');
    setLanguage = changeLanguage;
    languageContext.t = () => translations[language()];
    state = useSimulatorState({
      courseInfoMap: () => new Map(),
      electiveCourses: () => new Set(),
      hpcCompleted: () => false,
      parsedCourses: () => courses,
      statuses,
      uniListCredits: () => 0,
    });
    return cleanup;
  });
  t.after(dispose);

  for (const [stage, additionalCourses, credits] of [
    ['three', [], 174],
    ['four', fourthYear, 234],
    ['graduated', [thesis], 240],
  ]) {
    setStatuses((previous) => ({
      ...previous,
      ...Object.fromEntries(
        additionalCourses.map((course) => [course.name, passed]),
      ),
    }));
    const originalStatuses = statuses();
    const expectedEligibility = state.graduationEligibility();
    assert.equal(state.totalCredits(), credits);
    assert.equal(expectedEligibility.canGrad3yr, true);
    assert.equal(expectedEligibility.canGrad4yr, stage !== 'three');
    assert.equal(expectedEligibility.graduated4yr, stage === 'graduated');
    for (const [language, dictionary] of Object.entries(translations)) {
      setLanguage(language);
      assert.equal(statuses(), originalStatuses);
      assert.equal(state.totalCredits(), credits);
      assert.deepEqual(state.graduationEligibility(), expectedEligibility);
      assert.ok(
        state
          .reasonMap()
          [threeYear[0].name].includes(dictionary.reasons.passed),
      );
    }
  }
});
