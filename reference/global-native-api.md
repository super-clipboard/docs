# `globalNativeApi`

The full API surface lives under the `SuperClipboard.GlobalNativeApi` interface
in [`spec.d.ts`](https://github.com/super-clipboard/userscript-types/blob/main/spec.d.ts).
This page is a high-level tour; consult the type file for exhaustive signatures
and JSDoc.

## Categories

| Category | Methods |
|----------|---------|
| Menu / subscriptions (sync) | `registerMenuCommand`, `unregisterMenuCommand`, `addClipboardListener`, `removeClipboardListener`, `addAppListener`, `addPanelListener` |
| Data access (async) | `getClipBody`, `setClipMetadata` |
| Storage (async) | `setValue`, `getValue`, `deleteValue`, `listValues` |
| User interaction (async) | `notification`, `saveFile`, `showPanel`, `resizePanel`, `closePanel` |
| Diagnostics (sync) | `log`, `warn`, `error`, `info` |

## Listening for new clips

```ts
globalNativeApi.addClipboardListener("added", (e) => {
  // e: SuperClipboard.ClipboardAddedEvent
  globalNativeApi.log("captured", e.type, e.hash);
});
```

`ClipboardEventMap` exposes three keys: `added` (any kind), `text`, `image`,
`file`. Subscribing to a kind-specific event is more precise than filtering
inside the handler.

## Reading a clip body

```ts
const body = await globalNativeApi.getClipBody(ref);
switch (body?.type) {
  case "text":
    console.log(body.text);
    break;
  case "image":
    console.log(body.bytes?.byteLength);
    break;
  case "file":
    body.files?.forEach((f) => console.log(f.path));
    break;
}
```

The return type is `SuperClipboard.ClipBodyContent | null` — a tagged union
keyed by `type`.

## Per-script storage

`getValue` / `setValue` are scoped to the script's `@namespace`:

```ts
await globalNativeApi.setValue("counter", 1);
const counter = await globalNativeApi.getValue<number>("counter", 0);
```

Two scripts with different `@namespace` cannot read each other's keys.

## Mounting a panel

```ts
await globalNativeApi.showPanel({
  url: "panel.html",
  placement: "right",
  width: 360,
});
```

`placement` accepts `"menu-anchor" | "center" | "right" | "bottom"`. Both
`width` and `height` are optional and default to placement-aware values.
