import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { loadSourceModule, mockStorage } from './test-helpers.mjs';

const profiles = await loadSourceModule('../src/storage/profiles.ts');
const { settings } = await loadSourceModule('../src/config/settings.ts');
const { validateAuthors, requireValidAuthors } = await loadSourceModule(
  '../src/shared/validation.ts',
);
const originalChrome = globalThis.chrome;
afterEach(() => {
  globalThis.chrome = originalChrome;
});
const author = {
  email: 'test@example.test',
  name: 'Test',
  surname: 'Author',
  organization: 'Example',
  country: 'IN',
};

function profileIn(data, id) {
  return data[profiles.profileKey(id)];
}

test('v2 starts empty and ignores older saved data without importing it', async () => {
  const old = {
    profile1: [author],
    'cmtAutofill.settings': { schemaVersion: 1 },
    unrelated: 'keep',
  };
  const storage = mockStorage(old);
  const state = await profiles.loadProfiles();
  assert.equal(state.schemaVersion, 2);
  assert.equal(state.activeProfileId, settings.defaultProfileId);
  assert.deepEqual(
    state.profiles.map((profile) => profile.authors),
    [[]],
  );
  assert.deepEqual(storage.data().profile1, [author]);
  assert.equal(storage.data().unrelated, 'keep');
  await profiles.loadProfiles();
  assert.equal(
    storage.writes(),
    1,
    'opening again must not reset or rewrite v2',
  );
});

test('named profiles keep distinct authors and persist active selection', async () => {
  const storage = mockStorage();
  const original = await profiles.loadProfiles();
  await profiles.saveAuthors(original.activeProfileId, [author]);
  const created = await profiles.createProfile('  Second team  ');
  const secondId = created.activeProfileId;
  assert.notEqual(secondId, original.activeProfileId);
  assert.equal(profiles.findProfile(created, secondId).name, 'Second team');
  await profiles.saveAuthors(secondId, [
    { ...author, email: 'second@example.test' },
  ]);
  await profiles.selectProfile(original.activeProfileId);
  assert.deepEqual(await profiles.loadAuthors(), [author]);
  assert.equal(
    (await profiles.loadAuthors(secondId))[0].email,
    'second@example.test',
  );
  await profiles.renameProfile(secondId, 'Renamed team');
  assert.equal(profileIn(storage.data(), secondId).name, 'Renamed team');
  await profiles.selectProfile(secondId);
  assert.equal((await profiles.loadProfiles()).activeProfileId, secondId);
});

test('deleting the active profile selects a remaining profile on reopen', async () => {
  const storage = mockStorage();
  const initial = await profiles.loadProfiles();
  const created = await profiles.createProfile('Temporary');
  const deletedId = created.activeProfileId;
  const state = await profiles.deleteProfile(deletedId);
  assert.equal(state.activeProfileId, initial.activeProfileId);
  assert.equal(
    (await profiles.loadProfiles()).activeProfileId,
    initial.activeProfileId,
  );
  assert.equal(storage.data()[profiles.profileKey(deletedId)], undefined);
  await assert.rejects(
    profiles.deleteProfile(initial.activeProfileId),
    /Keep at least one profile/,
  );
  await assert.rejects(profiles.loadAuthors(deletedId), /no longer exists/);
});

test('names reject blanks, duplicates ignoring case, and excessive length', async () => {
  mockStorage();
  const state = await profiles.loadProfiles();
  await assert.rejects(profiles.createProfile('  '), /Enter a profile name/);
  await assert.rejects(profiles.createProfile('default'), /already exists/);
  await assert.rejects(profiles.createProfile('x'.repeat(81)), /80 characters/);
  const created = await profiles.createProfile('Other');
  await assert.rejects(
    profiles.renameProfile(created.activeProfileId, 'DEFAULT'),
    /already exists/,
  );
  await profiles.renameProfile(state.activeProfileId, 'default');
});

