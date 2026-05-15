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

`<kebab-case-id>` must equal the last segment of `@namespace`, e.g.

```text
// @namespace    com.example.json-format
```

→ directory `json-format/`.

## Submission flow

1. Fork [super-clipboard/userscripts](https://github.com/super-clipboard/userscripts).
2. Add your folder under `scripts/`.
3. Validate locally:

   ```bash
   pnpm validate
   ```

   Runs the `@super-clipboard/userscript` parser and checks:
   - Required metadata fields present and well-formed
   - Every `@grant` is whitelisted
   - Every `@require` is on a whitelisted registry **and** carries SRI
   - File / directory name matches the `@namespace` tail

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
- **Use `globalNativeApi.error`** instead of `throw` so users can see failures in
  the script manager.
