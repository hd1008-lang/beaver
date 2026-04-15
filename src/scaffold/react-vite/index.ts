import path from 'path';
import chalk from 'chalk';
import { createSpinner } from 'nanospinner';
import { MENU_OPTIONS_LEVEL_1 } from '@src/constants';
import { Cart } from '@src/types';
import { dirExists, writeProjectFile } from '@src/scaffold/utils';
import { ScaffoldError, isNodeError } from '@src/scaffold/errors';
import { getFsdFileMap } from './templates/fsd-layout';
import { getBprFileMap } from './templates/bpr-layout';

export const scaffoldReactVite = async (cart: Cart): Promise<void> => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ReactVite.value) return;

  const { projectName } = cart;
  const projectRoot = path.resolve(process.cwd(), projectName);

  if (await dirExists(projectRoot)) {
    throw new ScaffoldError(
      `Directory "${projectName}" already exists. Please choose a different project name or remove the existing directory.`
    );
  }

  const spinner = createSpinner(`Scaffolding ${chalk.cyan(projectName)}...`).start();

  try {
    const fileMap = cart.layout === 'FSD' ? getFsdFileMap(cart) : getBprFileMap(cart);

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
    if (cart.router === 'TANSTACK_ROUTER') {
      console.log('');
      console.log(chalk.gray('  Note: TanStack Router will auto-generate routeTree.gen.ts on first dev run.'));
    }
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

    // Best-effort cleanup of partially-created directory
    try {
      const { rm } = await import('fs/promises');
      await rm(projectRoot, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }

    process.exit(1);
  }
};
