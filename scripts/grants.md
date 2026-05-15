# Grants & Sandbox

Two grants, an opaque iframe, and a typed bridge — that's the whole security model.

## The two grants

| Grant | Adds |
|-------|------|
| `@grant utools.*` | The `utools` global (uTools' public API minus a denylist) |
| `@grant globalNativeApi.*` | Always-injected; this grant unlocks **mutating** methods (KV write, panel control, OCR, etc.); without it only `info` / `log` / `warn` / `error` work |

## `utools.*` denylist

Even with `@grant utools.*` the following are blocked. Calling them throws
`BridgeError { code: "GRANT_DENIED" }`.

| Category | Blocked methods |
|----------|----------------|
| KV / DB | `db`, `dbStorage`, every `db*` method |
| Plugin lifecycle | `setFeature`, `removeFeature`, `getFeatures` |
| Account / payment | `openPayment`, `fetchUserServerTemporaryToken`, `getUser*` |
| Subscriptions | every `on*` event method (use `globalNativeApi.add*Listener` instead) |

Why each is denied:

- **`db*`** — KV must go through `globalNativeApi` so namespaces stay isolated.
- **`setFeature` / `removeFeature`** — would let scripts impersonate uTools features.
- **`payment` / account** — out of scope and a phishing risk.
- **`on*`** — duplicates `globalNativeApi.add*Listener` and bypasses cleanup.

## Sandbox

Each script runs in:

```html
<iframe sandbox="allow-scripts allow-downloads"
        src="about:blank"
        srcdoc="…<your script>…"></iframe>
```

Consequences:

- **Opaque origin** — `fetch` to your own backend needs CORS just like a third-party page.
- **No `top` access** — scripts can't read the host DOM.
- **`allow-downloads`** — required for `globalNativeApi.saveFile`.
- **No `allow-same-origin`** — so even if you guess host URLs, cookies / `localStorage`
  are isolated.

## The bridge

All `globalNativeApi.*` and `utools.*` calls are proxied via `postMessage`:

1. iframe builds an `envelope = { id, method, args }`.
2. Host validates: grant present? method allowed? args within shape?
3. Host runs the native impl, posts back `{ id, ok, value }` or `{ id, ok: false, error }`.
4. iframe resolves / rejects the corresponding `Promise`.

### Errors

All bridge errors share `BridgeError`:

| `code` | Meaning |
|--------|---------|
| `GRANT_DENIED` | Grant missing or method on denylist |
| `METHOD_NOT_FOUND` | Typo / version mismatch |
| `INVALID_PARAMS` | Args failed schema validation |
| `BRIDGE_TIMEOUT` | `@timeout` exceeded for this call |
| `INTERNAL_ERROR` | Native impl threw |

Catch them like normal:

```ts twoslash
declare const ref: SuperClipboard.ClipRef;
// ---cut---
try {
  await globalNativeApi.setClipMetadata(ref, { foo: 1 });
} catch (e) {
  if (e instanceof Error && (e as any).code === "GRANT_DENIED") {
    globalNativeApi.warn("Need globalNativeApi.* grant for this");
  }
}
```

## What's *not* available

- `xmlhttpRequest` (Tampermonkey-style cross-origin) — use `fetch` + CORS.
- Direct file system access — use `globalNativeApi.saveFile`.
- Inter-script communication — use `setClipMetadata` to write to a shared clip,
  or KV (per-namespace).
