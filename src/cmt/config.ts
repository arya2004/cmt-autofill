export const cmtSelectors = {
  addAuthor: 'button[data-bind*="showDialog(true)"]',
  authorForm:
    'form[data-bind*="submit: function () { $parent.addAuthor($data); }"]',
  email: 'input[data-bind*="value: email"]',
  name: 'input[data-bind*="value: firstName"]',
  surname: 'input[data-bind*="value: lastName"]',
  organization: 'input[data-bind*="value: organization"]',
  country: 'select[data-bind*="value: countryCode"]',
  submit: 'button[type="submit"]',
} as const;

// Existing timing is preserved here; bounded waits belong to plan item 4.
export const cmtTiming = {
  fieldUpdateMs: 1,
  dialogOpenMs: 1,
  nextAuthorMs: 2,
} as const;
