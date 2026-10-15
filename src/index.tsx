// @refresh reload
import { render } from 'solid-js/web';

import './index.css';
import App from './App.tsx';
import { initAnalytics } from './lib/analytics.ts';
import { LanguageProvider } from './lib/LanguageProvider';

initAnalytics();

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
