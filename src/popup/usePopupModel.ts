import { useEffect, useRef, useState } from 'react';
import type { Author, ProfileState } from '../shared/models';
import { normalizeAuthors, validateAuthors } from '../shared/validation';
import {
  createProfile,
  deleteProfile,
  findProfile,
  loadProfiles,
  renameProfile,
  saveAuthors,
  selectProfile,
} from '../storage/profiles';
import { startAutofill } from './autofill';
import { fieldId } from './types';
import type {
  ActionResult,
  AuthorDraft,
  FocusRequest,
  Notice,
  PendingAction,
} from './types';

const newDraft = (): AuthorDraft => ({
  id: crypto.randomUUID(),
  author: { email: '', name: '', surname: '', organization: '', country: '' },
});
const snapshot = (drafts: AuthorDraft[]) =>
  JSON.stringify(drafts.map((draft) => draft.author));

export function usePopupModel() {
  const [state, setState] = useState<ProfileState>();
  const [drafts, setDrafts] = useState<AuthorDraft[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState('[]');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState<PendingAction | null>('load');
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [focusRequest, setFocusRequest] = useState<FocusRequest>();
  const lock = useRef(false);
  const mounted = useRef(true);
  const dirty = snapshot(drafts) !== savedSnapshot;
  const profile = state ? findProfile(state, state.activeProfileId) : undefined;
  const issues = validateAuthors(drafts.map((draft) => draft.author));
  const focus = (target: string) =>
    setFocusRequest((previous) => ({
      target,
      sequence: (previous?.sequence ?? 0) + 1,
    }));

  function applyState(next: ProfileState) {
    const profile = findProfile(next, next.activeProfileId);
    const nextDrafts = profile.authors.length
      ? profile.authors.map((author) => ({
          id: crypto.randomUUID(),
          author: { ...author },
        }))
      : [newDraft()];
    setState(next);
    setDrafts(nextDrafts);
    setSavedSnapshot(snapshot(nextDrafts));
    setExpandedId(profile.authors.length ? null : nextDrafts[0]!.id);
    setSubmitted(false);
    setTouched(new Set());
    setFocusRequest(undefined);
  }

  useEffect(() => {
    let cancelled = false;
    mounted.current = true;
    void loadProfiles()
      .then((next) => {
        if (!cancelled) applyState(next);
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setNotice({
            tone: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Could not load profiles. Please retry.',
          });
      })
      .finally(() => {
        if (!cancelled) setPending(null);
      });
    return () => {
      cancelled = true;
      mounted.current = false;
    };
  }, []);

  async function run(
    action: PendingAction,
    operation: () => Promise<void>,
    message: string,
  ): Promise<ActionResult> {
    if (lock.current || pending === 'load')
      return { ok: false, error: 'Please wait for the current operation.' };
    lock.current = true;
    setPending(action);
    setNotice(null);
    try {
      await operation();
      if (mounted.current) setNotice({ tone: 'success', message });
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please retry.';
      if (mounted.current) setNotice({ tone: 'error', message });
      return { ok: false, error: message };
    } finally {
      lock.current = false;
      if (mounted.current) setPending(null);
    }
  }

  function validate() {
    setSubmitted(true);
    if (!issues.length) return true;
    const first = issues[0]!;
    const draft = drafts[first.authorIndex]!;
    setExpandedId(draft.id);
    focus(fieldId(draft.id, first.field));
    setNotice({
      tone: 'error',
      message: `Author ${first.authorIndex + 1}: ${first.message}${issues.length > 1 ? ' Check the other highlighted fields.' : ''}`,
    });
    return false;
  }

  function updateAuthor(id: string, field: keyof Author, value: string) {
    setDrafts((previous) =>
      previous.map((draft) =>
        draft.id === id
          ? { ...draft, author: { ...draft.author, [field]: value } }
          : draft,
      ),
    );
    setNotice(null);
  }
  function addAuthor() {
    const draft = newDraft();
    setDrafts((previous) => [...previous, draft]);
    setExpandedId(draft.id);
    setSubmitted(false);
    setNotice(null);
    focus(fieldId(draft.id, 'email'));
  }
  function removeAuthor(id: string) {
    if (drafts.length < 2) return;
    const index = drafts.findIndex((draft) => draft.id === id);
    const next = drafts.filter((draft) => draft.id !== id);
    setDrafts(next);
    if (expandedId === id) setExpandedId(null);
    setNotice(null);
    focus(`summary-${next[Math.min(index, next.length - 1)]!.id}`);
  }
  const canLeave = () => !dirty || confirm('Discard unsaved author changes?');

  async function save() {
    if (!state || pending || !validate()) return;
    const authors = normalizeAuthors(drafts.map((draft) => draft.author));
    await run(
      'save',
      async () => {
        await saveAuthors(state.activeProfileId, authors);
        if (!mounted.current) return;
        setState(
          (previous) =>
            previous && {
              ...previous,
              profiles: previous.profiles.map((profile) =>
                profile.id === state.activeProfileId
                  ? { ...profile, authors }
                  : profile,
              ),
            },
        );
        const savedDrafts = drafts.map((draft, index) => ({
          ...draft,
          author: authors[index]!,
        }));
        setDrafts(savedDrafts);
        setSavedSnapshot(snapshot(savedDrafts));
        setSubmitted(false);
        setTouched(new Set());
      },
      'Authors saved. Ready to fill the CMT page.',
    );
  }
  async function fill() {
    if (!state || pending || !validate()) return;
    if (dirty || !profile?.authors.length) {
      setNotice({
        tone: 'info',
        message: 'Save author changes before filling the CMT page.',
      });
      return;
    }
    await run(
      'fill',
      () => startAutofill(state.activeProfileId),
      'Autofill started on the CMT page.',
    );
  }
  async function changeProfile(id: string) {
    if (!state || pending || id === state.activeProfileId || !canLeave())
      return;
    await run(
      'select',
      async () => {
        const next = await selectProfile(id);
        if (mounted.current) applyState(next);
      },
      'Profile selected.',
    );
  }
  async function create(name: string): Promise<ActionResult> {
    if (!canLeave())
      return {
        ok: false,
        error:
          'Profile creation cancelled. Your author changes are still here.',
      };
    return run(
      'create',
      async () => {
        const next = await createProfile(name);
        if (mounted.current) applyState(next);
      },
      'Profile created. Add and save authors.',
    );
  }
  async function rename(name: string): Promise<ActionResult> {
    if (!state) return { ok: false, error: 'Load your profiles first.' };
    return run(
      'rename',
      async () => {
        const next = await renameProfile(state.activeProfileId, name);
        if (mounted.current) setState(next);
      },
      'Profile renamed.',
    );
  }
  async function remove(): Promise<ActionResult> {
    if (!state) return { ok: false, error: 'Load your profiles first.' };
    return run(
      'delete',
      async () => {
        const next = await deleteProfile(state.activeProfileId);
        if (mounted.current) applyState(next);
      },
      'Profile deleted.',
    );
  }
  async function retry() {
    return run(
      'load',
      async () => {
        const next = await loadProfiles();
        if (mounted.current) applyState(next);
      },
      'Profile loaded.',
    );
  }

  return {
    state,
    profile,
    drafts,
    expandedId,
    setExpandedId,
    notice,
    pending,
    dirty,
    focusRequest,
    issues: issues.filter(
      (issue) =>
        submitted ||
        touched.has(fieldId(drafts[issue.authorIndex]!.id, issue.field)),
    ),
    touch: (id: string, field: keyof Author) =>
      setTouched((previous) => new Set(previous).add(fieldId(id, field))),
    updateAuthor,
    addAuthor,
    removeAuthor,
    save,
    fill,
    changeProfile,
    create,
    rename,
    remove,
    retry,
  };
}
