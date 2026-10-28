import test from 'node:test';
import assert from 'node:assert/strict';
import {applicationLines} from '../scripts/application-lines.mjs';

// The requested acceptance ceiling counts the complete application and executable configuration.
const APP_LINE_CEILING = 2500;
const LONG_LINE_PCT_CEILING = 17;

test('all application source and configuration stay within 2,500 physical lines', () => {
  const audit = applicationLines();
  assert.ok(audit.total <= APP_LINE_CEILING,
    `Application has ${audit.total} lines; ceiling is ${APP_LINE_CEILING}. Modules: ${JSON.stringify(audit.modules)}`);
});

test('application scripts retain the baseline long-line density ceiling', () => {
  const files = applicationLines().files.filter(file => !file.path.endsWith('.css'));
  const total = files.reduce((sum, file) => sum + file.lines, 0);
  const long = files.reduce((sum, file) => sum + file.longLines, 0);
  const percent = 100 * long / Math.max(total, 1);
  assert.ok(percent <= LONG_LINE_PCT_CEILING,
    `Long-line density ${percent.toFixed(1)}% exceeds ${LONG_LINE_PCT_CEILING}% (${long}/${total} over 120 chars)`);
});
