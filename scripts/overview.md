# Scripts Overview

Userscripts let you extend Super Clipboard with menu commands, listeners,
panels, and KV storage — all in plain JavaScript / TypeScript.

## Design principles

| Principle | What it means |
|-----------|---------------|
| **Tampermonkey-style** | Familiar `// ==UserScript==` metadata header |
| **Two grants only** | `utools.*` and `globalNativeApi.*` — minimal surface |
| **Sandboxed** | Each script runs in its own iframe with `sandbox="allow-scripts allow-downloads"` |
| **Async by default** | All native calls go through a postMessage bridge → `Promise` |
| **Type-safe** | Ship `@super-clipboard/userscript-types` and get full IntelliSense + Twoslash |

## Runtime model

```text
┌────────────── plugin window (host) ──────────────┐
│                                                  │
│  history list / settings / panel host            │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  iframe  (script "foo")                    │  │
│  │   ├── globalNativeApi.* ─┐                 │  │
│  │   └── utools.* (subset) ─┤  postMessage   │──┼──► host bridge
│  │                          │                 │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
└──────────────────────────────────────────────────┘
```

- One iframe per script; the iframe persists across `closePanel()` so state
  (in-memory, IndexedDB) is retained.
- The host enforces grants, namespace isolation, and timeouts (`@timeout`).

## Injected globals

| Global | Provided when |
|--------|---------------|
| `globalNativeApi` | always (no grant needed for `info`, `log`, `warn`, `error`) |
| `utools` | only if `@grant utools.*` |

The full surface of `utools` is the public uTools API **minus** a denylist
(see [Grants & Sandbox](./grants)).

## Lifecycle

| Event | Trigger |
|-------|---------|
| `parse` | Plugin starts → metadata header validated |
| `instantiate` | iframe created; script source injected |
| `ready` | First `registerMenuCommand` / listener call |
| `command` | User invokes a menu command |
| `dispose` | User disables / uninstalls / `@timeout` exceeded |

Background scripts (`@run-at background`) are instantiated as soon as the
plugin starts, regardless of UI visibility.

## Built-in scripts

Shipped with the plugin and re-installed when the bundled script set is upgraded:

| ID | What it does |
|----|--------------|
| `qr-code` | Generate a QR code image from a text clip |
| `tokenize` | Tokenize text (Chinese / mixed) and show counts |
| `save-as` | Save image / file clip to a chosen path |

## Where next

- [Quickstart](./quickstart) — a real script in 30 lines.
- [Meta headers](./meta-headers) — every supported `@key`.
- [Grants & Sandbox](./grants) — exactly what's allowed and what isn't.
- [Examples](./examples) — copy-paste-able patterns.
- [Publishing](./publishing) — ship to the marketplace.
