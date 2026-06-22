export const HARNESS_MENU_AI = {
  claude: {
    display: 'Claude (Claude Code)',
    value: 'CLAUDE',
    description: 'CLAUDE.md + .claude/ agents + feature docs structure',
    disabled: false,
  },
  codex: {
    display: 'Codex (OpenAI Codex CLI)',
    value: 'CODEX',
    description: 'AGENTS.md + .codex/ agents + feature docs structure',
    disabled: false,
  },
  both: {
    display: 'Both (Claude + Codex)',
    value: 'BOTH',
    description: 'Full dual-harness: .claude/ + .codex/ + feature docs structure',
    disabled: false,
  },
} as const;

export const HARNESS_MENU_PROJECT_TYPE = {
    ReactVite: {
        display: 'React + Vite',
        value: 'REACT_VITE',
        description: 'React + Vite project',
        disabled: false,
    },
    ChromeExtension: {
        display: 'Chrome Extension',
        value: 'CHROME_EXTENSION',
        description: 'Chrome Extension project',
        disabled: false,
    },
    Generic: {
        display: 'Other (Generic)',
        value: 'GENERIC',
        description: 'Any other project',
        disabled: false,
    },
} as const;
