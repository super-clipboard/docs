# Getting Started

> Super Clipboard is a clipboard manager that runs inside [uTools](https://u.tools/):
> it captures every copy you make (text / image / file) and exposes a scriptable
> extension surface.

## 1. Install

1. Open uTools (default <kbd>⌥</kbd> + <kbd>Space</kbd> / <kbd>Alt</kbd> + <kbd>Space</kbd>).
2. Open *Plugin Marketplace*, search for **超级剪贴板 Next** ("Super Clipboard Next"), click *Install*.
3. Reopen uTools and type `sc` (or `clipboard`) to launch.

The first launch silently downloads a small native helper
(macOS / Windows / Linux, ~1–2 MB) used to capture the system clipboard.

## 2. Enable "Auto-launch with uTools"

In uTools' plugin manager, find Super Clipboard and turn on
**Launch with uTools** so the listener starts as soon as uTools does.
Otherwise the listener only starts after you manually open the plugin.

## 3. Core concepts

| Concept | Meaning |
|---------|---------|
| **clip** | One captured copy event, automatically deduped by content hash |
| **type** | `text` / `image` / `file` |
| **pinned / starred / tags** | Three independent annotation axes — see [Pinned, Starred & Tags](./pinned-and-tags) |
| **userscript** | A Tampermonkey-style extension: menu commands, listeners, panels |

## 4. First use

1. The plugin opens on the **History** page. Copy any text — a new row appears at the top.
2. <kbd>↑</kbd> <kbd>↓</kbd> to browse, <kbd>Enter</kbd> to paste back into the previous app.
3. <kbd>`</kbd> (backtick) toggles the right-side preview panel.
4. **Right-click** any row for actions: copy, pin, tag, run script…

## 5. Optional: clipboard permission

In most cases uTools already has clipboard access from regular use, so the
plugin works out of the box and **no extra permission is needed**.
Only if newly copied content is not being recorded should you check below:

- **macOS** — in *System Settings → Privacy & Security*, confirm uTools has
  *Accessibility* and *Clipboard* access.
- **Windows** — usually no extra permission needed.
- **Linux** — relies on `xclip` / `wl-clipboard` (usually preinstalled).

## 6. Where next

- [Feature overview](./features)
- [Settings](./settings)
- Want to write a script? Jump to [Scripts overview](/scripts/overview).
