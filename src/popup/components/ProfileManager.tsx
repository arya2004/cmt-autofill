import { settings } from '../../config/settings';
import type { ProfileState } from '../../shared/models';
import type { ActionResult, PendingAction } from '../types';
import { Icon } from './Icon';

interface Props {
  state: ProfileState;
  pending: PendingAction | null;
  onSelect: (id: string) => Promise<void>;
  onCreate: () => Promise<ActionResult>;
  onDelete: () => Promise<ActionResult>;
}

export function ProfileManager({
  state,
  pending,
  onSelect,
  onCreate,
  onDelete,
}: Props) {
  const disabled = pending !== null;
  return (
    <header className="profile-panel" aria-label="Profiles">
      <div className="profile-tabs" role="group" aria-label="Choose profile">
        {state.profiles.map((profile, index) => (
          <button
            key={profile.id}
            type="button"
            className="profile-tab"
            data-profile-id={profile.id}
            aria-pressed={profile.id === state.activeProfileId}
            disabled={disabled}
            onClick={() => {
              void onSelect(profile.id);
            }}
          >
            {/^Profile [1-4]$/.test(profile.name)
              ? profile.name
              : `Profile ${index + 1}`}
          </button>
        ))}
        {state.profiles.length < settings.maxProfiles && (
          <button
            id="newProfile"
            type="button"
            className="icon-button"
            aria-label="Add profile"
            title="Add profile"
            disabled={disabled}
            onClick={() => {
              void onCreate();
            }}
          >
            <Icon name="plus" />
          </button>
        )}
      </div>
      <button
        id="deleteProfile"
        type="button"
        className="icon-button"
        aria-label="Delete profile"
        title="Delete profile"
        disabled={disabled || state.profiles.length === 1}
        onClick={() => {
          if (confirm('Delete this profile and its authors?')) void onDelete();
        }}
      >
        <Icon name="trash" />
      </button>
    </header>
  );
}
