import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import process from 'node:process';
import solid from 'vite-plugin-solid';

import { localizeHtml } from './src/lib/page-metadata.ts';

export default function config() {
  return {
    define: {
      // The deployment workflow checks out the triggering commit before this build.
      // Local/non-GitHub builds intentionally have no trusted revision.
      'import.meta.env.VITE_APP_REVISION': JSON.stringify(
        process.env.GITHUB_ACTIONS === 'true'
          ? (process.env.GITHUB_SHA ?? '')
          : '',
      ),
    },
    plugins: [
      tailwindcss(),
      solid(),
      {
        name: 'localized-metadata',
        transformIndexHtml: (html) => localizeHtml(html),
      },
    ],
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, './src'),
      },
    },
  };
}
