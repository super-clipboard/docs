# 历史列表

历史页是插件的主战场，承载所有剪贴板条目的浏览、搜索和操作入口。

## 列表布局

![main](/main.webp)

- **左列时间** —— 相对时间（5 分钟前 / 昨天 / 2 月 14 日）。
- **中列内容** —— 文本预览 / 图片缩略图 / 文件名。
- **右列徽标** —— 置顶图钉、收藏星标、标签色块。

## 顶部分类 Tab

预设：**全部 / 文本 / 图片 / 文件 / 置顶 / 收藏**，加上你创建的每个标签。

- 按 <kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd> 顺序切换。
- 按 <kbd>←</kbd> <kbd>→</kbd> 同样切换；按 <kbd>Ctrl/Cmd</kbd> + <kbd>←</kbd> / <kbd>→</kbd> 跳到首/尾 Tab。
- 拖拽顺序、隐藏不用的 Tab 见分类布局设置。

## 搜索

- 任意位置开始打字会自动聚焦顶部 utools 搜索框（无需先点）。
- 中文输入法兼容：组合期间不会触发滚动 / 多选。
- 默认走 MiniSearch 全文倒排索引，支持前缀匹配与拼写容错。

退出插件后，搜索状态会在默认 5 秒后清空（可在设置中调整或关闭）。

### 高级搜索语法（Lucene 子集）{#高级搜索语法lucene-子集}

Super 剪贴板支持类 Lucene 查询语法，可组合字段过滤、布尔运算和时间范围。

> **Pro 专属**：字段过滤、布尔运算需要 Pro 订阅。精确子串匹配（`+term` / `"phrase"`）免费可用。

#### 文本子类型

| 语法 | 含义 |
|------|------|
| `is:url` | 整条文本就是一个 URL |
| `has:url` | 文本中包含 URL |
| `is:email` | 整条文本就是一个邮箱地址 |
| `has:email` | 文本中包含邮箱地址 |
| `is:color` | 整条文本就是一个颜色值（HEX / RGB / HSL） |
| `has:color` | 文本中包含颜色值 |
| `is:json` | 整条文本是合法 JSON |
| `is:phone` | 整条文本就是一个电话号码 |
| `has:phone` | 文本中包含电话号码 |

- `is:` = 完整匹配（同一性判断，如 GitHub `is:issue`）
- `has:` = 包含匹配（包含性判断，如 Gmail `has:attachment`）

#### 布尔属性

| 语法 | 含义 |
|------|------|
| `is:pinned` | 条目已置顶 |
| `is:starred` | 条目已收藏 |
| `-is:pinned` | 条目未置顶 |

#### 字段过滤

| 语法 | 含义 |
|------|------|
| `type:text` · `type:image` · `type:file` | 按剪贴板类型筛选 |
| `type:(image OR file)` | 图片或文件（多值 OR） |
| `app:Chrome` · `app:WeChat*` | 按来源应用筛选（支持 `*` 通配） |
| `tag:工作` | 按标签筛选（包含匹配） |
| `date:>7d` · `date:<30d` | 相对时间：最近 7 天 / 30 天前 |
| `date:[2024-01-01 TO 2024-12-31]` | 绝对时间范围 |
| `in:primary` · `in:remark` · `in:fileNames` | 限定全文搜索范围 |

#### 布尔运算

| 语法 | 含义 |
|------|------|
| `foo AND bar` | 同时包含 foo 和 bar |
| `foo OR bar` | 包含 foo 或 bar |
| `NOT foo` · `-foo` | 排除 foo |
| `+foo` | 必须包含 foo（精确子串） |
| `(a OR b) AND c` | 分组组合 |
| `"hello world"` | 短语搜索 |

#### 精确子串匹配（免费可用）

倒排索引以词为单位，搜索 `index` 不会命中 `reindexed` 这类词内含 `index` 的复合词。
使用以下语法可强制进行逐字符子串扫描：

| 语法 | 含义 |
|------|------|
| `+index` | 结果必须包含子串 `index`（如 `reindexed`、`createIndexBuffer`） |
| `"create index"` | 结果必须包含完整短语 `create index` |
| `+index -log` | 包含 `index` 且不含 `log`（`-log` 是 Pro 功能） |

> `+term` 不触发 Pro 闸门，任何用户均可使用。

## 多选模式

- 按 <kbd>Space</kbd> 进入多选并把当前条目计入选中；继续按 <kbd>Space</kbd> 增减选择。
- 多选模式下：
  - <kbd>Enter</kbd> —— **合并粘贴**：按从旧到新的顺序拼接所有选中条目，一次性粘出。
  - <kbd>Ctrl/Cmd</kbd> + <kbd>C</kbd> —— **合并复制**：仅写入剪贴板。
  - <kbd>Delete</kbd> —— 批量删除。
  - <kbd>Ctrl/Cmd</kbd> + <kbd>P</kbd> —— 批量切换置顶。
  - <kbd>Esc</kbd> —— 退出多选。

合并文本默认以换行分隔。脚本可通过菜单命令读取 `ctx.clips`（多选场景下长度 > 1）做自定义合并。

## 滚动到底自动加载

每屏会先渲染约 50 条；滚到底部 50px 内自动追加下一批，直到全部读取。
不需要翻页。

## 删除与清理

- 单条 / 多选删除立即生效，可在设置 → 数据库中清空全部历史。
- 自动过期与最大数量上限**仅在下次启动时执行**，避免运行期间频繁写盘。
