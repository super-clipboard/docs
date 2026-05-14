---
layout: home

hero:
  name: "Super Clipboard"
  text: "A scriptable clipboard manager."
  tagline: Capture, search, and act on every clip — extend it with TypeScript user scripts.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /reference/global-native-api
    - theme: alt
      text: GitHub
      link: https://github.com/super-clipboard

features:
  - title: First-class TypeScript
    details: Every script API ships with hand-written .d.ts. Autocomplete and JSDoc examples in your IDE on day one.
  - title: Scriptable surface
    details: Subscribe to clipboard events, register menu commands, mount panels — all from a single global, globalNativeApi.
  - title: Sandboxed
    details: Scripts run in an isolated context with a typed bridge to the host. No internal modules are reachable.
---
