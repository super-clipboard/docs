# `globalNativeApi`

完整 API 在类型包 [`spec.d.ts`](https://github.com/super-clipboard/userscript-types/blob/main/spec.d.ts)
中的 `SuperClipboard.GlobalNativeApi` 接口下。本页提供高层概览，详细签名以
类型文件为准。

## 分类

| 分类 | 方法 |
|------|------|
| 菜单 / 订阅（同步） | `registerMenuCommand` `unregisterMenuCommand` `addClipboardListener` `removeClipboardListener` `addAppListener` `addPanelListener` |
| 数据访问（异步） | `getClipBody` `setClipMetadata` |
| 存储（异步） | `setValue` `getValue` `deleteValue` `listValues` |
| 用户交互（异步） | `notification` `saveFile` `showPanel` `resizePanel` `closePanel` |
| 诊断（同步） | `log` `warn` `error` `info` |

## 监听新剪贴项

```ts
globalNativeApi.addClipboardListener("added", (e) => {
  // e: SuperClipboard.ClipboardAddedEvent
  globalNativeApi.log("captured", e.type, e.hash);
});
```

`ClipboardEventMap` 提供四个 key：`added`（任何类型）、`text`、`image`、`file`。
订阅特定类型比在 handler 内部过滤更精确。

## 读取剪贴项正文

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

返回类型是 `SuperClipboard.ClipBodyContent | null` —— 按 `type` 区分的标签联合。

## 脚本作用域存储

`getValue` / `setValue` 按脚本的 `@namespace` 隔离：

```ts
await globalNativeApi.setValue("counter", 1);
const counter = await globalNativeApi.getValue<number>("counter", 0);
```

两个不同 `@namespace` 的脚本无法读取彼此的 key。

## 挂载面板

```ts
await globalNativeApi.showPanel({
  url: "panel.html",
  placement: "right",
  width: 360,
});
```

`placement` 取值为 `"menu-anchor" | "center" | "right" | "bottom"`。`width` /
`height` 都是可选，缺省时使用与 placement 匹配的默认值。
