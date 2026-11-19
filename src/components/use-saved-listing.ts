import { createEffect, createMemo, createSignal, untrack } from 'solid-js';

import { getCourseLinkValue, replaceUrlParams } from '@/lib/listing-url-state';
import { isMasterCourse } from '@/lib/master-programs';
import {
  getSavedShareUrl,
  parseSavedParam,
  resolveSavedValues,
  SAVED_PARAM,
  serializeSavedParam,
} from '@/lib/saved-courses';
import { useSavedCourses } from '@/lib/saved-courses-store';
import { type CourseRaw } from '@/types/course';

import { type useListingState } from './use-listing-state';

type SavedListingDeps = {
  readonly courses: () => readonly CourseRaw[];
  readonly listing: ReturnType<typeof useListingState>;
};

// The saved courses the listing filters by: the student's own, or a set a
// link carries until the student adds it to theirs or goes back to their own.
export const useSavedListing = (deps: SavedListingDeps) => {
  const saved = useSavedCourses();
  const linked = resolveSavedValues(
    untrack(deps.courses),
    parseSavedParam(new URL(location.href).searchParams.get(SAVED_PARAM)),
  );
  const [shared, setShared] = createSignal<null | string[]>(
    linked.length > 0 ? linked : null,
  );

  if (linked.length > 0) {
    // Show the cycle the shared courses are in.
    const undergraduate = untrack(deps.courses).some(
      (course) =>
        !isMasterCourse(course) && linked.includes(getCourseLinkValue(course)),
    );
    // A link that carries a saved set shows it, in the cycle it belongs to.
    deps.listing.updateFilters({ savedOnly: true });
    deps.listing.showLinkedCycle(undergraduate ? 'undergraduate' : 'master');
  }

  createEffect(() => {
    const list = shared();
    replaceUrlParams((params) => {
      if (list === null) params.delete(SAVED_PARAM);
      else params.set(SAVED_PARAM, serializeSavedParam(list));
    });
  });

  const own = createMemo(
    () => new Set(resolveSavedValues(deps.courses(), saved.values())),
  );

  const effective = (): ReadonlySet<string> =>
    shared() === null ? own() : new Set(shared());

  return {
    addShared: () => {
      const list = shared();
      if (list) saved.add(list);
      setShared(null);
    },
    // The courses the Saved filter keeps.
    effective,
    // The same while the filter is on; nothing narrows the list otherwise.
    filterValues: () =>
      deps.listing.filters().savedOnly ? effective() : undefined,
    ownCount: () => own().size,
    share: async (): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(
          getSavedShareUrl(location.href, [...own()]),
        );
        return true;
      } catch {
        return false;
      }
    },
    shared,
    showMine: () => {
      setShared(null);
    },
  };
};
