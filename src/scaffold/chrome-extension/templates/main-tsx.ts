import { ChromeExtensionCore } from '@src/types';

export const mainTsxTemplate = (cart: ChromeExtensionCore): string => {
  const hasTailwind = cart.css === 'TAILWIND';

  return `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
${hasTailwind ? "import './index.css';\n" : ''}import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;
};
