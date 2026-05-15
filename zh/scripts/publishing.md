# 发布脚本

> 把脚本提交到 [`super-clipboard/userscripts`](https://github.com/super-clipboard/userscripts)
> 仓库后，会出现在插件内的 **脚本市场**，所有用户都能一键安装。

## 仓库结构

```
super-clipboard/userscripts/
  scripts/
    <kebab-case-id>/
      <kebab-case-id>.user.js     # 脚本本体（含元数据头）
      README.md                   # 简短说明 + 截图
      package.json                # 可选：声明依赖、tags
```

`<kebab-case-id>` 必须与脚本的 `@namespace` 末段一致，例如：

```text
// @namespace    com.example.json-format
```

→ 目录命名为 `json-format/`。

## 提交流程

1. Fork [super-clipboard/userscripts](https://github.com/super-clipboard/userscripts)。
2. 在 `scripts/` 下新建你的目录，按上面结构放入文件。
3. 本地校验（在仓库根）：

   ```bash
   pnpm validate
   ```

   该脚本会调用 `@super-clipboard/userscript` 的 parser，检查：
   - 元数据字段完整 / 合法
   - `@grant` 在白名单内
   - `@require` URL 在白名单注册表 + 含 SRI
   - 文件名 / 目录名与 `@namespace` 末段匹配

4. 提交 PR；CI 会重跑 `pnpm validate` 并构建市场索引（`scripts.index.json`）。
5. Maintainer 审核合并后，下次插件启动会自动拉取新索引。

## 版本与升级

- `@version` 走语义化版本。
- 用户已安装的脚本，启动时会比对 `scripts.index.json` 中的最新 `version`，
  若更高则**仅在脚本管理页提示**，不会自动覆盖（避免行为意外变化）。
- 如果脚本含 `@updateURL`，可指定独立的 `.user.js` 直链覆盖默认源。
- `internal://<id>` 形式的 `@updateURL` 是仓库**内置脚本**专用，不要用于第三方脚本。

## README 规范

最少包含：

- **一句话作用** —— 插入用户菜单后会做什么。
- **触发条件** —— 哪种 clip 类型 / 是否多选支持。
- **截图 / GIF** —— 一张就够，能看出最终效果即可。
- **权限说明** —— 列出 `@grant` 与原因。
- **依赖** —— 列出 `@require`（含来源与许可证）。

## 内置脚本 vs 市场脚本

| 维度 | 内置 | 市场 |
|------|------|------|
| 安装时机 | 首次启动种入；嬿主升级内置包时重装 | 用户在市场页主动点装 |
| 用户删除后 | 不会自动重装 | 不会自动重装 |
| 更新源 | `@updateURL internal://<id>` | 默认走仓库索引；可选自定义 URL |
| 适用范围 | 高频 / 通用工具（QR、分词、另存为） | 任何垂直需求 |

如果你的脚本特别通用、希望开箱即用，可以在 PR 里申请「内置候选」，
maintainer 会评估是否纳入。

## 推荐做法

- **命名空间** 用反域名：`com.<author>.<id>`，避免冲突。
- **Tags**（`@tag`）至少加一个：`text` / `image` / `file` / `utility` / `ai` …
  会出现在市场筛选里。
- **Timeout** 评估单次回调的最坏耗时，避免默认 30 s 偏长（OCR 等长任务除外）。
- **依赖最小化** 优先用 iframe 内置 API；外部库通过 `@require` 引入并锁定具体版本。
- **`globalNativeApi.error`** 写日志而不是 `throw` —— 让用户能在脚本管理页看见。
