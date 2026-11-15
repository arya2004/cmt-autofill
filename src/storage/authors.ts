import type { Author } from '../shared/models';

// Keep the existing sync storage format and callback behavior for this build step.
export function loadAuthors(
  profile: string,
  callback: (authors: Author[]) => void,
) {
  chrome.storage.sync.get([profile], (result) => {
    callback((result[profile] as Author[] | undefined) ?? []);
  });
}

export function saveAuthors(
  profile: string,
  authors: Author[],
  callback: () => void,
) {
  chrome.storage.sync.set({ [profile]: authors }, callback);
}
