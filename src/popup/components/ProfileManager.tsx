import { useEffect, useRef, useState } from 'react';
import { settings } from '../../config/settings';
import type { ProfileState } from '../../shared/models';
import type { ActionResult, PendingAction } from '../types';
import { FormField } from './FormField';
import { Icon } from './Icon';

type Mode = 'create' | 'rename' | 'delete' | null;
interface Props {
  state: ProfileState;
  pending: PendingAction | null;
  onSelect: (id: string) => Promise<void>;
  onCreate: (name: string) => Promise<ActionResult>;
  onRename: (name: string) => Promise<ActionResult>;
  onDelete: () => Promise<ActionResult>;
}

export function ProfileManager({
  state,
  pending,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const select = useRef<HTMLSelectElement>(null);
  const restoreFocus = useRef(false);
  const deleteButton = useRef<HTMLButtonElement>(null);
  const disabled = pending !== null;
  const active = state.profiles.find(
    (profile) => profile.id === state.activeProfileId,
  )!;
  useEffect(() => {
    if (mode === 'delete') deleteButton.current?.focus();
    if (mode === null && !pending && restoreFocus.current) {
      select.current?.focus();
      restoreFocus.current = false;
    }
  }, [mode, pending]);

  function open(next: Mode) {
    setMode(next);
    setError(undefined);
    setName(next === 'rename' ? active.name : '');
  }
  function close() {
    restoreFocus.current = true;
    setMode(null);
    setError(undefined);
  }
  async function submit() {
    const result =
      mode === 'create' ? await onCreate(name) : await onRename(name);
    if (result.ok) close();
    else setError(result.error);
  }
  async function remove() {
    const result = await onDelete();
    if (result.ok) close();
    else setError(result.error);
  }

  return (
    <section className="profile-panel" aria-label="Profiles">
      <div className="section-label">
        <label htmlFor="profileSelect">Active profile</label>
        <span>
          {state.profiles.length}{' '}
          {state.profiles.length === 1 ? 'profile' : 'profiles'}
        </span>
      </div>
      <div className="profile-row">
        <select
          id="profileSelect"
          ref={select}
          className="field-control"
          value={state.activeProfileId}
          disabled={disabled || mode !== null}
          onChange={(event) => {
            void onSelect(event.target.value);
          }}
        >
          {state.profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
        <button
          id="newProfile"
          type="button"
          className="button button-secondary"
          disabled={disabled || mode !== null}
          onClick={() => open('create')}
        >
          <Icon name="plus" />
          New
        </button>
      </div>
      {!mode && (
        <div className="profile-tools">
          <span>Keep a separate list for each team.</span>
          <button
            id="renameProfile"
            type="button"
            className="text-button"
            disabled={disabled}
            onClick={() => open('rename')}
          >
            <Icon name="edit" />
            Rename
          </button>
          <button
            id="deleteProfile"
            type="button"
            className="text-button danger"
            disabled={disabled || state.profiles.length < 2}
            title={
              state.profiles.length < 2
                ? 'Keep at least one profile'
                : 'Delete this profile'
            }
            onClick={() => open('delete')}
          >
            <Icon name="trash" />
            <span className="sr-only">Delete profile</span>
          </button>
        </div>
      )}
      {(mode === 'create' || mode === 'rename') && (
        <form
          className="profile-editor"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <fieldset disabled={disabled}>
            <FormField
              id="profileName"
              label={mode === 'create' ? 'New profile name' : 'Profile name'}
              value={name}
              onChange={(value) => {
                setName(value);
                setError(undefined);
              }}
              maxLength={settings.profileNameMaxLength}
              placeholder="e.g. Research team"
              error={error}
              focusRequest={mode === 'create' ? 1 : 2}
            />
            <div className="inline-actions">
              <button
                type="button"
                className="button button-quiet"
                onClick={close}
              >
                Cancel
              </button>
              <button
                id="submitProfileName"
                type="submit"
                className="button button-primary"
              >
                {pending === mode
                  ? 'Saving…'
                  : mode === 'create'
                    ? 'Create profile'
                    : 'Save name'}
              </button>
            </div>
          </fieldset>
        </form>
      )}
      {mode === 'delete' && (
        <div
          className="delete-confirm"
          role="group"
          aria-label="Confirm profile deletion"
        >
          <p>
            Delete <strong>{active.name}</strong> and its saved authors?
          </p>
          <p className="muted">The other profiles will stay available.</p>
          {error && <p className="field-error">{error}</p>}
          <div className="inline-actions">
            <button
              type="button"
              className="button button-quiet"
              disabled={disabled}
              onClick={close}
            >
              Cancel
            </button>
            <button
              id="confirmDeleteProfile"
              type="button"
              ref={deleteButton}
              className="button button-danger"
              disabled={disabled}
              onClick={() => {
                void remove();
              }}
            >
              {pending === 'delete' ? 'Deleting…' : 'Delete profile'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
