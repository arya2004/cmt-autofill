# Contributing

Use Node.js 24 and npm. Run `npm ci`, then `npm run check`. Load
`dist/extension/` through Chrome Developer mode to check UI and CMT behavior.
Use fictional author details and never submit a paper during testing.

Keep changes simple and focused. Use TypeScript, controlled React inputs and the
existing storage helpers. Keep selectors out of UI components. Add regression
tests for meaningful behavior and failures. Never include personal author data,
credentials or browser storage dumps in PRs.

Report bugs at https://github.com/arya2004/cmt-autofill/issues with extension and
Chrome versions, reproduction steps, expected/actual behavior and redacted errors.

PRs should describe resulting behavior, validation and remaining limits. Do not
commit `dist/` or `node_modules/`. Rebuild after edits. See [README](README.md) for
architecture and [TAGGING](TAGGING.md) for packaging.

Contributions are licensed under [MIT](LICENSE).
