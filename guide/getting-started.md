# Getting Started

> Write your first Super Clipboard user script in under five minutes.

## 1. Scaffold a script

A user script is a single TypeScript file with a Tampermonkey-style header. The
minimum viable header looks like this:

```ts
// ==UserScript==
// @name         Hello Super Clipboard
// @namespace    com.example.hello
// @version      0.1.0
// @grant        globalNativeApi.registerMenuCommand
// @grant        globalNativeApi.getClipBody
// ==/UserScript==
```

Every API used at runtime must appear in an `@grant` line. The host enforces
this — calls outside the granted set throw at the bridge layer.

## 2. Add types for autocomplete

Install the type package:

```bash
pnpm add -D @super-clipboard/userscript-types
```

Then enable it via either a triple-slash reference at the top of your script:

```ts
/// <reference types="@super-clipboard/userscript-types" />
```

…or add it project-wide in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@super-clipboard/userscript-types"]
  }
}
```

## 3. Register a menu command

```ts
const id = globalNativeApi.registerMenuCommand(
  "Copy as link",
  async (ctx) => {
    const target = ctx.clips[0];
    if (target?.type !== "text") return;
    const body = await globalNativeApi.getClipBody(target);
    if (body?.type === "text" && body.text) {
      utools.copyText(`<${body.text}>`);
    }
  },
  { kind: "text" },
);
```

Right-clicking any text clip will now show **Copy as link** as a menu entry.

## 4. Where to next

- [`globalNativeApi` reference](/reference/global-native-api) — every method, with
  examples and notes on async semantics.
- The package's [`spec.d.ts`](https://github.com/super-clipboard/userscript-types/blob/main/spec.d.ts)
  is the single source of truth and is updated together with the host.
