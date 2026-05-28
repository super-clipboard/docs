# Meta Headers

Every script starts with a Tampermonkey-style header:

```text
// ==UserScript==
// @name         Copy as Markdown link
// @namespace    com.example.md-link
// @version      0.1.0
// @description  Wraps the focused text clip as a Markdown auto-link.
// @grant        utools.copyText
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.notification
// @match-clip   text
// ==/UserScript==
```

## Required keys

| Key | Notes |
|-----|-------|
| `@name` | Display name |
| `@version` | SemVer |
| `@description` | One-line summary |

> **About `@namespace`**: starting in v0.5 a script's identity is
> derived entirely from its install-source URL
> (`updateURL` / `downloadURL` / marketplace link). KV and `scriptData`
> are isolated by this URL-derived *script id*, **not by `@namespace`**.
> `@namespace` is now optional metadata kept for human readability — it
> doesn't affect any runtime behaviour. A reverse-DNS string is still
> recommended for clarity.

## Optional keys

| Key | Default | Notes |
|-----|---------|-------|
| `@namespace` | — | Reverse-DNS-ish string. Display/identification only; no isolation effect. |
| `@author` | — | |
| `@homepage` | — | URL shown in the script manager |
| `@icon` | — | URL or `data:` |
| `@grant` | none | Repeatable; `<namespace>.<method-or-wildcard>` where namespace is `utools` or `globalNativeApi` |
| `@require` | — | URL to external lib; **must include SRI** |
| `@match-clip` | all | Repeatable: `text` / `image` / `file` |
| `@run-at` | `on-demand` | `on-demand` / `background` |
| `@timeout` | `30000` | ms; per-callback hard cap |
| `@updateURL` | — | Override default marketplace source; `internal://<id>` reserved for builtins |
| `@tag` | — | Repeatable; powers marketplace filters |

## `@grant`

Grants follow the shape `<namespace>.<method>` or `<namespace>.*`, where
namespace is either `utools` or `globalNativeApi`. Repeat the line for
each API you need:

```text
// @grant   utools.copyText
// @grant   utools.showNotification
// @grant   globalNativeApi.registerMenuCommand
// @grant   globalNativeApi.getClipBody
// @grant   globalNativeApi.saveFile
```

The wildcard form (`@grant utools.*`, `@grant globalNativeApi.*`) is
accepted for convenience during development but should be tightened to
specific method names before publishing — see
[Grants & Permissions](./grants).

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
