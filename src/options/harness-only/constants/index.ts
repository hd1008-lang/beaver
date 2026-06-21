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
