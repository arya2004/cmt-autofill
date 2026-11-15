# Releases

1. Update `package.json`, lockfile and `manifest.json` to the same version.
   Update `CHANGELOG.md`. Run `npm ci` and `npm run check` on Node.js 24.
2. Load `dist/extension/` in Chrome. Check profiles, five authors, keyboard
   navigation and real CMT filling with test data. Verify actual author acceptance.
3. Inspect `dist/packages/`. Verify with `unzip -t` and, from that directory,
   `shasum -a 256 -c cmt-autofill-<version>.zip.sha256` (Linux: `sha256sum -c`).
4. When ready, a maintainer creates/pushes the matching `v<version>` tag. The
   workflow checks versions, runs checks, uploads assets, attests the ZIP and
   creates a **draft** release.
5. Review draft notes, assets and manual validation before publishing.

Manual workflow runs upload packages without creating releases. CI on pull
requests and main uploads verified packages with 14-day retention. Workflows use
timeouts, concurrency controls, limited permissions and pinned actions. No workflow
submits to the Chrome Web Store. GitHub-hosted runs remain unverified locally.

Verify a tag-build attestation with:

```sh
gh attestation verify cmt-autofill-<version>.zip --repo arya2004/cmt-autofill
```

Attestation availability depends on repository visibility and GitHub plan. Resolve
workflow failures before publishing. Website and Pages deployment are absent.
