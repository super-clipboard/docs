# 脚本系统概述

> Super Clipboard 内置 Tampermonkey 风格的用户脚本系统：
> 单文件 `.user.ts` / `.user.js`，配合元数据头声明权限，
> 即可在剪贴板上扩展右键命令、后台监听、浮窗面板与脚本级存储。

## 脚本能做什么

| 能力 | 给用户/开发者的意义 |
|------|--------------------|
| **自定义右键命令** | 在文本 / 图片 / 文件剪贴项的菜单里追加任意操作。 |
| **后台监听** | 在剪贴板有新条目时实时响应（自动 OCR、去重、自动打标签…）。 |
| **浮窗面板** | 在历史列表旁边渲染你自己的 UI，做小工具、预览、对话框等。 |
| **脚本级存储** | 在你的脚本独占的 KV 空间里保存设置与缓存。 |
| **标注剪贴项** | 为 clip 写回 metadata（OCR 文本、语言、自定义标签），随后即可被搜索。 |
| **保存 / 复制文件** | 把图片 clip 直接落盘，或把本地文件复制到用户选定的目录。 |
| **复用 uTools 能力** | 调用宿主提供的 `utools.*`（复制文本、打开链接、系统对话框…）。 |
| **加载外部资源** | 通过 `fetch` 请求接口；通过 `@require` 引入第三方库（必须带 SRI 校验）。 |

脚本只关心「做什么」，菜单渲染、事件分发、权限校验、生命周期管理都由宿主负责。

## 60 秒感受一下

```ts
// ==UserScript==
// @name         复制为 Markdown 链接
// @namespace    com.example.md-link
// @version      0.1.0
// @match-clip   text
// @grant        utools.copyText
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.notification
// ==/UserScript==

globalNativeApi.registerMenuCommand("复制为 Markdown 链接", async (ctx) => {
  const ref = ctx.clips[0];
  if (ref?.type !== "text") return;
  const body = await globalNativeApi.getClipBody(ref);
  if (body?.type !== "text" || !body.text) return;
  utools.copyText(`<${body.text.trim()}>`);
  await globalNativeApi.notification({ body: "已复制为 Markdown" });
});
```

整段脚本到此为止 —— 在 *设置 → 脚本 → 新建* 里粘贴保存，
任意文本剪贴项的右键菜单里就会出现这条命令。完整流程见 [5 分钟上手](./quickstart)。

## 注入的两个全局

脚本运行时**可能**拿到两个全局对象 —— 取决于你在 `@grant` 里申请了哪些 API：

| 全局 | 用来做什么 |
|------|-----------|
| `globalNativeApi` | 本项目特有能力：菜单、剪贴项读写、KV、面板、文件 IO、OCR 写回、日志。 |
| `utools` | 宿主公开的 [uTools API](https://www.u.tools/docs/developer/api.html)：复制文本、调起浏览器、原生对话框等。少量管理 / 支付 API 被屏蔽，详见 [Grants](./grants)。 |

未声明的 API 都是 `undefined`。**始终申请最小必要的权限** ——
推荐用细粒度的 API 级 `@grant`（如 `@grant utools.copyText`、
`@grant globalNativeApi.saveFile`），这样用户一眼就能看清你的脚本碰了什么。

## 触发模式

| `@run-at` | 什么时候加载 |
|-----------|-------------|
| `foreground`（默认） | 用户打开主窗口后按需加载。适合菜单命令这类需要 UI 的脚本。 |
| `background` | 插件启动即加载，与主窗口可见性无关。适合纯监听器。 |

## 内置脚本

仓库自带几个脚本，既开箱即用、也是最直观的示例：

| 名称 | 作用 |
|------|------|
| **二维码生成** | 把当前文本生成二维码并在浮窗显示。 |
| **智慧分词** | 中文/混合文本分词，在浮窗里点选复制。 |
| **另存为…** | 文本 / 图片 clip 落盘，或选择目录直接写入。 |
| **自动 OCR 标注** | 后台监听新图片并写回 OCR 文本，让图片能用文字搜索。 |

任一脚本都可以卸载；卸载后插件不会静默重装。

## 下一步

- [5 分钟上手](./quickstart) —— 完整跑通一个脚本。
- [元数据头](./meta-headers) —— 所有 `@key` 一览。
- [Grant 与权限](./grants) —— 细粒度授权模型。
- [示例集](./examples) —— 常见场景拷贝即用。
- [发布脚本](./publishing) —— 把脚本推到市场。
- [`globalNativeApi` 参考](/zh/reference/global-native-api) —— 完整方法列表。
