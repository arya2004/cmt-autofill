import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { Buffer } from 'node:buffer';
import { URL } from 'node:url';
import ts from 'typescript';

const source = await readFile(
  new URL('../src/popup/autofill.ts', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { startAutofill } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);
const cmtUrl =
  'https://cmt3.research.microsoft.com/ICICDSE2027/Track/1/Submission/Create';
const originalChrome = globalThis.chrome;
afterEach(() => {
  globalThis.chrome = originalChrome;
});

function browser({
  ready = true,
  url = cmtUrl,
  injectionFails = false,
  fillFails = false,
} = {}) {
  const messages = [];
  const injections = [];
  globalThis.chrome = {
    tabs: {
      async query() {
        return [{ id: 9, url }];
      },
      async sendMessage(id, message, options) {
        messages.push({ id, message, options });
        if (!ready)
          throw new Error(
            'Could not establish connection. Receiving end does not exist.',
          );
        if (message.action === 'ping') return { ready: true };
        if (fillFails) throw new Error('Tab navigated');
        return { accepted: true };
      },
    },
    scripting: {
      async executeScript(details) {
        injections.push(details);
        if (injectionFails)
          throw new Error('Cannot access contents of the page');
        ready = true;
      },
    },
  };
  return { messages, injections };
}

test('uses an existing receiver without reinjecting', async () => {
  const { messages, injections } = browser();
  await startAutofill('profile1');
  assert.equal(injections.length, 0);
  assert.deepEqual(
    messages.map(({ message }) => message.action),
    ['ping', 'autoFillAuthors'],
  );
  assert.equal(messages[1].message.profile, 'profile1');
  assert.ok(messages.every(({ options }) => options.frameId === 0));
});

test('recovers an already-open tab with no receiver and fills once', async () => {
  const { messages, injections } = browser({ ready: false });
  await startAutofill('profile1');
  assert.deepEqual(injections, [
    { target: { tabId: 9 }, files: ['contentScript.js'] },
  ]);
  assert.deepEqual(
    messages.map(({ message }) => message.action),
    ['ping', 'ping', 'autoFillAuthors'],
  );
});

test('reports denied injection without sending a fill', async () => {
  const { messages } = browser({ ready: false, injectionFails: true });
  await assert.rejects(startAutofill('profile1'), /Refresh the tab/);
  assert.ok(messages.every(({ message }) => message.action === 'ping'));
});

test('rejects non-CMT tabs without injection or messaging', async () => {
  const { messages, injections } = browser({ url: 'https://example.com' });
  await assert.rejects(startAutofill('profile1'), /Open the Microsoft CMT/);
  assert.equal(messages.length + injections.length, 0);
});

test('does not retry a fill after a messaging failure', async () => {
  const { messages } = browser({ fillFails: true });
  await assert.rejects(startAutofill('profile1'), /Refresh the tab/);
  assert.equal(
    messages.filter(({ message }) => message.action === 'autoFillAuthors')
      .length,
    1,
  );
});

test('built content script acknowledges messages and registers only once', async () => {
  const bundle = await readFile(
    new URL('../dist/extension/contentScript.js', import.meta.url),
    'utf8',
  );
  const listeners = [];
  const alerts = [];
  const context = {
    chrome: {
      runtime: {
        onMessage: {
          addListener(fn) {
            listeners.push(fn);
          },
        },
      },
      storage: {
        sync: {
          get(_, cb) {
            cb({});
          },
        },
      },
    },
    alert(message) {
      alerts.push(message);
    },
  };
  runInNewContext(bundle, context);
  runInNewContext(bundle, context);
  assert.equal(listeners.length, 1);
  let response;
  listeners[0]({ action: 'ping' }, {}, (value) => {
    response = value;
  });
  assert.equal(response.ready, true);
  listeners[0](
    { action: 'autoFillAuthors', profile: 'profile1' },
    {},
    (value) => {
      response = value;
    },
  );
  assert.equal(response.accepted, true);
  assert.match(alerts[0], /No authors to fill/);
});
