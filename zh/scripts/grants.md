# Grant 与权限

脚本必须通过 `@grant` 声明它要使用的每个 API。宿主在调用时校验声明，
未声明的 API 会**立刻**以 `BridgeError { code: "GRANT_DENIED" }` 失败，
避免静默扩权。

> **一句话** —— 发布脚本时请逐个列出方法
> （`@grant utools.copyText`、`@grant globalNativeApi.saveFile`）。
> 通配 `@grant utools.*` 仅推荐在开发联调阶段使用，发布前请收紧。

## 两个命名空间，两种粒度

```text
@grant <namespace>.<method-or-wildcard>
       │           │
       │           └── 方法名，例如 `copyText`
       │               或 `*` 代表整个命名空间
       └── `utools` | `globalNativeApi`
```

| 粒度 | 示例 | 适用场景 |
|------|------|---------|
| **细粒度**（推荐） | `@grant utools.copyText` | 生产 / 发布脚本：用户能一眼看清你碰了哪些 API；后续 uTools 新增方法也不会偷偷扩大你的权限面。 |
| **通配** | `@grant utools.*` | 仅本地开发：方便快速试 API，不用每加一个方法就改 header。发布前请改为细粒度列表。 |

两种风格可以混写、可重复：

```text
// @grant   utools.copyText
// @grant   utools.showNotification
// @grant   globalNativeApi.registerMenuCommand
// @grant   globalNativeApi.getClipBody
// @grant   globalNativeApi.saveFile
```

## 校验规则

bridge 在每次调用时检查：**该 `namespace.method` 是否在你的 `@grant` 列表里？
或者你是否声明了对应的通配？**

| 你声明了 | `utools.copyText` 通过 | `globalNativeApi.saveFile` 通过 |
|----------|----------------------|--------------------------------|
| （没有） | ❌ `GRANT_DENIED` | ❌ `GRANT_DENIED` |
| `utools.*` | ✅ | ❌ |
| `utools.copyText` | ✅ | ❌ |
| `globalNativeApi.*` | ❌ | ✅ |
| `utools.*` + `globalNativeApi.saveFile` | ✅ | ✅ |

注入的全局对象（`utools`、`globalNativeApi`）只有在你声明了该 namespace 下
**至少一个** grant 时才会出现。未申请的方法在对象上根本不存在。

> **免授权 API**：`globalNativeApi.info` 无需任何 grant。
> 记录日志请直接使用 `console.log` / `console.warn` / `console.error`——
> 宿主会拦截沙箱内的 `console.*`，加上 `[script:<name>] [console]`
> 前缀写入应用主日志文件并显示在脚本调试面板。
> `globalNativeApi.log/warn/error` 仍可用但已 deprecated。

## `utools.*` 黑名单

即便声明了 `@grant utools.*`（或单独列了下面某个名字），宿主仍然拒绝暴露它们，
访问时返回 `undefined` / `GRANT_DENIED`：

| 类别 | 黑名单方法 | 原因 |
|------|-----------|------|
| **KV / DB** | `db`、`dbStorage`、所有 `db*` | KV 必须走 `globalNativeApi`，以保证按脚本 namespace 隔离。 |
| **插件生命周期** | `setFeature`、`removeFeature`、`getFeatures` | 否则脚本可以冒充 / 劫持 uTools 功能。 |
| **账号 / 支付** | `openPayment`、`fetchUserServerTemporaryToken`、`getUser*` | 钓鱼面，超出脚本职责。 |
| **事件订阅** | 所有 `on*` 方法 | 请用 `globalNativeApi.addClipboardListener` / `addAppListener` / `addPanelListener`，宿主会自动清理。 |

## 处理 grant 错误

`BridgeError` 是带 `code` 字段的普通 `Error`：

```ts twoslash
declare const ref: SuperClipboard.ClipRef;
// ---cut---
try {
  await globalNativeApi.setClipMetadata(ref, { foo: 1 });
} catch (e) {
  if (e instanceof Error && (e as any).code === "GRANT_DENIED") {
    console.warn("缺少 @grant globalNativeApi.setClipMetadata");
  }
}
```

其他可能见到的 `code`：

| `code` | 含义 |
|--------|------|
| `GRANT_DENIED` | 缺少该方法的 grant（或在黑名单中）。 |
| `METHOD_NOT_FOUND` | 拼写错误 / 宿主版本不匹配。 |
| `INVALID_PARAMS` | 参数结构不符合 schema。 |
| `BRIDGE_TIMEOUT` | 单次调用超出 `@timeout`。 |
| `INTERNAL_ERROR` | 宿主原生实现抛错。 |

## 发布前收紧清单

提交到 [脚本市场](./publishing) 前：

1. 先以 `@grant utools.*` / `@grant globalNativeApi.*` 把脚本跑通，
   记下实际调用过的每个方法。
2. 把通配改成逐个方法的细粒度声明。
3. 重新跑所有路径；如果出现 `GRANT_DENIED`，说明漏了一个调用 ——
   或是你可以直接删掉的死代码。
4. 最终的 header 就应该读起来像一份权限清单，用户在安装前会扫一眼。

## 脚本**不能**做什么

- **跨域 XHR**（Tampermonkey 的 `xmlhttpRequest`）—— 用 `fetch`，遵守 CORS。
- **任意文件系统访问** —— 写文件用 `globalNativeApi.saveFile`，
  复制本地文件用 `globalNativeApi.copyLocalFile`。
- **脚本间通信** —— 用 `setClipMetadata` 标注共享 clip，
  或者各自用 namespace 隔离的 KV 保存设置。
- **触达宿主 DOM / Cookie** —— 脚本在隔离 iframe 中运行。
