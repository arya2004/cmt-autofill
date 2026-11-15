import { settings } from '../config/settings';
import type { AutoFillRequest } from '../shared/models';

const connectionError =
  'Could not connect to the CMT page. Refresh the tab and try again. If this continues, reload the extension from dist/extension/.';

async function isReady(tabId: number): Promise<boolean> {
  try {
    const response = await chrome.tabs.sendMessage(
      tabId,
      { action: 'ping' },
      { frameId: 0 },
    );
    return response?.ready === true;
  } catch {
    return false;
  }
}

export async function startAutofill(profile: string): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined)
    throw new Error(
      'No active tab was found. Open the CMT submission page and try again.',
    );
  const url = tab.url ? new URL(tab.url) : undefined;
  if (url?.origin !== settings.cmtOrigin) {
    throw new Error(
      'Open the Microsoft CMT submission page before filling authors.',
    );
  }

  // Tabs already open when an extension is installed/reloaded may have no receiver.
  if (!(await isReady(tab.id))) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [settings.contentScriptFile],
      });
      if (!(await isReady(tab.id))) throw new Error(connectionError);
    } catch {
      throw new Error(connectionError);
    }
  }

  const request: AutoFillRequest = { action: 'autoFillAuthors', profile };
  // Only retry the handshake; retrying the fill could add authors twice.
  try {
    const response = await chrome.tabs.sendMessage(tab.id, request, {
      frameId: 0,
    });
    if (response?.accepted !== true) throw new Error(connectionError);
  } catch {
    throw new Error(connectionError);
  }
}
