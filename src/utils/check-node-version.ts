import chalk from "chalk";

const MIN_NODE_MAJOR = 20;

export const checkNodeVersion = () => {
  const major = parseInt(process.version.slice(1).split(".")[0], 10);
  if (major < MIN_NODE_MAJOR) {
    console.error(
      chalk.red(
        `✖ beaver requires Node.js v${MIN_NODE_MAJOR} or higher.\n` +
          `  You are running ${process.version}.\n` +
          `  Please upgrade Node.js: https://nodejs.org`
      )
    );
    process.exit(1);
  }
};
