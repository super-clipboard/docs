# Super Clipboard Docs

VitePress site for the Super Clipboard userscript runtime. Two flavours of
reference live here:

- **Narrative** (`reference/global-native-api.md`, `zh/reference/global-native-api.md`) — curated, by-category, with TwoSlash demos.
- **Auto-generated** (`reference/api/`, mirrored at `zh/reference/api/`) — produced by [TypeDoc](https://typedoc.org/) from `@super-clipboard/userscript-types`'s `spec.d.ts`.

## Scripts

```bash
pnpm install         # requires @super-clipboard/userscript-types ^0.4.1 on npm
pnpm dev             # runs `docs:api` then starts VitePress dev server
pnpm build           # runs `docs:api` then builds the static site
pnpm docs:api        # regenerates ./reference/api + mirrors to ./zh/reference/api
```

## Updating to a new API surface

1. Land the API changes in the `super-clipboard/userscript-types` repo (sibling under `refs/userscript-types`).
2. Publish a new version of `@super-clipboard/userscript-types` to npm.
3. Bump the dependency here:
   ```bash
   pnpm add -D @super-clipboard/userscript-types@latest
   ```
4. `pnpm dev` — TwoSlash + TypeDoc will pick up the new types automatically.

### Local dev against unpublished types

When iterating before a release, point the dependency at the local checkout
temporarily (do **not** commit):

```bash
pnpm add -D @super-clipboard/userscript-types@link:../userscript-types
```

Revert before pushing so `package.json` keeps the published semver.

## i18n notes

- API reference is generated from English JSDoc only. The mirror script
  (`scripts/mirror-api-zh.mjs`) duplicates it under `/zh/reference/api/` with a
  banner that links back to the bilingual narrative docs.
- Narrative pages under `guide/` and `scripts/` are written and reviewed
  separately for each locale.
