# Contributing

Use Node.js 24.15+ (CI: Node 24 and 26) and npm for development.

```sh
npm ci --ignore-scripts
npm run validate
```

## Language policy

- Write commit messages, branch names, pull request titles and descriptions, code comments, test names, tooling output, and developer documentation in English.
- Keep the README, GitHub repository description, customer release notes and changelog, store acceptance checklists, security guidance, support issue form, and storefront text in Turkish. The audience is Turkish e-commerce merchants.
- Keep technical identifiers and the standard license text in their original form. Preserve copyright holders' names exactly.
- Technical API and adapter documentation is developer documentation and must be in English, even when linked from the Turkish README.
- Apply this policy to new work; do not rewrite published commit history or existing release artifacts to translate them.

## Development and review

Sources are in `src/`; behavior tests are in `tests/`. Run `npm run format` for formatting. Explain the need before adding a runtime dependency. Do not share customer store code, screenshots, or personal data without permission.

Bug fixes must include a test that reproduces the issue and verifies the result. Verify order/cart changes in a test store. Submit a small pull request describing the expected behavior, validation results, and compatibility impact. Follow [SECURITY.md](SECURITY.md) when reporting vulnerabilities.

## Releases

`npm run build` creates the distribution ZIP in `dist/` from the current sources. Do not commit generated ZIPs as source files. Before publishing a release, synchronize `package.json`, the lockfile, and `CHANGELOG.md`; tag the validated commit and attach the ZIP built from that commit. A CI artifact is not a published stable release.
