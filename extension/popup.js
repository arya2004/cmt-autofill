document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.getElementById('saveAuthors');
  const autoFillButton = document.getElementById('autoFillAuthors');

  // Save Authors to chrome.storage
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
    chrome.storage.sync.set({ authors }, () => {
      alert('Authors saved successfully!');
    });
  });

  // Load Authors from chrome.storage automatically
  chrome.storage.sync.get(['authors'], (result) => {
    if (result.authors && result.authors.length > 0) {
      result.authors.forEach((author, index) => {
        const i = index + 1;
        document.getElementById(`email${i}`).value = author.email || '';
        document.getElementById(`name${i}`).value = author.name || '';
        document.getElementById(`surname${i}`).value = author.surname || '';
        document.getElementById(`organization${i}`).value = author.organization || '';
        document.getElementById(`country${i}`).value = author.country || '';
      });
      console.log('Authors loaded automatically.');
    } else {
      console.log('No saved authors found.');
    }
  });

  // Send a message to content script to auto-fill authors
  autoFillButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'autoFillAuthors' });
    });
  });
});
