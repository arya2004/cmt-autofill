function storageError(operation: string, message: string): Error {
  const advice = /quota|MAX_WRITE|bytes/i.test(message)
    ? 'Chrome sync storage is full or rate limited. Reduce saved data or wait a minute and retry.'
    : 'Check that the extension is enabled, then retry.';
  return new Error(
    `Could not ${operation} saved profiles. ${advice} (${message})`,
  );
}

export function readStorage(): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(null, (result) => {
      const error = chrome.runtime.lastError;
      if (error)
        reject(storageError('read', error.message ?? 'Unknown storage error'));
      else resolve(result);
    });
  });
}

export function writeStorage(values: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(values, () => {
      const error = chrome.runtime.lastError;
      if (error)
        reject(storageError('save', error.message ?? 'Unknown storage error'));
      else resolve();
    });
  });
}

export function removeStorage(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.remove(key, () => {
      const error = chrome.runtime.lastError;
      if (error)
        reject(
          storageError('delete', error.message ?? 'Unknown storage error'),
        );
      else resolve();
    });
  });
}
