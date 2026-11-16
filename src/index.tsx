// @refresh reload
import { render } from 'solid-js/web';

import './index.css';
import App from './App.tsx';
import { initAnalytics } from './lib/analytics.ts';
import { LanguageProvider } from './lib/LanguageProvider';

const root = document.querySelector('#root');

if (!root) throw new Error('Root element not found');

// Start queueing before the first render; the SDK itself loads once idle.
initAnalytics();

render(
  () => (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  ),
  root,
);