test('validation identifies required fields, malformed email, unsupported country, and duplicate email', () => {
  const issues = validateAuthors([
    { ...author, email: 'invalid', name: ' ', country: 'ZZ' },
    author,
    { ...author, email: ' TEST@EXAMPLE.TEST ' },
  ]);
  assert.ok(
    issues.some((issue) => issue.authorIndex === 0 && issue.field === 'email'),
  );
  assert.ok(
    issues.some((issue) => issue.authorIndex === 0 && issue.field === 'name'),
  );
  assert.ok(
    issues.some(
      (issue) => issue.authorIndex === 0 && issue.field === 'country',
    ),
  );
  assert.ok(
    issues.some(
      (issue) =>
        issue.authorIndex === 2 && /duplicates author 2/.test(issue.message),
    ),
  );
  for (const field of ['email', 'name', 'surname', 'organization', 'country']) {
    assert.ok(
      validateAuthors([{ ...author, [field]: '' }]).some(
        (issue) => issue.field === field,
      ),
    );
  }
  assert.throws(() => requireValidAuthors([]), /at least one author/);
  assert.deepEqual(
    requireValidAuthors([
      { ...author, email: ' test@example.test ', name: ' Test ' },
    ]),
    [author],
  );
  assert.deepEqual(
    validateAuthors([{ ...author, country: 'UK' }]),
    [],
    'retain the CMT country code',
  );
});

test('invalid saves leave existing authors unchanged', async () => {
  const storage = mockStorage();
  const state = await profiles.loadProfiles();
  await profiles.saveAuthors(state.activeProfileId, [author]);
  const saved = storage.data();
  await assert.rejects(
    profiles.saveAuthors(state.activeProfileId, [{ ...author, email: '' }]),
    /Email is required/,
  );
  await assert.rejects(
    profiles.saveAuthors(state.activeProfileId, [
      author,
      { ...author, email: 'TEST@example.test' },
    ]),
    /duplicates/,
  );
  assert.deepEqual(storage.data(), saved);
});

test('read and initialization failures are actionable and never claim success', async () => {
  const storage = mockStorage();
  storage.fail('get');
  await assert.rejects(
    profiles.loadProfiles(),
    /Could not read saved profiles/,
  );
  assert.deepEqual(storage.data(), {});
  storage.fail('set', 'QUOTA_BYTES_PER_ITEM quota exceeded');
  await assert.rejects(profiles.loadProfiles(), /Reduce saved data or wait/);
  assert.deepEqual(storage.data(), {});
  storage.recover();
  const state = await profiles.loadProfiles();
  assert.equal(state.profiles.length, 1);
});

test('save and delete failures preserve previously stored data and allow retry', async () => {
  const storage = mockStorage();
  const state = await profiles.loadProfiles();
  await profiles.saveAuthors(state.activeProfileId, [author]);
  const saved = storage.data();
  storage.fail('set');
  await assert.rejects(
    profiles.saveAuthors(state.activeProfileId, [{ ...author, name: 'New' }]),
    /Could not save/,
  );
  assert.deepEqual(storage.data(), saved);
  storage.recover();
  const created = await profiles.createProfile('Another');
  const beforeDelete = storage.data();
  storage.fail('remove');
  await assert.rejects(
    profiles.deleteProfile(created.activeProfileId),
    /Could not delete/,
  );
  assert.deepEqual(storage.data(), beforeDelete);
  storage.recover();
  await profiles.deleteProfile(created.activeProfileId);
});

test('damaged and unsupported versioned storage is not overwritten', async () => {
  for (const initial of [
    {
      [settings.settingsKey]: { schemaVersion: 99, activeProfileId: 'default' },
    },
    {
      [profiles.profileKey('default')]: {
        id: 'default',
        name: 'Default',
        authors: [],
      },
    },
    {
      [settings.settingsKey]: { schemaVersion: 2, activeProfileId: 'default' },
      [profiles.profileKey('default')]: {
        id: 'default',
        name: 'Default',
        authors: [{ ...author, email: 2 }],
      },
    },
  ]) {
    const storage = mockStorage(initial);
    await assert.rejects(profiles.loadProfiles(), /No data was overwritten/);
    assert.deepEqual(storage.data(), initial);
    assert.equal(storage.writes(), 0);
  }
});
