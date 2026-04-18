import { ChromeExtensionCore } from '@src/types';

export const appTsxTemplate = (cart: ChromeExtensionCore): string => {
  const hasQuery = cart.query === 'TANSTACK_QUERY';

  if (hasQuery) {
    return `import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <h1>${'${cart.projectName}'}</h1>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;
`.replace('${cart.projectName}', cart.projectName);
  }

  return `const App = () => {
  return (
    <div>
      <h1>${cart.projectName}</h1>
    </div>
  );
};

export default App;
`;
};
