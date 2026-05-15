# 脚本系统概述

> Super Clipboard 提供 Tampermonkey 风格的用户脚本系统：单文件 TypeScript / JavaScript，
> 配合元数据头声明权限，运行在隔离沙箱中。

## 设计原则

1. **零构建** —— 直接写一份 `.user.ts` / `.user.js`，无需打包工具。
2. **类型优先** —— 全部 API 由 `@super-clipboard/userscript-types` 提供 `.d.ts`，IDE 即时补全。
3. **沙箱隔离** —— 每个脚本运行在独立 iframe（`sandbox="allow-scripts allow-downloads"`），
   不能触达宿主内部模块。
4. **粗粒度授权** —— 仅两个 `@grant` 标记（`utools.*` / `globalNativeApi.*`），
   未声明则不注入对应全局。
5. **白名单子集** —— uTools 原生 API 经[黑名单](./grants#utools-黑名单)过滤后暴露，
   屏蔽 `db*` / `setFeature` / 支付 / 账号等敏感接口。

## 运行模型

```
┌──────────────────────────────────────────────────┐
│ Super Clipboard 主窗口（宿主）                    │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ <iframe sandbox="allow-scripts allow-...">│  │
│  │   • 你的脚本代码                            │  │
│  │   • 按需注入的 globalNativeApi / utools     │  │
│  │   ↕ postMessage 位于 iframe 与宿主之间       │  │
│  └────────────────────────────────────────────┘  │
│           ↓ bridge 路由（权限校验 / 超时 / 错误码）  │
│           ↓                                       │
│        宿主提供的原生能力（剪贴板 / 文件 / 通知 / OCR）│
└──────────────────────────────────────────────────┘
```

- **iframe** —— 脚本的实际执行容器；有自己的 `document`，可挂任意 DOM。
- **bridge** —— 宿主端的消息路由，所有 API 调用都经此转发；
  负责权限校验、参数序列化、错误归因（错误码包括 `GRANT_DENIED` / `BRIDGE_TIMEOUT` 等）。
- **原生能力** —— 剪贴板读写、文件 IO、系统通知、OCR 等由宿主统一提供；
  脚本不需（也无法）直接接触底层进程或文件系统。

## 注入到 iframe 的全局

| 全局 | 启用条件 | 来源 |
|------|----------|------|
| `globalNativeApi` | `@grant globalNativeApi.*` | 项目自有（[Reference](/zh/reference/global-native-api)） |
| `utools` | `@grant utools.*` | uTools 原生（去掉黑名单），见 [Grants](./grants) |
| `console` / `fetch` / `setTimeout` … | 始终可用 | iframe 默认 |

未声明 grant 的全局会被 `delete` 掉；即使脚本绕过 IDE 检查直接调用，
bridge 也会以 `GRANT_DENIED` 拒绝。

## 生命周期

| 时机 | 说明 |
|------|------|
| **解析** | 启动时 / 安装时校验元数据 |
| **加载** | 按需创建 iframe；同一脚本只持有一个 iframe（重新触发会复用） |
| **执行** | iframe `srcdoc` 内联脚本源码 + bootstrap |
| **常驻** | iframe 不销毁；`closePanel()` 仅修改样式，DOM 与 JS 状态保留 |
| **卸载** | 用户在脚本管理页禁用 / 删除时，iframe 才被移除 |

`@run-at` 暂仅 `foreground`（仅在主窗口可见时执行）与 `background`（无界面长驻）两档。

## 内置脚本

仓库自带几个示例脚本，首次启动种入：

| 脚本 | 用途 | 演示要点 |
|------|------|---------|
| **二维码生成** | 把当前文本生成二维码 | `@require` 外部 UMD + `showPanel` |
| **智慧分词** | 中文分词浮窗 | `utools.copyText` + DOM 交互 |
| **另存为** | 文本 / 图片下载 | `getClipBody` + `saveFile` |
| **自动 OCR 标注** | 后台 OCR 写回 metadata | `addClipboardListener` + `setClipMetadata` |

可参考 [示例集](./examples) 的逐行解析。

## 接下来

- [5 分钟上手](./quickstart) —— 完整跑通一个脚本
- [元数据头](./meta-headers) —— 所有 `@directive` 一览
- [Grant 与沙箱](./grants) —— 授权模型 + uTools 黑名单
- [API 参考](/zh/reference/global-native-api) —— 每个方法 + 类型化示例
