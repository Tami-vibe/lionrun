import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';

/** Soft ceilings — ratchet down as cleanup continues. Fail if bloat grows. */
// Includes the scoped main-image journey and its responsive styles.
// Includes the approved Footer editor, shared model and responsive rendering.
const APP_LINE_CEILING = 9500;
const LONG_LINE_PCT_CEILING = 17;
const LONG_LINE_CHARS = 120;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx|css)$/.test(name)) out.push(path);
  }
  return out;
}

test('src/app stays under the line budget and long-line density ceiling', () => {
  const files = walk(join(process.cwd(), 'src/app'));
  let appLines = 0;
  let tsLines = 0;
  let long = 0;
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    appLines += readFileSync(file).reduce((n, b) => n + (b === 10 ? 1 : 0), 0);
    if (file.endsWith('.css')) continue;
    // Match audit script: count every split segment (incl. trailing empty)
    for (const line of text.split('\n')) {
      tsLines += 1;
      if (line.length > LONG_LINE_CHARS) long += 1;
    }
  }
  const pct = (100 * long) / Math.max(tsLines, 1);
  assert.ok(appLines <= APP_LINE_CEILING, `src/app has ${appLines} lines; ceiling is ${APP_LINE_CEILING}`);
  assert.ok(pct <= LONG_LINE_PCT_CEILING, `long-line density ${pct.toFixed(1)}% exceeds ${LONG_LINE_PCT_CEILING}% (${long}/${tsLines} over ${LONG_LINE_CHARS} chars)`);
});
