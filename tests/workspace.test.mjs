import test from 'node:test';
import assert from 'node:assert/strict';
import {keepPreRecoveryCopy, loadFailureMessage, preRecoveryKey, retainFailedWorkspace, unreadableWorkspaceKey, workspaceKey} from '../src/app/editor/workspace.ts';

function memory(entries) {
  const store = new Map(entries);
  return {store, storage:{
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, value),
    removeItem: () => { throw new Error('saved workspace must not be removed'); }
  }};
}
test('a failed load keeps the saved workspace and records one copy', () => {
  const {store, storage} = memory([[workspaceKey, '{"schemaVersion":3}']]);
  const first = retainFailedWorkspace(storage);
  assert.equal(first.dirty, false);
  assert.equal(first.error, loadFailureMessage);
  assert.equal(store.get(workspaceKey), '{"schemaVersion":3}');
  assert.equal(store.get(unreadableWorkspaceKey), '{"schemaVersion":3}');
  store.set(workspaceKey, '{"schemaVersion":3,"pages":[]}');
  retainFailedWorkspace(storage);
  assert.equal(store.get(unreadableWorkspaceKey), '{"schemaVersion":3}');
  assert.equal(store.get(workspaceKey), '{"schemaVersion":3,"pages":[]}');
});
test('an empty browser can start a website without writing storage', () => {
  const storage = {getItem: () => null, setItem: () => { throw new Error('unexpected write'); }};
  assert.deepEqual(retainFailedWorkspace(storage), {dirty: true, error: ''});
});
test('the pre-recovery copy is written once and never replaced', () => {
  const {store, storage} = memory([[workspaceKey, '{"schemaVersion":3,"pages":["original"]}']]);
  keepPreRecoveryCopy(storage);
  assert.equal(store.get(preRecoveryKey), '{"schemaVersion":3,"pages":["original"]}');
  store.set(workspaceKey, '{"schemaVersion":3,"pages":["edited"]}');
  keepPreRecoveryCopy(storage);
  assert.equal(store.get(preRecoveryKey), '{"schemaVersion":3,"pages":["original"]}');
  assert.equal(store.get(workspaceKey), '{"schemaVersion":3,"pages":["edited"]}');
});
