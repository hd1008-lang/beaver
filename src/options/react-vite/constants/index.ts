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

