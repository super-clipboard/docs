# 元数据头（`==UserScript==`）

每个脚本必须以一段元数据注释开头：

```text
// ==UserScript==
// @name         脚本展示名
// @namespace    com.example.unique-id
// @version      0.1.0
// ...
// ==/UserScript==
```

## 必填字段

| 字段 | 含义 | 备注 |
|------|------|------|
| `@name` | 展示名 | 出现在脚本管理页和右键菜单 |
| `@namespace` | 命名空间 | 反向域名风格；KV 存储与 metadata 写入按此隔离 |
| `@version` | 语义化版本 | `x.y.z` 格式；`updateURL` 升级会比对此值 |

任一缺失会抛 `META_FIELD_MISSING`，脚本不会被装载。

## 可选字段

| 字段 | 默认 | 取值 | 说明 |
|------|------|------|------|
| `@description` | — | 任意文本 | 简短描述 |
| `@author` | — | 任意文本 | 作者名 |
| `@icon` | — | URL | 列表中的图标 |
| `@run-at` | `foreground` | `foreground` / `background` | `background` 表示后台常驻、不绑定主窗口可见性 |
| `@match-clip` | 全部 | `text` / `image` / `file`，可多次 | 限定菜单出现的 clip 类型 |
| `@grant` | — | `utools.*` / `globalNativeApi.*` | 见下文与 [Grants](./grants) |
| `@require` | — | `https://...#sha256-...` | 加载外部 JS（必须 SRI 校验） |
| `@timeout` | 30 000 ms | 1 ~ 120 000 | 单次 callback 调用的超时上限 |
| `@updateURL` | — | URL / `internal://<id>` | 升级源；`internal://` 走内置脚本 |
| `@tag` | — | 字符串，可多次 | 在脚本市场中作为筛选标签 |
| `@preinstall` | — | `true` / `false` | 标记内置脚本，首次启动种入 |

未识别的 `@key` **不会报错**，会被原样保留在 `ParsedMeta.raw[key]` 里供未来扩展。

## `@grant` 详解

只接受两个值：

```text
// @grant        utools.*
// @grant        globalNativeApi.*
```

任何其他写法（包括细粒度的 `@grant utools.copyText`）都会以 `META_FIELD_INVALID` 拒绝。
详细授权语义见 [Grant 与沙箱](./grants)。

## `@require` 与 SRI

为了防止运行期被篡改，外部依赖**必须**附带子资源完整性哈希：

```text
// @require https://registry.npmmirror.com/qrcode-encoder/1.3.0/files/dist/iife/qrcode-encoder.iife.js#sha256-5KyVbh3LWYvV9VB/OSCGI2JLqBoIulvKW0af8TISAMA=
```

支持 `sha256` / `sha384` / `sha512`。校验失败时脚本不会运行，错误会显示在脚本管理页。

> 当前**白名单**（即可信注册表）：
>
> - `registry.npmmirror.com`
> - `cdn.jsdelivr.net`
> - `unpkg.com`
>
> 其他域名会被拒绝，避免脚本任意拉取代码。

## `@match-clip` 与 `options.matchClip`

两层过滤会取交集：

```text
// @match-clip   text
// @match-clip   image
```

```ts
globalNativeApi.registerMenuCommand("Decode QR", onDecode, {
  matchClip: ["image"], // 仅在 image 上出现
});
```

最终命令只在 `image` 类型 clip 上可见。

## 完整示例

```text
// ==UserScript==
// @name         二维码生成
// @namespace    com.superclipboard.builtin.qr
// @version      3.4.0
// @description  把当前文本剪贴板生成二维码并在浮窗显示
// @author       SuperClipboard
// @run-at       foreground
// @match-clip   text
// @grant        globalNativeApi.*
// @require      https://registry.npmmirror.com/qrcode-encoder/1.3.0/files/dist/iife/qrcode-encoder.iife.js#sha256-5KyVbh3LWYvV9VB/OSCGI2JLqBoIulvKW0af8TISAMA=
// @tag          text
// @tag          utility
// @timeout      10000
// ==/UserScript==
```
