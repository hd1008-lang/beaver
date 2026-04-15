import { execSync } from "child_process";

export const getUserName = (): string => {
  const username = execSync("git config --global user.name").toString().trim();
  return username || process.env.USER || process.env.USERNAME || "Guest";
}   