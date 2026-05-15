# Preview & Paragraph Copy

## Preview panel

- Press <kbd>`</kbd> (backtick) to toggle the side preview.
- It renders the focused clip:
  - **text** — monospace with optional Markdown / code highlighting
  - **image** — fitted preview, click to open full-size
  - **file** — list of paths with sizes
- The preview tracks list focus — moving up / down updates it.

## Paragraph copy (text only)

When the preview is open and the clip is text:

- Hold <kbd>Cmd</kbd> (macOS) or <kbd>Ctrl</kbd> (Windows / Linux).
- Hover — paragraphs highlight under the cursor.
- Click — that paragraph alone is copied to the system clipboard.

Useful for grabbing one snippet from a long copied document without
manually selecting.

## Tips

- "Paragraph" is split by blank lines, so well-formatted text works best.
- Code blocks inside Markdown are treated as one paragraph each.
- Paragraph copy goes to the system clipboard **and** creates a new clip in history.
