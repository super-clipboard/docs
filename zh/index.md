---
layout: home

hero:
  name: "Super Clipboard"
  text: "可脚本化的剪贴板管理器"
  tagline: 捕获、检索、对每一项剪贴内容做出响应 —— 用 TypeScript 自定义脚本随心扩展。
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/getting-started
    - theme: alt
      text: API 参考
      link: /zh/reference/global-native-api
    - theme: alt
      text: GitHub
      link: https://github.com/super-clipboard

features:
  - title: 一等公民的 TypeScript
    details: 所有脚本 API 都附带手写 .d.ts 与 JSDoc 示例，IDE 中自动补全开箱即用
  - title: 可脚本化
    details: 订阅剪贴板事件、注册菜单命令、挂载面板 —— 都通过单一全局 globalNativeApi
  - title: 沙箱隔离
    details: 脚本运行于隔离上下文，仅通过类型化 bridge 与宿主交互，无法触达内部模块
---
