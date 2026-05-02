import { ReactViteCore } from '@src/types';
import { FileMap } from '@src/scaffold/utils';
import { packageJsonTemplate } from './package-json';
import { viteConfigTemplate } from './vite-config';
import { tsconfigTemplate, tsconfigNodeTemplate } from './tsconfig';
import { indexHtmlTemplate } from './index-html';
import { mainTsxTemplate } from './main-tsx';
import { appTsxFsdTemplate } from './app-tsx';
import { rootRouteTemplate, indexRouteFsdTemplate, routeTreeGenTemplate } from './router';
import { zustandStoreTemplate } from './zustand';
import { biomeConfigTemplate, eslintConfigTemplate } from './linter';
import { gitignoreTemplate } from './gitignore';
import { stylesCssTemplate } from './styles';
import { viteEnvDtsTemplate } from './vite-env-d-ts';
import { getCopilotInstructionFiles } from './copilot-instructions';
import { homePageFsdTemplate } from './home-page';

export const getFsdFileMap = (cart: ReactViteCore): FileMap => {
  const hasRouter = cart.router === 'TANSTACK_ROUTER';
  const hasZustand = cart.stateManagement === 'ZUSTAND';
  const hasQuery = cart.query === 'TANSTACK_QUERY';

  const files: FileMap = [
    { relativePath: 'package.json',       content: packageJsonTemplate(cart) },
    { relativePath: 'vite.config.ts',     content: viteConfigTemplate(cart) },
    { relativePath: 'tsconfig.json',      content: tsconfigTemplate() },
    { relativePath: 'tsconfig.node.json', content: tsconfigNodeTemplate() },
    { relativePath: 'index.html',         content: indexHtmlTemplate(cart.projectName) },
    { relativePath: '.gitignore',         content: gitignoreTemplate() },
    ...getCopilotInstructionFiles(cart),
    { relativePath: 'src/vite-env.d.ts',  content: viteEnvDtsTemplate() },
    { relativePath: 'src/main.tsx',       content: mainTsxTemplate(cart) },
    { relativePath: 'src/app/index.tsx',  content: appTsxFsdTemplate(hasRouter, hasQuery) },
    {
      relativePath: 'src/pages/home/ui/HomePage.tsx',
      content: homePageFsdTemplate(cart),
    },
    {
      relativePath: 'src/pages/home/index.ts',
      content: `export { HomePage } from './ui/HomePage';\n`,
    },
    { relativePath: 'src/widgets/.gitkeep',       content: '' },
    { relativePath: 'src/features/.gitkeep',      content: '' },
    { relativePath: 'src/entities/.gitkeep',      content: '' },
    { relativePath: 'src/shared/ui/.gitkeep',     content: '' },
    { relativePath: 'src/shared/lib/.gitkeep',    content: '' },
    { relativePath: 'src/shared/api/.gitkeep',    content: '' },
    { relativePath: 'src/shared/config/.gitkeep', content: '' },
  ];

  if (hasRouter) {
    files.push(
      { relativePath: 'src/routes/__root.tsx',        content: rootRouteTemplate() },
      { relativePath: 'src/routes/index.tsx',         content: indexRouteFsdTemplate() },
      { relativePath: 'src/routes/routeTree.gen.ts',  content: routeTreeGenTemplate() },
    );
  }

  if (hasZustand) {
    files.push({
      relativePath: 'src/shared/lib/store.ts',
      content: zustandStoreTemplate(),
    });
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
