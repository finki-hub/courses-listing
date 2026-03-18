import { For } from 'solid-js';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type CourseStatus } from '@/lib/prerequisite';
import {
  getExclusiveProjectBlocker,
  isRequired,
  matchesSeasonFilter,
  type SeasonFilter,
  type SimulatorCourse,
} from '@/lib/simulator';

import { CourseCardRow } from './course-card-row';
import { CourseRow } from './course-row';

type SimulatorTableProps = {
  courses: SimulatorCourse[];
  enabledMap: Record<string, boolean>;
  fullLevels: Set<number>;
  onToggleListened: (name: string) => void;
  onTogglePassed: (name: string) => void;
  overLimitSet: Set<string>;
  reasonMap: Record<string, string>;
  ref?: (el: HTMLDivElement) => void;
  seasonFilter: SeasonFilter;
  showOnlyEnabled: boolean;
  statuses: Record<string, CourseStatus>;
};

export const SimulatorTable = (props: SimulatorTableProps) => {
  const visibleCourses = () =>
    props.courses.filter((course) => {
      const enabled = props.enabledMap[course.name] ?? true;
      return (
        (!props.showOnlyEnabled || enabled) &&
        matchesSeasonFilter(course.semester, props.seasonFilter)
      );
    });

  const getCourseProps = (course: SimulatorCourse) => ({
    atLimit:
      !props.statuses[course.name]?.passed &&
      !isRequired(course.programState) &&
      props.fullLevels.has(course.level),
    course,
    enabled: props.enabledMap[course.name] ?? true,
    exclusiveBlocker: getExclusiveProjectBlocker(props.statuses, course.name),
    listened: props.statuses[course.name]?.listened ?? false,
    onToggleListened: () => {
      props.onToggleListened(course.name);
    },
    onTogglePassed: () => {
      props.onTogglePassed(course.name);
    },
    overLimit: props.overLimitSet.has(course.name),
    passed: props.statuses[course.name]?.passed ?? false,
    reason: props.reasonMap[course.name] ?? '',
  });

  return (
    <div ref={props.ref}>
      {/* Mobile: card layout */}
      <div class="space-y-1.5 sm:hidden">
        <For each={visibleCourses()}>
          {(course) => {
            const courseProps = getCourseProps(course);
            return <CourseCardRow {...courseProps} />;
          }}
        </For>
      </div>

      {/* Desktop: table layout */}
      <div class="hidden rounded-md border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-12 text-center sm:w-16">Сем.</TableHead>
              <TableHead>Предмет</TableHead>
              <TableHead class="w-16 text-center sm:w-24">Слушан</TableHead>
              <TableHead class="w-16 text-center sm:w-24">Положен</TableHead>
              <TableHead class="hidden md:table-cell">Предуслов</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={visibleCourses()}>
              {(course) => {
                const courseProps = getCourseProps(course);
                return <CourseRow {...courseProps} />;
              }}
            </For>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
