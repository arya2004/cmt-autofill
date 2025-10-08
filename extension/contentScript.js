const SELECTORS = {
  ADD_AUTHOR_BUTTON: 'button[data-bind*="showDialog(true)"]',
  AUTHOR_FORM:
    'form[data-bind*="submit: function () { $parent.addAuthor($data); }"]',
  EMAIL_INPUT: 'input[data-bind*="value: email"]',
  FIRST_NAME_INPUT: 'input[data-bind*="value: firstName"]',
  LAST_NAME_INPUT: 'input[data-bind*="value: lastName"]',
  ORGANIZATION_INPUT: 'input[data-bind*="value: organization"]',
  COUNTRY_DROPDOWN: 'select[data-bind*="value: countryCode"]',
  SUBMIT_BUTTON: 'button[type="submit"]',
};

// Helper function to extract author names from the page
// This function was missing. I've added it back here.
function getAuthorsFromPage() {
  const authorElements = document.querySelectorAll(".author-name"); // Adjust selector if needed
  const authors = Array.from(authorElements).map((el) => el.textContent.trim());
  return authors;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "autoFillAuthors") {
    const profileKey = request.profile || "profile1"; // Default to profile1 if not specified
    chrome.storage.sync.get([profileKey], (result) => {
      const authors = result[profileKey] || [];
      if (authors.length === 0) {
        alert(
          `No authors to fill for ${profileKey}. Please save author details first.`
        );
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
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      inputElement.dispatchEvent(new Event("change", { bubbles: true }));
      console.log(
        `Set value for: ${inputElement.placeholder || inputElement.name}`
      );
    }
    setTimeout(resolve, 1);
  });
}

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(interval);
        resolve(el);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      reject(new Error(`Timeout: Could not find element ${selector}`));
    }, timeout);
  });
}

async function fillAuthorsSequentially(authors) {
  let index = 0;

  async function processNextAuthor() {
    if (index >= authors.length) {
      console.log("All authors have been added successfully.");
      alert("All authors have been added!");
      return;
    }

    const author = authors[index];
    const addButton = document.querySelector(SELECTORS.ADD_AUTHOR_BUTTON);

    if (!addButton) {
      console.error('CMT Autofill: Could not find "Add Author" button.');
      return;
    }

    addButton.click();
    console.log(`Clicked Add button for Author ${index + 1}`);

    try {
      const form = await waitForElement(SELECTORS.AUTHOR_FORM);

      if (!form) {
        console.error("CMT Autofill: Could not find author form.");
        return;
      }

      const emailField = await waitForElement(SELECTORS.EMAIL_INPUT);
      const firstNameField = await waitForElement(SELECTORS.FIRST_NAME_INPUT);
      const lastNameField = await waitForElement(SELECTORS.LAST_NAME_INPUT);
      const organizationField = await waitForElement(
        SELECTORS.ORGANIZATION_INPUT
      );
      const countryDropdown = await waitForElement(SELECTORS.COUNTRY_DROPDOWN);
      const submitButton = await waitForElement(SELECTORS.SUBMIT_BUTTON);

      if (!emailField) {
        console.error("CMT Autofill: Could not find email field.");
        return;
      }
      
      await setKnockoutValue(emailField, author.email || "");
      
      if (!firstNameField) {
        console.error("CMT Autofill: Could not find first name field.");
        return;
      }
      
      await setKnockoutValue(firstNameField, author.name || "");
      await setKnockoutValue(lastNameField, author.surname || "");
      
      if (!lastNameField) {
        console.error("CMT Autofill: Could not find last name field.");
        return;
      }
      
      await setKnockoutValue(organizationField, author.organization || "");
      
      if (!countryDropdown) {
        console.error("CMT Autofill: Could not find country dropdown.");
        return;
      }
      
      countryDropdown.value = author.country || "";
      countryDropdown.dispatchEvent(new Event("change", { bubbles: true }));
      
      await new Promise((res) => setTimeout(res, 20));
      
      console.log(`Filled Author ${index + 1}:`, author);
      
      if (!submitButton) {
        console.error("CMT Autofill: Could not find submit button.");
        return;
      }
      
      submitButton.click();
      
      console.log(`Clicked Submit button for Author ${index + 1}`);
      index++;
      setTimeout(processNextAuthor, 500); // Wait a short period for dialog to close
    } catch (err) {
      console.error(`Error while processing author: ${err.message}`);
    }
  }

  processNextAuthor();
}

// This line should now work correctly
module.exports = { setKnockoutValue, getAuthorsFromPage };