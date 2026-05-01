#!/usr/bin/env node
import { menu } from "@src/options";
import { sleep } from "@src/utils";
import { typeWriter } from "@src/utils/animation";
import { getUserName } from "@src/utils/user";
import chalk from "chalk";

const main = async () => {
  await typeWriter(`Hi! ${getUserName()} 🙆`, chalk.whiteBright, 50);
  await sleep(500);
  try {
    await menu();
  } catch (err) {
    if (err instanceof Error) {
      console.error(chalk.red(err.message));
    }
    process.exit(1);
  }
};

main();
