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
