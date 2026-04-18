import { ChromeExtensionCore } from '@src/types';
import { FileMap } from '@src/scaffold/utils';
import { packageJsonTemplate } from './package-json';
import { viteConfigTemplate } from './vite-config';
import { manifestJsonTemplate } from './manifest-json';
import { buildExtensionScriptTemplate } from './build-extension-script';
import { mainTsxTemplate } from './main-tsx';
import { appTsxTemplate } from './app-tsx';
import { viteEnvDtsTemplate } from '@src/scaffold/react-vite/templates/vite-env-d-ts';
import { tsconfigTemplate, tsconfigNodeTemplate } from '@src/scaffold/react-vite/templates/tsconfig';
import { indexHtmlTemplate } from '@src/scaffold/react-vite/templates/index-html';
import { gitignoreTemplate } from '@src/scaffold/react-vite/templates/gitignore';
import { stylesCssTemplate } from '@src/scaffold/react-vite/templates/styles';
import { zustandStoreTemplate } from '@src/scaffold/react-vite/templates/zustand';
import { biomeConfigTemplate, eslintConfigTemplate } from '@src/scaffold/react-vite/templates/linter';

export const getChromeExtensionFileMap = (cart: ChromeExtensionCore): FileMap => {
  const hasZustand = cart.stateManagement === 'ZUSTAND';

  const files: FileMap = [
    { relativePath: 'package.json',          content: packageJsonTemplate(cart) },
    { relativePath: 'vite.config.ts',        content: viteConfigTemplate(cart) },
    { relativePath: 'tsconfig.json',         content: tsconfigTemplate() },
    { relativePath: 'tsconfig.node.json',    content: tsconfigNodeTemplate() },
    { relativePath: 'index.html',            content: indexHtmlTemplate(cart.projectName) },
    { relativePath: 'manifest.json',         content: manifestJsonTemplate(cart.projectName) },
    { relativePath: '.gitignore',            content: gitignoreTemplate() },
    { relativePath: 'scripts/build-extension.js', content: buildExtensionScriptTemplate() },
    { relativePath: 'src/vite-env.d.ts',     content: viteEnvDtsTemplate() },
    { relativePath: 'src/main.tsx',          content: mainTsxTemplate(cart) },
    { relativePath: 'src/App.tsx',           content: appTsxTemplate(cart) },
    { relativePath: 'src/components/.gitkeep', content: '' },
    { relativePath: 'src/hooks/.gitkeep',    content: '' },
    { relativePath: 'src/lib/.gitkeep',      content: '' },
    { relativePath: 'src/types/.gitkeep',    content: '' },
    { relativePath: 'src/utils/.gitkeep',    content: '' },
  ];

  if (hasZustand) {
    files.push({ relativePath: 'src/stores/appStore.ts', content: zustandStoreTemplate() });
  }

  if (cart.css === 'TAILWIND') {
    files.push({ relativePath: 'src/index.css', content: stylesCssTemplate() });
  }

  if (cart.linter === 'BIOME') {
    files.push({ relativePath: 'biome.json', content: biomeConfigTemplate() });
  } else if (cart.linter === 'ESLINT') {
    files.push({ relativePath: 'eslint.config.js', content: eslintConfigTemplate() });
  }

  return files;
};
