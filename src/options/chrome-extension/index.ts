import { select, input, Separator } from '@inquirer/prompts';
import { MENU_OPTIONS_LEVEL_1 } from '@src/constants';
import {
  CHROME_MENU_STATE_MANAGEMENT,
  CHROME_MENU_QUERY,
  CHROME_MENU_CSS,
  CHROME_MENU_LINTER,
} from '@src/options/chrome-extension/constants';
import { MenuOptions } from '@src/options/react-vite/types';
import { Cart } from '@src/types';
import chalk from 'chalk';

const selectFromMenu = async <T extends MenuOptions>(
  menuOptions: T,
  message: string
): Promise<T[keyof T]['value']> => {
  const keys = Object.keys(menuOptions) as Array<keyof T>;
  const enabledKeys = keys.filter((key) => !menuOptions[key].disabled);
  const choices = enabledKeys.map((key) => ({
    name: menuOptions[key].display,
    value: menuOptions[key].value,
    description: menuOptions[key].description,
  }));

  const answer = await select({
    message: chalk.whiteBright(message),
    choices: [...choices, new Separator()],
  });

  return answer as T[keyof T]['value'];
};

const menuProjectName = async (cart: Cart) => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ChromeExtension.value) return;

  cart.projectName = await input({
    message: chalk.whiteBright('Project name:'),
    validate: (value) => {
      if (!value.trim()) return 'Project name cannot be empty';
      if (!/^[a-zA-Z0-9_-]+$/.test(value.trim()))
        return 'Only letters, numbers, hyphens, and underscores allowed';
      return true;
    },
    transformer: (value) => value.trim(),
  });
};

const menuStateManagement = async (cart: Cart) => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ChromeExtension.value) return;

  cart.stateManagement = await selectFromMenu(
    CHROME_MENU_STATE_MANAGEMENT,
    'Choose a State Management'
  );
};

const menuQuery = async (cart: Cart) => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ChromeExtension.value) return;

  cart.query = await selectFromMenu(CHROME_MENU_QUERY, 'Choose a Data Fetching library');
};

const menuCss = async (cart: Cart) => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ChromeExtension.value) return;

  cart.css = await selectFromMenu(CHROME_MENU_CSS, 'Choose a CSS framework');
};

const menuLinter = async (cart: Cart) => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ChromeExtension.value) return;

  cart.linter = await selectFromMenu(CHROME_MENU_LINTER, 'Choose a Linter / Formatter');
};

export const flowChromeExtension = async (cart: Cart) => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ChromeExtension.value) return;
  await menuProjectName(cart);
  await menuStateManagement(cart);
  await menuQuery(cart);
  await menuCss(cart);
  await menuLinter(cart);
  const { scaffoldChromeExtension } = await import('@src/scaffold/chrome-extension');
  await scaffoldChromeExtension(cart);
};
