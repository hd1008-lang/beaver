export const MENU_OPTIONS_LEVEL_1 = {
    ReactVite: {
        display: 'React + Vite',
        value: 'REACT_VITE',
        description: 'React 19 + Vite',
        disabled: false
    },
    NextJS: {
        display: 'Next.js',
        value: 'NEXTJS',
        description: 'Next 15',
        disabled: true
    },
    ChromeExtension: {
        display: 'Chrome Extension',
        value: 'CHROME_EXTENSION',
        description: 'React 19 + Vite (Manifest v3)',
        disabled: false
    },
    Nuxt: {
        display: 'Nuxt',
        value: 'NUXT',
        description: 'Upcoming...',
        disabled: true
    }
} as const;

