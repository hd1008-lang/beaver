export const buildExtensionScriptTemplate = (): string =>
  `import { execSync } from 'child_process';
import { copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

execSync('npm run build', { stdio: 'inherit' });

copyFileSync(join(root, 'manifest.json'), join(root, 'dist', 'manifest.json'));

console.log('Build extension completed');
`;
