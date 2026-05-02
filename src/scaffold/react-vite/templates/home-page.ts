import type { ReactViteCore } from '@src/types';

interface Badge { label: string; bg: string; fg: string; border: string }

function buildBadges(o: {
  hasTailwind: boolean;
  hasRouter: boolean;
  hasZustand: boolean;
  hasQuery: boolean;
  layout: 'FSD' | 'BPR';
  linter: string;
}): Badge[] {
  const badges: Badge[] = [
    { label: 'React 19',   bg: '#1e3a8a', fg: '#bfdbfe', border: '#3b82f6' },
    { label: 'TypeScript', bg: '#1e3a8a', fg: '#bfdbfe', border: '#2563eb' },
    { label: 'Vite 6',     bg: '#4c1d95', fg: '#ddd6fe', border: '#8b5cf6' },
    { label: o.layout === 'FSD' ? 'FSD' : 'Bulletproof React', bg: '#78350f', fg: '#fde68a', border: '#d97706' },
  ];
  if (o.hasRouter)   badges.push({ label: 'TanStack Router', bg: '#7f1d1d', fg: '#fecaca', border: '#ef4444' });
  if (o.hasZustand)  badges.push({ label: 'Zustand',         bg: '#14532d', fg: '#bbf7d0', border: '#22c55e' });
  if (o.hasQuery)    badges.push({ label: 'TanStack Query',  bg: '#7c2d12', fg: '#fed7aa', border: '#f97316' });
  if (o.hasTailwind) badges.push({ label: 'Tailwind CSS v4', bg: '#164e63', fg: '#a5f3fc', border: '#06b6d4' });
  if (o.linter === 'BIOME')  badges.push({ label: 'Biome',  bg: '#1e3a5f', fg: '#bae6fd', border: '#0284c7' });
  if (o.linter === 'ESLINT') badges.push({ label: 'ESLint', bg: '#312e81', fg: '#c7d2fe', border: '#6366f1' });
  return badges;
}

interface BuildOpts {
  projectName: string;
  layout: 'FSD' | 'BPR';
  hasTailwind: boolean;
  hasZustand: boolean;
  hasQuery: boolean;
  hasRouter: boolean;
  linter: string;
  storeImportPath: string;
  componentName: string;
  namedExport: boolean;
}

