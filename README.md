# CMT Author Auto-Fill v2

A Chrome extension that automates the process of filling author details in the Microsoft Conference Management Toolkit (CMT). This tool allows users to save, load, and auto-fill authors' information (Email, First Name, Last Name, Organization, and Country) into the CMT form.

---

## **Features**

- **Named Profiles**: Create, rename, delete, and select separate author lists.
- **Save Author Details**: Save validated author information for reuse.
- **Load Author Details**: Load saved author information into the extension.
- **Auto-Fill Form**: Automatically fill the author details sequentially in the CMT form with a single click.
- **Modern UI**: A user-friendly and responsive popup interface.

---

## **Screenshots**

### **Extension Popup Interface**

This is the popup interface where users can input author details and initiate the auto-fill process.

<div style="text-align: center;">
    <img src="./docs/images/ext.png" alt="Extension Popup" width="400">
</div>

### **CMT Auto-Fill in Action**

This screenshot shows the auto-filled author details in the CMT submission form after using the extension.

![Auto-Filled Form](./docs/images/after.png)

---

## **Installation**

1. **Clone or Download** the repository to your local machine:

   ```bash
   git clone https://github.com/arya2004/cmt-autofill.git
   ```

2. **Build the extension** with Node.js 24 (see `.nvmrc`):

   ```bash
   nvm use
   npm ci
   npm run build
   ```

3. **Open Chrome** and navigate to:

   ```
   chrome://extensions
   ```

4. **Enable Developer Mode**:
   - Toggle the developer mode switch at the top-right corner.

5. **Load the Extension**:
   - Click on the "Load unpacked" button.
   - Select `dist/extension/` inside this repository.

6. The extension will now be visible in your Chrome toolbar.

---

## **Usage**

### **Step 1: Save Author Details**

- Click the extension icon to open the popup.
- Fill in Email, First Name, Last Name, Organization, and Country for each author.
- All fields are required. Emails must be valid and unique within the profile.
- Click the **Save Authors** button to store the information.

### **Step 2: Load Saved Details**

- Saved authors load automatically when you open the popup or select a profile.
- Use the profile selector to switch author lists. Enter a name and click **Create**
  to start another list, or **Rename** to change the selected profile name.
- **Delete** removes the selected profile after confirmation. At least one profile
  must remain. Switching or creating profiles prompts before discarding unsaved authors.

### **Step 3: Auto-Fill Form**

- Save any author changes, then navigate to the CMT submission page.
- Click the **Fill Authors** button in the extension popup.
- The extension will sequentially:
  - Click the "Add Author" button.
  - Fill the details for each author.
  - Submit the form for each author.

---

## **Supported Fields**

Each author includes the following details:

- **Email**
- **First Name**
- **Last Name**
- **Organization**
- **Country**

---

## **License**

This project is licensed under the [CC BY-NC-ND 4.0](LICENSE).

---

## Development

Use Node.js 24 and npm. Run `npm ci` after cloning.

| Command                | Purpose                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| `npm run dev`          | Build and watch the popup and content script in `dist/extension/`        |
| `npm run lint`         | Check source and tooling with ESLint                                     |
| `npm run format-check` | Check formatting with Prettier                                           |
| `npm run format`       | Apply formatting                                                         |
| `npm test`             | Build and run profile, validation, popup, and messaging regression tests |
| `npm run typecheck`    | Check strict TypeScript types                                            |
| `npm run build`        | Typecheck and build the production extension                             |

Load `dist/extension/` through Chrome's **Load unpacked** control. After a watched
build, reload the extension at `chrome://extensions`, reopen its popup, and refresh
the target tab to load the new content script. Restart `npm run dev` after changing
`manifest.json`; the manifest is copied when the build starts. Development uses
bundles on disk, without a development server or hot reload.

Source layout:

- `src/popup/`: React entry, popup components, styles, and temporary jQuery bridge.
- `src/storage/`: Versioned v2 profiles and Chrome sync storage error handling.
- `src/shared/`: Profile/author models and validation shared by popup and CMT integration.
- `src/config/`: Application settings and CMT country options.
- `src/cmt/`: Content-script entry and existing author automation.
- `scripts/build.mjs`: Vite popup build and standalone content-script bundle.
- `manifest.json`: Manifest V3 source; generated paths refer to build output.

The build follows [Vite's production build modes](https://vite.dev/guide/build)
and uses [strict TypeScript checking](https://www.typescriptlang.org/tsconfig/strict.html).
Generated files and dependencies are ignored by Git. The React host deliberately
retains the jQuery interface until plan item 3. Permission changes and automation
reliability remain later plan items.

The lockfile overrides TypeScript ESLint's transitive `minimatch` to the patched
11.x release because its upstream 10.x range includes a known denial-of-service
advisory. Recheck this override when upgrading TypeScript ESLint.

If Fill Authors reports a connection error, reload the extension at
`chrome://extensions` after rebuilding, then reopen the CMT submission tab and
try again. The popup now checks that the content script is listening and injects
it into the active CMT tab when missing. It reports a refresh instruction if
Chrome denies access or the page navigates during the connection.

## V2 storage and validation

V2 starts with an empty **Default** profile. Earlier `profile1` data and previous
storage namespaces are ignored; there is no migration or import step. The
extension and package version are `2.0.0`.

Profiles continue to use Chrome sync storage. Settings are stored under
`cmtAutofill.v2.settings` with `schemaVersion: 2` and `activeProfileId`. Each profile
is a separate `cmtAutofill.v2.profile.<id>` record containing its ID, name, and
authors. Deleting the selected profile selects the first remaining profile on
load. This also handles a profile deletion synced from another browser.

Profile names must be nonempty, at most 80 characters, and unique ignoring case.
Saving trims author fields and checks required fields, email syntax, supported
country codes, and duplicate emails ignoring case. The content script repeats
validation before filling. Errors identify the affected author; failed writes
keep the editor contents so you can retry. Unsaved edits must be saved before
filling. Drafts are not persisted when the popup closes.

Chrome sync has [per-item, total-storage, and write-rate quotas](https://developer.chrome.com/docs/extensions/reference/api/storage).
A quota failure reports a reduce-data/wait-and-retry message. Damaged or unknown
v2 schemas report an error rather than overwriting saved profiles. No local
storage fallback or automatic reset occurs.

`npm test` covers fresh initialization, profile persistence and deletion,
validation, simulated read/write/delete failures, popup operations using the
production bundle in a DOM harness, and messaging recovery. These checks do not
replace live CMT verification of the author-dialog automation.
