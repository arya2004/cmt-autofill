/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');
const $ = require('jquery');

// Make jQuery available globally for popup.js
global.$ = $;

// Mock the chrome extension APIs before any modules are loaded
global.chrome = {
  storage: {
    sync: {
      set: jest.fn((data, callback) => {
        if (callback) {
          callback();
        }
      }),
      get: jest.fn((keys, callback) => {
        // Mock the get to call the callback with an empty object for the initial load
        if (callback) {
          callback({});
        }
      }),
    },
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => {
      if (callback) {
        callback([{ id: 1 }]);
      }
    }),
    sendMessage: jest.fn(),
  },
};

// Mock the alert and confirm functions
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

// Load the necessary HTML and scripts
const html = fs.readFileSync(path.resolve(__dirname, './popup.html'), 'utf8');
const { populateCountryDropdown } = require('./countries.js');
const { initializePopup } = require('./popup.js'); // Import the main initializer

global.populateCountryDropdown = populateCountryDropdown;

describe('Popup UI and Functionality', () => {
  beforeEach(() => {
    // Set up the DOM for each test
    document.body.innerHTML = html;
    
    // Call the initializer to set up event listeners and initial state
    initializePopup();

    // Reset mocks before each test to ensure test isolation
    jest.clearAllMocks();
    global.confirm.mockClear().mockReturnValue(true); // Reset confirm to default to 'true'
  });

  describe('Author Management', () => {
    test('should add a new author form when #addAuthor is clicked', () => {
      // Initially, there should be one author form from loadProfile
      expect($('.author').length).toBe(1);
      
      // Simulate the click
      $('#addAuthor').click();
      
      // Now there should be two author forms
      expect($('.author').length).toBe(2);
      expect($('.author-number').last().text()).toBe('2');
    });

    test('should remove an author when .remove-author is clicked', () => {
      // Add a second author to have something to remove
      $('#addAuthor').click();
      expect($('.author').length).toBe(2);

      // Click the remove button on the first author
      $('.remove-author').first().click();
      
      // Only one author should remain, and its number should be updated to '1'
      expect($('.author').length).toBe(1);
      expect($('.author-number').text()).toBe('1');
    });

    test('should not remove the last author and show an alert', () => {
      expect($('.author').length).toBe(1);
      
      // Try to remove the only author
      $('.remove-author').click();
      
      // The author form should still be there
      expect($('.author').length).toBe(1);
      
      // An alert should have been called
      expect(global.alert).toHaveBeenCalledWith('You must have at least one author.');
    });
  });

  describe('Data Persistence (chrome.storage)', () => {
    test('should save author data to storage when #saveAuthors is clicked', () => {
      // Fill in some data for the first author
      $('.author-email').first().val('test@example.com');
      $('.author-name').first().val('John');
      
      // Simulate the save button click
      $('#saveAuthors').click();

      // Check if chrome.storage.sync.set was called correctly
      expect(chrome.storage.sync.set).toHaveBeenCalledTimes(1);
      
      // Verify the data that was passed to the storage API
      const expectedData = {
        profile1: [{
          email: 'test@example.com',
          name: 'John',
          surname: '',
          organization: '',
          country: '',
        }],
      };
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(expectedData, expect.any(Function));
    });

    test('should load author data from storage for a specific profile', () => {
      // Mock the data that will be returned by chrome.storage.sync.get
      const mockProfileData = {
        profile2: [
          { name: 'Jane', email: 'jane@example.com', surname: 'Doe', organization: 'Org', country: 'US' },
          { name: 'John', email: 'john@example.com', surname: 'Smith', organization: 'Another Org', country: 'CA' },
        ],
      };
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback(mockProfileData);
      });
      
      // Simulate clicking a different profile button
      $('.profile-button[data-profile="profile2"]').click();

      // Check if the correct number of author forms are rendered
      expect($('.author').length).toBe(2);
      
      // Check if the forms are populated with the correct data
      expect($('.author-name').first().val()).toBe('Jane');
      expect($('.author-surname').last().val()).toBe('Smith');
    });
  });

  describe('Profile Switching', () => {
    test('should switch to a different profile and load its data', () => {
      const storageGetSpy = jest.spyOn(chrome.storage.sync, 'get');
      
      // Click the button for Profile 3
      $('.profile-button[data-profile="profile3"]').click();
      
      // The button should now have the 'active' class
      expect($('.profile-button[data-profile="profile3"]').hasClass('active')).toBe(true);
      expect($('.profile-button[data-profile="profile1"]').hasClass('active')).toBe(false);
      
      // It should have tried to load data for 'profile3'
      expect(storageGetSpy).toHaveBeenCalledWith(['profile3'], expect.any(Function));
    });
  });
  
  describe('Clear All Functionality', () => {
    test('should clear all authors and leave one blank form when #clearAllBtn is clicked', () => {
      $('#addAuthor').click();
      $('#addAuthor').click();
      expect($('.author').length).toBe(3);
      
      // Click the clear all button
      $('#clearAllBtn').click();
      
      expect(global.confirm).toHaveBeenCalledWith('Clear all authors from the form?');
      expect($('.author').length).toBe(1);
      expect($('.author-email').val()).toBe('');
    });
  });
});