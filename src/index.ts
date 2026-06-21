#!/usr/bin/env node
import { runUpdate } from "@src/commands/update";
import { menu } from "@src/options";
import { sleep } from "@src/utils";
import { typeWriter } from "@src/utils/animation";
import { checkNodeVersion } from "@src/utils/check-node-version";
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
  checkNodeVersion();

  const args = process.argv.slice(2);

  if (args.includes("--version") || args.includes("-v")) {
    console.log(`beaver-build v${getVersion()}`);
    process.exit(0);
  }

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
beaver-build - Interactive CLI for scaffolding modern web projects

Usage:
  beaver [command] [options]

Commands:
  update            Update beaver to the latest version from npm

Options:
  -v, --version     Show version
  -h, --help        Show help
      --ai          Apply AI harness to an existing project
    `);
    process.exit(0);
  }

  if (args[0] === "update") {
    await runUpdate(getVersion());
    process.exit(0);
  }

  if (args.includes("--ai")) {
    try {
      const { flowHarnessOnly } = await import("@src/options/harness-only");
      await flowHarnessOnly();
    } catch (err) {
      if (err instanceof Error) {
        console.error(chalk.red(err.message));
      }
      process.exit(1);
    }
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
