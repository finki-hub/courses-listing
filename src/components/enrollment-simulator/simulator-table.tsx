import { For, Show } from 'solid-js';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/lib/LanguageProvider';
import { type CourseStatus } from '@/lib/prerequisite';
import {
  getExclusiveProjectBlocker,
  isRequired,
  type SimulatorCourse,
} from '@/lib/simulator';
import { type BulkStatus, type SemesterGroup } from '@/lib/simulator-view';

import { CourseCardRow } from './course-card-row';
import { CourseRow } from './course-row';
import { SemesterHeader } from './semester-header';

type SimulatorTableProps = {
  enabledMap: Record<string, boolean>;
  fullLevels: Set<number>;
  groups: SemesterGroup[];
  onBulkMark: (group: SemesterGroup, target: BulkStatus) => void;
  onToggleListened: (name: string) => void;
  onTogglePassed: (name: string) => void;
  overLimitSet: Set<string>;
  reasonMap: Record<string, string>;
  statuses: Record<string, CourseStatus>;
};

const TABLE_COLUMNS = 5;

export const SimulatorTable = (props: SimulatorTableProps) => {
  const { t } = useLanguage();

  // The props shared by the desktop row and the mobile card. Getters keep
  // them reactive through the spread.
  const rowProps = (course: SimulatorCourse) => ({
    get atLimit() {
      return (
        !props.statuses[course.name]?.passed &&
        !isRequired(course.programState) &&
        props.fullLevels.has(course.level)
      );
    },
    course,
    get enabled() {
      return props.enabledMap[course.name] ?? true;
    },
    get exclusiveBlocker() {
      return getExclusiveProjectBlocker(props.statuses, course.name);
    },
    get listened() {
      return props.statuses[course.name]?.listened ?? false;
    },
    onToggleListened: () => {
      props.onToggleListened(course.name);
    },
    onTogglePassed: () => {
      props.onTogglePassed(course.name);
    },
    get overLimit() {
      return props.overLimitSet.has(course.name);
    },
    get passed() {
      return props.statuses[course.name]?.passed ?? false;
    },
    get reason() {
      return props.reasonMap[course.name] ?? '';
    },
  });

  const header = (group: SemesterGroup) => (
    <SemesterHeader
      enabledMap={props.enabledMap}
      group={group}
      onBulkMark={(target) => {
        props.onBulkMark(group, target);
      }}
      statuses={props.statuses}
    />
  );

  return (
    <Show
      fallback={
        <div class="text-muted-foreground py-12 text-center text-sm">
          {t().common.noResults}
        </div>
      }
      when={props.groups.length > 0}
    >
      {/* Mobile: card layout */}
      <div class="space-y-1.5 sm:hidden">
        <For each={props.groups}>
          {(group) => (
            <section class="space-y-1.5 [&:not(:first-child)]:pt-2">
              {header(group)}
              <For each={group.courses}>
                {(course) => {
                  const row = rowProps(course);
                  return <CourseCardRow {...row} />;
                }}
              </For>
            </section>
          )}
        </For>
      </div>

      {/* Desktop: table layout */}
      <div class="hidden rounded-md border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-12 text-center sm:w-16">
                {t().common.semesterShort}
              </TableHead>
              <TableHead>{t().common.course}</TableHead>
              <TableHead class="w-16 text-center sm:w-24">
                {t().simulator.attended}
              </TableHead>
              <TableHead class="w-16 text-center sm:w-24">
                {t().simulator.passed}
              </TableHead>
              <TableHead class="hidden md:table-cell">
                {t().common.prerequisite}
              </TableHead>
            </TableRow>
          </TableHeader>
          <For each={props.groups}>
            {(group) => (
              <TableBody>
                <TableRow class="bg-muted/40 hover:bg-muted/40">
                  <TableCell colSpan={TABLE_COLUMNS}>{header(group)}</TableCell>
                </TableRow>
                <For each={group.courses}>
                  {(course) => {
                    const row = rowProps(course);
                    return <CourseRow {...row} />;
                  }}
                </For>
              </TableBody>
            )}
          </For>
        </Table>
      </div>
    </Show>
  );
};
