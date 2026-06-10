import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { createSpinner } from 'nanospinner';

const execAsync = promisify(exec);

const PACKAGE_NAME = 'beaver-build';

export const runUpdate = async (currentVersion: string): Promise<void> => {
  const spinner = createSpinner('Checking for updates...').start();

  let latestVersion: string;
  try {
    const { stdout } = await execAsync(`npm view ${PACKAGE_NAME} version`);
    latestVersion = stdout.trim();
  } catch {
    spinner.error({ text: chalk.red('Failed to check the latest version from npm.') });
    console.error(chalk.red('Please check your network connection and try again.'));
    process.exit(1);
  }

  if (latestVersion === currentVersion) {
    spinner.success({
      text: chalk.green(`Already on the latest version (v${currentVersion}).`),
    });
    return;
  }

  spinner.update({
    text: `Updating ${chalk.cyan(PACKAGE_NAME)} v${currentVersion} → v${latestVersion}...`,
  });

  try {
    await execAsync(`npm install -g ${PACKAGE_NAME}@latest`);
    spinner.success({
      text: chalk.green(`Updated to ${chalk.bold(`v${latestVersion}`)}!`),
    });
  } catch (err) {
    spinner.error({ text: chalk.red('Update failed.') });

    const message = err instanceof Error ? err.message : String(err);
    if (/EACCES|permission/i.test(message)) {
      console.error(chalk.red('Permission denied while installing globally.'));
      console.error(chalk.yellow(`Try: sudo npm install -g ${PACKAGE_NAME}@latest`));
    } else {
      console.error(chalk.red(message));
    }

    process.exit(1);
  }
};
