import { select, input } from "@inquirer/prompts";
import path from "path";
import { MENU_OPTIONS_LEVEL_1 } from "@src/constants";
import { HARNESS_MENU_AI, HARNESS_MENU_PROJECT_TYPE } from "@src/options/harness-only/constants";
import { MenuOptions } from "@src/options/react-vite/types";
import { Cart, HarnessOnlyCore } from "@src/types";
import { dirExists } from "@src/scaffold/utils";
import chalk from "chalk";

const selectFromMenu = async <T extends MenuOptions>(
  menuOptions: T,
  message: string
): Promise<T[keyof T]["value"]> => {
  const keys = Object.keys(menuOptions) as Array<keyof T>;
  const choices = keys
    .filter((key) => !menuOptions[key].disabled)
    .map((key) => ({
      name: menuOptions[key].display,
      value: menuOptions[key].value,
      description: menuOptions[key].description,
    }));

  const answer = await select({ message: chalk.whiteBright(message), choices });
  return answer as T[keyof T]["value"];
};

const menuTargetDirectory = async (cart: Cart): Promise<void> => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.HarnessOnly.value) return;

  const raw = await input({
    message: chalk.whiteBright("Target directory (existing project):"),
    default: ".",
    validate: async (value) => {
      const resolved = path.resolve(process.cwd(), value.trim());
      if (!(await dirExists(resolved))) {
        return `Directory "${value.trim()}" does not exist`;
      }
      return true;
    },
    transformer: (value) => value.trim(),
  });

  (cart as HarnessOnlyCore).targetDirectory = path.resolve(process.cwd(), raw.trim());
};

const menuProjectName = async (cart: Cart): Promise<void> => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.HarnessOnly.value) return;

  const defaultName = path.basename((cart as HarnessOnlyCore).targetDirectory);

  (cart as HarnessOnlyCore).projectName = await input({
    message: chalk.whiteBright("Project name:"),
    default: defaultName,
    validate: (value) => {
      if (!value.trim()) return "Project name cannot be empty";
      if (!/^[a-zA-Z0-9_-]+$/.test(value.trim()))
        return "Only letters, numbers, hyphens, and underscores allowed";
      return true;
    },
    transformer: (value) => value.trim(),
  });
};

const menuProjectType = async (cart: Cart): Promise<void> => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.HarnessOnly.value) return;

  (cart as HarnessOnlyCore).projectType = await selectFromMenu(
    HARNESS_MENU_PROJECT_TYPE,
    "Project type:"
  );
};

const menuAI = async (cart: Cart): Promise<void> => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.HarnessOnly.value) return;

  (cart as HarnessOnlyCore).ai = await selectFromMenu(
    HARNESS_MENU_AI,
    "Choose an AI harness:"
  );
};

const menuProductDescription = async (cart: Cart): Promise<void> => {
  if (!cart || cart.type !== MENU_OPTIONS_LEVEL_1.HarnessOnly.value) return;

  (cart as HarnessOnlyCore).productDescription = await input({
    message: chalk.whiteBright("Describe your project (one line):"),
    validate: (value) => {
      if (!value.trim()) return "Description cannot be empty";
      return true;
    },
    transformer: (value) => value.trim(),
  });
};

export const flowHarnessOnly = async (): Promise<void> => {
  const cart: Cart = { type: MENU_OPTIONS_LEVEL_1.HarnessOnly.value } as HarnessOnlyCore;

  await menuTargetDirectory(cart);
  await menuProjectName(cart);
  await menuProjectType(cart);
  await menuAI(cart);
  await menuProductDescription(cart);

  const { scaffoldHarnessOnly } = await import("@src/scaffold/harness-only");
  await scaffoldHarnessOnly(cart);
};
