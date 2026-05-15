# History List

The home page of the plugin.

## Layout

![image-placeholder]()

- **Top toolbar** — search box + tab filters.
- **Main column** — virtualised list of clip rows grouped by *Today / Yesterday / earlier*.
- **Right panel** (optional) — preview of the focused clip, toggled by <kbd>`</kbd>.

## Tabs

| Tab | Filter |
|-----|--------|
| All | every clip |
| Text / Image / File | only that type |
| Pinned | `pinned: true` |
| Starred | `starred: true` |
| `<your tags>` | any clip carrying that tag |

Tabs are configurable in **Settings → Category layout** — reorder, hide, or pin custom tag tabs.

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
