import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { afterEach, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { loadSourceModule, mockStorage } from './test-helpers.mjs';

const { settings } = await loadSourceModule('../src/config/settings.ts');
const html = await readFile(
  new URL('../dist/extension/popup.html', import.meta.url),
  'utf8',
);
const script = html.match(/src="([^"]+\.js)"/)[1];
const bundle = await readFile(
  new URL(`../dist/extension/${script}`, import.meta.url),
  'utf8',
);
const windows = [];
const originalChrome = globalThis.chrome;
afterEach(() => {
  windows.splice(0).forEach((window) => window.close());
  globalThis.chrome = originalChrome;
});
const author = {
  email: 'test@example.test',
  name: 'Test',
  surname: 'Author',
  organization: 'Example',
  country: 'IN',
};

async function waitFor(condition) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (condition()) return;
    await delay(10);
  }
  assert.fail('Timed out waiting for popup state');
}

async function openPopup(storage) {
  const dom = new JSDOM(html, {
    url: 'https://extension.test/popup.html',
    runScripts: 'outside-only',
  });
  const window = dom.window;
  windows.push(window);
  const messages = [];
  window.chrome = globalThis.chrome;
  window.chrome.tabs = {
    async query() {
      return [
        {
          id: 5,
          url: `${settings.cmtOrigin}/ICICDSE2027/Track/1/Submission/Create`,
        },
      ];
    },
    async sendMessage(_, message) {
      if (message.action === 'ping') return { ready: true };
      messages.push(message);
      return { accepted: true };
    },
  };
  window.confirm = () => true;
  window.eval(bundle);
  const $ = (selector) => window.document.querySelector(selector);
  await waitFor(
    () =>
      $('#status')?.textContent &&
      !$('#status').textContent.includes('Loading'),
  );
  function click(selector) {
    $(selector).click();
  }
  function set(selector, value) {
    $(selector).value = value;
    $(selector).dispatchEvent(new window.Event('change', { bubbles: true }));
  }
  function fill(value) {
    for (const [field, text] of Object.entries(value))
      set(`.author-${field}`, text);
  }
  async function status(text) {
    await waitFor(() => $('#status').textContent.includes(text));
  }
  return { window, $, click, set, fill, status, storage, messages };
}

test('built popup creates, saves, switches, renames, deletes, and reopens profiles', async () => {
  const storage = mockStorage({ profile1: [author] });
  const ui = await openPopup(storage);
  assert.equal(ui.$('.author-email').value, '', 'v2 starts fresh');
  ui.fill(author);
  ui.click('#saveAuthors');
  await ui.status('Authors saved');
  ui.set('#profileName', 'Second');
  ui.click('#createProfile');
  await ui.status('Profile created');
  const secondId = ui.$('#profileSelect').value;
  assert.notEqual(secondId, settings.defaultProfileId);
  assert.equal(ui.$('.author-email').value, '');
  ui.fill({ ...author, email: 'second@example.test' });
  ui.click('#saveAuthors');
  await ui.status('Authors saved');
  ui.set('#profileSelect', settings.defaultProfileId);
  await ui.status('Profile selected');
  assert.equal(ui.$('.author-email').value, author.email);
  ui.set('#profileName', 'Main team');
  ui.click('#renameProfile');
  await ui.status('Profile renamed');
  assert.equal(ui.$('#profileSelect option:checked').textContent, 'Main team');
  ui.click('#deleteProfile');
  await ui.status('Profile deleted');
  assert.equal(ui.$('#profileSelect').value, secondId);
  assert.equal(ui.$('.author-email').value, 'second@example.test');
  ui.window.close();
  const reopened = await openPopup(storage);
  assert.equal(reopened.$('#profileSelect').value, secondId);
  assert.equal(reopened.$('.author-email').value, 'second@example.test');
});

test('popup preserves drafts on validation and storage failures and can retry', async () => {
  const storage = mockStorage();
  storage.fail('get');
  const ui = await openPopup(storage);
  await ui.status('Could not read');
  assert.equal(ui.$('#saveAuthors').disabled, true);
  assert.equal(ui.$('#retryLoad').hidden, false);
  storage.recover();
  ui.click('#retryLoad');
  await ui.status('Profile loaded');
  ui.click('#saveAuthors');
  await ui.status('Email is required');
  assert.equal(ui.$('.author-email').getAttribute('aria-invalid'), 'true');
  ui.fill(author);
  storage.fail('set', 'QUOTA_BYTES quota exceeded');
  ui.click('#saveAuthors');
  await ui.status('Reduce saved data or wait');
  assert.equal(ui.$('.author-email').value, author.email);
  assert.equal(
    storage.data()[`${settings.profilePrefix}${settings.defaultProfileId}`]
      .authors.length,
    0,
  );
  storage.recover();
  ui.click('#saveAuthors');
  await ui.status('Authors saved');
  ui.click('#autoFillAuthors');
  await ui.status('Autofill started');
  assert.equal(ui.messages[0].profile, settings.defaultProfileId);
});

test('switching profiles protects unsaved authors and filling requires a save', async () => {
  const storage = mockStorage();
  const ui = await openPopup(storage);
  ui.set('#profileName', 'Other');
  ui.click('#createProfile');
  await ui.status('Profile created');
  const currentId = ui.$('#profileSelect').value;
  ui.fill(author);
  ui.click('#autoFillAuthors');
  await ui.status('Save author changes before filling');
  assert.equal(ui.messages.length, 0);
  ui.window.confirm = () => false;
  ui.set('#profileSelect', settings.defaultProfileId);
  assert.equal(ui.$('#profileSelect').value, currentId);
  assert.equal(ui.$('.author-email').value, author.email);
  ui.set('#profileName', 'Default');
  ui.click('#renameProfile');
  await ui.status('already exists');
  assert.equal(ui.$('.author-email').value, author.email);
});
