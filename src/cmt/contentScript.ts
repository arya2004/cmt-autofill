import type { AutoFillRequest } from '../shared/models';
import { loadAuthors } from '../storage/authors';
import { fillAuthorsSequentially } from './fillAuthors';

// Programmatic recovery and manifest injection can both run on the same page.
const scope = globalThis as typeof globalThis & {
  cmtAutofillRegistered?: boolean;
};
if (!scope.cmtAutofillRegistered) {
  scope.cmtAutofillRegistered = true;
  chrome.runtime.onMessage.addListener(
    (request: AutoFillRequest | { action: 'ping' }, _sender, sendResponse) => {
      if (request.action === 'ping') {
        sendResponse({ ready: true });
        return;
      }
      if (request.action === 'autoFillAuthors') {
        // Acknowledge receipt, not completion of the page automation.
        sendResponse({ accepted: true });
        const profileKey = request.profile || 'profile1';
        loadAuthors(profileKey, (authors) => {
          if (authors.length === 0) {
            alert(
              `No authors to fill for ${profileKey}. Please save author details first.`,
            );
            return;
          }
          fillAuthorsSequentially(authors);
        });
      }
    },
  );
}
