# CMT Author Auto-Fill v2

Save author lists and fill Microsoft CMT submission creation forms. React and
TypeScript, for Chrome 120+.

- Four numbered profiles, added with **+**; no custom naming.
- Five authors per profile: email, first name, last name, organization, country.
- Compact animated editors, reduced-motion support and inline validation.
- Chrome sync storage with actionable save errors and retry support.

## Install

Use Node.js 24 (`.nvmrc`) and npm:

```sh
git clone https://github.com/arya2004/cmt-autofill.git
cd cmt-autofill
nvm use
npm ci
npm run build
```

Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**
and select `dist/extension/`. Reload the extension after rebuilding.

Alternatively, extract a versioned ZIP from
[Releases](https://github.com/arya2004/cmt-autofill/releases) and load the extracted
folder containing `manifest.json`. Release availability depends on maintainer
publication; source builds work independently.

## Use

1. Open the extension, enter author details and press **Save**.
2. Use **Add** for another author and tap a card to edit. Profile **+** adds
   another team; the profile trash control asks before deleting.
3. Open a submission creation page on `https://cmt3.research.microsoft.com`,
   then press **Fill authors**. Save changes first to enable filling.
4. Review the resulting CMT author list before submitting your paper.

Switching profiles prompts before discarding unsaved edits. Drafts are lost when
the popup closes. V2 starts fresh and does not import older profile data.

## Development

| Command                | Purpose                                                   |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Watch production extension bundles                        |
| `npm run build`        | Strict typecheck and production build                     |
| `npm test`             | Build and test storage, popup, messaging and CMT fixtures |
| `npm run lint`         | ESLint                                                    |
| `npm run format-check` | Prettier check                                            |
| `npm run format`       | Apply formatting                                          |
| `npm run package`      | Rebuild, validate and ZIP extension with SHA-256          |
| `npm run check`        | All checks and package verification                       |

Packaging requires `zip` and `unzip` (available on macOS and Ubuntu runners).
Output is `dist/packages/cmt-autofill-2.0.0.zip` and its `.sha256` file. The ZIP
contains production extension files only, with `manifest.json` at its root.
Generated `dist/` stays out of Git.

`src/popup/` contains React UI/state, `src/storage/` owns persistence,
`src/shared/` owns models/validation, `src/config/` contains settings/countries,
and `src/cmt/` contains selectors and existing automation. `scripts/` holds build,
packaging and test tooling.

After watched builds, reload the extension and refresh the target tab. Restart
`npm run dev` after manifest changes. There is no development server or website.

## Verification and limitations

Tests exercise the production popup/content-script bundles, storage failures,
profile persistence, validation, messaging recovery and synthetic CMT forms.
Fixtures document existing automation limitations: slow dialogs can fail,
rejected authors are not detected, and the completion alert does not prove CMT
accepted every author. Partial fills are possible. Review the actual list before
retrying to avoid duplicates. The automation uses fixed delays.

The user confirmed live autofill worked during development. Current visual UI and
all conference-specific dialog behavior remain unverified in Chrome. Title,
abstract, uploads and final paper submission remain manual.

For connection errors, reload the extension, refresh the CMT submission tab and
reopen the popup. The popup checks for a receiver and attempts injection when
missing; Chrome access restrictions may still require refreshing.

See [CONTRIBUTING](CONTRIBUTING.md), [privacy](PRIVACY.md), [security](SECURITY.md),
and [tag commands](TAGGING.md).

## License

[MIT](LICENSE). Independent project; not affiliated with Microsoft.
