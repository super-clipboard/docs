# 示例集

> 以下示例展示常见脚本场景与 API 的典型组合。
> 鼠标悬停代码中的符号可查看完整类型。

## 1. 二维码生成（`@require` + `showPanel`）

利用 `@require` 拉取外部 UMD 库，把当前文本剪贴板生成 SVG 二维码并在浮窗展示。

```ts twoslash
// @noErrors
declare const QRCodeEncoder: {
  encode(text: string, opts?: { errorCorrection?: "L" | "M" | "Q" | "H" }): unknown;
  toSVG(modules: unknown): string;
};
// ---cut---
// @grant globalNativeApi.*
// @require https://registry.npmmirror.com/qrcode-encoder/1.3.0/files/dist/iife/qrcode-encoder.iife.js#sha256-…

globalNativeApi.registerMenuCommand("生成二维码", async (ctx) => {
  const target = ctx.clips[0];
  if (!target) return;

  const body = await globalNativeApi.getClipBody(target);
  const text = (body && (body.type === "text" ? body.text || body.preview : "")) || "";
  if (!text) return;

  const svg = QRCodeEncoder.toSVG(QRCodeEncoder.encode(text, { errorCorrection: "L" }));
  document.body.innerHTML = `<div>${svg}</div>`;

  await globalNativeApi.showPanel({ width: 240, height: 320, placement: "center" });
});
```

要点：

- `@require` 必须带 SRI 哈希，见 [元数据头 → @require](./meta-headers#require-与-sri)。
- `showPanel` 不会重建 iframe；面板关闭后 DOM 状态保留，再次打开速度极快。
- 如果二维码生成失败（payload 太大），通过 `notification` 告知用户。

## 2. 智慧分词（`@require` + DOM 交互 + `utools.copyText`）

```ts twoslash
// @noErrors
declare const Segmentit: {
  Segment: new () => unknown;
  useDefault: (s: unknown) => { doSegment(text: string, opt?: { simple?: boolean }): string[] };
};
// ---cut---
// @grant utools.*
// @grant globalNativeApi.*

const seg = Segmentit.useDefault(new Segmentit.Segment());

globalNativeApi.registerMenuCommand("智慧分词", async (ctx) => {
  const targets = ctx.clips ?? [];
  const bodies = await Promise.all(targets.map((c) => globalNativeApi.getClipBody(c)));
  const text = bodies
    .map((b) => (b?.type === "text" ? b.text || b.preview : "") || "")
    .filter((t) => t.trim())
    .join("\n");
  if (!text.trim()) return;

  const tokens = seg.doSegment(text, { simple: true });
  document.body.innerHTML = `<div id="r"></div>`;
  const r = document.getElementById("r")!;
  for (const t of tokens) {
    const span = document.createElement("span");
    span.textContent = t;
    span.onclick = () => utools.copyText(t);
    r.appendChild(span);
  }
  await globalNativeApi.showPanel({ width: 360, height: 320, placement: "center" });
});
```

要点：

- 多选下拼接所有文本再一次性分词。
- 子元素点击 → `utools.copyText` 复制单个词。

## 3. 另存为（`getClipBody` + `saveFile`）

```ts twoslash
// @grant globalNativeApi.*

globalNativeApi.registerMenuCommand("另存为...", async (ctx) => {
  const targets = ctx.clips ?? [];
  const baseTs = new Date().toISOString().replace(/[:.]/g, "-");

  for (const [idx, clip] of targets.entries()) {
    const body = await globalNativeApi.getClipBody(clip);
    if (!body) continue;
    const suffix = targets.length > 1 ? `-${idx + 1}` : "";

    if (body.type === "text") {
      await globalNativeApi.saveFile(body.text || body.preview || "", {
        filename: `clip-${baseTs}${suffix}.txt`,
        mime: "text/plain",
      });
    } else if (body.type === "image" && body.bytes) {
      await globalNativeApi.saveFile(body.bytes, {
        filename: `clip-${baseTs}${suffix}.png`,
        mime: body.mime ?? "image/png",
      });
    }
  }
});
```

要点：

- 文本 / 图片走不同分支（`body.type` 判别联合类型，IDE 会按分支收窄字段）。
- 多选时给文件名追加序号，避免下载冲突。

## 4. 后台 OCR 标注（`addClipboardListener` + `setClipMetadata`）

```ts twoslash
// @noErrors
// @grant globalNativeApi.*
// @run-at background

globalNativeApi.addClipboardListener("image", async (e) => {
  // 调用宿主提供的 OCR（这里假设挂在 utools 子集中；实际可能通过自定义 worker）
  const body = await globalNativeApi.getClipBody(e);
  if (body?.type !== "image" || !body.bytes) return;

  const text = await runOcr(body.bytes); // 你的实现
  if (!text) return;

  await globalNativeApi.setClipMetadata(e, { ocrText: text });
  globalNativeApi.log("ocr written", e.hash, text.length);
});

declare function runOcr(bytes: Uint8Array): Promise<string>;
```

要点：

- `@run-at background` —— 无界面常驻；适合事件监听类。
- `setClipMetadata` 写入 `scriptData["<你的 namespace>"]`；
  写入后该字段会被全文搜索索引，从而**用 OCR 文本搜图片**。

## 5. 复制为 Markdown 链接（带 `info` 自标识）

```ts twoslash
// @grant globalNativeApi.*
// @grant utools.*

const tag = `[${globalNativeApi.info.name} v${globalNativeApi.info.version}]`;

globalNativeApi.registerMenuCommand("复制为 Markdown 链接", async (ctx) => {
  const target = ctx.clips[0];
  if (target?.type !== "text") return;
  const body = await globalNativeApi.getClipBody(target);
  if (body?.type !== "text" || !body.text) return;

  try {
    const u = new URL(body.text.trim());
    utools.copyText(`[${u.hostname}](${u.href})`);
    globalNativeApi.log(tag, "copied", u.href);
  } catch {
    await globalNativeApi.notification("当前内容不是合法 URL");
  }
}, { matchClip: ["text"] });
```

要点：

- `globalNativeApi.info` 同步可读，无需 await。
- `notification` 接受字符串简写，等价于 `{ body: "..." }`。

---

更多示例可在 [refs/userscripts](https://github.com/super-clipboard/super-clipboard-next/tree/main/refs/userscripts/scripts)
找到（JSON 格式化、Base64 编解码、时间戳工具、大小写转换、OCR.space 集成等）。
