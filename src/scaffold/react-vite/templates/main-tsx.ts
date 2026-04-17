import { ReactViteCore } from '@src/types';

const mainTsxFsd = (hasTailwind: boolean): string =>
  `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
${hasTailwind ? "import './index.css';\n" : ''}import { App } from './app';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;

const mainTsxBpr = (hasTailwind: boolean): string =>
  `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
${hasTailwind ? "import './index.css';\n" : ''}import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;

export const mainTsxTemplate = (cart: ReactViteCore): string => {
  const hasTailwind = cart.css === 'TAILWIND';
  return cart.layout === 'FSD' ? mainTsxFsd(hasTailwind) : mainTsxBpr(hasTailwind);
};
