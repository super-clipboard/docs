# `globalNativeApi`

> 完整签名见类型包 [`spec.d.ts`](https://github.com/super-clipboard/userscript-types/blob/main/spec.d.ts)
> 中的 `SuperClipboard.GlobalNativeApi`。本页按分类列出所有方法，
> 代码块使用标准 TypeScript 语法高亮。

```ts
globalNativeApi.info;
```

## 分类速查

| 分类 | 同步 / 异步 | 方法 |
|------|-----------|------|
| [菜单](#菜单) | 同步 | `registerMenuCommand` `unregisterMenuCommand` |
| [事件订阅](#事件订阅) | 同步 | `addClipboardListener` `removeClipboardListener` `addAppListener` `addPanelListener` |
| [数据读写](#数据读写) | 异步 | `getClipBody` `setClipMetadata` |
| [KV 存储](#kv-存储) | 异步 | `setValue` `getValue` `deleteValue` `listValues` |
| [输出 / IO](#输出-io) | 异步 | `notification` `saveFile` `copyLocalFile` |
| [日志](#日志) | 同步 | `log` `warn` `error` |
| [面板](#面板) | 异步 | `showPanel` `resizePanel` `closePanel` |
| [元信息](#元信息) | 同步 | `info` |

---

## 菜单

### `registerMenuCommand(name, callback, options?)`

注册一条出现在剪贴项右键菜单中的命令。

```ts
const id = globalNativeApi.registerMenuCommand(
  "复制为链接",
  async (ctx) => {
    const target = ctx.clips[0];
    if (target?.type !== "text") return;
    const body = await globalNativeApi.getClipBody(target);
    if (body?.type === "text" && body.text) {
      utools.copyText(`<${body.text}>`);
    }
  },
  {
    matcher: (ctx) => ctx.clips.length === 1 && ctx.clips[0].type === "text",
  },
);
```

- 返回的 `id` 不在重启后保留；如需持久化命令，每次启动都重新注册。
- `options.matcher` 是命令级同步过滤函数——在脚本级 `@match-clip` 命中后再跑一次。
  必须为纯同步函数（不能使用 `async`/`await`/外部闭包变量），详见 `MenuMatcherContext`。
- ~~`options.matchClip`~~ 已弃用——与 `@match-clip` 语义重复，请改用 `@match-clip` + `options.matcher`。
- `options.accessKey`：单字符，作为菜单的快捷字母提示。

### `unregisterMenuCommand(id)`

```ts
declare const id: string;
// ---cut---
globalNativeApi.unregisterMenuCommand(id);
```

未知 id 是 no-op，不抛错。

---

## 事件订阅

### `addClipboardListener(event, handler)` / `removeClipboardListener`

```ts
const onAdded = (e: SuperClipboard.ClipboardAddedEvent) => {
  console.log("captured", e.type, e.hash);
};

globalNativeApi.addClipboardListener("added", onAdded);
// 取消订阅时务必传入同一个函数引用：
globalNativeApi.removeClipboardListener("added", onAdded);
```

四个 channel：`"added"`（任意类型）、`"text"`、`"image"`、`"file"`。
订阅特定类型比在 handler 内过滤更精确。

### `addAppListener(event, handler)`

```ts
globalNativeApi.addAppListener("visible", () => {
  // 主窗口每次变可见时触发（当前为占位，等待宿主实装）
});
```

> ⚠️ **占位 API**：当前宿主未实际 emit 任何 `app:*` 事件，
> 订阅是 no-op。后续版本会逐步落实。

### `addPanelListener(event, handler)`

```ts
globalNativeApi.addPanelListener("closed", () => {
  // 面板被用户或 closePanel() 关闭时触发（同样是占位）
});
```

> ⚠️ **占位 API**：同上。

---

## 数据读写

### `getClipBody(ref)`

读取一条 clip 的正文，按 `body.type` 走标签联合分支：

```ts
declare const ref: SuperClipboard.ClipRef;
// ---cut---
async function demo() {
  const body = await globalNativeApi.getClipBody(ref);
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

返回 `null` 表示该 clip 已被宿主清理。

### `setClipOcrText(hash, ocrText)`

把 OCR 文本写入 image clip 对应的 `ocr/{hash}` 文档——这是宿主自己
维护的全局共享存储，所有脚本以及内置的图片文本搜索都会读取它，
并且不会随脚本卸载而丢失。

```ts
declare const clip: SuperClipboard.ClipRef & { hash: string };
// ---cut---
await globalNativeApi.setClipOcrText(clip.hash, "hello world");
```

- 按图片字节的 `hash` 内容寻址——相同图片只会保留一条 OCR 记录。
- 传空字符串可以记录“识别过、没有文字”的负向结果，避免重复识别。
- 旧的 `setClipMetadata` / `scriptData` 通道仍在类型定义中保留为
  `@deprecated`，但不被宿主搜索索引消费；如需写入“图片 OCR”请使用本 API。

---

## KV 存储

按**脚本身份**（安装来源 URL 派生）隔离的简单键值存储。

```ts
await globalNativeApi.setValue("settings", { autoOpen: true });
const s = await globalNativeApi.getValue<{ autoOpen: boolean }>("settings");

await globalNativeApi.deleteValue("settings");
const keys = await globalNativeApi.listValues();
```

- 值经 `JSON.stringify` 序列化；不要存 `Map` / `Set` / 函数。
- `getValue<T>` 在 key 不存在时返回 `undefined`。
- 不同脚本（不同安装 URL）无法读到彼此的 key，`@namespace` 是否相同都不影响隔离。

---

## 输出 / IO

### `notification(options | string)`

```ts
await globalNativeApi.notification({
  title: "完成",
  body: "已保存到 ~/Downloads/clip.png",
  timeoutMs: 4000,
});

// 字符串简写，等价于 { body: "..." }
await globalNativeApi.notification("已保存");
```

### `saveFile(content, options)`

```ts
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

- `content` 接受 `string` / `Uint8Array` / `ArrayBuffer`。
- 传入 `options.targetDir` 后，文件会直接写入该目录（依赖安装在 uTools 中的 Node 环境）；
  未指定时退回浏览器下载行为（使用 `<a download>` 触发，不返回路径）。
- `mime` 影响保存对话框默认扩展名。

### `copyLocalFile(srcPath, destPath)`

```ts
await globalNativeApi.copyLocalFile(
  "/Users/me/Downloads/source.png",
  "/Users/me/Pictures/dest.png",
);
```

- 在支持的 Node 环境下把本地文件或目录复制到另一个路径。
- 传入目录时会递归复制。
- 常用于文件类 clip、脚本面板里选定的任意路径。

---

## 日志

> ⚠️ **Deprecated**：请改用 `console.log` / `console.warn` / `console.error`。
> 宿主会拦截沙箱内的 `console.*` 调用，自动加上
> `[script:<name>] [console]` 前缀写入应用主日志文件
> (`utools.getPath('logs')/super-clipboard-next/...`) 并在设置 → 脚本 → 调试日志面板实时显示。
> 以下 API 仍可用但在 spec 中已 `@deprecated`，后续版本会移除。

```ts
console.log("ordinary", { hash: "abc" });
console.warn("unexpected condition");
console.error(new Error("boom"));
```

- 同步调用。
- 输出自动带 `[script:<name>]` 前缀，便于在 uTools 日志里检索。
- 抛 `Error` 给 bridge 也会被宿主记在 `error` 级，但显式 `console.error` 更清晰。

---

## 面板

每个脚本有**一个**自身 iframe；`showPanel` 仅修改其样式与可见性，
**不重建 DOM**，状态在 close/show 之间保留。

### `showPanel(options)`

```ts
await globalNativeApi.showPanel({
  width: 360,
  height: "auto",
  placement: "center",
  closeOnOutside: true,
});
```

- `placement`: `"menu-anchor" | "center" | "right" | "bottom"`。
- `width` / `height` 缺省时按 placement 取默认；`"auto"` 跟随 body 内容尺寸。
- `closeOnOutside` 默认 `true`；`modal` 默认 `false`。

### `resizePanel(size)`

```ts
await globalNativeApi.resizePanel({ width: 480, height: "auto" });
```

仅传需要修改的维度即可，省略的维度保持原值。面板已关闭时 no-op。

### `closePanel()`

```ts
await globalNativeApi.closePanel();
```

隐藏面板但**不卸载 iframe**。

---

## 元信息

### `info`

```ts
const info = globalNativeApi.info;

console.log(`[${info.name} v${info.version}] grants:`, info.grants);
```

只读，脚本启动时由宿主同步注入。`scriptId` 形如 `config/script/<sha1-16hex>`，
可用作日志的稳定来源标识。
