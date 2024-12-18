chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'autoFillAuthors') {
      chrome.storage.sync.get(['authors'], (result) => {
        const authors = result.authors || [];
        if (authors.length === 0) {
          alert('No authors to fill. Please save author details first.');
          return;
        }
        fillAuthorsSequentially(authors);
      });
    }
  });
  
  // Function to add authors one by one
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
      
      console.log(author);
      // Step 1: Click the "Add" button to open the form
      if (addButton) {
        addButton.click();
        console.log(`Clicked Add button for Author ${index + 1}`);
  
        setTimeout(() => {
          // Step 2: Populate the input fields
          const emailField = document.querySelector('input[placeholder="Email"]');
          const firstNameField = document.querySelector('input[placeholder="First Name"]');
          const lastNameField = document.querySelector('input[placeholder="Last Name"]');
          const organizationField = document.querySelector('input[placeholder="Organization"]');
          const countryDropdown = document.querySelector('select[aria-label="Country/Region"]');
  
          if (emailField && firstNameField && lastNameField && organizationField && countryDropdown) {
            // Fill in the fields
            emailField.value = author.email || '';
            emailField.dispatchEvent(new Event('input', { bubbles: true }));
  
            firstNameField.value = author.name || '';
            firstNameField.dispatchEvent(new Event('input', { bubbles: true }));
  
            lastNameField.value = author.surname || '';
            lastNameField.dispatchEvent(new Event('input', { bubbles: true }));
  
            organizationField.value = author.organization || '';
            organizationField.dispatchEvent(new Event('input', { bubbles: true }));
  
            // Set the country dropdown
            const targetCountry = author.country || '';
            const option = Array.from(countryDropdown.options).find(opt => opt.value === targetCountry);
            if (option) {
              countryDropdown.value = targetCountry;
              countryDropdown.dispatchEvent(new Event('change', { bubbles: true }));
              console.log(`Selected country: ${targetCountry}`);
            }
  
            console.log(`Filled Author ${index + 1}:`, author);
  
            // Step 3: Click the "Submit" button
            const submitButton = document.querySelector('button.btn.btn-primary');
            if (submitButton) {
              submitButton.click();
              console.log(`Clicked Submit button for Author ${index + 1}`);
  
              // Step 4: Wait and process the next author
              index++;
              setTimeout(processNextAuthor, 2000);
            } else {
              alert('Submit button not found!');
            }
          } else {
            alert('One or more input fields not found. Please check the page layout.');
          }
        }, 1000); // Wait for the form to open
      } else {
        alert('Add button not found on the page.');
      }
    }
  
    processNextAuthor();
  }
  