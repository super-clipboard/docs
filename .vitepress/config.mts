import { defineConfig, type DefaultTheme } from "vitepress";

const GITHUB_URL = "https://github.com/super-clipboard";

const enNav: DefaultTheme.NavItem[] = [
  { text: "Guide", link: "/guide/getting-started", activeMatch: "/guide/" },
  { text: "Reference", link: "/reference/global-native-api", activeMatch: "/reference/" },
];

const enSidebar: DefaultTheme.Sidebar = {
  "/guide/": [
    {
      text: "Guide",
      items: [{ text: "Getting Started", link: "/guide/getting-started" }],
    },
  ],
  "/reference/": [
    {
      text: "Reference",
      items: [{ text: "globalNativeApi", link: "/reference/global-native-api" }],
    },
  ],
};

const zhNav: DefaultTheme.NavItem[] = [
  { text: "指南", link: "/zh/guide/getting-started", activeMatch: "/zh/guide/" },
  { text: "参考", link: "/zh/reference/global-native-api", activeMatch: "/zh/reference/" },
];

const zhSidebar: DefaultTheme.Sidebar = {
  "/zh/guide/": [
    {
      text: "指南",
      items: [{ text: "快速开始", link: "/zh/guide/getting-started" }],
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

  // Default to English; resolve site-wide social/edit links once.
  themeConfig: {
    socialLinks: [{ icon: "github", link: GITHUB_URL }],
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
