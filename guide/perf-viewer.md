---
title: Perf Viewer (Debug)
---

# Perf Viewer

A purely client-side viewer for performance JSONL logs exported by
**Super Clipboard**. Drop one or more files exported from
`{userData}/super-clipboard-next-perf-logs/` and overlay their
time-series for comparison.

::: info Privacy
This page does **not upload** anything. All parsing happens locally in your
browser using the [File API][file-api] + a [`TextDecoderStream`][tds] pipe.
You can even use it offline — once the page is cached, no further network
requests are made.

[file-api]: https://developer.mozilla.org/en-US/docs/Web/API/File_API
[tds]: https://developer.mozilla.org/en-US/docs/Web/API/TextDecoderStream
:::

## How to collect logs

1. Open **Settings → Debug & Performance** in Super Clipboard.
2. Toggle **Enable performance sampling**. Sampling writes a single line
   every 5 s into `YYYY-MM-DD.jsonl` under
   `{userData}/super-clipboard-next-perf-logs/`.
3. Use the app normally for as long as you want to profile.
4. Click **Open directory** in the same settings panel; copy the relevant
   `.jsonl` files anywhere.

## Open files

<PerfViewer />

## Tips

- **Compare two sessions / machines / app versions**: load both files. Each
  file gets a unique color and is overlaid on the same axes.
- **Switch to relative time** (`t = 0` at session start) to align runs that
  started at different absolute timestamps.
- **Toggle metrics** at the top to focus on a single dimension (e.g. only
  RSS during a memory regression hunt).
- **Event markers** appear as dashed vertical lines on the first metric
  chart (e.g. `route-change`, `history-load-end`, `upgrade-shown`).
- **Interactions**: scroll wheel zooms in/out around the cursor; click + drag
  pans the time axis; double-click resets to fit-all.
