import { settings } from '../config/settings';
import type {
  Author,
  AppSettings,
  Profile,
  ProfileState,
} from '../shared/models';
import {
  authorFields,
  requireValidAuthors,
  validateProfileName,
} from '../shared/validation';
import { readStorage, writeStorage, removeStorage } from './chromeStorage';

export const profileKey = (id: string) => `${settings.profilePrefix}${id}`;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const invalidStorage = () =>
  new Error(
    'Saved profile data is damaged or uses an unsupported version. No data was overwritten. Use a compatible extension version or restore a backup.',
  );

function readAuthors(value: unknown): Author[] {
  if (!Array.isArray(value)) throw invalidStorage();
  return value.map((author: unknown) => {
    if (!isRecord(author)) throw invalidStorage();
    const parsed = {} as Author;
    for (const field of authorFields) {
      const item = author[field];
      if (typeof item === 'string') parsed[field] = item;
      else throw invalidStorage();
    }
    return parsed;
  });
}

function decodeState(raw: Record<string, unknown>): ProfileState {
  const saved = raw[settings.settingsKey];
  if (
    !isRecord(saved) ||
    saved.schemaVersion !== settings.schemaVersion ||
    typeof saved.activeProfileId !== 'string'
  )
    throw invalidStorage();
  const profiles = Object.entries(raw)
    .filter(([key]) => key.startsWith(settings.profilePrefix))
    .map(([key, value]): Profile => {
      if (
        !isRecord(value) ||
        typeof value.id !== 'string' ||
        !value.id ||
        key !== profileKey(value.id) ||
        typeof value.name !== 'string' ||
        !value.name.trim()
      )
        throw invalidStorage();
      return {
        id: value.id,
        name: value.name,
        authors: readAuthors(value.authors),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  if (!profiles.length) throw invalidStorage();
  // A removed active profile (including a synced deletion) selects the first remaining one.
  const activeProfileId = profiles.some(
    (profile) => profile.id === saved.activeProfileId,
  )
    ? saved.activeProfileId
    : profiles[0]!.id;
  return { schemaVersion: settings.schemaVersion, activeProfileId, profiles };
}

export async function loadProfiles(): Promise<ProfileState> {
  const raw = await readStorage();
  if (raw[settings.settingsKey] !== undefined) return decodeState(raw);
  // Do not replace orphaned versioned records if settings have been damaged.
  if (Object.keys(raw).some((key) => key.startsWith(settings.profilePrefix)))
    throw invalidStorage();
  // V2 starts fresh; legacy profile keys are not read or imported.
  const profiles: Profile[] = [
    {
      id: settings.defaultProfileId,
      name: settings.defaultProfileName,
      authors: [],
    },
  ];
  const appSettings: AppSettings = {
    schemaVersion: settings.schemaVersion,
    activeProfileId: settings.defaultProfileId,
  };
  const values: Record<string, unknown> = {
    [settings.settingsKey]: appSettings,
  };
  profiles.forEach((profile) => {
    values[profileKey(profile.id)] = profile;
  });
  // Publish the v2 settings and default profile together.
  await writeStorage(values);
  return { ...appSettings, profiles };
}

export function findProfile(state: ProfileState, id: string): Profile {
  const profile = state.profiles.find((profile) => profile.id === id);
  if (!profile)
    throw new Error(
      'This profile no longer exists. Reload the popup and choose another profile.',
    );
  return profile;
}

export async function createProfile(name: string): Promise<ProfileState> {
  const state = await loadProfiles();
  const profile: Profile = {
    id: crypto.randomUUID(),
    name: validateProfileName(
      name,
      state.profiles.map((profile) => profile.name),
    ),
    authors: [],
  };
  await writeStorage({
    [profileKey(profile.id)]: profile,
    [settings.settingsKey]: {
      schemaVersion: settings.schemaVersion,
      activeProfileId: profile.id,
    },
  });
  return {
    ...state,
    activeProfileId: profile.id,
    profiles: [...state.profiles, profile],
  };
}

export async function renameProfile(
  id: string,
  name: string,
): Promise<ProfileState> {
  const state = await loadProfiles();
  const profile = findProfile(state, id);
  const renamed = {
    ...profile,
    name: validateProfileName(
      name,
      state.profiles.map((profile) => profile.name),
      profile.name,
    ),
  };
  await writeStorage({ [profileKey(id)]: renamed });
  return {
    ...state,
    profiles: state.profiles.map((profile) =>
      profile.id === id ? renamed : profile,
    ),
  };
}

export async function selectProfile(id: string): Promise<ProfileState> {
  const state = await loadProfiles();
  findProfile(state, id);
  await writeStorage({
    [settings.settingsKey]: {
      schemaVersion: settings.schemaVersion,
      activeProfileId: id,
    },
  });
  return { ...state, activeProfileId: id };
}

export async function deleteProfile(id: string): Promise<ProfileState> {
  const state = await loadProfiles();
  findProfile(state, id);
  if (state.profiles.length === 1)
    throw new Error(
      'Keep at least one profile. Create another profile before deleting this one.',
    );
  // Removing one record is atomic; a stale active id is resolved deterministically on load.
  await removeStorage(profileKey(id));
  const profiles = state.profiles.filter((profile) => profile.id !== id);
  return {
    ...state,
    profiles,
    activeProfileId:
      state.activeProfileId === id ? profiles[0]!.id : state.activeProfileId,
  };
}

export async function saveAuthors(
  id: string,
  authors: Author[],
): Promise<void> {
  const validated = requireValidAuthors(authors);
  const state = await loadProfiles();
  const profile = findProfile(state, id);
  await writeStorage({ [profileKey(id)]: { ...profile, authors: validated } });
}

export async function loadAuthors(id?: string): Promise<Author[]> {
  const state = await loadProfiles();
  return findProfile(state, id ?? state.activeProfileId).authors;
}
