import { usePopupModel } from './usePopupModel';
import { AuthorCard } from './components/AuthorCard';
import { Icon } from './components/Icon';
import { ProfileManager } from './components/ProfileManager';
import { StatusMessage } from './components/StatusMessage';

export function PopupApp() {
  const model = usePopupModel();
  const busy = model.pending !== null;
  const savedCount = model.profile?.authors.length ?? 0;
  const saveLabel =
    model.pending === 'save'
      ? 'Saving…'
      : !model.dirty && savedCount > 0
        ? 'Changes saved'
        : 'Save authors';
  return (
    <div className="popup-shell">
      <header className="app-header">
        <span className="brand-mark">
          <Icon name="authors" />
        </span>
        <div>
          <p className="eyebrow">Microsoft CMT</p>
          <h1>Author autofill</h1>
        </div>
        <span className="version-badge">v2</span>
      </header>
      <main className="popup-content" aria-busy={busy}>
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
        {!model.state ? (
          <div className="loading-panel">
            {busy ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <p role="status">Loading your profiles…</p>
              </>
            ) : (
              <>
                <Icon name="authors" />
                <h2>Your profiles couldn’t be loaded</h2>
                <p>Retry above to access your saved authors.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <ProfileManager
              state={model.state}
              pending={model.pending}
              onSelect={model.changeProfile}
              onCreate={model.create}
              onRename={model.rename}
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
                <div>
                  <h2>
                    Authors{' '}
                    <span className="count-badge">{model.drafts.length}</span>
                  </h2>
                  <p>Your team, ready for the next submission.</p>
                </div>
                <button
                  id="addAuthor"
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={model.addAuthor}
                >
                  <Icon name="plus" />
                  Add author
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
        )}
      </main>
      <footer className="action-bar">
        <div className="save-state" aria-live="polite">
          <span className={`state-dot${model.dirty ? ' is-unsaved' : ''}`} />
          {model.dirty
            ? 'Unsaved changes'
            : savedCount
              ? 'All changes saved'
              : 'Not saved yet'}
          <span className="footer-count">
            {model.state
              ? `${model.drafts.length} ${model.drafts.length === 1 ? 'author' : 'authors'}`
              : ''}
          </span>
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
            {saveLabel}
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
        <p className="footer-hint">
          {model.dirty
            ? 'Save to keep your changes and enable autofill.'
            : savedCount
              ? 'Open your CMT submission page, then fill.'
              : 'Add your authors and save to get started.'}
        </p>
      </footer>
    </div>
  );
}
