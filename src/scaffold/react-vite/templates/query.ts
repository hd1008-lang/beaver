// BPR: src/providers/index.tsx — wraps QueryClientProvider when query is selected
export const queryProviderBprTemplate = (): string =>
  `import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
`;

// BPR: src/providers/index.tsx — simple pass-through when no query
export const simpleProviderBprTemplate = (): string =>
  `export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
`;
