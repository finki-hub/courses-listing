const REVISION_PATTERN = /^[a-f0-9]{40}$/u;

export const withAppRevision = (
  properties: Record<string, unknown>,
  revision: unknown,
): Record<string, unknown> => {
  const trusted = { ...properties };
  // eslint-disable-next-line e18e/no-delete-property -- Invalid metadata must be absent, not undefined.
  delete trusted['app_revision'];
  if (typeof revision === 'string' && REVISION_PATTERN.test(revision)) {
    trusted['app_revision'] = revision;
  }
  return trusted;
};
