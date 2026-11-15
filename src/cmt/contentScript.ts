import type { AutoFillRequest } from '../shared/models';
import { loadAuthors } from '../storage/profiles';
import { requireValidAuthors } from '../shared/validation';
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
        void loadAuthors(request.profile)
          .then((authors) => {
            if (!authors.length) {
              alert('No authors to fill. Please save author details first.');
              return;
            }
            fillAuthorsSequentially(requireValidAuthors(authors));
          })
          .catch((error: unknown) => {
            alert(
              error instanceof Error
                ? error.message
                : 'Could not load saved authors. Reopen the extension and retry.',
            );
          });
      }
    },
  );
}
