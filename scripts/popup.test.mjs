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

async function openPopup(storage, { wait = true } = {}) {
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
  await waitFor(() => $('.app-header'));
  if (wait)
    await waitFor(() => $('main').getAttribute('aria-busy') === 'false');
  async function click(selector) {
    assert.ok($(selector), `Missing ${selector}`);
    $(selector).click();
    await delay(0);
  }
  async function set(selector, value) {
    const element = $(selector);
    assert.ok(element, `Missing ${selector}`);
    const prototype =
      element.tagName === 'SELECT'
        ? window.HTMLSelectElement.prototype
        : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(
      element,
      value,
    );
    element.dispatchEvent(
      new window.Event(element.tagName === 'SELECT' ? 'change' : 'input', {
        bubbles: true,
      }),
    );
    await delay(0);
  }
  async function fill(value) {
    for (const [field, text] of Object.entries(value))
      await set(`.author-${field}`, text);
  }
  async function status(text) {
    await waitFor(() => $('#status').textContent.includes(text));
  }
  async function openAuthor(index = 0) {
    const selector = `.author-card:nth-child(${index + 1}) .author-summary`;
    if ($(selector).getAttribute('aria-expanded') !== 'true')
      await click(selector);
  }
  return { window, $, click, set, fill, status, openAuthor, storage, messages };
}

test('React popup creates, saves, switches, renames, deletes, and reopens profiles', async () => {
  const storage = mockStorage({ profile1: [author] });
  const ui = await openPopup(storage);
  assert.equal(ui.$('.author-email').value, '', 'v2 starts fresh');
  await ui.fill(author);
  assert.match(ui.$('.save-state').textContent, /Unsaved changes/);
  await ui.click('#saveAuthors');
  await ui.status('Authors saved');
  assert.match(ui.$('.save-state').textContent, /All changes saved/);
  await ui.click('#newProfile');
  await ui.set('#profileName', 'Second');
  await ui.click('#submitProfileName');
  await ui.status('Profile created');
  const secondId = ui.$('#profileSelect').value;
  assert.notEqual(secondId, settings.defaultProfileId);
  assert.equal(ui.$('.author-email').value, '');
  await ui.fill({ ...author, email: 'second@example.test' });
  await ui.click('#saveAuthors');
  await ui.status('Authors saved');
  await ui.set('#profileSelect', settings.defaultProfileId);
  await ui.status('Profile selected');
  assert.equal(ui.$('.author-summary').getAttribute('aria-expanded'), 'false');
  assert.match(ui.$('.author-summary').textContent, /Test Author/);
  await ui.openAuthor();
  assert.equal(ui.$('.author-email').value, author.email);
  await ui.click('#renameProfile');
  await ui.set('#profileName', 'Main team');
  await ui.click('#submitProfileName');
  await ui.status('Profile renamed');
  assert.equal(ui.$('#profileSelect option:checked').textContent, 'Main team');
  await ui.click('#deleteProfile');
  assert.equal(ui.window.document.activeElement.id, 'confirmDeleteProfile');
  await ui.click('#confirmDeleteProfile');
  await ui.status('Profile deleted');
  assert.equal(ui.$('#profileSelect').value, secondId);
  await ui.openAuthor();
  assert.equal(ui.$('.author-email').value, 'second@example.test');
  ui.window.close();
  const reopened = await openPopup(storage);
  assert.equal(reopened.$('#profileSelect').value, secondId);
  await reopened.openAuthor();
  assert.equal(reopened.$('.author-email').value, 'second@example.test');
});

test('inline validation, focus, storage errors, and retry preserve author drafts', async () => {
  const storage = mockStorage();
  storage.fail('get');
  const ui = await openPopup(storage);
  await ui.status('Could not read');
  assert.equal(ui.$('#saveAuthors').disabled, true);
  assert.ok(ui.$('#retryLoad'));
  storage.recover();
  await ui.click('#retryLoad');
  await ui.status('Profile loaded');
  await ui.click('#saveAuthors');
  await ui.status('Email is required');
  const email = ui.$('.author-email');
  assert.equal(email.getAttribute('aria-invalid'), 'true');
  assert.equal(ui.window.document.activeElement, email);
  assert.equal(
    ui.window.document.getElementById(email.getAttribute('aria-describedby'))
      .textContent,
    'Email is required.',
  );
  assert.equal(ui.$(`label[for="${email.id}"]`).textContent, 'Email');
  await ui.fill(author);
  storage.fail('set', 'QUOTA_BYTES quota exceeded');
  await ui.click('#saveAuthors');
  await ui.status('Reduce saved data or wait');
  assert.equal(ui.$('.author-email').value, author.email);
  assert.equal(
    storage.data()[`${settings.profilePrefix}${settings.defaultProfileId}`]
      .authors.length,
    0,
  );
  storage.recover();
  await ui.click('#saveAuthors');
  await ui.status('Authors saved');
  await ui.click('#autoFillAuthors');
  await ui.status('Autofill started');
  assert.equal(ui.messages[0].profile, settings.defaultProfileId);
});

