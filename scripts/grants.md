# Grants & Permissions

Scripts must declare every API they use through `@grant`. The host enforces
the declaration at call time, so a missing grant fails fast with
`BridgeError { code: "GRANT_DENIED" }` instead of silently leaking access.

> **TL;DR** — In production, list each method individually
> (`@grant utools.copyText`, `@grant globalNativeApi.saveFile`). The wildcard
> form (`@grant utools.*`) is intended for the inner-loop of development.

## Two namespaces, two grant styles

```text
@grant <namespace>.<method-or-wildcard>
       │           │
       │           └── method name, e.g. `copyText`
       │               or `*` for the whole namespace
       └── `utools` | `globalNativeApi`
```

| Style | Example | When to use |
|-------|---------|-------------|
| **Fine-grained** (recommended) | `@grant utools.copyText` | Production / published scripts. Users see exactly which APIs you touch; new uTools releases can't enlarge your reach. |
| **Wildcard** | `@grant utools.*` | Local development only. Lets you try APIs without rewriting headers each time. Tighten before publishing. |

Both styles can be mixed and repeated:

```text
// @grant   utools.copyText
// @grant   utools.showNotification
// @grant   globalNativeApi.registerMenuCommand
// @grant   globalNativeApi.getClipBody
// @grant   globalNativeApi.saveFile
```

## How enforcement works

At call time the bridge checks: *is the namespaced method in your grant
list, or does your grant list contain the matching wildcard?*

| You declared | `utools.copyText` succeeds | `globalNativeApi.saveFile` succeeds |
|--------------|---------------------------|-------------------------------------|
| (nothing) | ❌ `GRANT_DENIED` | ❌ `GRANT_DENIED` |
| `utools.*` | ✅ | ❌ |
| `utools.copyText` | ✅ | ❌ |
| `globalNativeApi.*` | ❌ | ✅ |
| `utools.*` + `globalNativeApi.saveFile` | ✅ | ✅ |

The injected globals (`utools`, `globalNativeApi`) are only present if you
declared at least one grant in that namespace. Methods you didn't ask for
are simply absent from the object.

> **Free APIs**: `globalNativeApi.info`, `globalNativeApi.log`,
> `globalNativeApi.warn`, `globalNativeApi.error` work without any grant —
> they exist for diagnostics.

## `utools.*` denylist

Even with `@grant utools.*` (or a fine-grained grant for one of the names
below), the host refuses to expose these. They return `undefined` /
`GRANT_DENIED`:

| Category | Blocked names | Why |
|----------|---------------|-----|
| **KV / DB** | `db`, `dbStorage`, all `db*` | KV must flow through `globalNativeApi` so each script's namespace stays isolated. |
| **Plugin lifecycle** | `setFeature`, `removeFeature`, `getFeatures` | Would let a script impersonate or hijack uTools features. |
| **Account / payment** | `openPayment`, `fetchUserServerTemporaryToken`, `getUser*` | Phishing surface; out of scope. |
| **Event subscriptions** | every `on*` method | Use `globalNativeApi.addClipboardListener` / `addAppListener` / `addPanelListener` — they get proper cleanup. |

## Handling grant errors

`BridgeError` is a plain `Error` with a `code` field:

```ts twoslash
declare const clip: SuperClipboard.ClipRef & { hash: string };
// ---cut---
try {
  await globalNativeApi.setClipOcrText(clip.hash, "hello");
} catch (e) {
  if (e instanceof Error && (e as any).code === "GRANT_DENIED") {
    globalNativeApi.warn("Missing @grant globalNativeApi.setClipOcrText");
  }
}
```

Other `code` values you may see:

| `code` | Meaning |
|--------|---------|
| `GRANT_DENIED` | Grant missing for this method (or it's on the denylist). |
| `METHOD_NOT_FOUND` | Typo / version mismatch with the host. |
| `INVALID_PARAMS` | Argument shape rejected. |
| `BRIDGE_TIMEOUT` | `@timeout` exceeded for this single call. |
| `INTERNAL_ERROR` | The native impl threw. |

## Tighten-before-publish checklist

Before submitting to the [marketplace](./publishing):

1. Run your script once with `@grant utools.*` / `@grant globalNativeApi.*`
   and note every method actually called.
2. Replace the wildcards with explicit method grants.
3. Re-run all paths; any `GRANT_DENIED` reveals an API you forgot to list
   (or a leftover dead call you can remove).
4. The published header should read like a permission manifest — users skim
   it before installing.

## What scripts cannot do

- **Cross-origin XHR** (Tampermonkey's `xmlhttpRequest`) — use `fetch`; CORS rules apply.
- **Arbitrary file system access** — use `globalNativeApi.saveFile` (write)
  or `globalNativeApi.copyLocalFile` (copy from a chosen source path).
- **Inter-script messaging** — use a dedicated host API (e.g.
  `setClipOcrText` for OCR), or per-namespace KV for your own settings.
- **Touch the host DOM / cookies** — scripts run in an isolated iframe.
