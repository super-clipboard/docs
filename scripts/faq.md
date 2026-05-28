# FAQ

## I get `GRANT_DENIED` even though I declared the grant

Check:

1. Each method needs its own `@grant` line, either fine-grained
   (`@grant utools.copyText`, `@grant globalNativeApi.saveFile`) or via
   the wildcard (`@grant utools.*`). A grant for one method does *not*
   cover others in the same namespace.
2. The method isn't on the [utools denylist](./grants#utools-denylist) —
   `utools.db*`, `setFeature`, payment, `on*`, etc. — those stay blocked
   even with `@grant utools.*`.
3. The metadata header isn't accidentally inside `/* */` — the parser only
   reads `// @key value` lines.

## `@require` fails to load / SRI doesn't match

- Is the host in the whitelist (`registry.npmmirror.com`,
  `cdn.jsdelivr.net`, `unpkg.com`)?
- Recompute the hash:

  ```bash
  curl -sL "<url>" | openssl dgst -sha256 -binary | base64
  ```

  Append `#sha256-<base64>` to the URL.

- `npmmirror` paths look like
  `https://registry.npmmirror.com/<pkg>/<version>/files/<path>`.

## `showPanel` flickers and immediately closes

- `closeOnOutside` defaults `true` and the very click that triggered your
  command may be detected as *outside*. Call `showPanel` **first**, then do
  anything async.
- The iframe body needs visible content; an empty body with `height: "auto"`
  computes to 0.
- Two `showPanel` calls overwrite each other — close the previous panel first.

## `getClipBody` returns `null` or empty fields

- `null` means the host has cleaned up that clip (TTL / user delete).
- Text clips may have `body.text === undefined` for very large entries; fall
  back to `body.preview`.
- Image clips might give you only `body.preview` (base64 thumb); guard
  `if (body.bytes)`.

## How do I access OS-level APIs?

You can't — scripts run inside an iframe sandbox and have no direct access to
the host process. What scripts get is:

- `globalNativeApi.*` (clipboard / file / notification / OCR write-back)
- `utools.*` (subset)
- Standard web platform APIs the iframe exposes (`fetch`, `Worker`,
  `IndexedDB`, `crypto.subtle`, …)

Need something new? Open an issue against the main repo to discuss adding it
to `globalNativeApi`.

## Can scripts share data across namespaces?

KV is **strictly per-script-identity**. Workarounds:

- Use a dedicated host API where one exists (e.g. `setClipOcrText` writes
  to a shared `ocr/{hash}` store visible across all scripts).
- The system clipboard as a signal channel (not recommended; pollutes
  history).

## When does a `@run-at background` script run?

- As soon as the plugin loads and listeners are wired — no need for the main
  window to be visible.
- Disabled / uninstalled → destroyed.
- Throws / hangs past `@timeout` → bridge force-terminates the call.

## Notifications don't show up

- macOS — System Settings → Notifications → uTools must be allowed.
- Windows — disabled when Notification Center is muted.
- Linux — relies on `notify-send`; install if missing.

## My script crashed — what do I do?

- *Settings → Scripts* keeps the last error per script.
- Toggle the script off — others keep working.
- Prefer `globalNativeApi.error()` over `throw`; it surfaces in the same UI.

## Type IntelliSense isn't working

- Install `@super-clipboard/userscript-types`.
- Add either at the top of your script:
  `/// <reference types="@super-clipboard/userscript-types" />`
  or in `tsconfig.json` via `compilerOptions.types`.
- Use `.user.ts` — `.user.js` works but IDE help is weaker.
