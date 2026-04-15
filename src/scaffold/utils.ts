import fs from 'fs/promises';
import path from 'path';

export type FileMap = Array<{ relativePath: string; content: string }>;

export const dirExists = async (dirPath: string): Promise<boolean> => {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
};

export const writeProjectFile = async (
  projectRoot: string,
  relativePath: string,
  content: string
): Promise<void> => {
  const fullPath = path.join(projectRoot, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, 'utf-8');
};
