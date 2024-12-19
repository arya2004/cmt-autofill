document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.getElementById('saveAuthors');
  const autoFillButton = document.getElementById('autoFillAuthors');
  const profileButtons = document.querySelectorAll('.profile-button');
  let activeProfile = 'profile1'; // Default active profile

  // Save Authors to chrome.storage for the active profile
  saveButton.addEventListener('click', () => {
    const authors = [];
    for (let i = 1; i <= 4; i++) {
      authors.push({
        email: document.getElementById(`email${i}`).value,
        name: document.getElementById(`name${i}`).value,
        surname: document.getElementById(`surname${i}`).value,
        organization: document.getElementById(`organization${i}`).value,
        country: document.getElementById(`country${i}`).value,
      });
    }
    chrome.storage.sync.set({ [activeProfile]: authors }, () => {
      alert(`Authors saved for ${activeProfile}!`);
    });
  });

  // Load Authors from chrome.storage for the active profile
  function loadProfile(profile) {
    chrome.storage.sync.get([profile], (result) => {
      if (result[profile] && result[profile].length > 0) {
        result[profile].forEach((author, index) => {
          const i = index + 1;
          document.getElementById(`email${i}`).value = author.email || '';
          document.getElementById(`name${i}`).value = author.name || '';
          document.getElementById(`surname${i}`).value = author.surname || '';
          document.getElementById(`organization${i}`).value = author.organization || '';
          document.getElementById(`country${i}`).value = author.country || '';
        });
        console.log(`Loaded ${profile}`);
      } else {
        console.log(`No saved authors found for ${profile}`);
        clearFields();
      }
    });
  }

  // Clear all fields
  function clearFields() {
    for (let i = 1; i <= 4; i++) {
      document.getElementById(`email${i}`).value = '';
      document.getElementById(`name${i}`).value = '';
      document.getElementById(`surname${i}`).value = '';
      document.getElementById(`organization${i}`).value = '';
      document.getElementById(`country${i}`).value = '';
    }
  }

  // Add event listeners to profile buttons
  profileButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      activeProfile = event.target.dataset.profile;
      loadProfile(activeProfile);
    });
  });

  // Send a message to content script to auto-fill authors
  autoFillButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'autoFillAuthors', profile: activeProfile });
    });
});


  // Load default profile on page load
  loadProfile(activeProfile);
});
