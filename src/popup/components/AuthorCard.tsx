import { useEffect, useRef } from 'react';
import { countries } from '../../config/countries';
import { authorFields } from '../../shared/validation';
import type { Author, ValidationIssue } from '../../shared/models';
import { fieldId } from '../types';
import type { AuthorDraft, FocusRequest } from '../types';
import { FormField } from './FormField';
import { Icon } from './Icon';

const labels: Record<keyof Author, string> = {
  email: 'Email',
  name: 'First name',
  surname: 'Last name',
  organization: 'Organization',
  country: 'Country',
};
interface Props {
  draft: AuthorDraft;
  index: number;
  expanded: boolean;
  disabled: boolean;
  canRemove: boolean;
  issues: ValidationIssue[];
  focusRequest?: FocusRequest;
  onToggle: () => void;
  onRemove: () => void;
  onChange: (field: keyof Author, value: string) => void;
  onBlur: (field: keyof Author) => void;
}

export function AuthorCard({
  draft,
  index,
  expanded,
  disabled,
  canRemove,
  issues,
  focusRequest,
  onToggle,
  onRemove,
  onChange,
  onBlur,
}: Props) {
  const summary = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (focusRequest?.target === `summary-${draft.id}`)
      summary.current?.focus();
  }, [focusRequest, draft.id]);
  const { author } = draft;
  const fullName = [author.name.trim(), author.surname.trim()]
    .filter(Boolean)
    .join(' ');
  const initials = [author.name, author.surname]
    .map((part) => part.trim().slice(0, 1))
    .join('');
  return (
    <section
      className={`author-card${expanded ? ' is-open' : ''}${issues.length ? ' has-errors' : ''}`}
      aria-label={`Author ${index + 1}`}
    >
      <div className="author-card-header">
        <button
          type="button"
          ref={summary}
          className="author-summary"
          aria-expanded={expanded}
          aria-controls={`fields-${draft.id}`}
          onClick={onToggle}
          disabled={disabled}
        >
          <span className="author-avatar" aria-hidden="true">
            {initials || String(index + 1).padStart(2, '0')}
          </span>
          <span className="author-heading">
            <span className="eyebrow">
              Author {String(index + 1).padStart(2, '0')}
            </span>
            <span className="author-name-text">{fullName || 'New author'}</span>
            <span className="author-subtitle">
              {author.email || 'Add their contact details'}
            </span>
          </span>
          {issues.length > 0 && (
            <span className="error-dot" aria-label="Needs attention" />
          )}
          <Icon name="chevron" className="expand-icon" />
        </button>
        <button
          type="button"
          className="icon-button remove-author"
          aria-label={`Remove author ${index + 1}`}
          title={canRemove ? 'Remove author' : 'Keep at least one author'}
          onClick={onRemove}
          disabled={disabled || !canRemove}
        >
          <Icon name="trash" />
        </button>
      </div>
      <div id={`fields-${draft.id}`} hidden={!expanded}>
        {expanded && (
          <fieldset className="author-editor" disabled={disabled}>
            <legend className="sr-only">Author {index + 1} details</legend>
            <div className="field-grid">
              {authorFields.map((field) => (
                <div
                  key={field}
                  className={
                    field === 'name' || field === 'surname' ? '' : 'full-width'
                  }
                >
                  <FormField
                    id={fieldId(draft.id, field)}
                    label={labels[field]}
                    value={author[field]}
                    type={field === 'email' ? 'email' : 'text'}
                    className={`author-${field}`}
                    placeholder={
                      field === 'email'
                        ? 'name@institution.edu'
                        : field === 'organization'
                          ? 'University or organization'
                          : undefined
                    }
                    error={
                      issues.find((issue) => issue.field === field)?.message
                    }
                    onChange={(value) => onChange(field, value)}
                    onBlur={() => onBlur(field)}
                    focusRequest={
                      focusRequest?.target === fieldId(draft.id, field)
                        ? focusRequest.sequence
                        : undefined
                    }
                  >
                    {field === 'country' ? (
                      <>
                        <option value="">Select a country</option>
                        {author.country &&
                          !countries.some(
                            (country) => country.code === author.country,
                          ) && (
                            <option value={author.country}>
                              Unsupported ({author.country})
                            </option>
                          )}
                        {countries.map((country, index) => (
                          <option
                            key={`${country.code}-${index}`}
                            value={country.code}
                          >
                            {country.name}
                          </option>
                        ))}
                      </>
                    ) : undefined}
                  </FormField>
                </div>
              ))}
            </div>
          </fieldset>
        )}
      </div>
    </section>
  );
}
