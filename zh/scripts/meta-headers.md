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
| `@version` | 语义化版本 | `x.y.z` 格式；`updateURL` 升级会比对此值 |

任一缺失会抛 `META_FIELD_MISSING`，脚本不会被装载。

> **`@namespace` 现在是可选的。** v0.5 起系统从安装来源 URL 派生怕身份，
> `@namespace` 不再影响隔离、路由或安全。仍可保留作为人类可读的标签——
> 解析器接受但不要求必填。

## 可选字段

| 字段 | 默认 | 取值 | 说明 |
|------|------|------|------|
| `@namespace` | — | 可选，反向域名风格标签。不影响隔离，仅作可读标识。 |
| `@description` | — | 任意文本 | 简短描述 |
| `@author` | — | 任意文本 | 作者名 |
| `@icon` | — | URL | 列表中的图标 |
| `@run-at` | `foreground` | `foreground` / `background` | `background` 表示后台常驻、不绑定主窗口可见性 |
| `@match-clip` | 全部 | `text` / `image` / `file`，可多次 | 限定菜单出现的 clip 类型 |
| `@grant` | — | `<namespace>.<method>` 或 `<namespace>.*`，namespace 为 `utools` / `globalNativeApi` | 见下文与 [Grants](./grants) |
| `@require` | — | `https://...#sha256-...` | 加载外部 JS（必须 SRI 校验） |
| `@timeout` | 30 000 ms | 1 ~ 120 000 | 单次 callback 调用的超时上限 |
| `@updateURL` | — | URL / `internal://<id>` | 升级源；`internal://` 走内置脚本 |
| `@tag` | — | 字符串，可多次 | 在脚本市场中作为筛选标签 |
| `@preinstall` | — | `true` / `false` | 标记内置脚本，首次启动种入 |

未识别的 `@key` **不会报错**，会被原样保留在 `ParsedMeta.raw[key]` 里供未来扩展。

## `@grant` 详解

`@grant` 的格式是 `<namespace>.<method>` 或 `<namespace>.*`，namespace 为
`utools` 或 `globalNativeApi`。每用到一个 API 都重复一行：

```text
// @grant   utools.copyText
// @grant   utools.showNotification
// @grant   globalNativeApi.registerMenuCommand
// @grant   globalNativeApi.getClipBody
// @grant   globalNativeApi.saveFile
```

通配形式（`@grant utools.*`、`@grant globalNativeApi.*`）也被接受，
但**仅推荐在开发联调阶段使用**，发布前请改为逐个方法的细粒度声明。
详细授权语义见 [Grant 与权限](./grants)。

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

## `@match-clip` 与 `options.matcher`

`@match-clip` 是脚本级类型粗筛（同步、零开销），对所有命令生效：

```text
// @match-clip   text
// @match-clip   image
```

`options.matcher` 是命令级精筛——在 `@match-clip` 命中后再跑一次同步判断：

```ts
globalNativeApi.registerMenuCommand("Decode QR", onDecode, {
  matcher: (ctx) => ctx.clips.length === 1 && ctx.clips[0].type === "image",
});
```

- matcher 必须是**纯同步函数**，不能使用 `async`/`await`、不能引用外部闭包变量。
- `ctx.bodies` 仅包含 text/file 类型的同步缓存正文；image 字节不在其中（需异步读盘）。
- 若 cache 未命中（冷启动早期），对应 hash 不在 `ctx.bodies` 中，matcher 应回退到仅 type 判断。

### `options.matchClip`（已弃用）

`options.matchClip` 与 `@match-clip` 表达相同语义，已弃用。请改用 `@match-clip`（脚本级） + `options.matcher`（命令级条件）。

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
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// @grant        globalNativeApi.showPanel
// @require      https://registry.npmmirror.com/qrcode-encoder/1.3.0/files/dist/iife/qrcode-encoder.iife.js#sha256-5KyVbh3LWYvV9VB/OSCGI2JLqBoIulvKW0af8TISAMA=
// @tag          text
// @tag          utility
// @timeout      10000
// ==/UserScript==
```
