# Examples

Five copy-paste-friendly patterns. All use Twoslash — hover any symbol for types.

## 1. QR code in a panel

Generate a QR for the focused text clip and show it in a centered panel.

```ts twoslash
// @noErrors
// @require   https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js#sha256-…
declare const QRCode: { toDataURL(text: string): Promise<string> };
// ---cut---
globalNativeApi.registerMenuCommand(
  "Show QR",
  async (ctx) => {
    const ref = ctx.clips[0];
    if (ref?.type !== "text") return;
    const body = await globalNativeApi.getClipBody(ref);
    if (body?.type !== "text" || !body.text) return;

    const dataUrl = await QRCode.toDataURL(body.text);
    document.body.innerHTML = `<img src="${dataUrl}" style="display:block" />`;

    await globalNativeApi.showPanel({
      width: 280,
      height: "auto",
      placement: "center",
    });
  },
  { matchClip: ["text"] },
);
```

## 2. Tokenize Chinese / English text

```ts twoslash
function tokenize(text: string): string[] {
  // naive: split on whitespace + per-CJK-character
  const out: string[] = [];
  for (const w of text.split(/\s+/)) {
    if (!w) continue;
    if (/[\u4e00-\u9fff]/.test(w)) out.push(...w.split(""));
    else out.push(w);
  }
  return out;
}

globalNativeApi.registerMenuCommand(
  "Tokenize",
  async (ctx) => {
    const ref = ctx.clips[0];
    if (ref?.type !== "text") return;
    const body = await globalNativeApi.getClipBody(ref);
    if (body?.type !== "text" || !body.text) return;
    const tokens = tokenize(body.text);
    await globalNativeApi.notification({
      title: "Tokenize",
      body: `${tokens.length} tokens`,
    });
  },
  { matchClip: ["text"] },
);
```

## 3. Save image clip to disk

```ts twoslash
globalNativeApi.registerMenuCommand(
  "Save as PNG",
  async (ctx) => {
    const ref = ctx.clips[0];
    if (ref?.type !== "image") return;
    const body = await globalNativeApi.getClipBody(ref);
    if (body?.type !== "image" || !body.bytes) return;

    await globalNativeApi.saveFile(body.bytes, {
      filename: `clip-${ref.hash.slice(0, 8)}.png`,
      mime: "image/png",
    });
  },
  { matchClip: ["image"] },
);
```

## 4. Background OCR backfill

`@run-at background` lets the script run as soon as the plugin starts.
Here we listen for new image clips and write back recognised text.

```ts twoslash
// ==UserScript==
// @run-at  background
// ==/UserScript==

// @noErrors
declare function callOcr(bytes: Uint8Array): Promise<string>;
// ---cut---
globalNativeApi.addClipboardListener("image", async (e) => {
  const body = await globalNativeApi.getClipBody(e);
  if (body?.type !== "image" || !body.bytes) return;
  const text = await callOcr(body.bytes);
  if (!text) return;
  await globalNativeApi.setClipMetadata(e, { ocrText: text });
  globalNativeApi.log("ocr done", e.hash, text.length);
});
```

## 5. Read script info for logging

```ts twoslash
const { name, version, scriptId } = globalNativeApi.info;
//        ^?
globalNativeApi.log(`[${name} v${version}] booted`, scriptId);
```
