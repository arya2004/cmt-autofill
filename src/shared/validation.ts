import { countries } from '../config/countries';
import { settings } from '../config/settings';
import type { Author, ValidationIssue } from './models';

export const authorFields = [
  'email',
  'name',
  'surname',
  'organization',
  'country',
] as const;
const countryCodes = new Set<string>(countries.map(({ code }) => code));
const fieldNames: Record<keyof Author, string> = {
  email: 'Email',
  name: 'First name',
  surname: 'Last name',
  organization: 'Organization',
  country: 'Country',
};

export function normalizeAuthors(authors: Author[]): Author[] {
  return authors.map(
    (author) =>
      Object.fromEntries(
        authorFields.map((field) => [field, author[field].trim()]),
      ) as unknown as Author,
  );
}

export function validateAuthors(authors: Author[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const emails = new Map<string, number>();
  authors.forEach((author, authorIndex) => {
    for (const field of authorFields) {
      const value = author[field].trim();
      if (!value)
        issues.push({
          authorIndex,
          field,
          message: `${fieldNames[field]} is required.`,
        });
      else if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        issues.push({
          authorIndex,
          field,
          message: 'Enter a valid email address.',
        });
      } else if (field === 'country' && !countryCodes.has(value)) {
        issues.push({
          authorIndex,
          field,
          message: 'Choose a supported country.',
        });
      }
    }
    const email = author.email.trim().toLowerCase();
    if (email) {
      const previous = emails.get(email);
      if (previous !== undefined)
        issues.push({
          authorIndex,
          field: 'email',
          message: `Email duplicates author ${previous + 1}.`,
        });
      else emails.set(email, authorIndex);
    }
  });
  return issues;
}

export function requireValidAuthors(authors: Author[]): Author[] {
  if (!authors.length)
    throw new Error('Add at least one author before saving or filling.');
  if (authors.length > settings.maxAuthors)
    throw new Error('Maximum of five authors.');
  const issues = validateAuthors(authors);
  if (issues.length) {
    throw new Error(
      issues
        .map((issue) => `Author ${issue.authorIndex + 1}: ${issue.message}`)
        .join('\n'),
    );
  }
  return normalizeAuthors(authors);
}
