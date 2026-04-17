import { select, input, Separator } from "@inquirer/prompts";
import { MENU_OPTIONS_LEVEL_1 } from "@src/constants";
import {
  REACT_MENU_LAYOUT,
  REACT_MENU_ROUTER,
  REACT_MENU_STATE_MANAGEMENT,
  REACT_MENU_QUERY,
  REACT_MENU_CSS,
  REACT_MENU_LINTER,
} from "@src/options/react-vite/constants";
import { MenuOptions } from "@src/options/react-vite/types";
import { Cart } from "@src/types";
import chalk from "chalk";

const selectFromMenu = async <T extends MenuOptions>(
  menuOptions: T,
  message: string
): Promise<T[keyof T]["value"]> => {
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

  return answer as T[keyof T]["value"];
};

const menuProjectName = async (cart: Cart) => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ReactVite.value) return;

  cart.projectName = await input({
    message: chalk.whiteBright("Project name:"),
    validate: (value) => {
      if (!value.trim()) return "Project name cannot be empty";
      if (!/^[a-zA-Z0-9_-]+$/.test(value.trim()))
        return "Only letters, numbers, hyphens, and underscores allowed";
      return true;
    },
    transformer: (value) => value.trim(),
  });
};

export const menuLayout = async (cart: Cart) => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ReactVite.value) return;

  cart.layout = await selectFromMenu(REACT_MENU_LAYOUT, "Choose a layout");
};

export const menuRouter = async (cart: Cart) => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ReactVite.value) return;

  cart.router = await selectFromMenu(REACT_MENU_ROUTER, "Choose a Router");
};

export const menuStateManagement = async (cart: Cart) => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ReactVite.value) return;

  cart.stateManagement = await selectFromMenu(
    REACT_MENU_STATE_MANAGEMENT,
    "Choose a State Management"
  );
};

export const menuQuery = async (cart: Cart) => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ReactVite.value) return;

  cart.query = await selectFromMenu(
    REACT_MENU_QUERY,
    "Choose a Data Fetching library"
  );
};

export const menuCss = async (cart: Cart) => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ReactVite.value) return;

  cart.css = await selectFromMenu(REACT_MENU_CSS, 'Choose a CSS framework');
};

export const menuLinter = async (cart: Cart) => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ReactVite.value) return;

  cart.linter = await selectFromMenu(
    REACT_MENU_LINTER,
    "Choose a Linter / Formatter"
  );
};

export const flowReactVite = async (cart: Cart) => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.ReactVite.value) return;
  await menuProjectName(cart);
  await menuLayout(cart);
  await menuRouter(cart);
  await menuStateManagement(cart);
  await menuQuery(cart);
  await menuCss(cart);
  await menuLinter(cart);
  const { scaffoldReactVite } = await import("@src/scaffold/react-vite");
  await scaffoldReactVite(cart);
};
