/**
 * @jest-environment jsdom
 */

const $ = require("jquery");
global.$ = $;

// Mock chrome.storage API
global.chrome = {
  storage: {
    sync: {
      set: jest.fn((data, callback) => callback && callback()),
      get: jest.fn((keys, callback) => callback && callback({}))
    }
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => callback([{ id: 1 }])),
    sendMessage: jest.fn()
  }
};

// Import functions from popup.js
const { addAuthor, updateAuthorNumbers, loadProfile } = require('./popup.js');

beforeEach(() => {
  // Clear DOM before each test
  document.body.innerHTML = `
    <div id="authorFields"></div>
    <template id="authorTemplate">
      <div class="author">
        <span class="author-number"></span>
        <input class="author-email"/>
        <input class="author-name"/>
        <input class="author-surname"/>
        <input class="author-organization"/>
        <input class="author-country"/>
        <button class="remove-author">Remove</button>
      </div>
    </template>
  `;
});

describe("Popup.js functions", () => {

  test("addAuthor should add a new author element", () => {
    addAuthor();
    const authors = document.querySelectorAll(".author");
    expect(authors.length).toBe(1);
    expect(authors[0].querySelector(".author-number").textContent).toBe("1");
  });

  test("updateAuthorNumbers should update numbers correctly", () => {
    addAuthor();
    addAuthor();
    updateAuthorNumbers();
    const numbers = Array.from(document.querySelectorAll(".author-number")).map(el => el.textContent);
    expect(numbers).toEqual(["1", "2"]);
  });

  test("loadProfile should call chrome.storage.sync.get", () => {
    const spy = jest.spyOn(chrome.storage.sync, "get");
    loadProfile("profile1");
    expect(spy).toHaveBeenCalledWith(["profile1"], expect.any(Function));
  });

});
