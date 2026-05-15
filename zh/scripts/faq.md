# 常见问题（FAQ）

## 调用 API 抛 `GRANT_DENIED`

只声明了对应的 `@grant`，还是被拒？检查：

1. 写法是否完整：`@grant utools.*` 或 `@grant globalNativeApi.*`，
   不接受细粒度 `@grant utools.copyText`。
2. 是否调用了 [utools 黑名单](./grants#utools-黑名单)中的方法，
   例如 `utools.db`、`utools.setFeature`、`utools.openPayment`。
3. 元数据头有没有被注释掉（`/* */` 包住）—— 解析器跳过非 `// @key` 形式的行。

## `@require` 加载失败 / SRI 校验不过

- 检查域名是否在白名单：`registry.npmmirror.com` / `cdn.jsdelivr.net` / `unpkg.com`。
- 重新计算哈希：

  ```bash
  curl -sL "<your-url>" | openssl dgst -sha256 -binary | base64
  ```

  把 `sha256-<base64>` 拼到 URL 后面。

- 注意 `npmmirror` 的版本号是 unpkg 风格的目录路径：
  `https://registry.npmmirror.com/<pkg>/<version>/files/<path>`。

## `showPanel` 弹不出来 / 闪一下就消失

- `closeOnOutside` 默认 `true`，触发面板的鼠标事件本身可能立刻被识别为 *outside click*。
  在事件回调结尾不要再 `await` 长任务后才 `showPanel`，应**先 showPanel 再做后续工作**。
- iframe 内的 DOM 必须有可见尺寸；如果 body 完全空，`height: "auto"` 会算成 0。
- 多个脚本同时 `showPanel` 只会显示最后一个；先关旧的再开新的。

## `getClipBody` 返回 `null` / 字段为空

- `null` 表示该 clip 已被宿主清理（自动过期 / 用户删除）。
- 文本 clip 的 `body.text` 可能 `undefined`（极大文本未预加载），用 `body.text || body.preview` 兜底。
- 图片 clip 的 `body.bytes` 在某些场景仅返回 `preview`（base64 缩略图）；判断 `if (body.bytes)`。

## 如何在脚本里访问系统级 API

不行 —— 脚本运行在 iframe 沙箱内，无法直接调用嬿主进程。脚本能拿到的只有：

- `globalNativeApi.*` 提供的封装能力（剪贴板 / 文件 / 通知 / OCR 写回）；
- `utools.*` 子集（去掉黑名单）；
- iframe 默认的 web 平台 API（`fetch` / `Worker` / `IndexedDB` / `crypto.subtle` …）。

如需新能力，请在主仓库提 issue 讨论加入 `globalNativeApi`。

## 脚本能跨 namespace 共享数据吗

KV 是按 `@namespace` 严格隔离的，无法直接读取其他脚本的 key。

替代方案：

- 通过 `globalNativeApi.setClipMetadata` 写入 clip 自身的 `scriptData[<ns>]`，
  其他脚本可在 `getClipBody` / `addClipboardListener` 时通过宿主返回的 `ClipMeta`
  读取（**仅可读自己 namespace 的子对象**）。
- 借助系统剪贴板做信号传递（不推荐，会污染历史）。

## 后台脚本 (`@run-at background`) 什么时候执行

- 插件加载完毕、监听器启动后即执行，与主窗口可见性无关。
- 用户禁用 / 卸载脚本时被销毁。
- 如果脚本 throw / 死循环超过 `@timeout`，会被 bridge 强制结束。

## `notification` 没有弹窗

- macOS：检查「系统设置 → 通知 → uTools」是否允许。
- Windows：通知中心被关闭时不显示。
- Linux：依赖系统 `notify-send`；轻量发行版可能默认未装。

## 脚本崩了怎么办

- 进入 **设置 → 脚本** 看错误日志（每个脚本最近一次 error 会保留）。
- 临时禁用脚本（开关），不影响其他脚本。
- 用 `globalNativeApi.error()` 主动写日志，比 `throw` 更易定位。

## 类型补全不生效

- 确认 `@super-clipboard/userscript-types` 已安装。
- 在脚本顶部加 `/// <reference types="@super-clipboard/userscript-types" />`，
  或在 `tsconfig.json.compilerOptions.types` 中加入。
- 文件后缀建议 `.user.ts` —— `.user.js` 也能跑，但 IDE 提示弱。