function buildHomePage(o: BuildOpts): string {
  const badges = buildBadges(o);
  const storeImport = o.hasZustand ? `import { useAppStore } from '${o.storeImportPath}';\n` : '';
  const queryImport = o.hasQuery   ? `import { useQuery } from '@tanstack/react-query';\n`        : '';
  const postType    = o.hasQuery   ? `\ntype Post = { id: number; title: string; body: string };\n` : '';
  const exportKw    = o.namedExport ? `export const ${o.componentName}` : `const ${o.componentName}`;
  const defaultExp  = o.namedExport ? '' : `\nexport default ${o.componentName};\n`;

  if (o.hasTailwind) {
    const badgesJsx = badges
      .map(b => `            <span className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: '${b.bg}80', color: '${b.fg}', border: '1px solid ${b.border}70' }}>${b.label}</span>`)
      .join('\n');

    const counterCmp = o.hasZustand ? `
const Counter = () => {
  const { count, increment, decrement, reset } = useAppStore();
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={decrement}
        className="w-9 h-9 rounded-lg bg-surface-high hover:bg-surface-muted text-text text-xl font-bold transition-colors"
      >
        −
      </button>
      <span className="text-3xl font-bold text-text w-14 text-center tabular-nums">{count}</span>
      <button
        onClick={increment}
        className="w-9 h-9 rounded-lg bg-surface-high hover:bg-surface-muted text-text text-xl font-bold transition-colors"
      >
        +
      </button>
      <button onClick={reset} className="ml-2 text-sm text-text-muted hover:text-text transition-colors">
        reset
      </button>
    </div>
  );
};
` : '';

    const queryCmp = o.hasQuery ? `
const QueryDemo = () => {
  const { data, isLoading, isError } = useQuery<Post>({
    queryKey: ['demo-post'],
    queryFn: () => fetch('https://jsonplaceholder.typicode.com/posts/1').then(r => r.json()),
  });
  if (isLoading) return <p className="text-text-muted text-sm">Fetching post…</p>;
  if (isError)   return <p className="text-red-400 text-sm">Failed to fetch.</p>;
  return (
    <div className="space-y-1">
      <p className="text-text text-sm font-medium">{data?.title}</p>
      <p className="text-text-muted text-xs leading-relaxed">{data?.body}</p>
    </div>
  );
};
` : '';

    const zustandCard = o.hasZustand ? `
        <div className="rounded-xl p-5 mb-3 bg-surface-high/60 border border-border">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Zustand — Counter</p>
          <Counter />
        </div>` : '';

    const queryCard = o.hasQuery ? `
        <div className="rounded-xl p-5 bg-surface-high/60 border border-border">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">TanStack Query — Fetched Post</p>
          <QueryDemo />
        </div>` : '';

    return `${storeImport}${queryImport}${postType}${counterCmp}${queryCmp}
${exportKw} = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-surface to-surface-muted">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚀</div>
          <h1 className="text-4xl font-bold text-text mb-2">${o.projectName}</h1>
          <p className="text-text-muted">Your React + Vite starter is ready.</p>
        </div>

        <div className="rounded-xl p-5 mb-3 bg-surface-high/60 border border-border">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Stack</p>
          <div className="flex flex-wrap gap-2">
${badgesJsx}
          </div>
        </div>${zustandCard}${queryCard}
      </div>
    </div>
  );
};
${defaultExp}`;
  }

  // ── Inline-styles version (no Tailwind) ──────────────────────────────────

  const badgeDefs = badges
    .map(b => `  { label: '${b.label}', bg: '${b.bg}80', fg: '${b.fg}', border: '${b.border}70' }`)
    .join(',\n');

  const counterCmp = o.hasZustand ? `
const Counter = () => {
  const { count, increment, decrement, reset } = useAppStore();
  const btn: React.CSSProperties = {
    width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
    background: '#334155', border: 'none', color: 'white',
    fontSize: '1.25rem', cursor: 'pointer', lineHeight: 1,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <button style={btn} onClick={decrement}>−</button>
      <span style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', width: '3.5rem', textAlign: 'center' }}>{count}</span>
      <button style={btn} onClick={increment}>+</button>
      <button
        onClick={reset}
        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.875rem', marginLeft: '0.5rem' }}
      >
        reset
      </button>
    </div>
  );
};
` : '';

  const queryCmp = o.hasQuery ? `
const QueryDemo = () => {
  const { data, isLoading, isError } = useQuery<Post>({
    queryKey: ['demo-post'],
    queryFn: () => fetch('https://jsonplaceholder.typicode.com/posts/1').then(r => r.json()),
  });
  if (isLoading) return <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Fetching post…</p>;
  if (isError)   return <p style={{ color: '#f87171', fontSize: '0.875rem' }}>Failed to fetch.</p>;
  return (
    <div>
      <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500, margin: '0 0 0.25rem' }}>{data?.title}</p>
      <p style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.6, margin: 0 }}>{data?.body}</p>
    </div>
  );
};
` : '';

  const card = `{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '0.75rem' }`;
  const cardLabel = `{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '0.75rem' }`;

  const zustandCard = o.hasZustand ? `
        <div style={${card}}>
          <p style={${cardLabel}}>Zustand — Counter</p>
          <Counter />
        </div>` : '';

  const queryCard = o.hasQuery ? `
        <div style={{ ...${card}, marginBottom: 0 }}>
          <p style={${cardLabel}}>TanStack Query — Fetched Post</p>
          <QueryDemo />
        </div>` : '';

  const reactImport = o.hasZustand ? `import type React from 'react';\n` : '';

  return `${reactImport}${storeImport}${queryImport}${postType}
const stackBadges = [
${badgeDefs},
];
${counterCmp}${queryCmp}
${exportKw} = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🚀</div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.5rem' }}>${o.projectName}</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Your React + Vite starter is ready.</p>
        </div>

        <div style={${card}}>
          <p style={${cardLabel}}>Stack</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {stackBadges.map(b => (
              <span key={b.label} style={{ background: b.bg, color: b.fg, border: \`1px solid \${b.border}\`, borderRadius: '0.375rem', padding: '0.25rem 0.625rem', fontSize: '0.75rem', fontWeight: 500 }}>
                {b.label}
              </span>
            ))}
          </div>
        </div>${zustandCard}${queryCard}
      </div>
    </div>
  );
};
${defaultExp}`;
}

export const homePageFsdTemplate = (cart: ReactViteCore): string =>
  buildHomePage({
    projectName:    cart.projectName,
    layout:         'FSD',
    hasTailwind:    cart.css === 'TAILWIND',
    hasZustand:     cart.stateManagement === 'ZUSTAND',
    hasQuery:       cart.query === 'TANSTACK_QUERY',
    hasRouter:      cart.router === 'TANSTACK_ROUTER',
    linter:         cart.linter,
    storeImportPath: '@/shared/lib/store',
    componentName:  'HomePage',
    namedExport:    true,
  });

export const homePageBprTemplate = (cart: ReactViteCore): string =>
  buildHomePage({
    projectName:    cart.projectName,
    layout:         'BPR',
    hasTailwind:    cart.css === 'TAILWIND',
    hasZustand:     cart.stateManagement === 'ZUSTAND',
    hasQuery:       cart.query === 'TANSTACK_QUERY',
    hasRouter:      cart.router === 'TANSTACK_ROUTER',
    linter:         cart.linter,
    storeImportPath: '@/stores/appStore',
    componentName:  'Home',
    namedExport:    false,
  });
