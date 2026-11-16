// @refresh reload
import { render } from 'solid-js/web';

import './index.css';
import App from './App.tsx';
import { initAnalytics } from './lib/analytics.ts';
import { LanguageProvider } from './lib/LanguageProvider';

const root = document.querySelector('#root');

if (!root) throw new Error('Root element not found');

render(
  () => (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  ),
  root,
);

// After the first render: the SDK loads lazily and never delays the page.
initAnalytics();
