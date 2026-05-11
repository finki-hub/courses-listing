import {
  base,
  browser,
  perfectionist,
  prettier,
  solid,
  typescript,
} from 'eslint-config-imperium';

const config = [
  { ignores: ['dist'] },
  ...base,
  browser,
  solid,
  typescript,
  prettier,
  perfectionist,
];

export default config;
