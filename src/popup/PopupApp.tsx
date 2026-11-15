import { settings } from '../config/settings';
import { usePopupModel } from './usePopupModel';
import { AuthorCard } from './components/AuthorCard';
import { Icon } from './components/Icon';
import { ProfileManager } from './components/ProfileManager';
import { StatusMessage } from './components/StatusMessage';

export function PopupApp() {
  const model = usePopupModel();
  const busy = model.pending !== null;
  const savedCount = model.profile?.authors.length ?? 0;
  return (
    <div className="popup-shell">
      <main className="popup-content" aria-busy={busy}>
        {model.state ? (
          <>
            <ProfileManager
              state={model.state}
              pending={model.pending}
              onSelect={model.changeProfile}
              onCreate={model.create}
              onDelete={model.remove}
            />
            <form
              id="authorForm"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void model.save();
              }}
            >
              <div className="authors-toolbar">
                <span>
                  Authors{' '}
                  <span className="count-badge">
                    {model.drafts.length} / {settings.maxAuthors}
                  </span>
                </span>
                <button
                  id="addAuthor"
                  type="button"
                  className="text-button"
                  disabled={busy || model.drafts.length >= settings.maxAuthors}
                  onClick={model.addAuthor}
                  aria-label="Add author"
                >
                  <Icon name="plus" />
                  Add
                </button>
              </div>
              <div className="author-list">
                {model.drafts.map((draft, index) => (
                  <AuthorCard
                    key={draft.id}
                    draft={draft}
                    index={index}
                    expanded={model.expandedId === draft.id}
                    disabled={busy}
                    canRemove={model.drafts.length > 1}
                    issues={model.issues.filter(
                      (issue) => issue.authorIndex === index,
                    )}
                    focusRequest={model.focusRequest}
                    onToggle={() =>
                      model.setExpandedId(
                        model.expandedId === draft.id ? null : draft.id,
                      )
                    }
                    onRemove={() => model.removeAuthor(draft.id)}
                    onChange={(field, value) =>
                      model.updateAuthor(draft.id, field, value)
                    }
                    onBlur={(field) => model.touch(draft.id, field)}
                  />
                ))}
              </div>
            </form>
          </>
        ) : (
          <div className="loading-panel">
            {busy ? (
              <>
                <span className="spinner" />
                <p role="status">Loading your profiles…</p>
              </>
            ) : (
              'Unable to load profiles'
            )}
          </div>
        )}
      </main>
      <footer className="action-bar">
        <div className="feedback-row">
          <span className="save-state">
            <span className={`state-dot${model.dirty ? ' is-unsaved' : ''}`} />
            {model.dirty
              ? 'Unsaved changes'
              : savedCount
                ? 'All changes saved'
                : 'Ready to edit'}
          </span>
          <StatusMessage
            notice={model.notice}
            onRetry={
              !model.state && !busy
                ? () => {
                    void model.retry();
                  }
                : undefined
            }
          />
        </div>
        <div className="footer-buttons">
          <button
            id="saveAuthors"
            type="submit"
            form="authorForm"
            className="button button-secondary"
            disabled={busy || !model.state || (!model.dirty && savedCount > 0)}
          >
            <Icon name="check" />
            {model.pending === 'save' ? 'Saving…' : 'Save'}
          </button>
          <button
            id="autoFillAuthors"
            type="button"
            className="button button-primary"
            disabled={busy || !model.state || model.dirty || !savedCount}
            onClick={() => {
              void model.fill();
            }}
          >
            {model.pending === 'fill' ? 'Connecting…' : 'Fill authors'}
            <Icon name="arrow" />
          </button>
        </div>
      </footer>
    </div>
  );
}
