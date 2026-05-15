# Meta Headers

Every script starts with a Tampermonkey-style header:

```text
// ==UserScript==
// @name         Copy as Markdown link
// @namespace    com.example.md-link
// @version      0.1.0
// @description  Wraps the focused text clip as a Markdown auto-link.
// @grant        utools.*
// @grant        globalNativeApi.*
// @match-clip   text
// ==/UserScript==
```

## Required keys

| Key | Notes |
|-----|-------|
| `@name` | Display name |
| `@namespace` | Globally unique (reverse-DNS recommended); used as KV bucket and `scriptData` key |
| `@version` | SemVer |
| `@description` | One-line summary |

## Optional keys

| Key | Default | Notes |
|-----|---------|-------|
| `@author` | — | |
| `@homepage` | — | URL shown in the script manager |
| `@icon` | — | URL or `data:` |
| `@grant` | none | Repeatable; only `utools.*` and `globalNativeApi.*` accepted |
| `@require` | — | URL to external lib; **must include SRI** |
| `@match-clip` | all | Repeatable: `text` / `image` / `file` |
| `@run-at` | `on-demand` | `on-demand` / `background` |
| `@timeout` | `30000` | ms; per-callback hard cap |
| `@updateURL` | — | Override default marketplace source; `internal://<id>` reserved for builtins |
| `@tag` | — | Repeatable; powers marketplace filters |

## `@grant`

```text
// @grant   utools.*
// @grant   globalNativeApi.*
```

Only these two tokens are accepted. **No** fine-grained subsets like
`@grant utools.copyText`. See [Grants & Sandbox](./grants) for what's
actually exposed.

## `@require` + SRI

```text
// @require   https://cdn.jsdelivr.net/npm/qrcode-svg@1.1.0/dist/qrcode.min.js#sha256-AbCd…
```

- Whitelisted hosts: `registry.npmmirror.com`, `cdn.jsdelivr.net`, `unpkg.com`.
- SRI suffix `#sha256-…` / `#sha384-…` / `#sha512-…` is mandatory.
- Compute it:

  ```bash
  curl -sL "<url>" | openssl dgst -sha256 -binary | base64
  ```

## `@match-clip` vs `options.matchClip`

- `@match-clip` filters the **whole script** — if no current clip matches,
  none of the script's commands appear.
- `options.matchClip` on `registerMenuCommand` further narrows a single command.

The two intersect: a command is only available when both pass.