test('switching profiles protects unsaved authors and filling requires a save', async () => {
  const storage = mockStorage();
  const ui = await openPopup(storage);
  await ui.click('#newProfile');
  await ui.set('#profileName', 'Other');
  await ui.click('#submitProfileName');
  await ui.status('Profile created');
  const currentId = ui.$('#profileSelect').value;
  await ui.fill(author);
  assert.equal(ui.$('#autoFillAuthors').disabled, true);
  assert.match(ui.$('.footer-hint').textContent, /Save to keep your changes/);
  assert.equal(ui.messages.length, 0);
  ui.window.confirm = () => false;
  await ui.set('#profileSelect', settings.defaultProfileId);
  assert.equal(ui.$('#profileSelect').value, currentId);
  assert.equal(ui.$('.author-email').value, author.email);
  await ui.click('#renameProfile');
  await ui.set('#profileName', 'Default');
  await ui.click('#submitProfileName');
  await ui.status('already exists');
  assert.match(ui.$('#profileName-error').textContent, /already exists/);
  assert.equal(ui.$('.author-email').value, author.email);
});

test('collapsed author cards retain values; invalid save opens and focuses the affected card', async () => {
  const ui = await openPopup(mockStorage());
  await ui.fill(author);
  await ui.click('#addAuthor');
  assert.equal(ui.window.document.querySelectorAll('.author-card').length, 2);
  assert.equal(ui.$('.author-email').value, '');
  assert.equal(ui.window.document.activeElement, ui.$('.author-email'));
  await ui.fill({ ...author, email: 'TEST@example.test', name: 'Second' });
  await ui.click('.author-card:nth-child(2) .author-summary');
  assert.equal(ui.$('.author-email'), null);
  await ui.click('#saveAuthors');
  await ui.status('Email duplicates author 1');
  const email = ui.$('.author-email');
  assert.equal(email.value, 'TEST@example.test');
  assert.equal(ui.window.document.activeElement, email);
  await ui.set('.author-email', 'second@example.test');
  await ui.click('#saveAuthors');
  await ui.status('Authors saved');
  await ui.openAuthor(0);
  assert.equal(ui.$('.author-email').value, author.email);
  await ui.click('.author-card:nth-child(2) .remove-author');
  assert.equal(ui.window.document.querySelectorAll('.author-card').length, 1);
  assert.equal(ui.window.document.activeElement, ui.$('.author-summary'));
  assert.match(ui.$('.save-state').textContent, /Unsaved changes/);
});

test('loading and saving disable controls until persistence finishes', async () => {
  const storage = mockStorage();
  const originalGet = globalThis.chrome.storage.sync.get;
  let releaseLoad;
  globalThis.chrome.storage.sync.get = (keys, callback) => {
    releaseLoad = () => originalGet(keys, callback);
  };
  const ui = await openPopup(storage, { wait: false });
  assert.match(ui.$('.loading-panel').textContent, /Loading your profiles/);
  assert.equal(ui.$('#saveAuthors').disabled, true);
  releaseLoad();
  globalThis.chrome.storage.sync.get = originalGet;
  await waitFor(() => ui.$('.author-email'));
  await ui.fill(author);
  const originalSet = globalThis.chrome.storage.sync.set;
  let releaseSave;
  globalThis.chrome.storage.sync.set = (values, callback) => {
    releaseSave = () => originalSet(values, callback);
  };
  await ui.click('#saveAuthors');
  await waitFor(() => ui.$('#saveAuthors').textContent.includes('Saving'));
  assert.equal(ui.$('#saveAuthors').disabled, true);
  assert.equal(ui.$('#autoFillAuthors').disabled, true);
  assert.equal(ui.$('main').getAttribute('aria-busy'), 'true');
  assert.equal(ui.$('.author-editor').disabled, true);
  assert.equal(storage.writes(), 1);
  releaseSave();
  await ui.status('Authors saved');
  assert.equal(storage.writes(), 2);
  assert.equal(ui.$('#autoFillAuthors').disabled, false);
});

test('canceling profile changes leaves authors intact and restores keyboard focus', async () => {
  const ui = await openPopup(mockStorage());
  await ui.fill(author);
  await ui.click('#renameProfile');
  assert.equal(ui.window.document.activeElement.id, 'profileName');
  await ui.click('.profile-editor .button-quiet');
  assert.equal(ui.$('.profile-editor'), null);
  assert.equal(ui.window.document.activeElement.id, 'profileSelect');
  assert.equal(ui.$('.author-email').value, author.email);
});
