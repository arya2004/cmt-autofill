import $ from 'jquery';
import { startAutofill } from './autofill';
import type { Author } from '../shared/models';
import { loadAuthors, saveAuthors } from '../storage/authors';

// Temporary bridge until the React interface replacement in plan item 3.
export function initializeLegacyPopup() {
  let activeProfile = 'profile1';

  if ($('#authorFields').children().length === 0) {
    addAuthor();
  }

  function addAuthor(authorData: Partial<Author> = {}) {
    const template =
      document.querySelector<HTMLTemplateElement>('#authorTemplate')!;
    const authorElement = document.importNode(template.content, true);
    const authorIndex = $('#authorFields').children().length + 1;

    $(authorElement).find('.author-number').text(authorIndex);

    const authorContainer = $(authorElement).find('.author');
    authorContainer.attr('data-author-index', authorIndex);

    if (authorData) {
      $(authorElement)
        .find('.author-email')
        .val(authorData.email || '');
      $(authorElement)
        .find('.author-name')
        .val(authorData.name || '');
      $(authorElement)
        .find('.author-surname')
        .val(authorData.surname || '');
      $(authorElement)
        .find('.author-organization')
        .val(authorData.organization || '');
      $(authorElement)
        .find('.author-country')
        .val(authorData.country || '');
    }

    $('#authorFields').append(authorElement);

    updateAuthorNumbers();
  }

  function updateAuthorNumbers() {
    $('.author').each(function (index) {
      $(this).attr('data-author-index', index + 1);
      $(this)
        .find('.author-number')
        .text(index + 1);
    });
  }

  $('#addAuthor').on('click', function () {
    addAuthor();
  });

  $('#authorFields').on('click', '.remove-author', function () {
    const authorCount = $('.author').length;

    if (authorCount > 1) {
      $(this).closest('.author').remove();
      updateAuthorNumbers();
    } else {
      alert('You must have at least one author.');
    }
  });

  $('#saveAuthors').on('click', function () {
    const authors: Author[] = [];

    $('.author').each(function () {
      authors.push({
        email: String($(this).find('.author-email').val() ?? ''),
        name: String($(this).find('.author-name').val() ?? ''),
        surname: String($(this).find('.author-surname').val() ?? ''),
        organization: String($(this).find('.author-organization').val() ?? ''),
        country: String($(this).find('.author-country').val() ?? ''),
      });
    });

    saveAuthors(activeProfile, authors, function () {
      alert(`Authors saved for ${activeProfile}!`);
    });
  });

  function loadProfile(profile: string) {
    loadAuthors(profile, function (authors) {
      $('#authorFields').empty();

      if (authors && authors.length > 0) {
        authors.forEach(function (author) {
          addAuthor(author);
        });
        console.log(`Loaded ${profile}`);
      } else {
        console.log(`No saved authors found for ${profile}`);
        addAuthor();
      }
    });
  }

  $('.profile-button').on('click', function () {
    activeProfile = String($(this).data('profile'));
    loadProfile(activeProfile);

    $('.profile-button').removeClass('active');
    $(this).addClass('active');
  });

  $('#autoFillAuthors').on('click', function () {
    const button = $(this);
    button.prop('disabled', true);
    void startAutofill(activeProfile)
      .catch((error: unknown) => {
        alert(
          error instanceof Error
            ? error.message
            : 'Could not start autofill. Please try again.',
        );
      })
      .finally(() => button.prop('disabled', false));
  });

  loadProfile(activeProfile);

  $(`.profile-button[data-profile="${activeProfile}"]`).addClass('active');
  return () => {
    $(
      '#addAuthor, #saveAuthors, #autoFillAuthors, #authorFields, .profile-button',
    ).off();
  };
}
