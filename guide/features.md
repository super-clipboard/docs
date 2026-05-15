# Features

A one-page tour. Each feature has its own dedicated page if you want details.

## Capture

- The plugin watches the OS clipboard in the background and pushes new copies into history.
- Three types: **text**, **image**, **file list**.
- Deduplication by content hash — re-copying the same content bumps it to the top instead of producing a duplicate row.
- Per-listener toggles: pause text, pause image, pause file capture independently.

## Browse & search

- **History list** — scroll-loaded virtual list grouped by date.
- **Tabs** — quick filters: All / Text / Image / File / Pinned / Starred / per-Tag.
- **Search** — full-text search over text content; for images, optional OCR backfill (see [Settings](./settings)).
- **Multi-select** — <kbd>Cmd/Ctrl</kbd>-click or <kbd>Shift</kbd>-click to select ranges.

→ [History list](./history-list)

## Preview & paragraph copy

- Press <kbd>`</kbd> to toggle the side preview panel.
- In preview, hold <kbd>Cmd/Ctrl</kbd> and click a paragraph to copy just that paragraph.

→ [Preview & paragraph copy](./preview-and-paragraph-copy)

## Pinned, starred, tags

Three orthogonal axes:

- **Pinned** — sticky to the top of *All*.
- **Starred** — appears in the *Starred* tab.
- **Tags** — arbitrary labels, each becomes a tab.

→ [Pinned, starred & tags](./pinned-and-tags)

## Quick-open links

- URLs (`http`, `https`, `ftp`, `mailto`, `tel`, `ws`, `wss`) become click-to-open.
- <kbd>Cmd/Ctrl</kbd> + click to open in default app instead of copying.

→ [Quick-open links](./link-quick-open)

## Userscripts

- Tampermonkey-style metadata header.
- Two grants only: `utools.*` and `globalNativeApi.*`.
- Sandboxed in an iframe; secure by default.
- A small marketplace + builtin scripts (QR, tokenize, save-as).

→ [Scripts](/scripts/overview)

## Customisation

- Comprehensive shortcut help inside the plugin (top-right help button).
- Granular [settings](./settings) — DB / listener / search / behaviour / preferences / category layout / logs / scripts.

## Storage & sync

- All data lives in uTools' local DB — no third-party server is involved.
- If you have a uTools membership, history syncs across your devices automatically through uTools' built-in sync.

## OCR for images

- **macOS** — uses the system Vision framework, runs offline, no setup required.
- **Other platforms** — install an OCR userscript from the [script market](/scripts/overview) to plug in cloud OCR
  (Baidu, iFlytek, Tencent Cloud, Aliyun OCR, etc.).

OCR text is written back to the image clip so it becomes searchable.
