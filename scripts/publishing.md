# Publishing

> Submit your script to [`super-clipboard/userscripts`](https://github.com/super-clipboard/userscripts)
> and it will appear in the in-plugin **marketplace**.

## Repo layout

```
super-clipboard/userscripts/
  scripts/
    <kebab-case-id>/
      <kebab-case-id>.user.js     # script + metadata header
      README.md                   # short description + screenshot
      package.json                # optional: deps, tags
```

`<kebab-case-id>` is the script's directory name in the repo and also the
`.user.js` filename. Pick a short, stable, conflict-free kebab-case name, e.g.

```
scripts/json-format/json-format.user.js
```

> `@namespace` is optional and does not affect script identity.
> From v0.5 onward identity is derived purely from the published
> npmmirror download URL.

## Submission flow

1. Fork [super-clipboard/userscripts](https://github.com/super-clipboard/userscripts).
2. Add your folder under `scripts/`.
3. Validate locally:

   ```bash
   pnpm validate
   ```

   Runs the `@super-clipboard/userscript` parser and checks:
   - Required metadata fields present and well-formed
   - Every `@grant` follows the `<utools|globalNativeApi>.<method-or-*>` shape
   - Every `@require` is on a whitelisted registry **and** carries SRI
   - File name matches its containing directory (`<id>/<id>.user.js`)

4. Open a PR; CI re-runs `pnpm validate` and rebuilds `scripts.index.json`.
5. After merge, plugins refresh the index on next launch.

## Versioning & updates

- Use [SemVer](https://semver.org/) for `@version`.
- Already-installed scripts get an *update available* hint when
  `scripts.index.json` shows a higher version. **Updates are never silent** —
  the user must opt-in.
- `@updateURL` overrides the default source. `internal://<id>` is reserved for
  builtin scripts shipped with the plugin.

## README contents

At minimum:

- One-sentence summary
- Trigger condition (clip type, multi-select supported?)
- Screenshot or short GIF
- Permissions: list every `@grant` with a one-line reason
- Dependencies: list every `@require` with source + license

## Builtin vs marketplace

| Aspect | Builtin | Marketplace |
|--------|---------|-------------|
| Install | Seeded on first launch; re-seeded when the plugin upgrades the bundled set | User installs from marketplace |
| If user uninstalls | Stays uninstalled | Stays uninstalled |
| Update source | `@updateURL internal://<id>` | Marketplace index, optionally overridden |
| Scope | High-traffic universal tools | Anything specific |

If your script is broadly useful and you'd like it bundled, mention it in the PR
and a maintainer will evaluate.

## Recommended practices

- **Namespace** — reverse-DNS: `com.<author>.<id>`.
- **Tags** (`@tag`) — at least one of `text` / `image` / `file` / `utility` / `ai` …
- **Timeout** — tune `@timeout` to your worst-case callback (default 30 s is generous).
- **Minimise deps** — prefer iframe-native APIs; pin every `@require` to an exact version.
- **Tighten `@grant` lines** before publishing — prefer fine-grained
  (`@grant utools.copyText`) over the wildcard (`@grant utools.*`). Users
  can then audit exactly which APIs your script touches. See
  [Grants & Permissions](./grants).
- **Use `console.error`** instead of `throw` so users can see failures in
  the script manager.
