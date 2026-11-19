import { createMemo, type ParentProps } from 'solid-js';

import {
  buildEnglishNameIndex,
  createCourseNameTranslator,
  localizeConnectors,
  localizePrerequisiteText,
  translatesCourseNames,
} from '@/lib/course-names';
import {
  type CourseNames,
  CourseNamesContext,
  KEEP_AS_WRITTEN,
} from '@/lib/course-names-context';
import { useLanguage } from '@/lib/LanguageProvider';
import { type CourseRaw } from '@/types/course';

// Course names are kept in Macedonian wherever they identify a course (saved
// progress, share links, prerequisite parsing) and only translated for display.
export const CourseNamesProvider = (
  props: ParentProps<{ courses: readonly CourseRaw[] }>,
) => {
  const { language, t } = useLanguage();
  const index = createMemo(() => buildEnglishNameIndex(props.courses));
  const knownNames = createMemo(() => Array.from(index().keys()));
  const names = createMemo<CourseNames>(() => {
    if (!translatesCourseNames(language())) return KEEP_AS_WRITTEN;
    const translate = createCourseNameTranslator(index());
    const words = t().prerequisiteText;
    return {
      courseName: translate,
      prerequisiteConnectors: (text) => localizeConnectors(text, words),
      prerequisiteText: (text) =>
        localizePrerequisiteText(text, {
          knownNames: knownNames(),
          translate,
          words,
        }),
    };
  });
  return (
    <CourseNamesContext.Provider value={names}>
      {props.children}
    </CourseNamesContext.Provider>
  );
};
