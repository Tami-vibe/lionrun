import {readdirSync, readFileSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const sourceExtension = /\.(?:[cm]?[jt]sx?|css)$/;
const excludedDirectories = new Set([
  '.git', '.next', '.agents', '.codex', '.worktrees', 'node_modules',
  'tests', 'docs', 'out', 'build', 'coverage',
]);

/** Count owned source and configuration conservatively, including this audit utility. */
export function applicationLines(root = process.cwd()) {
  const files = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, {withFileTypes: true})) {
      const path = join(directory, entry.name);
      if (entry.isDirectory() && !excludedDirectories.has(entry.name)) walk(path);
      if (!entry.isFile() || !sourceExtension.test(entry.name) || entry.name === 'next-env.d.ts') continue;
      const source = readFileSync(path, 'utf8');
      const lines = source === '' ? [] : source.replace(/\n$/, '').split('\n');
      files.push({path: relative(root, path), lines: lines.length,
        longLines: lines.filter(line => line.length > 120).length});
    }
  }
  walk(root);
  const modules = {};
  for (const file of files) {
    const moduleName = file.path.startsWith('src/app/') ? file.path.split('/').slice(0, 3).join('/') : 'configuration';
    modules[moduleName] = (modules[moduleName] || 0) + file.lines;
  }
  return {total: files.reduce((sum, file) => sum + file.lines, 0), modules, files};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(applicationLines(), null, 2));
}
