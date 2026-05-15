# Grant 与沙箱

> Super Clipboard 的脚本权限模型**只有两个开关**。声明哪个 grant，就注入对应的全局；
> 没声明，对应全局直接 `undefined`。

## 两个 Grant Token

```ts twoslash
// @noErrors
import { GRANT_TOKENS } from "@super-clipboard/userscript-engine/meta/grants";

GRANT_TOKENS;
// ^?
```

| Token | 注入的全局 | 典型用途 |
|-------|-----------|---------|
| `utools.*` | `utools` | 复制 / 通知 / 调起浏览器 / 文件选择 |
| `globalNativeApi.*` | `globalNativeApi` | 项目自有的剪贴板 / 面板 / KV / 文件 IO |

声明方式（多次调用，不要写一行）：

```text
// @grant        utools.*
// @grant        globalNativeApi.*
```

## utools 黑名单

`utools.*` 暴露的不是完整 uTools API，而是经黑名单过滤后的子集。

被屏蔽的方法：

| 类别 | 方法 | 屏蔽原因 |
|------|------|---------|
| **数据库** | `db` `dbStorage` `dbCryptoStorage` | 脚本应用 `globalNativeApi.{set,get}Value` 隔离的 KV，不直接读写宿主主库 |
| **特性注册** | `setFeature` `removeFeature` | 与宿主插件配置冲突 |
| **支付 / 账号** | `openPayment` `fetchUserPayments` `openPurchase` `isPurchasedUser` `getUserServerTemporaryToken` `fetchUserServerTemporaryToken` | 敏感，无脚本使用场景 |
| **生命周期** | 所有以 `on` 开头的方法（`onPluginEnter` 等） | 脚本应通过 `globalNativeApi.addAppListener` 订阅，宿主统一多路复用 |

调用被屏蔽的方法会抛 `TypeError`（属性为 `undefined`）。

## `globalNativeApi` 概览

完整签名见 [API 参考](/zh/reference/global-native-api)。一句话分类：

| 分类 | 方法 |
|------|------|
| 菜单 | `registerMenuCommand` / `unregisterMenuCommand` |
| 监听 | `addClipboardListener` / `addAppListener` / `addPanelListener` / `removeClipboardListener` |
| 数据 | `getClipBody` / `setClipMetadata` |
| KV | `setValue` / `getValue` / `deleteValue` / `listValues` |
| 输出 | `notification` / `log` / `warn` / `error` / `saveFile` |
| 面板 | `showPanel` / `resizePanel` / `closePanel` |
| 元信息 | `info` |

## 沙箱细节

每个脚本运行在独立 `<iframe>`：

```html
<iframe sandbox="allow-scripts allow-downloads" srcdoc="...">
```

- **`allow-scripts`** —— 允许执行 JS（必需）。
- **`allow-downloads`** —— 让 `globalNativeApi.saveFile` 触发的 `<a download>` 真正下载。
- **`allow-same-origin` 缺失** —— iframe 处于 *opaque origin*；
  无法访问宿主 `localStorage` / `cookie` / 父窗口 DOM。
- **postMessage IPC** —— `utools.*` / `globalNativeApi.*` 全部走父子窗口通信。
  调用都是 Promise（即使 utools 原签名同步）。

## Bridge 错误码

脚本捕获到的 `BridgeError.code` 可能取值：

| code | 含义 |
|------|------|
| `GRANT_DENIED` | 调用了未在 `@grant` 中声明的 scope |
| `METHOD_NOT_FOUND` | 方法名拼错 / utools 黑名单 |
| `BRIDGE_TIMEOUT` | 单次调用超出 `@timeout`（默认 30 s） |
| `INVALID_PARAMS` | 参数序列化失败 / 类型校验未过 |
| `INTERNAL_ERROR` | 宿主侧异常（详细信息走 `globalNativeApi.error`） |

## 没有 `xmlhttpRequest` / `@connect`

不同于 Tampermonkey，本项目**故意不暴露** `GM_xmlhttpRequest`。需要联网时：

- 走 iframe 的原生 `fetch` —— 受同源策略限制，目标 server 必须开 CORS。
- 或用 `utools.shellOpenExternal` 让用户在浏览器里完成跨域操作。
- 重要数据走 `globalNativeApi.setValue` 持久化，不要假定网络长期可用。
