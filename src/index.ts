#!/usr/bin/env node
import { menu } from "@src/options";
import { sleep } from "@src/utils";
import { typeWriter } from "@src/utils/animation";
import { getUserName } from "@src/utils/user";
import chalk from "chalk";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const getVersion = () => {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8"));
    return pkg.version;
  } catch {
    return "unknown";
  }
};

const main = async () => {
  const args = process.argv.slice(2);

  if (args.includes("--version") || args.includes("-v")) {
    console.log(`bver-build v${getVersion()}`);
    process.exit(0);
  }

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
bver-build - Interactive CLI for scaffolding modern web projects

Usage:
  beaver [options]

Options:
  -v, --version     Show version
  -h, --help        Show help
    `);
    process.exit(0);
  }

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
