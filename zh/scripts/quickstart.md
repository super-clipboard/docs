# 5 分钟上手

> 从零写一条菜单命令：右键文本剪贴项 → **复制为 Markdown 链接**。

## 第 1 步 · 在插件中新建脚本

1. 进入设置 → **脚本** → 右上角 **新建**。
2. 编辑器会预填一个最小模板（含元数据头）。
3. 把内容替换为下面整段，**保存**即生效。

## 第 2 步 · 完整代码

```ts twoslash
// ==UserScript==
// @name         复制为 Markdown 链接
// @namespace    com.example.copy-as-md-link
// @version      0.1.0
// @description  右键文本条目 → 把 URL 包成 [text](url)
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.*
// @grant        utools.*
// ==/UserScript==

globalNativeApi.registerMenuCommand(
  "复制为 Markdown 链接",
  async (ctx) => {
    const target = ctx.clips[0];
    if (!target || target.type !== "text") return;

    const body = await globalNativeApi.getClipBody(target);
    //    ^?
    if (body?.type !== "text" || !body.text) return;

    const url = body.text.trim();
    utools.copyText(`[${new URL(url).hostname}](${url})`);
    await globalNativeApi.notification({ title: "已复制", body: url });
  },
  { matchClip: ["text"] },
);
```

把鼠标悬停在 `body` 标识上 —— TwoSlash 会显示完整类型（来自
[`spec.d.ts`](https://github.com/super-clipboard/userscript-types/blob/main/spec.d.ts)）。

## 第 3 步 · 试运行

1. 复制任意 URL，例如 `https://viteplus.dev/guide/`。
2. 进入 Super Clipboard，右键这条记录。
3. 选择 **复制为 Markdown 链接** → 看到桌面通知，剪贴板内容变成
   `[viteplus.dev](https://viteplus.dev/guide/)`。

## 关键点解读

### `@grant`

```text
// @grant        globalNativeApi.*
// @grant        utools.*
```

仅声明这两个**粗粒度** scope；未声明则对应全局为 `undefined`，
且 bridge 会以 `GRANT_DENIED` 拒绝调用。详见 [Grants](./grants)。

### `@match-clip`

限定菜单只在指定 clip 类型上展示（这里只显示在 `text` 上）。
也可以在调用 `registerMenuCommand` 时通过 `options.matchClip` 二次收紧
（取交集）。

### `ctx.clips`

```ts twoslash
declare const ctx: SuperClipboard.MenuCallbackContext;
// ---cut---
ctx.clips;
// ^?
ctx.trigger;
// ^?
```

`clips` 始终是数组（多选场景下长度 > 1）；`trigger` 是用户实际右键的那一条，
用于做面板锚点。

## IDE 类型补全（在仓库外开发时）

如果你在 Super Clipboard 之外（例如自己的项目）开发脚本，安装类型包：

```bash
pnpm add -D @super-clipboard/userscript-types
```

然后用三斜线引用：

```ts
/// <reference types="@super-clipboard/userscript-types" />
```

或在 `tsconfig.json` 中：

```json
{
  "compilerOptions": {
    "types": ["@super-clipboard/userscript-types"]
  }
}
```

## 下一步

- [元数据头](./meta-headers) —— 所有 `@directive`
- [示例集](./examples) —— 二维码 / 分词 / 另存为 / 自动 OCR 的逐行解析
- [API 参考](/zh/reference/global-native-api) —— 完整方法列表
