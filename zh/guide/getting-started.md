# 快速开始

> 五分钟写出第一个 Super Clipboard 自定义脚本。

## 1. 创建脚本

自定义脚本是带 Tampermonkey 风格头部注释的单文件 TypeScript。最小可运行示例：

```ts
// ==UserScript==
// @name         Hello Super Clipboard
// @namespace    com.example.hello
// @version      0.1.0
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// ==/UserScript==
```

所有运行时使用的 API 都必须在 `@grant` 中声明。宿主在 bridge 层会强制检查 ——
未授权的调用会直接抛错。

## 2. 引入类型补全

安装类型包：

```bash
pnpm add -D @super-clipboard/userscript-types
```

然后用以下任一方式启用 —— 在脚本顶部加三斜线引用：

```ts
/// <reference types="@super-clipboard/userscript-types" />
```

…或在 `tsconfig.json` 中全局开启：

```json
{
  "compilerOptions": {
    "types": ["@super-clipboard/userscript-types"]
  }
}
```

## 3. 注册一个菜单命令

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
  { kind: "text" },
);
```

右键任意文本剪贴项，就能看到 **复制为链接** 这条菜单。

## 4. 接下来

- [`globalNativeApi` 参考](/zh/reference/global-native-api) —— 每个方法的签名、
  示例与异步语义注释
- 类型包的 [`spec.d.ts`](https://github.com/super-clipboard/userscript-types/blob/main/spec.d.ts)
  是唯一权威源，与宿主同步发布
