# `globalNativeApi`

> 完整签名见类型包 [`spec.d.ts`](https://github.com/super-clipboard/userscript-types/blob/main/spec.d.ts)
> 中的 `SuperClipboard.GlobalNativeApi`。本页按分类列出所有方法，
> 代码块使用 [TwoSlash](https://twoslash.netlify.app/) —— 把鼠标停在符号上可看完整类型。

```ts twoslash
globalNativeApi.info;
//              ^?
```

## 分类速查

| 分类 | 同步 / 异步 | 方法 |
|------|-----------|------|
| [菜单](#菜单) | 同步 | `registerMenuCommand` `unregisterMenuCommand` |
| [事件订阅](#事件订阅) | 同步 | `addClipboardListener` `removeClipboardListener` `addAppListener` `addPanelListener` |
| [数据读写](#数据读写) | 异步 | `getClipBody` `setClipMetadata` |
| [KV 存储](#kv-存储) | 异步 | `setValue` `getValue` `deleteValue` `listValues` |
| [输出 / IO](#输出-io) | 异步 | `notification` `saveFile` |
| [日志](#日志) | 同步 | `log` `warn` `error` |
| [面板](#面板) | 异步 | `showPanel` `resizePanel` `closePanel` |
| [元信息](#元信息) | 同步 | `info` |

---

## 菜单

### `registerMenuCommand(name, callback, options?)`

注册一条出现在剪贴项右键菜单中的命令。

```ts twoslash
const id = globalNativeApi.registerMenuCommand(
  "复制为链接",
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

- 返回的 `id` 不在重启后保留；如需持久化命令，每次启动都重新注册。
- `options.matchClip` 与元数据的 `@match-clip` 取交集。
- `options.accessKey`：单字符，作为菜单的快捷字母提示。

### `unregisterMenuCommand(id)`

```ts twoslash
declare const id: string;
// ---cut---
globalNativeApi.unregisterMenuCommand(id);
```

未知 id 是 no-op，不抛错。

---

## 事件订阅

### `addClipboardListener(event, handler)` / `removeClipboardListener`

```ts twoslash
const onAdded = (e: SuperClipboard.ClipboardAddedEvent) => {
  //                ^?
  globalNativeApi.log("captured", e.type, e.hash);
};

globalNativeApi.addClipboardListener("added", onAdded);
// 取消订阅时务必传入同一个函数引用：
globalNativeApi.removeClipboardListener("added", onAdded);
```

四个 channel：`"added"`（任意类型）、`"text"`、`"image"`、`"file"`。
订阅特定类型比在 handler 内过滤更精确。

### `addAppListener(event, handler)`

```ts twoslash
globalNativeApi.addAppListener("visible", () => {
  // 主窗口每次变可见时触发（当前为占位，等待宿主实装）
});
```

> ⚠️ **占位 API**：当前宿主未实际 emit 任何 `app:*` 事件，
> 订阅是 no-op。后续版本会逐步落实。

### `addPanelListener(event, handler)`

```ts twoslash
globalNativeApi.addPanelListener("closed", () => {
  // 面板被用户或 closePanel() 关闭时触发（同样是占位）
});
```

> ⚠️ **占位 API**：同上。

---

## 数据读写

### `getClipBody(ref)`

读取一条 clip 的正文，按 `body.type` 走标签联合分支：

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

返回 `null` 表示该 clip 已被宿主清理。

### `setClipMetadata(ref, partial)`

把 `partial` 浅合并到 clip 的 `scriptData[<你的 @namespace>]` 里。

```ts twoslash
declare const ref: SuperClipboard.ClipRef;
// ---cut---
await globalNativeApi.setClipMetadata(ref, {
  ocrText: "hello world",
  language: "en",
});
```

- 仅能写入**自己 namespace** 下的子对象。
- 多个脚本写不同 namespace 互不影响。
- 写入后该字段会被全文搜索索引（如果开启了 FTS）。

---

## KV 存储

按 `@namespace` 隔离的简单键值存储。

```ts twoslash
await globalNativeApi.setValue("settings", { autoOpen: true });
const s = await globalNativeApi.getValue<{ autoOpen: boolean }>("settings");
//    ^?

await globalNativeApi.deleteValue("settings");
const keys = await globalNativeApi.listValues();
//    ^?
```

- 值经 `JSON.stringify` 序列化；不要存 `Map` / `Set` / 函数。
- `getValue<T>` 在 key 不存在时返回 `undefined`。
- 不同脚本（不同 `@namespace`）无法读到彼此的 key。

---

## 输出 / IO

### `notification(options | string)`

```ts twoslash
await globalNativeApi.notification({
  title: "完成",
  body: "已保存到 ~/Downloads/clip.png",
  timeoutMs: 4000,
});

// 字符串简写，等价于 { body: "..." }
await globalNativeApi.notification("已保存");
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

- `content` 接受 `string` / `Uint8Array` / `ArrayBuffer`。
- 当前实现走 iframe 的 `<a download>` 触发浏览器下载，**不返回最终路径**。
- `mime` 影响系统的「保存为」对话框默认扩展名。

---

## 日志

```ts twoslash
globalNativeApi.log("ordinary", { hash: "abc" });
globalNativeApi.warn("unexpected condition");
globalNativeApi.error(new Error("boom"));
```

- 全部同步。
- 输出会带 `[script:<namespace>]` 前缀，便于在 uTools 日志里检索。
- 抛 `Error` 给 bridge 也会自动 `error` 一遍，但显式调用更清晰。

---

## 面板

每个脚本有**一个**自身 iframe；`showPanel` 仅修改其样式与可见性，
**不重建 DOM**，状态在 close/show 之间保留。

### `showPanel(options)`

```ts twoslash
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

```ts twoslash
await globalNativeApi.resizePanel({ width: 480, height: "auto" });
```

仅传需要修改的维度即可，省略的维度保持原值。面板已关闭时 no-op。

### `closePanel()`

```ts twoslash
await globalNativeApi.closePanel();
```

隐藏面板但**不卸载 iframe**。

---

## 元信息

### `info`

```ts twoslash
const info = globalNativeApi.info;
//    ^?

console.log(`[${info.name} v${info.version}] grants:`, info.grants);
```

只读，脚本启动时由宿主同步注入。`scriptId` 形如 `config/script/<sha1-16hex>`，
可用作日志的稳定来源标识。
