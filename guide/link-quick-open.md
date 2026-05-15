# Quick-Open Links

URLs in your text clips become clickable.

## Recognised schemes

| Scheme | Example |
|--------|---------|
| `http`, `https` | `https://github.com` |
| `ftp` | `ftp://example.com/file` |
| `mailto` | `mailto:hi@example.com` |
| `tel` | `tel:+1-555-0100` |
| `ws`, `wss` | `wss://realtime.example.com` |

Other schemes (e.g. `file://`, `vscode://`) are intentionally **not** auto-opened
to avoid invoking arbitrary local handlers.

## Behaviour

- **Click** — copies the URL (default action for any text).
- <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + **click** — opens in your default app:
  - browser for `http(s)` / `ftp`
  - mail client for `mailto`
  - phone dialler / FaceTime for `tel`

## Notes

- Detection is whitespace-bounded and length-capped to avoid false positives in code dumps.
- For full URL editing, switch to a real text editor — the preview is read-only.
