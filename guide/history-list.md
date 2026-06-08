# History List

The home page of the plugin.

## Layout

![main](/main.webp)

- **Top toolbar** — search box + tab filters.
- **Main column** — virtualised list of clip rows grouped by *Today / Yesterday / earlier*.
- **Right panel** (optional) — preview of the focused clip, toggled by <kbd>`</kbd>.

## Tabs

| Tab | Filter |
|-----|--------|
| All | every clip |
| Text / Image / File | only that type |
| Pinned | `is:pinned` |
| Starred | `is:starred` |
| `<your tags>` | any clip carrying that tag |

Tabs are configurable in **Settings → Category layout** — reorder, hide, or pin custom tag tabs.

## Search

- The search box auto-focuses as you type anywhere in the list.
- Chinese IME is fully compatible — no accidental triggering.
- Powered by MiniSearch inverted index with prefix matching and fuzzy tolerance.

Search state is cleared 5 seconds after the plugin hides (configurable in Settings).

### Advanced Search Syntax (Lucene Subset) {#advanced-search-syntax}

Super Clipboard supports Lucene-style query syntax with field filters, boolean operators, and time ranges.

> **Pro required** for field filters and boolean operators. Exact substring match (`+term` / `"phrase"`) is free for all users.

#### Text Subtypes

| Syntax | Meaning |
|--------|---------|
| `is:url` | The entire text IS a URL |
| `has:url` | The text CONTAINS a URL |
| `is:email` | The entire text IS an email address |
| `has:email` | The text CONTAINS an email address |
| `is:color` | The entire text IS a color value (HEX / RGB / HSL) |
| `has:color` | The text CONTAINS a color value |
| `is:json` | The entire text is valid JSON |
| `is:phone` | The entire text IS a phone number |
| `has:phone` | The text CONTAINS a phone number |

- `is:` = identity match ("this clip IS a URL" — same semantics as GitHub `is:issue`)
- `has:` = containment match ("this clip HAS a URL" — same semantics as Gmail `has:attachment`)

#### Boolean Properties

| Syntax | Meaning |
|--------|---------|
| `is:pinned` | Clip is pinned |
| `is:starred` | Clip is starred |
| `-is:pinned` | Clip is NOT pinned |

#### Field Filters

| Syntax | Meaning |
|--------|---------|
| `type:text` · `type:image` · `type:file` | Filter by clip type |
| `type:(image OR file)` | Images or files (multi-value OR) |
| `app:Chrome` · `app:WeChat*` | Filter by source app (supports `*` wildcard) |
| `tag:work` | Filter by tag (contains match) |
| `date:>7d` · `date:<30d` | Relative time: last 7 days / older than 30 days |
| `date:[2024-01-01 TO 2024-12-31]` | Absolute date range |
| `in:primary` · `in:remark` · `in:fileNames` | Scope full-text search to specific fields |

#### Boolean Operators

| Syntax | Meaning |
|--------|---------|
| `foo AND bar` | Both foo and bar required |
| `foo OR bar` | Either foo or bar |
| `NOT foo` · `-foo` | Exclude foo |
| `+foo` | Require foo (exact substring) |
| `(a OR b) AND c` | Grouping |
| `"hello world"` | Phrase search |

#### Exact Substring Match (free for all users)

The inverted index works at the token level, so searching `index` won't match compounds like `reindexed` or `createIndexBuffer`. Use the following syntax to force a character-level substring scan:

| Syntax | Meaning |
|--------|---------|
| `+index` | Results must contain the substring `index` (e.g. `reindexed`, `createIndexBuffer`) |
| `"create index"` | Results must contain the exact phrase `create index` |
| `+index -log` | Contains `index` and excludes `log` (`-log` requires Pro) |

> `+term` does **not** trigger the Pro gate — any user can use it.

## Multi-select

- <kbd>Cmd/Ctrl</kbd> + click — toggle a single row.
- <kbd>Shift</kbd> + click — extend a range.
- Toolbar then offers bulk *delete / pin / star / tag / run script*.

## Scrolling & loading

- The list is **virtualised**: only visible rows are rendered, so 100 k+ entries stay smooth.
- Older entries load as you scroll.
- Press <kbd>End</kbd> to jump to the very bottom (loads progressively).

## Deletion & cleanup

- Single delete — <kbd>Delete</kbd> on a row.
- Bulk delete — multi-select then *Delete*.
- Auto-cleanup — **Settings → DB** lets you cap by *count* or *age*.
