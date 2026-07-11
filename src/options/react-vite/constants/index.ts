import { MenuOptions } from "@src/options/react-vite/types";

export const REACT_MENU_LAYOUT: MenuOptions = {
  FSD: {
    display: "FSD",
    value: "FSD",
    description: "Feature slice design",
    disabled: false,
  },
  BPR: {
    display: "BPR",
    value: "BPR",
    description: "Bulletproof React",
    disabled: false,
  },
};
export const REACT_MENU_ROUTER: MenuOptions = {
  notUsing: {
    display: "Not Using",
    value: "NOT_USING",
    description: "Not using any router",
    disabled: false,
  },
  tanstack: {
    display: "TanStack Router",
    value: "TANSTACK_ROUTER",
    description: "TanStack Router v1.144.0",
    disabled: false,
  },
};
export const REACT_MENU_STATE_MANAGEMENT: MenuOptions = {
  notUsing: {
    display: "Not Using",
    value: "NOT_USING",
    description: "Not using any state management",
    disabled: false,
  },
  zustand: {
    display: "Zustand",
    value: "ZUSTAND",
    description: "Zustand state management",
    disabled: false,
  },
};

export const REACT_MENU_QUERY: MenuOptions = {
  notUsing: {
    display: "Not Using",
    value: "NOT_USING",
    description: "No data fetching library",
    disabled: false,
  },
  tanstackQuery: {
    display: "TanStack Query",
    value: "TANSTACK_QUERY",
    description: "Server state management (v5.74.4)",
    disabled: false,
  },
};

export const REACT_MENU_CSS: MenuOptions = {
  notUsing: {
    display: 'Not Using',
    value: 'NOT_USING',
    description: 'No CSS framework',
    disabled: false,
  },
  tailwind: {
    display: 'Tailwind CSS',
    value: 'TAILWIND',
    description: 'Tailwind CSS v4.1.3 (Vite plugin, zero-config)',
    disabled: false,
  },
};

export const REACT_MENU_LINTER: MenuOptions = {
  notUsing: {
    display: "Not Using",
    value: "NOT_USING",
    description: "No linter/formatter",
    disabled: false,
  },
  biome: {
    display: "Biome",
    value: "BIOME",
    description: "Fast all-in-one: lint + format (v1.9.4)",
    disabled: false,
  },
  eslint: {
    display: "ESLint",
    value: "ESLINT",
    description: "ESLint v9 (flat config) + typescript-eslint",
    disabled: false,
  },
};

export const REACT_MENU_TESTING: MenuOptions = {
  notUsing: {
    display: "Not Using",
    value: "NOT_USING",
    description: "No testing setup",
    disabled: false,
  },
  vitest: {
    display: "Vitest",
    value: "VITEST",
    description: "Unit + component testing with Vitest v3.2.4 + Testing Library",
    disabled: false,
  },
  playwright: {
    display: "Playwright",
    value: "PLAYWRIGHT",
    description: "End-to-end testing with Playwright v1.52.0",
    disabled: false,
  },
};

export const REACT_MENU_AI: MenuOptions = {
  notUsing: {
    display: "Not Using",
    value: "NOT_USING",
    description: "No AI setup",
    disabled: false,
  },
  claude: {
    display: "Claude (Claude Code)",
    value: "CLAUDE",
    description: "AGENTS.md + provider adapters (.claude/, .codex/) + feature docs structure",
    disabled: false,
  },
  codex: {
    display: "Codex (OpenAI Codex CLI)",
    value: "CODEX",
    description: "AGENTS.md + .codex/ agents + feature docs structure",
    disabled: false,
  },
  both: {
    display: "Both (Claude + Codex)",
    value: "BOTH",
    description: "Full dual-harness: .claude/ + .codex/ + feature docs structure",
    disabled: false,
  },
};

