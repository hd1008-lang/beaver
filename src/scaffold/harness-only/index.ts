import path from 'path';
import chalk from 'chalk';
import { createSpinner } from 'nanospinner';
import { MENU_OPTIONS_LEVEL_1 } from '@src/constants';
import { Cart, HarnessOnlyCore } from '@src/types';
import { dirExists, writeProjectFile } from '@src/scaffold/utils';
import { ScaffoldError, isNodeError } from '@src/scaffold/errors';
import { getReactViteHarnessFileMap } from './templates/react-vite-skeleton';
import { getChromeExtensionHarnessFileMap } from './templates/chrome-extension-skeleton';
import { getGenericHarnessFileMap } from './templates/generic-skeleton';

const getFileMap = (cart: HarnessOnlyCore) => {
  switch (cart.projectType) {
    case 'REACT_VITE': return getReactViteHarnessFileMap(cart);
    case 'CHROME_EXTENSION': return getChromeExtensionHarnessFileMap(cart);
    default: return getGenericHarnessFileMap(cart);
  }
};

export const scaffoldHarnessOnly = async (cart: Cart): Promise<void> => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.HarnessOnly.value) return;

  const { targetDirectory, projectName } = cart as HarnessOnlyCore;

  if (!(await dirExists(targetDirectory))) {
    throw new ScaffoldError(`Directory "${path.relative(process.cwd(), targetDirectory)}" does not exist.`);
  }

  const spinner = createSpinner(`Applying harness to ${chalk.cyan(projectName)}...`).start();

  try {
    const fileMap = getFileMap(cart as HarnessOnlyCore);

    for (const { relativePath, content } of fileMap) {
      await writeProjectFile(targetDirectory, relativePath, content);
    }

    spinner.success({
      text: chalk.green(`AI harness applied to ${chalk.bold(projectName)} successfully!`),
    });

    console.log('');
    console.log(chalk.whiteBright('Next steps:'));
    console.log(chalk.cyan(`  cd ${path.relative(process.cwd(), targetDirectory) || '.'}`));
    console.log(chalk.cyan('  claude /init') + chalk.gray('  ← generate project details, then merge them into AGENTS.md (CLAUDE.md stays a thin @AGENTS.md adapter)'));
    console.log('');
  } catch (err) {
    spinner.error({ text: chalk.red('Harness setup failed.') });

    if (err instanceof ScaffoldError) {
      console.error(chalk.red(err.message));
    } else if (isNodeError(err)) {
      console.error(chalk.red(`File system error (${err.code}): ${err.message}`));
    } else {
      console.error(chalk.red('An unexpected error occurred.'), err);
    }

    process.exit(1);
  }
};
