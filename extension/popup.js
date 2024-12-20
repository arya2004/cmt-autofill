$(document).ready(function() {
  let activeProfile = 'profile1'; 
  
  $('#saveAuthors').on('click', function() {
    const authors = [];
    for (let i = 1; i <= 4; i++) {
      authors.push({
        email: $(`#email${i}`).val(),
        name: $(`#name${i}`).val(),
        surname: $(`#surname${i}`).val(),
        organization: $(`#organization${i}`).val(),
        country: $(`#country${i}`).val(),
      });
    }
    chrome.storage.sync.set({ [activeProfile]: authors }, function() {
      alert(`Authors saved for ${activeProfile}!`);
    });
  });

 
  function loadProfile(profile) {
    chrome.storage.sync.get([profile], function(result) {
      if (result[profile] && result[profile].length > 0) {
        result[profile].forEach(function(author, index) {
          const i = index + 1;
          $(`#email${i}`).val(author.email || '');
          $(`#name${i}`).val(author.name || '');
          $(`#surname${i}`).val(author.surname || '');
          $(`#organization${i}`).val(author.organization || '');
          $(`#country${i}`).val(author.country || '');
        });
        console.log(`Loaded ${profile}`);
      } else {
        console.log(`No saved authors found for ${profile}`);
        clearFields();
      }
    });
  }

  function clearFields() {
    for (let i = 1; i <= 4; i++) {
      $(`#email${i}`).val('');
      $(`#name${i}`).val('');
      $(`#surname${i}`).val('');
      $(`#organization${i}`).val('');
      $(`#country${i}`).val('');
    }
  }

  $('.profile-button').on('click', function() {
    activeProfile = $(this).data('profile');
    loadProfile(activeProfile);
  });

  $('#autoFillAuthors').on('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'autoFillAuthors', profile: activeProfile });
    });
  });

  
  loadProfile(activeProfile);
});
