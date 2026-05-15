# Settings

Open via the gear icon. Sections:

## Database

- **Storage path** — where clips live (defaults to uTools' per-plugin dir).
- **Cap by count** — keep the latest *N* clips.
- **Cap by age** — drop clips older than *N* days.
- **Pinned / starred / tagged** — exempt from auto-cleanup.
- **Compact / Vacuum** — manual reclaim of disk space.

## Listener

- **Auto-start** — start clipboard capture on plugin load.
- **Capture text / image / file** — independent toggles.
- **Source filtering** — exclude specific apps (e.g. password managers).

## Search

- **Full-text search** — toggle on to enable a high-performance built-in index that searches across the entire history in milliseconds; the index is built progressively in the background on first use.
- **Auto clear on exit** — reset search / category / multi-select / preview state when the plugin loses focus.
- **Image OCR** — backfill OCR text for image clips so they become searchable.

## Behaviour

- **Hide on paste** — auto-close after <kbd>Enter</kbd>.
- **Confirm on delete**.
- **Single-instance protection**.

## Preferences

- **Theme** — light / dark / follow system.
- **Density** — comfortable / compact.
- **Language** — UI locale.

## Category layout

Reorder, hide, or pin tabs (built-in + custom tag tabs).

## Logs

- View recent log entries from the plugin and the background capture process.
- Toggle log level.
- Logs are kept for 15 days under the system log directory; *Open log folder* opens it in your OS file manager.

## Scripts

- Per-script enable / disable.
- Recent error log (one line per script).
- Built-in lightweight code editor with syntax highlighting (no Monaco / IntelliSense — use an external editor for heavier work and paste the result back).
- *Reset to builtin* — re-install builtin scripts to current shipped version.
- *Open scripts folder*.
