/* eslint-disable camelcase -- Assert PostHog wire properties. */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { withAppRevision } from '../src/lib/analytics-revision.ts';

test('only a trusted full lowercase build SHA survives merged caller properties', () => {
  const revision = 'a'.repeat(40);
  const input = {
    app_revision: 'spoof',
    position: 0,
    service: 'courses-listing',
  };
  assert.deepEqual(withAppRevision(input, revision), {
    ...input,
    app_revision: revision,
  });
  assert.equal(input.app_revision, 'spoof');
  for (const invalid of [
    undefined,
    null,
    '',
    'a'.repeat(39),
    'a'.repeat(41),
    'A'.repeat(40),
    'g'.repeat(40),
    123,
  ]) {
    assert.deepEqual(withAppRevision(input, invalid), {
      position: 0,
      service: 'courses-listing',
    });
  }
});
