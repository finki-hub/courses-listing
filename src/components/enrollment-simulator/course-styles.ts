import { type StatusTone } from '@/components/ui/status-badge';
import { type ProgramStateKind } from '@/lib/simulator';

/** The semantic tone of each way a program offers a course. */
export const PROGRAM_STATE_TONES: Record<ProgramStateKind, StatusTone> = {
  elective: 'elective',
  'faculty-list': 'faculty',
  required: 'required',
  'required-4yr': 'required',
};

export const getStatusClass = (status: {
  atLimit: boolean;
  listened: boolean;
  overLimit: boolean;
  passed: boolean;
}): string => {
  if (status.overLimit) return 'bg-danger-soft border-l-danger';
  if (status.passed) return 'bg-passed-soft border-l-passed';
  if (status.listened) return 'bg-enrolled-soft border-l-enrolled';
  return status.atLimit
    ? 'bg-warning-soft border-l-warning'
    : 'border-l-transparent';
};

/** A bordered action in the simulator toolbars. */
export const SIMULATOR_ACTION_CLASS =
  'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3';

/** The quiet button style shared by per-course and per-semester actions. */
export const ROW_ACTION_CLASS = `${SIMULATOR_ACTION_CLASS} bg-card hover:bg-muted min-h-8 text-xs sm:text-xs disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-card`;
