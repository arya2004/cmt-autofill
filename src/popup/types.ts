import type { Author } from '../shared/models';

export interface AuthorDraft {
  id: string;
  author: Author;
}

export interface Notice {
  tone: 'info' | 'success' | 'error';
  message: string;
}

export type ActionResult = { ok: true } | { ok: false; error: string };
export type PendingAction =
  'load' | 'save' | 'fill' | 'select' | 'create' | 'delete';
export interface FocusRequest {
  target: string;
  sequence: number;
}
export const fieldId = (id: string, field: keyof Author) =>
  `author-${id}-${field}`;
