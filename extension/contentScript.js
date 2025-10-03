chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autoFillAuthors') {
    const profileKey = request.profile || 'profile1'; // Default to profile1 if not specified
    chrome.storage.sync.get([profileKey], (result) => {
      const authors = result[profileKey] || [];
      if (authors.length === 0) {
        alert(`No authors to fill for ${profileKey}. Please save author details first.`);
        return;
      }
      fillAuthorsSequentially(authors);
    });
  }
});

function setKnockoutValue(inputElement, value) {
  return new Promise((resolve) => {
    if (inputElement) {
      inputElement.focus();
      inputElement.value = value;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`Set value for: ${inputElement.placeholder || inputElement.name}`);
    }
    setTimeout(resolve, 1);
  });
}

function fillAuthorsSequentially(authors) {
  let index = 0;

  function processNextAuthor() {
    if (index >= authors.length) {
      console.log('All authors have been added successfully.');
      alert('All authors have been added!');
      return;
    }

    const author = authors[index];
    const addButton = document.querySelector('button[data-bind*="showDialog(true)"]');

    if (!addButton) {
      console.error('CMT Autofill: Could not find "Add Author" button.');
      return;
    }

    addButton.click();
    console.log(`Clicked Add button for Author ${index + 1}`);
    
    setTimeout(async () => {
      const form = document.querySelector('form[data-bind*="submit: function () { $parent.addAuthor($data); }"]');

      if (!form) {
        console.error('CMT Autofill: Could not find author form.');
        return;
      }

      const emailField = form.querySelector('input[data-bind*="value: email"]');
      const firstNameField = form.querySelector('input[data-bind*="value: firstName"]');
      const lastNameField = form.querySelector('input[data-bind*="value: lastName"]');
      const organizationField = form.querySelector('input[data-bind*="value: organization"]');
      const countryDropdown = form.querySelector('select[data-bind*="value: countryCode"]');
      const submitButton = form.querySelector('button[type="submit"]');

      if (!emailField) {
        console.error('CMT Autofill: Could not find email field.');
        return;
      } 
      
      await setKnockoutValue(emailField, author.email || '');
      
      if (!firstNameField) {
        console.error('CMT Autofill: Could not find first name field.');
        return;
      } 
      
      await setKnockoutValue(firstNameField, author.name || '');
      
      if (!lastNameField) {
        console.error('CMT Autofill: Could not find last name field.');
        return;
      }
      
      await setKnockoutValue(lastNameField, author.surname || '');
      
      if (!organizationField) {
        console.error('CMT Autofill: Could not find organization field.');
        return;
      }
      
      await setKnockoutValue(organizationField, author.organization || '');
      
      if (!countryDropdown) {
        console.error('CMT Autofill: Could not find country dropdown.');
        return;
      }

      countryDropdown.value = author.country || '';
      countryDropdown.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 1));
      console.log(`Filled Author ${index + 1}:`, author);

      if (!submitButton) {
        console.error('CMT Autofill: Could not find submit button.');
        return;
      }

      submitButton.click();
      console.log(`Clicked Submit button for Author ${index + 1}`);

      index++;
      setTimeout(processNextAuthor, 2);
    }, 1);
  }

  processNextAuthor();
}