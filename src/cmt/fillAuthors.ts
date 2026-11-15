import { cmtSelectors, cmtTiming } from './config';
import type { Author } from '../shared/models';

function setKnockoutValue(inputElement: HTMLInputElement, value: string) {
  return new Promise<void>((resolve) => {
    if (inputElement) {
      inputElement.focus();
      inputElement.value = value;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(
        `Set value for: ${inputElement.placeholder || inputElement.name}`,
      );
    }
    setTimeout(resolve, cmtTiming.fieldUpdateMs);
  });
}

export function fillAuthorsSequentially(authors: Author[]) {
  let index = 0;

  function processNextAuthor() {
    if (index >= authors.length) {
      console.log('All authors have been added successfully.');
      alert('All authors have been added!');
      return;
    }

    const author = authors[index];
    if (!author) return;
    const addButton = document.querySelector<HTMLButtonElement>(
      cmtSelectors.addAuthor,
    );

    if (addButton) {
      addButton.click();
      console.log(`Clicked Add button for Author ${index + 1}`);

      setTimeout(async () => {
        const form = document.querySelector(cmtSelectors.authorForm);

        if (!form) {
          alert('Author form not found.');
          return;
        }

        const emailField = form.querySelector<HTMLInputElement>(
          cmtSelectors.email,
        );
        const firstNameField = form.querySelector<HTMLInputElement>(
          cmtSelectors.name,
        );
        const lastNameField = form.querySelector<HTMLInputElement>(
          cmtSelectors.surname,
        );
        const organizationField = form.querySelector<HTMLInputElement>(
          cmtSelectors.organization,
        );
        const countryDropdown = form.querySelector<HTMLSelectElement>(
          cmtSelectors.country,
        );
        const submitButton = form.querySelector<HTMLButtonElement>(
          cmtSelectors.submit,
        );

        if (emailField) await setKnockoutValue(emailField, author.email || '');
        if (firstNameField)
          await setKnockoutValue(firstNameField, author.name || '');
        if (lastNameField)
          await setKnockoutValue(lastNameField, author.surname || '');
        if (organizationField)
          await setKnockoutValue(organizationField, author.organization || '');

        if (countryDropdown) {
          countryDropdown.value = author.country || '';
          countryDropdown.dispatchEvent(new Event('change', { bubbles: true }));
          console.log(`Selected country: ${author.country}`);
          await new Promise<void>((resolve) =>
            setTimeout(resolve, cmtTiming.fieldUpdateMs),
          );
        }

        console.log(`Filled Author ${index + 1}:`, author);

        if (submitButton) {
          submitButton.click();
          console.log(`Clicked Submit button for Author ${index + 1}`);

          index++;
          setTimeout(processNextAuthor, cmtTiming.nextAuthorMs);
        } else {
          alert('Submit button not found in the form!');
        }
      }, cmtTiming.dialogOpenMs);
    } else {
      alert('Add button not found on the page.');
    }
  }

  processNextAuthor();
}
