import { ReactViteCore } from '@src/types';

const mainTsxFsd = (): string =>
  `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;

const mainTsxBpr = (): string =>
  `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;

export const mainTsxTemplate = (layout: ReactViteCore['layout']): string =>
  layout === 'FSD' ? mainTsxFsd() : mainTsxBpr();
