export const workspaceKey = "business-builder-workspace-v2";
export const unreadableWorkspaceKey = "business-builder-workspace-v2-unreadable";
export const loadFailureMessage = "Saved website could not be opened. It is still stored in this browser and was not replaced.";

type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function retainFailedWorkspace(storage: KeyValueStore): {dirty: boolean; error: string} {
  const saved = storage.getItem(workspaceKey);
  if (!saved) return {dirty: true, error: ""};
  if (!storage.getItem(unreadableWorkspaceKey)) storage.setItem(unreadableWorkspaceKey, saved);
  return {dirty: false, error: loadFailureMessage};
}
