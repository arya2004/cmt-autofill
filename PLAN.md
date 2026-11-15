# CMT Auto-Fill Overhaul Plan

Status: items 1–2 implemented locally; items 3–8 remain planned.

Item 1 verification: clean `npm ci`, lint, formatting, strict typecheck, production
build, development watchers, generated manifest/asset checks, and bundled popup /
content-script smoke checks pass. Dependency audit reports zero vulnerabilities.
Manual loading in Chrome and live CMT behavior remain unverified. The existing
jQuery UI is temporarily hosted by React pending item 3; automation behavior is preserved. The user subsequently confirmed autofill works. Nothing staged, committed, or pushed.

Item 2 uses a fresh v2 namespace per the user's revised scope; there is no
migration of older profiles. Named profile operations, validation, configuration
separation, storage errors, and popup integration are implemented. Eighteen
automated checks pass, including production-popup interactions and storage error
paths. Extension and package metadata are version 2.0.0. Nothing staged,
committed, or pushed by Codex.

This plan contains eight proposed commit-sized changes. They are organizational
boundaries only: do not stage, commit, or push any changes.

## Goals and scope

- Replace the jQuery popup with React and TypeScript.
- Separate UI, saved data, configuration, and CMT automation.
- Make autofill reliable and provide clear progress and failure feedback.
- Give the extension a modern, accessible interface.
- Build and package production output for installation and distribution.
- Refresh the website and repository documentation.
- Adopt relevant SteamStone build, testing, packaging, and maintenance practices.

The overhaul preserves author-detail autofill. Title, abstract, keywords, and
file-upload automation are separate feature work. Final paper submission remains
a user action.

## Findings from the existing project

- Author details already use Chrome storage. Hardcoding mainly affects profiles,
  country options, CMT selectors, and timing.
- There is no dependency-managed build or production packaging pipeline.
- The popup uses jQuery and mixes UI rendering with storage and messaging.
- Profile-handling code exists without corresponding profile controls.
- The content script runs on every website through `<all_urls>`.
- Autofill relies on 1–2 ms delays without verifying successful author additions.
- Validation, storage-error handling, and completion reporting are missing.
- Author data is logged to the console.
- Documentation describes a nonexistent “Load Authors” control and a four-author
  limit that the code does not enforce.
- Contributor documentation contains placeholder repository links.

## 1. `build: establish React TypeScript and Vite tooling`

- Add strict TypeScript, ESLint, Prettier, a dependency lockfile, and a documented
  Node version.
- Introduce clear folders for popup components, storage, shared models, and CMT
  integration.
- Add development, lint, format-check, typecheck, and production build commands.
- Generate a complete Manifest V3 extension in `dist/extension/`, with bundled
  scripts, styles, assets, and a manifest whose paths resolve correctly.
- Keep generated output out of source control. Installation instructions will
  point to `dist/extension/`.

Acceptance: a clean dependency installation and production build produce an
extension that Chrome can load from `dist/extension/`.

## 2. `refactor: introduce validated profiles and structured configuration`

- Separate author/profile models, country data, CMT selectors, and application
  settings from rendering and automation logic.
- Add named profiles with create, rename, delete, and selection operations.
- Validate author fields and duplicate emails.
- Introduce a versioned v2 storage schema in a fresh namespace. Per the updated
  scope, ignore older saved profiles and start with an empty default profile.
- Keep Chrome sync storage and report read, write, delete, and quota failures
  without discarding editor contents.

Acceptance: v2 starts fresh; profiles remain distinct; invalid data and storage
failures produce actionable feedback.

## 3. `feat: replace jQuery popup with a modern React interface`

- Remove jQuery and imperative popup rendering.
- Build reusable profile, author editor, form field, and status components.
- Use compact author cards, collapsible editing, clear typography, a restrained
  accent colour, and a sticky action area.
- Add accessible labels, keyboard focus, inline validation, saved/unsaved
  feedback, and loading states.
- Make the popup comfortable to use within browser extension size constraints.

Acceptance: users can manage profiles and authors, save changes, and initiate
autofill through an accessible interface with clear status feedback.

