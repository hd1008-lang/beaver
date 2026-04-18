import path from 'path';
import chalk from 'chalk';
import { createSpinner } from 'nanospinner';
import { MENU_OPTIONS_LEVEL_1 } from '@src/constants';
import { Cart } from '@src/types';
import { dirExists, writeProjectFile } from '@src/scaffold/utils';
import { ScaffoldError, isNodeError } from '@src/scaffold/errors';
import { getChromeExtensionFileMap } from './templates/layout';

export const scaffoldChromeExtension = async (cart: Cart): Promise<void> => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ChromeExtension.value) return;

  const { projectName } = cart;
  const projectRoot = path.resolve(process.cwd(), projectName);

  if (await dirExists(projectRoot)) {
    throw new ScaffoldError(
      `Directory "${projectName}" already exists. Please choose a different project name or remove the existing directory.`
    );
  }

  const spinner = createSpinner(`Scaffolding ${chalk.cyan(projectName)}...`).start();

  try {
    const fileMap = getChromeExtensionFileMap(cart);

    for (const { relativePath, content } of fileMap) {
      await writeProjectFile(projectRoot, relativePath, content);
    }

    spinner.success({
      text: chalk.green(`Project ${chalk.bold(projectName)} created successfully!`),
    });

    console.log('');
    console.log(chalk.whiteBright('Next steps:'));
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan('  npm install'));
    console.log(chalk.cyan('  npm run dev'));
    console.log('');
    console.log(chalk.whiteBright('To build the extension:'));
    console.log(chalk.cyan('  npm run build-extension'));
    console.log(chalk.gray('  Then load the dist/ folder in Chrome at chrome://extensions'));
    console.log('');
  } catch (err) {
    spinner.error({ text: chalk.red('Scaffolding failed.') });

    if (err instanceof ScaffoldError) {
      console.error(chalk.red(err.message));
    } else if (isNodeError(err)) {
      console.error(chalk.red(`File system error (${err.code}): ${err.message}`));
    } else {
      console.error(chalk.red('An unexpected error occurred.'), err);
    }

    try {
      const { rm } = await import('fs/promises');
      await rm(projectRoot, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }

    process.exit(1);
  }
};
