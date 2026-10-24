import test from 'node:test';
import assert from 'node:assert/strict';
import {contactHours} from '../src/app/site/contact-hours.ts';

const schedule = 'Monday–Friday  8:00–20:00\nSaturday  10:00–13:00\nSunday  Closed';
test('missing contact hours defaults without throwing', () => {
  assert.equal(contactHours(undefined), schedule);
});
test('a blank or legacy contact schedule receives the default once', () => {
  assert.equal(contactHours(''), schedule);
  assert.equal(contactHours('8:00–20:00'), schedule);
  assert.equal(contactHours('8:00 - 20:00'), schedule);
});
test('custom contact hours survive a second pass', () => {
  const saved = contactHours('By appointment');
  assert.equal(saved, 'By appointment');
  assert.equal(contactHours(saved), 'By appointment');
});
test('the default schedule is left unchanged on the next load', () => {
  const once = contactHours(undefined);
  assert.equal(contactHours(once), schedule);
});
