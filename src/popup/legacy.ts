import $ from 'jquery';
import { startAutofill } from './autofill';
import { countries } from '../config/countries';
import type { Author, ProfileState } from '../shared/models';
import {
  authorFields,
  requireValidAuthors,
  validateAuthors,
} from '../shared/validation';
import {
  createProfile,
  deleteProfile,
  findProfile,
  loadProfiles,
  renameProfile,
  saveAuthors,
  selectProfile,
} from '../storage/profiles';

// Temporary bridge until the React interface replacement in plan item 3.
export function initializeLegacyPopup() {
  let state: ProfileState | undefined;
  let busy = false;
  let disposed = false;
  let savedDraft = '';

  const status = (message: string, error = false) => {
    if (disposed) return;
    $('#status')
      .text(message)
      .attr('role', error ? 'alert' : 'status');
  };
  const controls =
    '#profileControls input, #profileControls select, #profileControls button, #authorForm input, #authorForm select, #authorForm button, #autoFillAuthors';

  function collectAuthors(): Author[] {
    return $('.author')
      .toArray()
      .map((element) => {
        const author = {} as Author;
        for (const field of authorFields)
          author[field] = String(
            $(element).find(`.author-${field}`).val() ?? '',
          );
        return author;
      });
  }
  const dirty = () => JSON.stringify(collectAuthors()) !== savedDraft;
  const canLeave = () => !dirty() || confirm('Discard unsaved author changes?');

  function addAuthor(author: Partial<Author> = {}) {
    const template =
      document.querySelector<HTMLTemplateElement>('#authorTemplate')!;
    const fragment = document.importNode(template.content, true);
    const select =
      fragment.querySelector<HTMLSelectElement>('.author-country')!;
    select.add(new Option('Select...', ''));
    countries.forEach((country) =>
      select.add(new Option(country.name, country.code)),
    );
    // Keep unsupported stored values visible so validation can explain the problem.
    if (
      author.country &&
      !countries.some((country) => country.code === author.country)
    )
      select.add(new Option(`Unsupported (${author.country})`, author.country));
    for (const field of authorFields)
      $(fragment)
        .find(`.author-${field}`)
        .val(author[field] ?? '');
    $('#authorFields').append(fragment);
    updateAuthorNumbers();
  }

  function updateAuthorNumbers() {
    $('.author').each(function (index) {
      $(this)
        .find('.author-number')
        .text(index + 1);
      for (const field of authorFields) {
        const input = $(this).find(`.author-${field}`);
        const id = `author-${index}-${field}`;
        input.attr('id', id);
        input.prev('label').attr('for', id);
      }
    });
  }

  function renderProfiles() {
    if (!state || disposed) return;
    const select = document.querySelector<HTMLSelectElement>('#profileSelect')!;
    select.replaceChildren();
    state.profiles.forEach((profile) =>
      select.add(new Option(profile.name, profile.id)),
    );
    select.value = state.activeProfileId;
    $('#profileName').val(findProfile(state, state.activeProfileId).name);
  }

  function renderAuthors() {
    if (!state || disposed) return;
    $('#authorFields').empty();
    const authors = findProfile(state, state.activeProfileId).authors;
    if (authors.length) authors.forEach(addAuthor);
    else addAuthor();
    savedDraft = JSON.stringify(collectAuthors());
  }

  async function run(operation: () => Promise<void>) {
    if (busy || disposed) return;
    busy = true;
    $(controls).prop('disabled', true);
    $('#retryLoad').prop('disabled', true);
    try {
      await operation();
    } catch (error) {
      status(
        error instanceof Error
          ? error.message
          : 'Could not update profiles. Please retry.',
        true,
      );
      if (state && !disposed) $('#profileSelect').val(state.activeProfileId);
    } finally {
      busy = false;
      if (!disposed) {
        $(controls).prop('disabled', !state);
        $('#retryLoad').prop('disabled', false);
      }
    }
  }

  function showValidation(authors: Author[]) {
    $('.author [aria-invalid]').removeAttr('aria-invalid');
    const issues = validateAuthors(authors);
    issues.forEach((issue) =>
      $('.author')
        .eq(issue.authorIndex)
        .find(`.author-${issue.field}`)
        .attr('aria-invalid', 'true'),
    );
    if (issues[0])
      $('.author')
        .eq(issues[0].authorIndex)
        .find(`.author-${issues[0].field}`)
        .trigger('focus');
    return requireValidAuthors(authors);
  }

  async function initialize() {
    status('Loading profiles…');
    $('#retryLoad').prop('hidden', true);
    try {
      state = await loadProfiles();
      renderProfiles();
      renderAuthors();
      status('Profile loaded.');
    } catch (error) {
      if (!disposed) $('#retryLoad').prop('hidden', false);
      throw error;
    }
  }

  $('#retryLoad').on('click', () => {
    void run(initialize);
  });
  $('#authorForm').on('submit', (event) => event.preventDefault());
  $('#addAuthor').on('click', () => {
    addAuthor();
    status('Unsaved author changes.');
  });
  $('#authorFields').on('input change', 'input, select', () =>
    status(dirty() ? 'Unsaved author changes.' : 'All author changes saved.'),
  );
  $('#authorFields').on('click', '.remove-author', function () {
    if ($('.author').length === 1) {
      status('Keep at least one author.', true);
      return;
    }
    $(this).closest('.author').remove();
    updateAuthorNumbers();
    status('Unsaved author changes.');
  });

  $('#saveAuthors').on('click', () => {
    // Validate before disabling inputs, so invalid fields can receive focus.
    if (!state || busy) return;
    let authors: Author[];
    try {
      authors = showValidation(collectAuthors());
    } catch (error) {
      status((error as Error).message, true);
      return;
    }
    void run(async () => {
      await saveAuthors(state!.activeProfileId, authors);
      findProfile(state!, state!.activeProfileId).authors = authors;
      renderAuthors();
      status('Authors saved.');
    });
  });

  $('#profileSelect').on('change', function () {
    if (!state || busy) return;
    const id = String($(this).val());
    if (!canLeave()) {
      $(this).val(state.activeProfileId);
      return;
    }
    void run(async () => {
      const next = await selectProfile(id);
      state = next;
      renderProfiles();
      renderAuthors();
      status('Profile selected.');
    });
  });
  $('#createProfile').on('click', () => {
    if (!state || busy || !canLeave()) return;
    const name = String($('#profileName').val() ?? '');
    void run(async () => {
      state = await createProfile(name);
      renderProfiles();
      renderAuthors();
      status('Profile created. Add and save authors.');
    });
  });
  $('#renameProfile').on('click', () => {
    if (!state || busy) return;
    const name = String($('#profileName').val() ?? '');
    void run(async () => {
      state = await renameProfile(state!.activeProfileId, name);
      renderProfiles();
      status(
        dirty()
          ? 'Profile renamed. Author changes are still unsaved.'
          : 'Profile renamed.',
      );
    });
  });
  $('#deleteProfile').on('click', () => {
    if (!state || busy) return;
    if (state.profiles.length === 1) {
      status(
        'Keep at least one profile. Create another profile before deleting this one.',
        true,
      );
      return;
    }
    const profile = findProfile(state, state.activeProfileId);
    if (!confirm(`Delete profile "${profile.name}" and its saved authors?`))
      return;
    void run(async () => {
      state = await deleteProfile(profile.id);
      renderProfiles();
      renderAuthors();
      status('Profile deleted.');
    });
  });
  $('#autoFillAuthors').on('click', () => {
    if (!state || busy) return;
    try {
      showValidation(collectAuthors());
    } catch (error) {
      status((error as Error).message, true);
      return;
    }
    if (dirty()) {
      status('Save author changes before filling the CMT page.', true);
      return;
    }
    void run(async () => {
      await startAutofill(state!.activeProfileId);
      status('Autofill started on the CMT page.');
    });
  });

  void run(initialize);
  return () => {
    disposed = true;
    $(
      '#profileControls input, #profileControls select, #profileControls button, #authorForm, #addAuthor, #saveAuthors, #autoFillAuthors, #authorFields, #retryLoad',
    ).off();
  };
}
