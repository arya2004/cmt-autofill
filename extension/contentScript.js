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

      if (addButton) {
          addButton.click();
          console.log(`Clicked Add button for Author ${index + 1}`);

          setTimeout(async () => {
              const form = document.querySelector('form[data-bind*="submit: function () { $parent.addAuthor($data); }"]');

              if (!form) {
                  alert('Author form not found.');
                  return;
              }

              const emailField = form.querySelector('input[data-bind*="value: email"]');
              const firstNameField = form.querySelector('input[data-bind*="value: firstName"]');
              const lastNameField = form.querySelector('input[data-bind*="value: lastName"]');
              const organizationField = form.querySelector('input[data-bind*="value: organization"]');
              const countryDropdown = form.querySelector('select[data-bind*="value: countryCode"]');
              const submitButton = form.querySelector('button[type="submit"]');

              if (emailField) await setKnockoutValue(emailField, author.email || '');
              if (firstNameField) await setKnockoutValue(firstNameField, author.name || '');
              if (lastNameField) await setKnockoutValue(lastNameField, author.surname || '');
              if (organizationField) await setKnockoutValue(organizationField, author.organization || '');

              if (countryDropdown) {
                  countryDropdown.value = author.country || '';
                  countryDropdown.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log(`Selected country: ${author.country}`);
                  await new Promise((resolve) => setTimeout(resolve, 1));
              }

              console.log(`Filled Author ${index + 1}:`, author);

              if (submitButton) {
                  submitButton.click();
                  console.log(`Clicked Submit button for Author ${index + 1}`);

                  index++;
                  setTimeout(processNextAuthor, 2);
              } else {
                  alert('Submit button not found in the form!');
              }
          }, 1);
      } else {
          alert('Add button not found on the page.');
      }
  }

  processNextAuthor();
}
