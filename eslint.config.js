import {
  base,
  browser,
  perfectionist,
  prettier,
  solid,
  typescript,
} from 'eslint-config-imperium';

const config = [
  // Local agent worktrees contain duplicate sources and generated build output.
  { ignores: ['dist', '.slim/'] },
  ...base,
  browser,
  solid,
  typescript,
  prettier,
  perfectionist,
];

export default config;
