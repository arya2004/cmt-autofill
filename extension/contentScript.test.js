// Mock the browser's `chrome` API
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
};

// Import the CORRECT function name: getAuthorsFromPage
const { setKnockoutValue, getAuthorsFromPage } = require('./contentScript.js');

// Mock the DOM
document.body.innerHTML = `
  <div>
    <input id="test-input" data-bind="value: someValue" />
    <div id="author-container">
      <span class="author-name">Jane Doe</span>
      <span class="author-name">John Smith</span>
    </div>
  </div>
`;

describe('Content Script Helpers', () => {

  // This test remains the same
  test('setKnockoutValue should update an input element value', () => {
    const input = document.getElementById('test-input');
    setKnockoutValue(input, 'New Value');
    expect(input.value).toBe('New Value');
  });

  // Update this test to call the CORRECT function
  test('getAuthorsFromPage should extract author names correctly', () => {
    const authors = getAuthorsFromPage(); // Use getAuthorsFromPage here
    expect(authors).toEqual(['Jane Doe', 'John Smith']);
  });

});