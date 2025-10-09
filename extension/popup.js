// extension/popup.js

(() => {
  // --- Private State ---
  let activeProfile = 'profile1';
  let authorCount = 0;

  // Example countries array - replace with actual international data as needed
  const COUNTRIES = [
    { value: 'USA', name: 'United States' },
    { value: 'IN', name: 'India' },
    { value: 'UK', name: 'United Kingdom' },
    { value: 'DE', name: 'Germany' },
    { value: 'FR', name: 'France' }
  ];

  // --- UI Message System ---
  function showStatusMessage(message, duration = 3000) {
    const $status = $('#statusMessage');
    if (!$status.length) {
      $('<div id="statusMessage" style="position:fixed;bottom:10px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 16px;border-radius:4px;font-size:14px;z-index:1000;opacity:0;transition:opacity 0.2s;"></div>')
        .appendTo('body');
    }
    const $elem = $('#statusMessage');
    $elem.text(message).css('opacity', 0).show().animate({ opacity: 1 }, 200);
    setTimeout(() => $elem.animate({ opacity: 0 }, 200, () => $elem.hide()), duration);
  }

  // --- Core Functions ---

  // Populate country dropdown
  function populateCountryDropdown($select) {
    $select.empty().append('<option value="">Select Country</option>');
    COUNTRIES.forEach(country => {
      $select.append(new Option(country.name, country.value));
    });
  }

  // Add a new author form (with optional data)
  function addAuthor(authorData = null) {
    authorCount++;
    
    // Import template content
    const template = document.getElementById('authorTemplate');
    if (!template) {
      console.error('Author template not found');
      return;
    }
    
    const fragment = document.importNode(template.content, true);
    const $author = $(fragment);
    
    // Set author number
    $author.find('.author-number').text(authorCount);
    
    // Populate country dropdown
    const $countrySelect = $author.find('.author-country');
    populateCountryDropdown($countrySelect);
    
    // Fill in data if provided
    if (authorData) {
      $author.find('.author-email').val(authorData.email || '');
      $author.find('.author-name').val(authorData.name || '');
      $author.find('.author-surname').val(authorData.surname || '');
      $author.find('.author-organization').val(authorData.organization || '');
      if (authorData.country) $countrySelect.val(authorData.country);
    }
    
    // Append to DOM
    $('#authorFields').append($author);
  }

  // Update author numbers after removal
  function updateAuthorNumbers() {
    authorCount = 0;
    $('.author').each(function () {
      authorCount++;
      $(this).find('.author-number').text(authorCount);
    });
  }

  // Load profile from chrome storage
  function loadProfile(profile) {
    chrome.storage.sync.get([profile], (result) => {
      const $container = $('#authorFields');
      $container.empty();
      authorCount = 0;
      
      const authors = result[profile];
      if (authors && Array.isArray(authors) && authors.length > 0) {
        authors.forEach(addAuthor);
      } else {
        addAuthor(); // Always show at least one author
      }
    });
  }

  // Clear all authors
  function clearAuthors() {
    if (confirm('Clear all authors from the form?')) {
      $('#authorFields').empty();
      authorCount = 0;
      addAuthor(); // Add one blank author
      showStatusMessage('All authors cleared');
    }
  }

  // Save authors to current profile
  function saveAuthors() {
    const authors = [];
    $('.author').each(function () {
      const $author = $(this);
      authors.push({
        email: $author.find('.author-email').val().trim(),
        name: $author.find('.author-name').val().trim(),
        surname: $author.find('.author-surname').val().trim(),
        organization: $author.find('.author-organization').val().trim(),
        country: $author.find('.author-country').val() || ''
      });
    });
    
    chrome.storage.sync.set({ [activeProfile]: authors }, () => {
      showStatusMessage(`Authors saved to ${activeProfile}!`);
    });
  }

  // Auto-fill on active tab
  function autoFillAuthors() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'autoFillAuthors', 
          profile: activeProfile 
        }, (response) => {
          if (chrome.runtime.lastError) {
            showStatusMessage('Error: CMT page not found or invalid');
          } else {
            showStatusMessage('Auto-fill started');
          }
        });
      }
    });
  }

  // --- Initialization ---
  function initializePopup() {
    // Set active profile button
    $(`.profile-button[data-profile="${activeProfile}"]`).addClass('active');
    
    // Load profile (this will add the default author)
    loadProfile(activeProfile);

    // --- Event Listeners ---
    
    // Add new author
    $('#addAuthor').on('click', () => {
      addAuthor();
    });

    // Remove author with confirmation if last one
    $('#authorFields').on('click', '.remove-author', function () {
      if ($('.author').length > 1) {
        $(this).closest('.author').remove();
        updateAuthorNumbers();
        showStatusMessage('Author removed');
      } else {
        showStatusMessage('At least one author is required');
      }
    });

    // Clear all authors
    $('#clearAllBtn').on('click', clearAuthors);

    // Save authors
    $('#saveAuthors').on('click', saveAuthors);

    // Switch profile
    $('.profile-button').on('click', function () {
      activeProfile = $(this).data('profile');
      $('.profile-button').removeClass('active');
      $(this).addClass('active');
      loadProfile(activeProfile);
      showStatusMessage(`Switched to ${activeProfile}`);
    });

    // Auto-fill
    $('#autoFillAuthors').on('click', autoFillAuthors);
  }

  // Initialize on DOM ready
  $(document).ready(initializePopup);

  // Export for testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      initializePopup,
      addAuthor,
      updateAuthorNumbers,
      loadProfile,
      clearAuthors,
      saveAuthors,
      autoFillAuthors,
      showStatusMessage
    };
  }
})();
