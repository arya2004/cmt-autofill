import type { Notice } from '../types';
import { Icon } from './Icon';

export function StatusMessage({
  notice,
  onRetry,
}: {
  notice: Notice | null;
  onRetry?: () => void;
}) {
  return (
    <div
      id="status"
      className={notice ? `notice notice-${notice.tone}` : 'notice-empty'}
      role={notice?.tone === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
    >
      {notice && (
        <>
          <Icon name={notice.tone === 'error' ? 'warning' : 'check'} />
          <div>
            <p title={notice.message}>{notice.message}</p>
            {onRetry && (
              <button
                id="retryLoad"
                type="button"
                className="text-button"
                onClick={onRetry}
              >
                Retry loading profiles
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
