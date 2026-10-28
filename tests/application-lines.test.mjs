import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {applicationLines} from '../scripts/application-lines.mjs';

test('source audit includes root config, public scripts and utilities, excludes only non-application files', () => {
  const root = mkdtempSync(join(tmpdir(), 'lionrun-lines-'));
  try {
    const fixtures = {
      'next.config.ts': 'export default {};\n',
      'src/app/page.tsx': 'one\ntwo\n',
      'src/app/site.css': 'three\nfour',
      'public/runtime.js': 'five\n',
      'scripts/export-utility.mjs': 'six\n',
      'scripts/application-lines.mjs': 'audit tooling\n',
      'tests/spec.mjs': 'test\n',
      'docs/example.ts': 'documentation example\n',
      'node_modules/lib/index.js': 'dependency\n',
      '.next/server/app.js': 'generated\n',
      'next-env.d.ts': 'generated\n',
    };
    for (const [name, source] of Object.entries(fixtures)) {
      mkdirSync(join(root, name, '..'), {recursive: true});
      writeFileSync(join(root, name), source);
    }
    const audit = applicationLines(root);
    assert.equal(audit.total, 8);
    assert.equal(audit.files.length, 6);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