## 4. `fix: make CMT autofill reliable and narrowly scoped`

- Keep CMT DOM automation in a separate TypeScript module.
- Replace millisecond delays with bounded waits for actual dialog and page
  changes.
- Restrict execution to supported CMT pages and remove unnecessary permissions.
- Add typed messages, progress reporting, concurrent-run protection, and useful
  partial-failure results.
- Verify each author addition before proceeding. Stop with an explicit result
  when CMT rejects an author or expected controls are unavailable.
- Keep progress recoverable when the popup closes and reopens during a run.
- Remove personal author data from console logs.
- Retain final paper submission as a user action.

Acceptance: unsupported pages are handled clearly; delayed dialogs do not cause
timing failures; rejected additions do not appear as successes; repeated clicks
do not start concurrent runs.

## 5. `test: cover storage initialization popup and autofill workflows`

- Add focused tests for validation, profile persistence, initialization, and storage
  errors.
- Test popup interactions and messaging failures.
- Use synthetic CMT fixtures to cover delayed dialogs, rejected authors, missing
  fields, and partial completion.
- Smoke-test the built unpacked extension.
- Document remaining live-CMT verification separately from fixture coverage.

Acceptance: meaningful automated checks cover the main failure paths without
requiring a CMT account, private author data, or a real submission.

## 6. `ci: enforce quality checks and package verified builds`

- Run formatting, linting, type checks, tests, and production builds in GitHub
  Actions.
- Pin third-party actions, limit workflow permissions, and configure timeouts and
  concurrency.
- Add `npm run package` to create a versioned ZIP from production extension
  output only.
- Validate packaged files and generate SHA-256 checksums.
- Prepare a tag-driven draft-release workflow with version checks and build
  provenance, adapting SteamStone's relevant release practices.
- Keep manual workflow runs useful for downloadable build artifacts without
  creating a public release.

Acceptance: CI checks the production build; the release ZIP contains only the
loadable extension; release metadata and the manifest agree on the version.
Preparing workflows does not publish a release or submit to an extension store.

## 7. `docs: refresh the website and installation experience`

- Refresh the existing GitHub Pages site to match the extension's visual style.
- Replace stale screenshots and inaccurate instructions, including the
  nonexistent “Load Authors” control and unsupported four-author claim.
- Explain release downloads, loading the built extension, profile management,
  permissions, and troubleshooting.
- Build the website into `dist/site/` and prepare Pages deployment from that
  output.
- Check links, asset paths, and release references, including the GitHub Pages
  repository base path.

Acceptance: the built website accurately describes the delivered extension and
provides working installation and download paths. Deployment configuration is
prepared locally; actual publication is outside this implementation step.

## 8. `chore: align repository documentation and maintenance practices`

- Rewrite README and CONTRIBUTING around the actual architecture and commands.
- Add privacy/security documentation, a changelog, release instructions, and
  dependency-update configuration.
- Replace placeholder repository links and generic issue/PR templates.
- Document supported CMT pages, known limitations, and verification status.
- Preserve the existing licence. Adopting SteamStone's engineering practices does
  not require changing the licence.

Acceptance: a new contributor can install dependencies, run checks, build, load,
and package the extension using the documented commands. User-facing claims
match verified behavior.

## References

- [SteamStone CI](https://github.com/arya2004/SteamStone/blob/main/.github/workflows/ci.yml)
- [SteamStone release workflow](https://github.com/arya2004/SteamStone/blob/main/.github/workflows/release.yml)
- [SteamStone contributor guide](https://github.com/arya2004/SteamStone/blob/main/CONTRIBUTING.md)
- [React: build an app from scratch](https://react.dev/learn/build-a-react-app-from-scratch)
- [Chrome extension content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)

## Execution constraints

- Obtain approval of this plan before implementation.
- Never stage, commit, or push changes.
- Do not create remote releases, publish the website, or submit to extension
  stores as part of this local overhaul.
- Rebuild `dist/extension/` after every implemented plan item so the unpacked
  extension always reflects the latest source changes.
- Keep implementation changes reviewable and report completed checks and any
  remaining verification limitations.
