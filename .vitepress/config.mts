import { defineConfig, type DefaultTheme } from "vitepress";
import { transformerTwoslash } from "@shikijs/vitepress-twoslash";

const GITHUB_URL = "https://github.com/super-clipboard";

// ─────────────────────────────────────────────────────────────────────────────
// English (root) navigation & sidebar
// ─────────────────────────────────────────────────────────────────────────────

const enNav: DefaultTheme.NavItem[] = [
  { text: "Guide", link: "/guide/getting-started", activeMatch: "/guide/" },
  { text: "Scripts", link: "/scripts/overview", activeMatch: "/scripts/" },
  { text: "Reference", link: "/reference/global-native-api", activeMatch: "/reference/" },
];

const enSidebar: DefaultTheme.Sidebar = {
  "/guide/": [
    {
      text: "Get Started",
      items: [
        { text: "Introduction", link: "/guide/getting-started" },
        { text: "Feature Overview", link: "/guide/features" },
      ],
    },
    {
      text: "Working with the History",
      items: [
        { text: "History List", link: "/guide/history-list" },
        { text: "Pinned, Starred & Tags", link: "/guide/pinned-and-tags" },
        { text: "Preview & Paragraph Copy", link: "/guide/preview-and-paragraph-copy" },
        { text: "Quick-Open Links", link: "/guide/link-quick-open" },
      ],
    },
    {
      text: "Customisation",
      items: [
        { text: "Settings", link: "/guide/settings" },
      ],
    },
  ],
  "/scripts/": [
    {
      text: "Get Started",
      items: [
        { text: "Overview", link: "/scripts/overview" },
        { text: "Quickstart", link: "/scripts/quickstart" },
      ],
    },
    {
      text: "Authoring",
      items: [
        { text: "Metadata Headers", link: "/scripts/meta-headers" },
        { text: "Grants & Sandbox", link: "/scripts/grants" },
        { text: "Examples", link: "/scripts/examples" },
        { text: "Publishing", link: "/scripts/publishing" },
        { text: "FAQ", link: "/scripts/faq" },
      ],
    },
  ],
  "/reference/": [
    {
      text: "Reference",
      items: [{ text: "globalNativeApi", link: "/reference/global-native-api" }],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 简体中文 navigation & sidebar
// ─────────────────────────────────────────────────────────────────────────────

const zhNav: DefaultTheme.NavItem[] = [
  { text: "指南", link: "/zh/guide/getting-started", activeMatch: "/zh/guide/" },
  { text: "脚本开发", link: "/zh/scripts/overview", activeMatch: "/zh/scripts/" },
  { text: "API 参考", link: "/zh/reference/global-native-api", activeMatch: "/zh/reference/" },
];

const zhSidebar: DefaultTheme.Sidebar = {
  "/zh/guide/": [
    {
      text: "开始使用",
      items: [
        { text: "安装与首次使用", link: "/zh/guide/getting-started" },
        { text: "功能总览", link: "/zh/guide/features" },
      ],
    },
    {
      text: "使用历史记录",
      items: [
        { text: "历史列表", link: "/zh/guide/history-list" },
        { text: "置顶、收藏与标签", link: "/zh/guide/pinned-and-tags" },
        { text: "预览与段落点选复制", link: "/zh/guide/preview-and-paragraph-copy" },
        { text: "链接快速打开", link: "/zh/guide/link-quick-open" },
      ],
    },
    {
      text: "个性化",
      items: [
        { text: "设置项", link: "/zh/guide/settings" },
      ],
    },
  ],
  "/zh/scripts/": [
    {
      text: "开始开发",
      items: [
        { text: "脚本系统概述", link: "/zh/scripts/overview" },
        { text: "5 分钟上手", link: "/zh/scripts/quickstart" },
      ],
    },
    {
      text: "脚本编写",
      items: [
        { text: "元数据头", link: "/zh/scripts/meta-headers" },
        { text: "Grant 与沙箱", link: "/zh/scripts/grants" },
        { text: "示例集", link: "/zh/scripts/examples" },
        { text: "发布脚本", link: "/zh/scripts/publishing" },
        { text: "常见问题", link: "/zh/scripts/faq" },
      ],
    },
  ],
  "/zh/reference/": [
    {
      text: "参考",
      items: [{ text: "globalNativeApi", link: "/zh/reference/global-native-api" }],
    },
  ],
};

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Super Clipboard",
  description: "A powerful, scriptable clipboard manager.",
  cleanUrls: true,
  lastUpdated: true,
  base: "/docs/",

  markdown: {
    codeTransformers: [
      // Renders TwoSlash hover types / `^?` markers in fenced ts/js code blocks.
      // Add `twoslash` to the language fence to opt in (e.g. ```ts twoslash).
      transformerTwoslash({
        twoslashOptions: {
          compilerOptions: {
            lib: ["ESNext", "DOM"],
            target: 99, // ESNext
            module: 99, // ESNext
            moduleResolution: 100, // Bundler
            strict: true,
            skipLibCheck: true,
            types: ["@super-clipboard/userscript-types"],
          },
        },
      }),
    ],
  },

  themeConfig: {
    socialLinks: [{ icon: "github", link: GITHUB_URL }],
    search: {
      provider: "local",
      options: {
        locales: {
          zh: {
            translations: {
              button: { buttonText: "搜索文档", buttonAriaLabel: "搜索文档" },
              modal: {
                noResultsText: "无法找到相关结果",
                resetButtonTitle: "清除查询条件",
                footer: {
                  selectText: "选择",
                  navigateText: "切换",
                  closeText: "关闭",
                },
              },
            },
          },
        },
      },
    },
  },

  locales: {
    root: {
      label: "English",
      lang: "en-US",
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
      },
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      link: "/zh/",
      themeConfig: {
        nav: zhNav,
        sidebar: zhSidebar,
        outline: { label: "页面导航" },
        docFooter: { prev: "上一页", next: "下一页" },
        lastUpdatedText: "最后更新于",
        darkModeSwitchLabel: "外观",
        sidebarMenuLabel: "菜单",
        returnToTopLabel: "返回顶部",
        langMenuLabel: "切换语言",
      },
    },
  },
});
