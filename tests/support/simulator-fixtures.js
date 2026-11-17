// Builds simulator courses for tests. `state` is the program state text.
export const makeCourse = ({
  credits = 6,
  enrollment = {},
  level = 1,
  name,
  prereqNode = { type: 'none' },
  semester = 1,
  state = 'задолжителен',
  tags = '',
}) => ({
  credits,
  level,
  name,
  prereqNode,
  prerequisite: undefined,
  programState: state,
  raw: { name, professors: '', tags, ...enrollment },
  rawPrereqNode: prereqNode,
  semester,
});

export const ELECTIVE = 'изборен';

export const passedAll = (names) =>
  Object.fromEntries(
    names.map((name) => [name, { listened: true, passed: true }]),
  );
