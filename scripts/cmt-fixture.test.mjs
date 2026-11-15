import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { build } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const result = await build({
  configFile: false,
  logLevel: 'silent',
  build: {
    write: false,
    lib: {
      entry: fileURLToPath(
        new URL('../src/cmt/fillAuthors.ts', import.meta.url),
      ),
      name: 'Fixture',
      formats: ['iife'],
    },
  },
});
const code = (Array.isArray(result) ? result[0] : result).output[0].code;
const author = {
  email: 'alex@example.test',
  name: 'Alex',
  surname: 'Lee',
  organization: 'Example',
  country: 'IN',
};

async function fixture({
  delay = 0,
  missingSubmit = false,
  reject = false,
  stopAfterFirst = false,
  missingEmail = false,
} = {}) {
  const dom = new JSDOM(
    '<button data-bind="click: showDialog(true)">Add author</button>',
    { runScripts: 'outside-only' },
  );
  const { window } = dom;
  const tasks = [];
  const alerts = [];
  const accepted = [];
  let clock = 0;
  window.console.log = () => {};
  window.alert = (message) => alerts.push(message);
  window.setTimeout = (fn, ms) => tasks.push({ fn, time: clock + ms });
  window.document.querySelector('button').onclick = () => {
    window.setTimeout(() => {
      if (window.document.querySelector('form')) return;
      const form = window.document.createElement('form');
      form.dataset.bind = 'submit: function () { $parent.addAuthor($data); }';
      const keys = missingEmail
        ? ['firstName', 'lastName', 'organization']
        : ['email', 'firstName', 'lastName', 'organization'];
      form.innerHTML =
        keys.map((key) => `<input data-bind="value: ${key}">`).join('') +
        '<select data-bind="value: countryCode"><option value="IN">India</option></select>' +
        (missingSubmit ? '' : '<button type="submit">Add</button>');
      form.onsubmit = (event) => {
        event.preventDefault();
        if (reject || missingEmail) return;
        accepted.push(
          [...form.querySelectorAll('input,select')].map(
            (input) => input.value,
          ),
        );
        form.remove();
        if (stopAfterFirst) window.document.querySelector('button').remove();
      };
      window.document.body.append(form);
    }, delay);
  };
  window.eval(code + '\nwindow.fill = Fixture.fillAuthorsSequentially;');
  window.fill([author, { ...author, email: 'sam@example.test' }]);
  for (let i = 0; i < 100; i++) {
    // Drain promise continuations between virtual timer callbacks.
    for (let j = 0; j < 10; j++) await Promise.resolve();
    if (!tasks.length) break;
    tasks.sort((a, b) => a.time - b.time);
    const task = tasks.shift();
    clock = task.time;
    task.fn();
  }
  dom.window.close();
  return { alerts, accepted };
}

test('CMT fixture fills two authors in order with all five values', async () => {
  const { accepted, alerts } = await fixture();
  assert.deepEqual(accepted, [
    Object.values(author),
    Object.values({ ...author, email: 'sam@example.test' }),
  ]);
  assert.match(alerts[0], /All authors/);
});
test('delayed dialogs expose the existing fixed-delay limitation', async () => {
  const { accepted, alerts } = await fixture({ delay: 50 });
  assert.equal(accepted.length, 0);
  assert.match(alerts[0], /form not found/);
});
test('missing submit control stops filling', async () => {
  const { accepted, alerts } = await fixture({ missingSubmit: true });
  assert.equal(accepted.length, 0);
  assert.match(alerts[0], /Submit button not found/);
});
test('partial completion preserves the first added author', async () => {
  const { accepted, alerts } = await fixture({ stopAfterFirst: true });
  assert.equal(accepted.length, 1);
  assert.match(alerts[0], /Add button not found/);
});
for (const options of [{ reject: true }, { missingEmail: true }]) {
  test(`rejected/missing-field fixture documents lack of acceptance checks: ${JSON.stringify(options)}`, async () => {
    const { accepted, alerts } = await fixture(options);
    assert.equal(accepted.length, 0);
    assert.match(
      alerts[0],
      /All authors/,
      'Legacy completion alert does not prove CMT acceptance',
    );
  });
}
