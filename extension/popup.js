// extension/popup.js

// Global state
let activeProfile = 'profile1';

// Function to add a new author form
function addAuthor(authorData = {}) {
  const template = document.getElementById('authorTemplate');
  if (!template) return; // Guard clause
  const authorElement = document.importNode(template.content, true);

  const countrySelect = $(authorElement).find('.author-country');
  populateCountryDropdown(countrySelect);

  if (authorData) {
    $(authorElement).find('.author-email').val(authorData.email || '');
    $(authorElement).find('.author-name').val(authorData.name || '');
    $(authorElement).find('.author-surname').val(authorData.surname || '');
    $(authorElement).find('.author-organization').val(authorData.organization || '');
    countrySelect.val(authorData.country || '');
  }

  $('#authorFields').append(authorElement);
  updateAuthorNumbers();
}

// Function to update author numbers
function updateAuthorNumbers() {
  $('.author').each(function(index) {
    $(this).find('.author-number').text(index + 1);
  });
}

// Function to load a profile from storage
function loadProfile(profile) {
  chrome.storage.sync.get([profile], function(result) {
    $('#authorFields').empty();
    const authors = result[profile];
    if (authors && authors.length > 0) {
      authors.forEach(addAuthor);
    } else {
      addAuthor(); // If profile is empty, add one blank author form
    }
  });
}

// Function to clear author forms
function clearAuthors({ keepOneBlank = true } = {}) {
  $('#authorFields').empty();
  if (keepOneBlank) {
    addAuthor();
  }
}

// Main initialization function that sets up event listeners
function initializePopup() {
  // Set initial active profile button
  $(`.profile-button[data-profile="${activeProfile}"]`).addClass('active');

  // Load the initial profile, which adds the first author form
  loadProfile(activeProfile);

  // --- Event Listeners ---
  $('#addAuthor').on('click', () => addAuthor());

  $('#clearAllBtn').on('click', () => {
    if (confirm('Clear all authors from the form?')) {
      clearAuthors({ keepOneBlank: true });
    }
  });

  $('#authorFields').on('click', '.remove-author', function() {
    if ($('.author').length > 1) {
      $(this).closest('.author').remove();
      updateAuthorNumbers();
    } else {
      alert('You must have at least one author.');
    }
  });

  $('#saveAuthors').on('click', () => {
    const authors = [];
    $('.author').each(function() {
      authors.push({
        email: $(this).find('.author-email').val(),
        name: $(this).find('.author-name').val(),
        surname: $(this).find('.author-surname').val(),
        organization: $(this).find('.author-organization').val(),
        country: $(this).find('.author-country').val(),
      });
    });
    chrome.storage.sync.set({ [activeProfile]: authors }, () => {
      alert(`Authors saved for ${activeProfile}!`);
    });
  });

  $('.profile-button').on('click', function() {
    activeProfile = $(this).data('profile');
    $('.profile-button').removeClass('active');
    $(this).addClass('active');
    loadProfile(activeProfile);
  });

  $('#autoFillAuthors').on('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'autoFillAuthors', profile: activeProfile });
      }
    });
  });
}

// This runs the initialization when the DOM is ready in the actual extension
$(document).ready(initializePopup);

// Export functions for Jest testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    initializePopup,
    // You can export other functions if you need to test them in isolation
  };
}


$(document).ready(function() {
  let authorCount = 0;

  // --- Main function to add a new author form ---
  function addAuthor() {
    authorCount++;

    // Clone the template's content
    const newAuthor = $('#authorTemplate').contents().clone();

    // Set the author number in the header
    newAuthor.find('.author-number').text(authorCount);

    // Find the <select> element within the new author section
    const countrySelect = newAuthor.find('.author-country');

    // --- Dynamically load countries into the dropdown ---
    // Use jQuery's $.each to loop through the COUNTRIES array
    $.each(COUNTRIES, function(index, country) {
      // Create a new <option> and append it to the select element
      countrySelect.append($('<option>', {
        value: country.value,
        text: country.name
      }));
    });

    // Append the fully constructed author form to the container
    $('#authorFields').append(newAuthor);
  }


  // --- Event Listeners ---

  // Add author when the button is clicked
  $('#addAuthor').on('click', addAuthor);

  // Use event delegation for the "Remove" button since authors are added dynamically
  $('#authorFields').on('click', '.remove-author', function() {
    // Find the parent .author element and remove it
    $(this).closest('.author').remove();
    // Note: Re-numbering authors after removal can be added here if needed
  });

  // Clear all authors
  $('#clearAllBtn').on('click', function() {
    $('#authorFields').empty();
    authorCount = 0; // Reset counter
  });


  // --- Initial State ---
  // Add the first author by default when the popup opens
  addAuthor();

});