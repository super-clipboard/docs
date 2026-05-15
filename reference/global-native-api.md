# `globalNativeApi`

> Full signatures live in [`spec.d.ts`](https://github.com/super-clipboard/userscript-types/blob/main/spec.d.ts)
> under `SuperClipboard.GlobalNativeApi`. This page lists every method by
> category. Code blocks use [TwoSlash](https://twoslash.netlify.app/) — hover
> a symbol to see its inferred type.

```ts twoslash
globalNativeApi.info;
//              ^?
```

## At a glance

| Category | Sync / async | Methods |
|----------|--------------|---------|
| [Menu](#menu) | sync | `registerMenuCommand` `unregisterMenuCommand` |
| [Subscriptions](#subscriptions) | sync | `addClipboardListener` `removeClipboardListener` `addAppListener` `addPanelListener` |
| [Data](#data) | async | `getClipBody` `setClipMetadata` |
| [KV](#kv) | async | `setValue` `getValue` `deleteValue` `listValues` |
| [I/O](#io) | async | `notification` `saveFile` |
| [Logging](#logging) | sync | `log` `warn` `error` |
| [Panel](#panel) | async | `showPanel` `resizePanel` `closePanel` |
| [Meta](#meta) | sync | `info` |

---

## Menu

### `registerMenuCommand(name, callback, options?)`

Register a context-menu entry on clip rows.

```ts twoslash
const id = globalNativeApi.registerMenuCommand(
  "Copy as link",
  async (ctx) => {
    //    ^?
    const target = ctx.clips[0];
    if (target?.type !== "text") return;
    const body = await globalNativeApi.getClipBody(target);
    if (body?.type === "text" && body.text) {
      utools.copyText(`<${body.text}>`);
    }
  },
  { matchClip: ["text"] },
);
```

- The returned `id` does not persist across restarts — re-register on each launch.
- `options.matchClip` intersects with the `@match-clip` header.
- `options.accessKey` — single character used as the menu's mnemonic.

### `unregisterMenuCommand(id)`

```ts twoslash
declare const id: string;
// ---cut---
globalNativeApi.unregisterMenuCommand(id);
```

Unknown ids are no-ops, never throw.

---

## Subscriptions

### `addClipboardListener(event, handler)` / `removeClipboardListener`

```ts twoslash
const onAdded = (e: SuperClipboard.ClipboardAddedEvent) => {
  //                ^?
  globalNativeApi.log("captured", e.type, e.hash);
};

globalNativeApi.addClipboardListener("added", onAdded);
// To unsubscribe, pass the SAME function reference:
globalNativeApi.removeClipboardListener("added", onAdded);
```

Channels: `"added"` (any type), `"text"`, `"image"`, `"file"`. Subscribing to a
specific type is more precise than filtering inside an `"added"` handler.

### `addAppListener(event, handler)`

```ts twoslash
globalNativeApi.addAppListener("visible", () => {
  // Fired when the main window becomes visible (placeholder for now).
});
```

> ⚠️ **Placeholder API**: the host does not currently emit any `app:*` events.
> Subscriptions are no-ops. Will be implemented in upcoming releases.

### `addPanelListener(event, handler)`

```ts twoslash
globalNativeApi.addPanelListener("closed", () => {
  // Fired when the panel is closed by the user or via closePanel().
});
```

> ⚠️ **Placeholder API**: same as above.

---

## Data

### `getClipBody(ref)`

Read a clip's body. Branch on `body.type` (tagged union):

```ts twoslash
declare const ref: SuperClipboard.ClipRef;
// ---cut---
async function demo() {
  const body = await globalNativeApi.getClipBody(ref);
  //    ^?
  if (!body) return;
  switch (body.type) {
    case "text":
      console.log(body.text ?? body.preview);
      break;
    case "image":
      console.log(body.bytes?.byteLength, body.mime);
      break;
    case "file":
      body.files?.forEach((f) => console.log(f.path));
      break;
  }
}
```

`null` means the host has cleaned up that clip.

### `setClipMetadata(ref, partial)`

Shallow-merge `partial` into the clip's `scriptData[<your @namespace>]`.

```ts twoslash
declare const ref: SuperClipboard.ClipRef;
// ---cut---
await globalNativeApi.setClipMetadata(ref, {
  ocrText: "hello world",
  language: "en",
});
```

- Writes only into **your namespace's** sub-object.
- Multiple scripts writing different namespaces don't conflict.
- These fields are picked up by FTS (when enabled).

---

## KV

Per-`@namespace` key-value store.

```ts twoslash
await globalNativeApi.setValue("settings", { autoOpen: true });
const s = await globalNativeApi.getValue<{ autoOpen: boolean }>("settings");
//    ^?

await globalNativeApi.deleteValue("settings");
const keys = await globalNativeApi.listValues();
//    ^?
```

- Values are `JSON.stringify`'d — don't store `Map` / `Set` / functions.
- `getValue<T>` returns `undefined` if the key is missing.
- Different scripts (different namespaces) cannot read each other's keys.

---

## I/O

### `notification(options | string)`

```ts twoslash
await globalNativeApi.notification({
  title: "Done",
  body: "Saved to ~/Downloads/clip.png",
  timeoutMs: 4000,
});

// Shorthand: a string is treated as { body: "..." }
await globalNativeApi.notification("Saved");
```

### `saveFile(content, options)`

```ts twoslash
declare const ref: SuperClipboard.ClipRef;
// ---cut---
const body = await globalNativeApi.getClipBody(ref);
if (body?.type === "image" && body.bytes) {
  await globalNativeApi.saveFile(body.bytes, {
    filename: "clip.png",
    mime: "image/png",
  });
}
```

- `content`: `string` / `Uint8Array` / `ArrayBuffer`.
- Current implementation triggers a browser download via `<a download>` from
  inside the iframe. **Final path is not returned.**
- `mime` controls the *Save as…* dialog default extension.

---

## Logging

```ts twoslash
globalNativeApi.log("ordinary", { hash: "abc" });
globalNativeApi.warn("unexpected condition");
globalNativeApi.error(new Error("boom"));
```

- All synchronous.
- Output is prefixed with `[script:<namespace>]` for easy filtering in uTools logs.
- Throwing also gets logged at `error`, but explicit calls are clearer.

---

## Panel

Each script has **one** dedicated iframe. `showPanel` only changes its style
and visibility — the DOM is not rebuilt, so state survives close/show.

### `showPanel(options)`

```ts twoslash
await globalNativeApi.showPanel({
  width: 360,
  height: "auto",
  placement: "center",
  closeOnOutside: true,
});
```

- `placement`: `"menu-anchor" | "center" | "right" | "bottom"`.
- `width` / `height` default per placement; `"auto"` follows the body's content size.
- `closeOnOutside` defaults `true`; `modal` defaults `false`.

### `resizePanel(size)`

```ts twoslash
await globalNativeApi.resizePanel({ width: 480, height: "auto" });
```

Pass only the dimensions you want to change. No-op if the panel is closed.

### `closePanel()`

```ts twoslash
await globalNativeApi.closePanel();
```

Hides the panel **without** unmounting the iframe.

---

## Meta

### `info`

```ts twoslash
const info = globalNativeApi.info;
//    ^?

console.log(`[${info.name} v${info.version}] grants:`, info.grants);
```

Read-only, injected synchronously when the script boots. `scriptId` looks like
`config/script/<sha1-16hex>` — a stable identifier for log correlation.
